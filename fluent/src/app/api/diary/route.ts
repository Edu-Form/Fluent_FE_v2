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

    const { original_text, level } = diaryData;

    const levelInstructions = {
      level1: `
        Limit the editing vocabulary & grammar to a preschooler ~ 1st grader.
        Use only simple sentence structures.
        No noun clauses.
        No relative pronouns.
        No gerunds.
        No to-infinitives.
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didnt know how to write it in English, please translate those as well to naturally fit into the diary.
      `,
      level2: `
        Limit the editing vocabulary & grammar to a 1st grader ~ 3rd grader.
        Use only simple sentence structures but the sentences can get slightly longer.
        No noun clauses.
        No relative pronouns.
        Encouraged to use simple gerunds.
        Encouraged to use simple to-infinitives.
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didn’t know how to write it in English, please translate those as well to naturally fit into the diary.
      `,
      level3: `
        Limit the editing vocabulary & grammar to a 3rd grader ~ 6th grader.
        You can creatively make the sentences slightly longer with simple grammar.
        No noun clauses.
        No relative pronouns.
        Encouraged to use simple gerunds.
        Encouraged to use simple to-infinitives.
        Encouraged to use while / during / for.
        Encouraged to use simple phrases and idioms to make the diary more natural (e.g., in the morning / on the weekend / went to bed).
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didn’t know how to write it in English, please translate those as well to naturally fit into the diary.
      `,
      level4:`
        Limit the editing vocabulary & grammar to a 3rd grader ~ 6th grader.
        You can creatively make the sentences slightly longer with simple grammar.
        No noun clauses.
        No relative pronouns.
        Encouraged to use simple gerunds.
        Encouraged to use to-infinitives.
        Encouraged to use while / during / for.
        Encouraged to use simple phrases and idioms to make the diary more natural (e.g., in the morning / on the weekend / went to bed).
        Creatively write more within the same level and context to make the diary more interesting.
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didn’t know how to write it in English, please translate those as well to naturally fit into the diary.
      `,
      level5: `
        Limit the editing vocabulary & grammar to a 5th ~ 6th grader.
        You can creatively make the sentences slightly longer with simple grammar.
        No noun clauses.
        No relative pronouns.
        Encouraged to use simple gerunds.
        Encouraged to use simple to-infinitives.
        Encouraged to use while / during / for.
        Creatively write more within the same level and context to make the diary more interesting.
        From a level 5 diary, edit the diary to focus on one major event instead of listing out simply what they did.
        Emphasize characters and dialogue.
        Start using quotes with expressions like "I was like", "she said", "he asked".
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didn’t know how to write it in English, please translate those as well to naturally fit into the diary.
      `,
      level6:`
        Limit the editing vocabulary & grammar to a 7th grader.
        You can creatively make the sentences slightly longer with simple grammar.
        No noun clauses.
        No relative pronouns.
        Encouraged to use simple gerunds.
        Encouraged to use simple to-infinitives.
        Encouraged to use while / during / for.
        Encouraged to use casual native phrases and idioms to make the diary more natural.
        Creatively write more within the same level and context to make the diary more interesting.
        From a level 5 diary onwards, edit the diary to focus on one major event instead of listing out simply what they did.
        Emphasize characters and dialogue.
        Start using harder quotes and summarization expressions like "she said that ~", "I told her to", "he asked me if", "I thought that", "I heard that".
        Feel free to vary sentence structure a little bit to make it sound more natural.
        If there is any Korean that the student used because they didn’t know how to write it in English, please translate those as well to naturally fit into the diary.
      `,

    };

    const selectedLevelInstruction = levelInstructions[`level${level as 1 | 2 | 3 | 4 | 5 | 6}`] || "";
    
    
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
            - Level-based instructions: ${selectedLevelInstruction}
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
              "- Return only the corrected diary without additional commentary." +
              `- Level-based instructions: ${selectedLevelInstruction}`
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
