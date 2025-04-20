import { NextResponse } from "next/server";
import { saveCurriculumData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const curriculumData = await request.json();
    console.log(curriculumData);

    if (!curriculumData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const result = await saveCurriculumData(curriculumData);

    return NextResponse.json(
      { message: "Data saved successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
