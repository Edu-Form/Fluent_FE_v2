import { NextRequest, NextResponse } from "next/server";
import { getTeacherPerformanceData } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year") || undefined;
    const month = searchParams.get("month") || undefined;

    const data = await getTeacherPerformanceData({ year, month });

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}