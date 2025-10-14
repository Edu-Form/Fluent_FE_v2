// app/api/billing/check1/route.ts
import { NextResponse } from "next/server";
import { saveBillingCheck1, saveBillingStatusCheck1 } from "@/lib/data"; // ensure both functions exist in data.ts

function makeYYYYMMFromMonth(monthObj: any): string | undefined {
  if (!monthObj) return undefined;
  const y = Number(monthObj.year);
  const m = Number(monthObj.month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return undefined;
  return `${y}${String(m).padStart(2, "0")}`;
}

/** If e.g. "2025. 10. 02." returns "202510" */
function parseYyyymmFromDateString(s: string | null | undefined): string | undefined {
  if (!s) return undefined;
  const m =
    String(s).trim().match(/^(\d{4})[.\-\/\s]?0?(\d{1,2})[.\-\/\s]?\d{1,2}/) ||
    String(s).trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return undefined;
  const y = m[1];
  const mo = m[2];
  return `${y}${String(mo).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;

    if (!body || !body.student_name) {
      return NextResponse.json({ ok: false, error: "student_name required" }, { status: 400 });
    }

    // compute yyyymm from body.yyyymm -> body.month -> first this_month_lines.note_date -> fallback current month
    let yyyymm: string | undefined = typeof body.yyyymm === "string" && body.yyyymm ? body.yyyymm : undefined;
    if (!yyyymm && body.month) {
      yyyymm = makeYYYYMMFromMonth(body.month);
    }
    if (!yyyymm && Array.isArray(body.this_month_lines) && body.this_month_lines.length > 0) {
      const first = body.this_month_lines[0];
      const candidate = first?.note_date ?? first?.date ?? null;
      yyyymm = parseYyyymmFromDateString(candidate);
    }
    if (!yyyymm) {
      const now = new Date();
      yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      console.warn(`[POST /api/billing/check1] could not derive yyyymm from request; falling back to ${yyyymm}`);
    }

    // 1) Save detail to confirmed_class_dates
    const detail = await saveBillingCheck1({
      student_name: body.student_name,
      teacher_name: body.teacher_name,
      yyyymm,
      month: body.month ?? null,
      this_month_lines: Array.isArray(body.this_month_lines) ? body.this_month_lines : [],
      next_month_lines: Array.isArray(body.next_month_lines) ? body.next_month_lines : [],
      final_save: !!body.final_save,
      meta: body.meta ?? {},
      savedBy: body.savedBy ?? "ui",
    });

    // 2) Immediately append to billing (status) using same yyyymm and step=TeacherConfirm
    let status = null;
    try {
      status = await saveBillingStatusCheck1({
        yyyymm,
        step: "TeacherConfirm",
        student_name: body.student_name,
        savedBy: body.savedBy ?? "ui",
        meta: { source: "check1-post" },
      });
    } catch (err: any) {
      // log and continue: detail is primary
      console.error("saveBillingStatusCheck1 failed:", err);
    }

    return NextResponse.json({ ok: true, detail, status }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/billing/check1 error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
