// src/app/api/diary/student/[student_name]/route.ts
import { NextResponse } from "next/server";
import { getDiaryNoteData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const diary_id = decodeURIComponent(url.pathname.split('/').pop() ?? '');
    console.log(diary_id)
    if (!diary_id) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const note = await getDiaryNoteData(diary_id);
    if (!note) {
      return NextResponse.json({ error: "Diary Note not found" }, { status: 404 });
    }
    console.log(note)
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching student diary data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}