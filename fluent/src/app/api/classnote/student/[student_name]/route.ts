import { NextResponse } from "next/server";
import { getClassnotes } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Robustly grab the segment after "student" to avoid issues with trailing slashes/basePath
    const parts = pathname.split("/").filter(Boolean);
    const studentIdx = parts.lastIndexOf("student");
    const raw = studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];
    const student_name = decodeURIComponent(raw ?? "").trim();

    if (!student_name) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }

    // Get all classnotes for the student
    const classnotes = await getClassnotes(student_name);
    
    // Sort by date descending (newest first)
    const sortedNotes = classnotes.sort((a: any, b: any) => {
      const dateA = a.date || a.class_date || "";
      const dateB = b.date || b.class_date || "";
      return dateB.localeCompare(dateA);
    });

    return NextResponse.json(sortedNotes, { status: 200 });
  } catch (err) {
    console.error("[/api/classnote/student] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

