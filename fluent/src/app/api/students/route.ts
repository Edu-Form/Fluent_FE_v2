// app/api/students/route.ts

import { NextResponse } from "next/server";
import { getAllStudents } from "@/lib/data";

export async function GET() {
  try {
    const students = await getAllStudents();

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}