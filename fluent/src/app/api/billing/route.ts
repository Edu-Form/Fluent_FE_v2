import { NextRequest, NextResponse } from "next/server";
import { getAllBillingData, getBillingDataByStudent, updateBillingProgress } from "@/lib/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_name = searchParams.get("student_name");

    if (student_name) {
      const studentData = await getBillingDataByStudent(student_name);
      return NextResponse.json(studentData || {});
    }

    const data = await getAllBillingData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { student_name, step, date } = await req.json();

    if (!student_name || !step || (step !== "diary" && !date)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await updateBillingProgress({ student_name, step, date });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
