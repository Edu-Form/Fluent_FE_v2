import { NextResponse } from "next/server";
import { createConsultation, getConsultations } from "@/lib/data";

// GET
export async function GET() {
  try {
    const data = await getConsultations();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET consultations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.student_name) {
      return NextResponse.json(
        { error: "student_name required" },
        { status: 400 }
      );
    }

    const result = await createConsultation(body);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("POST consultations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}