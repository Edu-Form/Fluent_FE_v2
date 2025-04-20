import { NextResponse } from "next/server";
import { getCurriculumNoteData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    console.log("Enter")
    const url = new URL(request.url);
    const curriculum_id = decodeURIComponent(url.pathname.split('/').pop() ?? '');
    console.log(curriculum_id)
    if (!curriculum_id) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const note = await getCurriculumNoteData(curriculum_id);
    if (!note) {
      return NextResponse.json({ error: "Curriculum Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching student curriculum data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}