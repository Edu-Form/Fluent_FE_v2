import { NextResponse } from "next/server";
import { getStudentCurriculumData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const student_name = decodeURIComponent(url.pathname.split('/').pop() ?? ''); // Extract the student_name from the URL
    console.log(student_name)
    if (!student_name) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const curriculum = await getStudentCurriculumData(student_name);
    console.log(curriculum);
    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }

    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error fetching student curriculum data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}