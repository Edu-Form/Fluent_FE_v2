import { NextResponse } from "next/server";
import { backfillPaymentCredits } from "@/lib/data";

export async function POST() {
  try {
    const result = await backfillPaymentCredits();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Backfill API error:", error);
    return NextResponse.json(
      { error: "Backfill failed" },
      { status: 500 }
    );
  }
}