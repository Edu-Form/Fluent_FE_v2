// src/app/api/schedules/teacher/[user]/route.ts
import { NextResponse } from "next/server";
import { getStudentListData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user = url.pathname.split('/').pop(); // Extract the user from the URL
    console.log(user)
    if (!user) {
      return NextResponse.json({ error: "User not provided" }, { status: 400 });
    }

    const studentList = await getStudentListData(user); // Pass user to getTeacherScheduleData
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
