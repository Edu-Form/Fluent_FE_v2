// src/app/api/diary/student/[student_name]/route.ts
import { NextResponse } from "next/server";
import { getQuizletNoteData, updateQuizletNoteData } from "@/lib/data"; // Import the function from data.ts

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

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const quizlet_id = decodeURIComponent(url.pathname.split('/').pop() ?? '');
    if (!quizlet_id) {
      return NextResponse.json({ error: "Quizlet ID not provided" }, { status: 400 });
    }

    const body = await request.json();
    const { original_text } = body;

    if (!original_text) {
      return NextResponse.json({ error: "Original text is required" }, { status: 400 });
    }

    const updatedNote = await updateQuizletNoteData(quizlet_id, original_text);

    if (!updatedNote) {
      return NextResponse.json({ error: "Failed to update quizlet note" }, { status: 500 });
    }

    return NextResponse.json({ message: "Quizlet note updated successfully", updatedNote });
  } catch (error) {
    console.error("Error updating quizlet note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}