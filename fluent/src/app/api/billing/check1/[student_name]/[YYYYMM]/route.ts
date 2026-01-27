// app/api/billing/check1/[student_name]/[yyyymm]/route.ts
import { NextResponse } from "next/server";
import { getBillingCheck1, saveBillingCheck1 } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);

    // Robust path parsing
    const parts = pathname.split("/").filter(Boolean);
    const anchorIdx = parts.lastIndexOf("check1");
    const rawStudent = anchorIdx >= 0 ? parts[anchorIdx + 1] : undefined;
    const rawYyyymm = anchorIdx >= 0 ? parts[anchorIdx + 2] : undefined;

    const student_name = rawStudent ? decodeURIComponent(rawStudent) : "";
    const yyyymm = rawYyyymm ? decodeURIComponent(rawYyyymm) : "";

    if (!student_name || !yyyymm) {
      return NextResponse.json({ ok: false, error: "Missing student_name or yyyymm in URL" }, { status: 400 });
    }

    const entry = await getBillingCheck1(student_name, yyyymm);
    if (!entry) {
      // Not found -> client can treat as editable
      return NextResponse.json({ ok: false, found: false }, { status: 404 });
    }

    return NextResponse.json({ ok: true, found: true, data: entry }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/billing/check1/... error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);

    // Robust path parsing
    const parts = pathname.split("/").filter(Boolean);
    const anchorIdx = parts.lastIndexOf("check1");
    const rawStudent = anchorIdx >= 0 ? parts[anchorIdx + 1] : undefined;
    const rawYyyymm = anchorIdx >= 0 ? parts[anchorIdx + 2] : undefined;

    const student_name = rawStudent ? decodeURIComponent(rawStudent) : "";
    const yyyymm = rawYyyymm ? decodeURIComponent(rawYyyymm) : "";

    if (!student_name || !yyyymm) {
      return NextResponse.json({ ok: false, error: "Missing student_name or yyyymm" }, { status: 400 });
    }

    const body = await request.json();
    const { locked } = body;

    // Use saveBillingCheck1 to update
    // We first fetch existing to preserve other fields if needed, or assume partial update is handled
    const current = await getBillingCheck1(student_name, yyyymm);

    await saveBillingCheck1({
      student_name,
      yyyymm,
      // Preserve existing fields if they exist, or initialize
      month: current?.month || null,
      this_month_lines: current?.this_month_lines || [],
      next_month_lines: current?.next_month_lines || [],
      meta: current?.meta || {},
      teacher_name: current?.teacher_name || "",
      final_save: !!locked, // map 'locked' to 'final_save'
      savedBy: "admin_toggle",
    });

    return NextResponse.json({ ok: true, locked: !!locked }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/billing/check1/... error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
