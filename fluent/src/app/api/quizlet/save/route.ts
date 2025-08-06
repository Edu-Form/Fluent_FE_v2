// /api/quizlet/save/route.ts
import { NextResponse } from "next/server";
import { saveQuizletData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quizletData, eng_quizlet, kor_quizlet, homework, nextClass } = body;

    if (!quizletData || !eng_quizlet || !kor_quizlet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { student_names, ...rest } = quizletData;

    const names = Array.isArray(student_names)
      ? student_names
      : typeof student_names === "string"
        ? student_names.split(",").map((n: string) => n.trim()).filter(Boolean)
        : [];

    if (names.length === 0) {
      return NextResponse.json({ error: "No student names provided" }, { status: 400 });
    }

    const results = [];

    for (const name of names) {
      const result = await saveQuizletData(
        { ...rest, student_name: name },
        kor_quizlet,
        eng_quizlet,
        homework,
        nextClass
      );
      results.push({ name, result });
    }

    return NextResponse.json({ message: "Saved for all students", results }, { status: 200 });

  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
