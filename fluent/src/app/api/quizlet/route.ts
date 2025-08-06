import { NextResponse } from "next/server";
import { saveQuizletData } from "@/lib/data";
import { openaiClient } from "@/lib/openaiClient"; // Import the OpenAI client instance
import * as cheerio from "cheerio";
import { decode } from "he"


export async function POST(request: Request) {
  try {
    const quizletData = await request.json();
    console.log(quizletData);

    if (!quizletData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { original_text, homework, nextClass } = quizletData;

    console.log("📥 ORIGINAL_TEXT (raw input):", original_text);

    const markBlocks = original_text.match(/<mark\b[^>]*>([\s\S]*?)<\/mark>/g) || [];

    if (markBlocks.length === 0) {
      return NextResponse.json({ error: "No Translation" }, { status: 400 });
    }

    const eng_quizlet = markBlocks.map((item: string) => {
      // Step 1: Decode escaped HTML (&lt;u&gt; → <u>)
      const decoded = decode(item);

      // Step 2: Parse into HTML and clean tags
      const $ = cheerio.load(decoded);

      // Strip only <mark> but keep content
      $('mark').each((_, el) => {
        $(el).replaceWith($(el).html() || '');
      });

      // Strip all other tags (like <u>, <b>, etc.)
      return $.text().trim();
    }).filter((line: string) => line);

    // Join eng_quizlet lines for OpenAI API request
    const eng_quizlet_text = eng_quizlet.join("\n");

    // Use OpenAI API to translate eng_quizlet to Korean
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o", // Use the correct GPT-4 model
      messages: [
        {
          role: "system",
          content:
          "Translate the following English text into Korean.\n\nGuidelines:\n- Make the translations as natural but accurate as possible.\n- Do not make the Korean grammar awkward.\n Leave punctuation marks like >, < as it is. \n- Each English line should be paired with exactly one Korean line. This is important for making flashcards.\n Remove any HTML tags like <h1>, <p>, <bold>. \n MUST Remove <u> tags.",
        },
        { role: "user", content: eng_quizlet_text },
      ],
    });

    const translated_text =
      completion.choices[0]?.message?.content?.trim() ?? "";
    const kor_quizlet = translated_text.split("\n");

    const result = await saveQuizletData(quizletData, kor_quizlet, eng_quizlet, homework, nextClass);

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
