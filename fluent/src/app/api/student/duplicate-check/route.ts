// app/api/student/duplicate-check/route.ts

import { NextResponse } from "next/server";
import { checkDuplicateStudentName } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const isDuplicate = await checkDuplicateStudentName(name);

    return NextResponse.json({ isDuplicate });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}