import { NextResponse } from "next/server";
import { saveProgressData, updateProgressData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const progressData = await request.json();

    if (!progressData || !progressData.student_name) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const result = await saveProgressData(progressData);

    return NextResponse.json(
      { message: "Progress saved successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving progress data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { student_name, current_progress_update } = data;

    if (!student_name || !current_progress_update) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const result = await updateProgressData(student_name, current_progress_update);

    return NextResponse.json(
      { message: "Progress updated successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
