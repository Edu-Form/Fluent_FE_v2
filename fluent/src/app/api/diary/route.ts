import { NextResponse } from "next/server";
import { saveDiaryData } from "@/lib/data";
import { openaiClient } from "@/lib/openaiClient"; // Import the OpenAI client instance

export async function POST(request: Request) {
  try {
    const diaryData = await request.json();
    console.log(diaryData);

    if (!diaryData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { original_text } = diaryData;

    // /// Diary Correction Version 1
    // const ai_diary_correction = async (original_text: string) => {
    //   const completion = await openaiClient.chat.completions.create({
    //     model: "gpt-4",
    //     messages: [
    //       {
    //         role: "system",
    //         content:
    //           "Your task is to correct a student's diary sentences with a limited number of corrections to improve their writing skills.\n" +
    //           "Guidelines:\n" +
    //           "- Focus on identifying only crucial English grammar mistakes.\n" +
    //           "- Only correct the language aspect, refraining from altering spaces, commas, and similar punctuation.\n" +
    //           "- Correct each sentence individually without combining them.\n" +
    //           "- Respond only with the corrected text, without sentences like: " +
    //           "'Sure / Certainly. Here are the corrections based on the given criteria.'",
    //       },
    //       {
    //         role: "user",
    //         content: `Here's the text to correct: ${original_text}`,
    //       },
    //     ],
    //   });

    //   return completion.choices[0]?.message?.content?.trim() ?? "";
    // };
    /// Diary Correction with Error Details
    
    
    const ai_diary_correction = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: { type: "json_object" }, // Ensures structured output
        messages: [
          {
            role: "system",
            content: `
            Your task is to analyze a student's diary entry, correct grammar mistakes, and provide explanations.
            ONLY return a valid JSON object with:
            - "errors": An array of objects with details on mistakes, including:
              - "errorContent": The incorrect text.
              - "errorType": The type of error (one word, e.g., "grammar", "spelling").
              - "errorFix": The corrected text.
              - "errorExplain": A simple explanation of the error in Korean, easy for kids to understand.
    
            Guidelines:
            - Maintain sentence structure and punctuation.
            - Do not introduce unnecessary corrections.
            - errorExplain MUST be in Korean. 
            - Ignore punctuation mistakes like commas, periods, and spaces.
            - Respond ONLY with a valid JSON object: { "errors": [...] }.
            `,
          },
          {
            role: "user",
            content: `Here's the text to correct: ${original_text}`,
          },
        ],
      });
    
      let response = completion.choices[0]?.message?.content?.trim();

      // Ensure the response is a JSON object
      try {
        if (typeof response === "string") {
          response = JSON.parse(response);
        }
      } catch (error) {
        console.error("Error parsing AI response:", error);
        return { correctedDiary: original_text, errors: [] }; // Return original text if parsing fails
      }
    
      return response;
    };
    

    const diary_correction = await ai_diary_correction(original_text);
    console.log(diary_correction);

    /// Diary Summary
    const ai_corrected_diary = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Your task is to correct any grammar and spelling mistakes in a student's diary entry.\n" +
              "Guidelines:\n" +
              "- Keep the original meaning and tone of the diary entry.\n" +
              "- Do not change the style unless necessary for proper grammar.\n" +
              "- Keep the language natural and suitable for a student.\n" +
              "- Return only the corrected diary without additional commentary.",
          },
          {
            role: "user",
            content: `Here is the diary to summarize: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };
    
    const corrected_diary = await ai_corrected_diary(original_text);

    /// Diary Expressions
    const ai_diary_expressions = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Recommend 5~10 new expressions for the student that can be used to improve the diary entry.\n" +
              "Guidelines:\n" +
              "- Stay within the vocabulary and grammar level of the diary text.\n" +
              "- Feel free to be slightly creative in line with the contents of the diary when recommending new expressions.\n" +
              "- Recommend new sentence structures.\n" +
              "- Recommend casual versions of the same sentence.\n" +
              "- Always include the number at the beginning of each expression.\n" +
              "- On the input, each sentence from the diary corrected text is separated by a newline character '\\n'.\n" +
              "- Sentences must be no longer than 50 characters.\n\n" +
              "Expected response example:\n" +
              "I headed to my friend's house\n" +
              "I didn't get up until noon\n" +
              "I woke up late\n" +
              "I was excited this morning because I used my new perfume\n" +
              'We watched a movie called "Dune 2"\n' +
              "My friend runs a pizza store in Seoul.\n" +
              "I was stressed because I woke up 20 minutes late\n" +
              "I didn't hear the alarm\n" +
              "I couldn't find my wallet\n" +
              "I didn't eat breakfast because I didn't have enough time",
          },
          {
            role: "user",
            content: `Here is the diary to summarize: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };

    const diary_expressions = await ai_diary_expressions(original_text);
    console.log(diary_expressions);

    /// Diary Summary
    const ai_diary_summary = async (original_text: string) => {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Your task is to summarize a student's diary entry in 3-5 sentences.\n" +
              "Guidelines:\n" +
              "- Write the summary in casual adult English tone.\n" +
              "- Write in first person.\n" +
              "- Use simple 4th-grade level vocabulary.\n" +
              "- Ensure that the first sentence starts with 'I wrote about'.\n" +
              "- Each sentence should have at most 40 words.",
          },
          {
            role: "user",
            content: `Here is the diary to summarize: ${original_text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? "";
    };

    const diary_summary = await ai_diary_summary(original_text);
    console.log(diary_summary);

    const result = await saveDiaryData(
      diaryData,
      diary_correction,
      corrected_diary,
      diary_expressions,
      diary_summary
    );

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
