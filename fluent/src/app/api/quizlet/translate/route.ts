// /api/quizlet/translate/route.ts
import { NextResponse } from "next/server";
import { openaiClient } from "@/lib/openaiClient";
import { decode } from "he"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { original_text } = body;

    const lines = original_text.match(/<mark>(.*?)<\/mark>/g);
    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: "No quizlet highlights found." }, { status: 400 });
    }

    const eng_quizlet = lines
      .map((item: string) => {
        const decoded = decode(item); // Convert &lt;u&gt; to <u>
        const noMark = decoded.replace(/<\/?mark[^>]*>/g, '');
        const noHtml = noMark.replace(/<[^>]*>/g, ''); // Strip all tags
        return noHtml.trim();
      })
      .filter((line: string) => line.length > 0);

    const eng_quizlet_text = eng_quizlet.join("\n");

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            `
          You are a professional translator helping generate flashcards.

          **Your task**: Translate each English sentence to Korean. If a sentence is already in Korean or mostly Korean, just return it as-is.

          **Rules**:
          - Keep the line order and count identical to the input.
          - For each input line, output exactly one translated line.
          - Do NOT omit or skip any lines, even if they're already Korean or gibberish.
          - Do NOT include any extra comments or formatting.
          - Strip HTML tags like <h1>, <p>, <bold>, etc.
          - Output only the Korean translations, one per line.
          `
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
