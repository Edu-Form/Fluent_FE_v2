// app/api/classnotes/route.ts
import { NextResponse } from "next/server";
import { saveClassnotesNew, getExactClassnote } from "@/lib/data";


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const student = url.searchParams.get("student_name");
    const teacher = url.searchParams.get("teacher_name");
    const date = url.searchParams.get("date");

    if (!student || !teacher || !date) {
      return NextResponse.json(
        { error: "student_name, teacher_name, and date are required" },
        { status: 400 }
      );
    }

    // Normalize date → ensure it ends with "."
    const cleanDate = date.endsWith(".") ? date : `${date}.`;

    const doc = await getExactClassnote(student, teacher, cleanDate);
    console.log(doc)

    return NextResponse.json({ data: doc ?? null });
  } catch (err) {
    console.error("GET /api/classnote error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Expect the same envelope style you already use
    // {
    //   quizletData: { student_names: string[] | string, class_date, date, original_text },
    //   homework, nextClass,
    //   started_at, ended_at, duration_ms,
    //   quizlet_saved, // boolean
    //   teacher_name,  // optional
    //   type           // optional
    // }
    const {
      quizletData,
      homework,
      nextClass,
      started_at,
      ended_at,
      duration_ms,
      quizlet_saved,
      teacher_name,
      type,
      reason
    } = body || {};

    if (!quizletData) {
      return NextResponse.json({ error: "Missing quizletData" }, { status: 400 });
    }

    const { student_names, class_date, date, original_text } = quizletData || {};
    const names = Array.isArray(student_names)
      ? student_names
      : typeof student_names === "string"
      ? student_names.split(",").map((n: string) => n.trim()).filter(Boolean)
      : [];

    if (!names.length) {
      return NextResponse.json({ error: "No student names provided" }, { status: 400 });
    }
    if (!class_date || !date) {
      return NextResponse.json({ error: "class_date and date are required" }, { status: 400 });
    }
    if (!original_text) {
      return NextResponse.json({ error: "original_text is required" }, { status: 400 });
    }

    const results = [];
    for (const name of names) {
      const res = await saveClassnotesNew({
        student_name: name,
        class_date,
        date,
        original_text,
        homework: homework ?? "",
        nextClass: nextClass ?? "",
        started_at: started_at ? new Date(started_at) : null,
        ended_at: ended_at ? new Date(ended_at) : null,
        duration_ms: Number.isFinite(duration_ms) ? Number(duration_ms) : null,
        quizlet_saved: !!quizlet_saved, // probably false at End Class time
        teacher_name: teacher_name ?? "",
        type: type ?? "",
        reason: reason ?? "", 
      });
      results.push({ name, result: res });
    }

    return NextResponse.json(
      { message: "Classnotes saved", results },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/classnotes] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
