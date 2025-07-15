import { NextResponse } from "next/server";
import { getProgressDataByStudentName } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: { student_name: string } }
) {
  try {
    const { student_name } = params;
    if (!student_name) {
      return NextResponse.json({ error: "Missing student_name" }, { status: 400 });
    }

    const progress = await getProgressDataByStudentName(student_name);

    // If no progress found, default to step 1
    if (!progress) {
      return NextResponse.json({ step: 1 });
    }

    return NextResponse.json({ step: progress.step || 1 });
  } catch (error) {
    console.error("GET /progress/:student_name error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
