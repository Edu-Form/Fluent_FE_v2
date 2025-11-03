import { NextResponse } from "next/server";
import { getClassnotesInRange } from "@/lib/data";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentsParam = url.searchParams.getAll("student_name");
    const students = studentsParam
      .flatMap(s => s.split(",").map(v => v.trim()).filter(Boolean));

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!students.length) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }
    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required (YYYY. MM. DD.)" }, { status: 400 });
    }

    const notes = await getClassnotesInRange(students, from, to);
    return NextResponse.json(notes ?? [], { status: 200 }); // ✅ flat array for consistency
  } catch (err) {
    console.error("Error fetching classnotes:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
