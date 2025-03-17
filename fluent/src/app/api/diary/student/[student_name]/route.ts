// src/app/api/diary/student/[student_name]/route.ts
import { NextResponse } from "next/server";
import { getStudentDiaryData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const student_name = decodeURIComponent(url.pathname.split('/').pop() ?? ''); // Extract the student_name from the URL
    console.log(student_name)
    if (!student_name) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const diaries = await getStudentDiaryData(student_name);
    console.log(diaries);
    if (!diaries) {
      return NextResponse.json({ error: "Diaries not found" }, { status: 404 });
    }

    return NextResponse.json(diaries);
  } catch (error) {
    console.error("Error fetching student diary data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
