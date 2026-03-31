import { NextResponse } from "next/server";
import { getAllClassnotes } from "@/lib/data";

export async function GET() {
  try {
    const data = await getAllClassnotes();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/classnote/all error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}