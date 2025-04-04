// src/app/api/diary/student/[student_name]/route.ts
import { NextResponse } from "next/server";
import { getQuizletNoteData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    console.log("Enter")
    const url = new URL(request.url);
    const quizlet_id = decodeURIComponent(url.pathname.split('/').pop() ?? '');
    console.log(quizlet_id)
    if (!quizlet_id) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const note = await getQuizletNoteData(quizlet_id);
    if (!note) {
      return NextResponse.json({ error: "Quizlet Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching student diary data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}