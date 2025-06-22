// /api/class-record/temp.ts
import { NextResponse } from "next/server";
import { saveTempClassNote, getTempClassNote } from "@/lib/data";

export async function POST(request: Request) {
  const { student_name, original_text } = await request.json();
  if (!student_name) return NextResponse.json({ error: "Missing student_name" }, { status: 400 });

  const result = await saveTempClassNote(student_name, original_text);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const student_name = searchParams.get("student_name");
  if (!student_name) return NextResponse.json({ error: "Missing student_name" }, { status: 400 });

  const result = await getTempClassNote(student_name);
  return NextResponse.json(result || {});
}
