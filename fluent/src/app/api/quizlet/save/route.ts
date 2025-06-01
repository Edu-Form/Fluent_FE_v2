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

    const result = await saveQuizletData(quizletData, kor_quizlet, eng_quizlet, homework, nextClass);

    return NextResponse.json({ message: "Data saved successfully", result }, { status: 200 });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
