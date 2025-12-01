// /api/quizlet/temp.ts
import { NextResponse } from "next/server";
import { saveTempClassNote, getTempClassNote } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json();

  const {
    student_name,
    class_date,
    date,
    original_text,
    homework,
    nextClass,
    teacher_name,
    type,
    started_at,
    ended_at,
    duration_ms,
    quizlet_saved,
  } = body;

  if (!student_name) {
    return NextResponse.json({ error: "Missing student_name" }, { status: 400 });
  }

  const tempPayload = {
    student_name,
    class_date,
    date,
    original_text,
    homework,
    nextClass,
    teacher_name,
    type,
    started_at,
    ended_at,
    duration_ms,
    quizlet_saved: quizlet_saved ?? false,
    updatedAt: new Date(),
  };

  const result = await saveTempClassNote(student_name, tempPayload);
  return NextResponse.json(result);
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const student_name = searchParams.get("student_name");
  if (!student_name) return NextResponse.json({ error: "Missing student_name" }, { status: 400 });

  const result = await getTempClassNote(student_name);
  return NextResponse.json(result || {});
}
