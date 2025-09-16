// app/api/student/[name]/route.ts
import { NextResponse } from "next/server";
import { getStudentByName } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Robustly grab the segment after "student" to avoid issues with trailing slashes/basePath
    const parts = pathname.split("/").filter(Boolean);
    const studentIdx = parts.lastIndexOf("student");
    const raw = studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];

    const student_name = decodeURIComponent(raw ?? "");

    if (!student_name) {
      return NextResponse.json(
        { error: "Student name not provided" },
        { status: 400 }
      );
    }

    const student = await getStudentByName(student_name);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
