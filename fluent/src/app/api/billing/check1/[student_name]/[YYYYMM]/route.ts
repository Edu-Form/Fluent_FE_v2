// app/api/billing/check1/[student_name]/[yyyymm]/route.ts
import { NextResponse } from "next/server";
import { getBillingCheck1 } from "@/lib/data"; // make sure this exists in your data.ts

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);

    // Robust path parsing using split/filter
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
    console.error("GET /api/billing/check1/[student_name]/[yyyymm] error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
