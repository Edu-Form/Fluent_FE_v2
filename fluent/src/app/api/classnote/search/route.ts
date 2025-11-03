// app/api/classnote/search/route.ts
import { NextResponse } from "next/server";
import { getClassnotesInRange } from "@/lib/data";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentParam = url.searchParams.getAll("student_name");
    // support comma-separated too
    const students = studentParam.length
      ? studentParam.flatMap(s => s.split(",").map(t => t.trim()).filter(Boolean))
      : [];

    const from = url.searchParams.get("from") || "";
    const to   = url.searchParams.get("to") || "";
    if (!students.length) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }
    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required (YYYY. MM. DD.)" }, { status: 400 });
    }

    const notes = await getClassnotesInRange(students, from, to);
    return NextResponse.json({ data: notes }, { status: 200 });
  } catch (e) {
    console.error("[classnote/search] error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
