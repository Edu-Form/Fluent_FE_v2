import { NextResponse } from "next/server";
import { saveTempDiary, getTempDiary } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_name, original_text } = body;

    if (!student_name) {
      return NextResponse.json({ error: "Missing student_name" }, { status: 400 });
    }

    const result = await saveTempDiary(student_name, original_text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Temp diary save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const student_name = searchParams.get("student_name");

    if (!student_name) {
      return NextResponse.json({ error: "Missing student_name" }, { status: 400 });
    }

    const result = await getTempDiary(student_name);
    return NextResponse.json(result || {});
  } catch (error) {
    console.error("Temp diary fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
