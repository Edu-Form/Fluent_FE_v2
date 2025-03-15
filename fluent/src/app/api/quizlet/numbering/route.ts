import { NextResponse } from "next/server";
import { openaiClient } from "@/lib/openaiClient"; // Import the OpenAI client instance

export async function POST(request: Request) {
  try {
    const classNotes = await request.json();
    console.log(classNotes);

    if (!classNotes) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { text } = classNotes;

    // Use OpenAI API to translate eng_quizlet to Korean
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4", // Use the correct GPT-4 model
      messages: [
        {
          role: "system",
          content:
            "You will number only the quizlet sentences in the given text while leaving titles and subtitles unchanged. " +
            "Keep the original structure intact. Do NOT delete any lines. " +
            "Number only the sentences that belong to quizlet notes. " +
            "Titles and subtitles should remain unnumbered.",

        },
        { role: "user", content: text },
      ],
    });

    const numbered_text =
      completion.choices[0]?.message?.content?.trim() ?? "";
    // const kor_quizlet = translated_text.split("\n");

    return NextResponse.json(
      { message: "Notes Organized", numbered_text: numbered_text },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error organizing notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
