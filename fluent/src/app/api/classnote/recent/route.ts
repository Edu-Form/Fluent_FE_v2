// app/api/classnote/recent/route.ts
import { NextResponse } from "next/server";
import { getRecentClassnote } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const student_name = url.searchParams.get("student_name")?.trim() || "";

    if (!student_name) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }

    const recent = await getRecentClassnote(student_name);
    if (!recent) {
      return NextResponse.json({ error: "No classnote found" }, { status: 404 });
    }

    return NextResponse.json(recent, { status: 200 });
  } catch (err) {
    console.error("[/api/classnote/recent] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
