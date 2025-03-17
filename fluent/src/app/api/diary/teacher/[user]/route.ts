// src/app/api/schedules/teacher/[user]/route.ts
import { NextResponse } from "next/server";
import { getStudentListData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const student_name = decodeURIComponent(url.pathname.split('/').pop() ?? ''); // Extract the student_name from the URL
    console.log(student_name)
    if (!student_name) {
      return NextResponse.json({ error: "User not provided" }, { status: 400 });
    }

    const studentList = await getStudentListData(student_name); // Pass user to getTeacherScheduleData
    console.log(studentList)
    if (!studentList) {
      return NextResponse.json({ error: "Student List not found" }, { status: 404 });
    }

    return NextResponse.json(studentList);
  } catch (error) {
    console.error("Error fetching student list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
