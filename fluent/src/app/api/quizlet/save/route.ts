// /api/quizlet/save/route.ts
import { NextResponse } from "next/server";
import { saveQuizletData, setClassnoteQuizletSavedById } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      quizletData,
      eng_quizlet,
      kor_quizlet,
      homework,
      nextClass,
    } = body;

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

    const { origin } = new URL(request.url);
    const results: any[] = [];

    for (const name of names) {
      // 1) Save the quizlet (your existing DB write)
      const result = await saveQuizletData(
        { ...rest, student_name: name },
        kor_quizlet,
        eng_quizlet,
        homework,
        nextClass,
      );

      // 2) Call your own API to get the most recent classnote
      let classnoteUpdate = { matched: 0, modified: 0 };
      try {
        const recentRes = await fetch(
          `${origin}/api/classnote/recent?student_name=${encodeURIComponent(name)}`,
          { cache: "no-store" }
        );

        if (recentRes.ok) {
          const recent = await recentRes.json(); // { _id, student_name, date, quizlet_saved, ... }
          if (recent?._id) {
            // 3) Flip quizlet_saved = true by ID
            classnoteUpdate = await setClassnoteQuizletSavedById(recent._id);
          }
        } else {
          // 404 or other non-OK → skip (there may be no classnote yet)
          console.warn(`[quizlet/save] recent classnote not found for '${name}'`);
        }
      } catch (e) {
        console.error("[quizlet/save] failed to fetch recent classnote:", e);
      }

      results.push({ name, result, classnote_update: classnoteUpdate });
    }

    return NextResponse.json({ message: "Saved for all students", results }, { status: 200 });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
