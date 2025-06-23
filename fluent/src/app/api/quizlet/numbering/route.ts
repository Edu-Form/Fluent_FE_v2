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
      model: "gpt-4o", // Use the correct GPT-4o model
      messages: [
        {
          role: "system",
          content:
            "You will number each non-empty line of the given text while keeping the original structure.\n" +
            "1. Prefix each non-empty line with its respective line number in this format: '1. <original line>'.\n" +
            "2. Do NOT number empty lines; keep them as they are.\n" +
            "3. Do NOT delete, merge, or alter any lines.\n" +
            "4. Maintain all line breaks exactly as they appear."

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
