// app/api/billing/status/[yyyymm]/route.ts
import { NextResponse } from "next/server";
import { getBillingStatusForMonth } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);

    // robust split-based parse
    const parts = pathname.split("/").filter(Boolean);
    const anchorIdx = parts.lastIndexOf("status");
    const rawYyyymm = anchorIdx >= 0 ? parts[anchorIdx + 1] : parts[parts.length - 1];
    const yyyymm = rawYyyymm ? decodeURIComponent(rawYyyymm) : "";

    if (!yyyymm || !/^\d{6}$/.test(yyyymm)) {
      return NextResponse.json({ ok: false, error: "Missing or invalid yyyymm (expected YYYYMM)" }, { status: 400 });
    }

    const docs = await getBillingStatusForMonth(yyyymm);
    return NextResponse.json({ ok: true, yyyymm, docs }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/billing/status/[yyyymm] error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
