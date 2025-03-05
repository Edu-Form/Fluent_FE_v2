import { NextResponse } from "next/server";
import { saveQuizletData } from "@/lib/data";
import { openaiClient } from "@/lib/openaiClient"; // Import the OpenAI client instance

export async function POST(request: Request) {
  try {
    const quizletData = await request.json();
    console.log(quizletData);

    if (!quizletData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { original_text } = quizletData;

    // Process the original text to create eng_quizlet
    let lines = original_text.split("\n").filter((line: string) => /^[0-9]/.test(line));
    // interface QuizletData {
    //   student_name: string;
    //   class_date: string;
    //   date: string;
    //   original_text: string;
    // }

    // Filter the numbered lines for quizlet 
    lines = lines.

    lines = lines
      .map((line: string) => line.trim())
      .filter((line: string) => line);
    const eng_quizlet = lines;

    // Join eng_quizlet lines for OpenAI API request
    const eng_quizlet_text = eng_quizlet.join("\n");

    // Use OpenAI API to translate eng_quizlet to Korean
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4", // Use the correct GPT-4 model
      messages: [
        {
          role: "system",
          content:
            "Translate the following lines of text from English to Korean. Return each translation on a new line:\n\n",
        },
        { role: "user", content: eng_quizlet_text },
      ],
    });

    const translated_text =
      completion.choices[0]?.message?.content?.trim() ?? "";
    const kor_quizlet = translated_text.split("\n");

    const result = await saveQuizletData(quizletData, kor_quizlet, eng_quizlet);

    return NextResponse.json(
      { message: "Data saved successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
