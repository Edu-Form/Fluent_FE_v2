// app/api/student/route.ts

import { NextResponse } from "next/server";
import { createStudent } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    const createdStudent = await createStudent(body);

    return NextResponse.json(createdStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}