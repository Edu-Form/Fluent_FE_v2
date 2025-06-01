// /api/quizlet/translate/route.ts
import { NextResponse } from "next/server";
import { openaiClient } from "@/lib/openaiClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { original_text } = body;

    const lines = original_text.match(/<mark>(.*?)<\/mark>/g);
    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: "No quizlet highlights found." }, { status: 400 });
    }

    const eng_quizlet = lines
      .map((item: string) => item.replace(/<\/?mark>/g, '').trim())
      .filter((line: string) => line.length > 0);

    const eng_quizlet_text = eng_quizlet.join("\n");

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Translate the following English text into Korean.\n\nGuidelines:\n- Make the translations as natural but accurate as possible.\n- Do not make the Korean grammar awkward.\n- Each English line should be paired with exactly one Korean line. This is important for making flashcards.",
        },
        { role: "user", content: eng_quizlet_text },
      ],
    });

    const translated_text = completion.choices[0]?.message?.content?.trim() ?? "";
    const kor_quizlet = translated_text.split("\n");

    return NextResponse.json({ eng_quizlet, kor_quizlet }, { status: 200 });
  } catch (error) {
    console.error("Error in translation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
