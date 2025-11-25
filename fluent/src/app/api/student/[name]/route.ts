// app/api/student/[name]/route.ts
import { NextResponse } from "next/server";
import { getStudentByName, updateStudentByName } from "@/lib/data";

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


export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
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

    const body = await request.json();
    const { credits, hourlyRate } = body;

    if (credits === undefined && hourlyRate === undefined) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (credits !== undefined) updateData.credits = String(credits);
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;

    const updated = await updateStudentByName(student_name, updateData);

    if (!updated) {
      return NextResponse.json(
        { error: "Student not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}