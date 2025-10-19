// app/api/billing/check2/route.ts
import { NextResponse } from "next/server";
import { getBillingCheck2, saveBillingCheck2, saveBillingStatusCheck2 } from "@/lib/data";

function makeYYYYMMFromMonth(monthObj: any): string | undefined {
  if (!monthObj) return undefined;
  const y = Number(monthObj.year);
  const m = Number(monthObj.month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return undefined;
  return `${y}${String(m).padStart(2, "0")}`;
}

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
    const body = await request.json();

    if (!body?.student_name) {
      return NextResponse.json({ ok: false, error: "student_name required" }, { status: 400 });
    }

    const yyyymm =
      typeof body.yyyymm === "string" && body.yyyymm
        ? body.yyyymm
        : makeYYYYMMFromMonth(body.month) ??
          parseYyyymmFromDateString(body.this_month_lines?.[0]?.note_date) ??
          `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    // Save detail with summary
    const detail = await saveBillingCheck2({
      student_name: body.student_name,
      teacher_name: body.teacher_name,
      yyyymm,
      month: body.month ?? null,
      this_month_lines: Array.isArray(body.this_month_lines) ? body.this_month_lines : [],
      next_month_lines: Array.isArray(body.next_month_lines) ? body.next_month_lines : [],
      final_save: !!body.final_save,
      meta: body.meta ?? {},
      savedBy: body.savedBy ?? "ui",

      // NEW: 정산 요약 summary fields
      carry_in_credit: Number(body.carry_in_credit ?? 0),
      this_month_actual: Number(body.this_month_actual ?? 0),
      next_month_planned: Number(body.next_month_planned ?? 0),
      total_credits_available: Number(body.total_credits_available ?? 0),
      next_to_pay_classes: Number(body.next_to_pay_classes ?? 0),
      fee_per_class: Number(body.fee_per_class ?? 0),
      amount_due_next: Number(body.amount_due_next ?? 0),
    });

    const status = await saveBillingStatusCheck2({
      yyyymm,
      step: "AdminConfirm",
      student_name: body.student_name,
      savedBy: body.savedBy ?? "ui",
      meta: { source: "check2-post", ...body.meta },
    });

    return NextResponse.json({ ok: true, detail, status }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/billing/check2 error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const student_name = searchParams.get("student_name");
    const yyyymm = searchParams.get("yyyymm");

    if (!student_name || !yyyymm) {
      return NextResponse.json(
        { ok: false, error: "student_name and yyyymm are required" },
        { status: 400 }
      );
    }

    const record = await getBillingCheck2({ student_name, yyyymm });

    if (!record) {
      return NextResponse.json(
        { ok: false, found: false, error: "No record found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, found: true, data: record }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/billing/check2 error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
