import { NextResponse } from "next/server";
import { getTeacherPerformanceData } from "@/lib/data";

export async function GET() {
  try {
    const data = await getTeacherPerformanceData();

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}