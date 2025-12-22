import { NextResponse } from "next/server";
import { getClassnotes, getStudentByName } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Robustly grab the segment after "count" to avoid issues with trailing slashes/basePath
    const parts = pathname.split("/").filter(Boolean);
    const countIdx = parts.lastIndexOf("count");
    const raw = countIdx >= 0 ? parts[countIdx + 1] : parts[parts.length - 1];
    const student_name = decodeURIComponent(raw ?? "").trim();

    if (!student_name) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }

    // Get all classnotes for the student
    const classnotes = await getClassnotes(student_name);
    const totalClassesCompleted = classnotes.length;

    // Get student data to get credits (initial class count)
    const student = await getStudentByName(student_name);
    const currentCredits = student && student.credits ? Number(student.credits) || 0 : 0;
    
    // For initial credits, we need to check payment history or use a different approach
    // Since we don't have a direct way to get initial credits, we'll use total completed as a proxy
    // The classesUsed is calculated as: if we have payment history, we can infer, otherwise use total completed
    // For now, we'll show total completed as classes used (since each classnote represents a used class)
    const classesUsed = totalClassesCompleted;

    return NextResponse.json({
      totalClassesCompleted,
      currentCredits,
      classesUsed,
    }, { status: 200 });
  } catch (err) {
    console.error("[/api/classnote/count] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

