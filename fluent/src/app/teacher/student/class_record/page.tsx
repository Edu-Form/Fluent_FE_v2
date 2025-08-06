"use client";

import { useState, useEffect, Suspense, ReactNode, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import Link from "next/link";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
import debounce from "lodash.debounce";
import "react-day-picker/dist/style.css";


// 날짜 포맷 함수들 유지
const formatToISO = (date: string | undefined): string => {
  // 기존 함수 유지
  try {
    if (!date) return "";

    const parts = date.trim().replace(/\.$/, "").split(". ");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // 이미 ISO 형식인 경우 검증 후 반환
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }

    return "";
  } catch (error) {
    console.error("날짜 포맷 오류:", error);
    return "";
  }
};

const today_formatted = (): string => {
  // 기존 함수 유지
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("오늘 날짜 포맷 오류:", error);
    return new Date().toISOString().split("T")[0]; // 대체 방법
  }
};

const formatToSave = (date: string | undefined): string => {
  // 기존 함수 유지
  try {
    if (!date) return "";

    // 유효한 날짜 형식인지 확인
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return "";

    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return "";

    return `${year}. ${month}. ${day}.`;
  } catch (error) {
    console.error("저장 형식 변환 오류:", error);
    return "";
  }
};

// 퀴즐렛 페이지 내용 컴포넌트
const ClassPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // URL 파라미터 안전하게 가져오기
  const getParam = (name: string): string => {
    try {
      return searchParams?.get(name) || "";
    } catch (error) {
      console.error(`파라미터 가져오기 오류 (${name}):`, error);
      return "";
    }
  };

  const next_class_date = getParam("next_class_date");
  const user = getParam("user");
  const student_name = getParam("student_name");
  const type = getParam("type");
  const user_id = getParam("id");

  const [class_date, setClassDate] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [original_text, setOriginal_text] = useState<string>("");
  const [loading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [quizletLines, setQuizletLines] = useState<
    { eng: string; kor: string }[]
  >([]);
  const [translating, setTranslating] = useState(false);
  const saveTempClassNote = useCallback(
    debounce(async (html: string) => {
      console.log("💾 Attempting to autosave:", { student_name, html }); // ← Add this
      try {
        await fetch("/api/quizlet/temp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_name, original_text: html }),
        });
      } catch (error) {
        console.error("❌ Autosave failed:", error);
      }
    }, 1000),
    [student_name]
  );

  // 마운트 확인 및 초기 데이터 설정
  useEffect(() => {
    setIsMounted(true);

    // 초기 날짜값 설정
    try {
      const formattedClassDate = formatToSave(formatToISO(next_class_date));
      const formattedToday = formatToSave(today_formatted());

      setClassDate(formattedClassDate);
      setDate(formattedToday);
    } catch (error) {
      console.error("날짜 초기화 오류:", error);
      // 오류 발생 시 기본값으로 오늘 날짜 사용
      const todayISO = new Date().toISOString().split("T")[0];
      setClassDate(formatToSave(todayISO));
      setDate(formatToSave(todayISO));
    }
  }, [next_class_date]);

  const handleSaveClick = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!homework.trim()) {
      alert("Homework field is required.");
      return;
    }

    if (!original_text || original_text.trim().length === 0) {
      alert("Please write class notes.");
      return;
    }

    if (!class_date || class_date.trim() === "") {
      alert("Please select a class date.");
      return;
    }

    if (!original_text.includes("<mark>")) {
      alert("Please highlight at least one Quizlet expression.");
      return;
    }

    setTranslating(true);

    try {
      const response = await fetch("/api/quizlet/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Translation failed");
      }

      const { eng_quizlet, kor_quizlet } = await response.json();

      const merged = eng_quizlet.map((eng: string, i: number) => ({
        eng,
        kor: kor_quizlet[i] || "",
      }));

      setQuizletLines(merged);
      setTranslationModalOpen(true);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Unknown error during translation."
      );
    } finally {
      setTranslating(false);
    }
  };

  const notesTemplate1 = `
  <h1>📚 First Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The First Class</h3>

  <ol>
    <li>
      <strong>Go Over Notion Goals</strong><br/>
      🕐 Duration: 5 minutes<br/>
      ✅ 주 2회 3~6개월 목표!<br/>
      ⚠️ 레벨 1 이하는 더 걸릴 수도 있다<br/>
      ❗ 숙제 안 해오고 수업 빠지기 시작하면 더 오래 걸릴 수 있다
    </li>

    <li>
      <strong>Self Introduction</strong><br/>
      🕐 Duration: 15 minutes<br/>
      😊 Keep it simple – don’t make it too hard<br/>
      📌 Add to flashcards – ensure memorization in bulk<br/>
      💬 Include:
      <ul>
        <li>Name</li>
        <li>Age</li>
        <li>Job</li>
        <li>Job Details</li>
        <li>Hobbies</li>
      </ul>
      (4–7 sentences is enough)
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ⚠️ If student is under Level 3 → Do textbook for 30 minutes instead<br/>
      💬 Questions to use:
      <ul>
        <li>What did you do yesterday?</li>
        <li>How are you?</li>
        <li>When did you wake up?</li>
        <li>What did you do after that?</li>
      </ul>
      📥 Add these into Quizlet
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📘 Pace: Finish Chapter 1 in 4–8 classes for Level 1–2 students
    </li>

    <li>
      <strong>Homework Prep</strong><br/>
      🕐 Duration: 10 minutes<br/>
      🛠️ Setup:
      <ul>
        <li>Fluent App: <a href="https://fluent-five.vercel.app/">https://fluent-five.vercel.app/</a></li>
        <li>Add to mobile home screen (iPhone Safari / Android Chrome)</li>
        <li>Kakao Channel: <a href="http://pf.kakao.com/_ndxoZG/chat">http://pf.kakao.com/_ndxoZG/chat</a></li>
      </ul>
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards (use the ‘star’ function properly)</li>
    <li>📩 Message teacher if you can’t find or use your flashcards</li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Go deeper into 일반동사 + be 동사 Q&A</li>
    <li>Test the student using the textbook with parts covered up</li>
  </ul>
`;

  const notesTemplate2 = `
  <h1>📚 Second Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The Second Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if students did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before class<br/>
      🌟 Check if they used the “star” function for flashcards<br/>
      📋 Copy completed self-introductions into the “collect bulk answers template”
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 5–15 minutes (based on level)<br/>
      💬 Questions to ask:
      <ul>
        <li>What did you do yesterday?</li>
        <li>How are you?</li>
        <li>When did you wake up?</li>
        <li>What did you do after that?</li>
      </ul>
      📥 Add these into Quizlet
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🔁 Focus on memorizing self-introductions<br/>
      ❌ If sentences are wrong → Star it → Retest → Still wrong? Copy into today’s notes<br/>
      🔀 Shuffle and review about half the Quizlet deck per class
    </li>

    <li>
      <strong>Write Diary Together</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📖 Read example diaries in Chapter 1 that match their level<br/>
      📌 Direct them to refer to those expressions in Quizlet when writing their next diary
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🗣️ Test the student by speaking while covering up the book<br/>
      📝 Add any slow/wrong expressions into their Quizlet deck
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write a similar diary after reviewing the flashcards</li>
  </ul>

  <h2>📌 Next Class Plan</h2>
  <ul>
    <li>Keep going deeper into 일반동사 + be 동사 Q&A</li>
    <li>Take the first textbook test if ready</li>
  </ul>
`;

  const notesTemplate3 = `
  <h1>📚 Third Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The Third Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if the student did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting<br/>
      🌟 Check if they used the “star” function on flashcards
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 5–15 minutes (depending on level)<br/>
      💬 Suggested Questions:
      <ul>
        <li>What did you do yesterday?</li>
        <li>How are you?</li>
        <li>When did you wake up?</li>
        <li>What did you do after that?</li>
      </ul>
      ➕ Try new simple questions from the textbook if they’ve reached the questions section
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🧠 Negotiate flashcard count: 30–60 cards<br/>
      ❌ Wrong answers → Star → Retest → Still wrong? Add to today’s notes<br/>
      🔀 Shuffle & review ~50% of the Quizlet deck each class
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      💬 Follow the diary conversation examples in Chapter 1<br/>
      📘 Refer to ‘diary expressions’ test in Chapter 1<br/>
      1️⃣ Student tells the diary without looking<br/>
      2️⃣ Open the AI-edited diary → Read through mistakes<br/>
      ✍️ Add easy/common mistakes + strong sentences to today’s notes for future flashcards
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ✅ If they took a test as homework, add wrong answers to flashcards<br/>
      ⚡ If they hesitated for more than 5 seconds (even if correct), add it as a polishing flashcard
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (include newly learned grammar)</li>
    <li>If you’ve reached the be동사/일반동사 test → Solve & grade at home<br/>
        🛑 Do not look at the answer sheet until after finishing the test
    </li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Go deeper into 일반동사 + be동사 Q&A</li>
    <li>Try harder diaries + diary conversations</li>
  </ul>
`;

  const notesTemplate4 = `
  <h1>📚 Fourth Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>Class Title</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if the student did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting<br/>
      🌟 Check if they used the “star” function on flashcards
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      💬 Review small talk using memorized expressions<br/>
      🔄 Have the student ask questions back (2-way conversation)
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ❌ Wrong cards → Star → Retest → Still wrong? Add to today’s notes<br/>
      🔀 Shuffle & review ~50% of the Quizlet deck each class
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🧠 Student summarizes the diary without looking<br/>
      📖 Look at AI-edited version → Add good expressions to flashcards<br/>
      ➕ Refer to textbook’s diary-related expressions<br/>
      🔁 Help the student upgrade the diary with new grammar
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📘 Process: Understand → Memorize → Use<br/>
      ✅ Tests can be done in class or assigned as homework depending on student level
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (include newly learned grammar)</li>
    <li>If reached test level: Solve and grade it at home</li>
  </ul>
`;

  const notesTemplate5 = `
  <h1>📚 Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>Class Title</h3>

  <ol>
    <li>
      <strong>Check Homework</strong>
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Previous Flashcards Review</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (including new grammar learned)</li>
    <li>Include a test if reached (solve and grade it for homework)</li>
  </ul>
`;

  const intermediateTemplate1 = `
  <h1>📚 First Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The First Class</h3>

  <ol>
    <li>
      <strong>Go Over Notion Goals</strong><br/>
      🕐 Duration: 3–5 minutes<br/>
      ✅ 주 2회 3~6개월 목표!<br/>
      ⚠ 숙제 안 해오고 수업 빠지기 시작하면 더 걸릴 수도 있다.
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      💬 Topics:
      <ul>
        <li>Weekend / Today / Something new / Next weekend</li>
        <li>What else did you do?</li>
        <li>Did you do anything fun?</li>
      </ul>
      📌 Feel free to extend time if conversation flows well!
    </li>

    <li>
      <strong>Self Introduction</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🧠 Make it harder than beginner level self-intro<br/>
      📌 Add to flashcards — make sure they memorize in bulk!<br/>
      💡 Include:
      <ul>
        <li>Name</li>
        <li>Age</li>
        <li>Job & job detail</li>
        <li>Hobbies</li>
      </ul>
      (4–7 sentences is enough)
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 20 minutes<br/>
      📘 Activities:
      <ul>
        <li>Read goals & homework together</li>
        <li>Ask: “How many ways can you greet me without looking at the textbook?”</li>
        <li>Read “preview examples” together</li>
        <li>If comfortable (usually level 7+), skip to test</li>
        <li>Read at least 1 storytelling example</li>
        <li>Write a sample storytelling diary together</li>
      </ul>
      📏 Pace: Try to finish Chapter 5 in 2–3 classes
    </li>

    <li>
      <strong>Homework Prep</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      🛠️ Setup:
      <ul>
        <li>Fluent App: <a href="https://fluent-five.vercel.app/">https://fluent-five.vercel.app/</a></li>
        <li>Add to home screen (iPhone Safari / Android Chrome)</li>
        <li>Kakao Channel: <a href="http://pf.kakao.com/_ndxoZG/chat">http://pf.kakao.com/_ndxoZG/chat</a></li>
      </ul>
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards (use the ‘star’ function properly)</li>
    <li>Storytelling Diary</li>
    <li>Chapter 5 Test – Solve & Grade at home<br/>(or next class if you're going slow)</li>
    <li>📩 Message the teacher if flashcards are missing</li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Storytelling Diary – 대화로 검사</li>
    <li>Chapter 5 Test – 틀린 표현들 검사 (틀리면 퀴즐렛 추가)</li>
  </ul>
`;

  const intermediateTemplate2 = `
  <h1>📚 Second Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The Second Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if students did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting class<br/>
      🌟 Check if they used the “star” function on their flashcards<br/>
      📋 Copy completed self-introductions into the “collect bulk answers template”
    </li>

    <li>
      <strong>Student-Driven Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🎯 Students ask questions first (let them know it’s intentional)<br/>
      💡 Provide small talk starter expressions:
      <ul>
        <li>What did you do last weekend?</li>
        <li>Did anything fun or unexpected happen?</li>
        <li>What are your plans for the upcoming weekend?</li>
        <li>How was work this week?</li>
        <li>What’s something you’re looking forward to?</li>
      </ul>
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🎓 Check if they memorized their self-introduction in bulk<br/>
      🔄 Negotiate amount: 30–100 cards (more is better, polishing encouraged)<br/>
      ❌ Wrong cards → Star it → Retest → Still wrong? Copy into today's notes<br/>
      📌 Students MUST memorize their flashcards
    </li>

    <li>
      <strong>Storytell the Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🗣️ Without looking, student retells diary in a fun, compact way<br/>
      🤔 Ask a few follow-up questions<br/>
      🎭 You give an example version of their diary<br/>
      🔄 Student asks about your week/weekend<br/>
      🧑‍🏫 You do a 5-minute storytelling session<br/>
      ❓ Let the student ask you a few questions too<br/>
      ✍️ Afterward: check AI diary edits & add good expressions to flashcards
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📄 Go over Chapter 5 test & expressions they got wrong or don’t understand<br/>
      🧠 Add those expressions to flashcards if needed<br/>
      ⏱️ Finishing a chapter = 2–3 classes<br/>
      📘 If they finish quickly → Try questions from the Intermediate Level Test<br/>
      🏠 Optional Homework: Write Intermediate Test questions at home
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Storytelling Diary (or Work Diary if business-focused)</li>
    <li>Chapter 5 Test – Solve & Grade at home</li>
    <li>Already did Chapter 5? Write 1–3 Intermediate test questions at home:</li>
    <ul>
      <li>Tell me about something unexpected that happened recently</li>
      <li>Tell me about the most memorable fight or argument you had</li>
      <li>Tell me some office gossip (someone you dislike maybe)</li>
      <li>Tell me about a situation that annoyed you at work</li>
      <li>Tell me about how your kids upset you or made you laugh</li>
    </ul>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Storytell Intermediate Level Test questions in person</li>
    <li>Move on to the next textbook chapter</li>
  </ul>
`;
  const intermediateTemplate3 = `
  <h1>📚 Third Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>The Third Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if students did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting class<br/>
      🌟 Check if they used the “star” function on their flashcards
    </li>

    <li>
      <strong>Student-Driven Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🎯 Students initiate conversation<br/>
      💡 Teach & practice useful small talk starter expressions:
      <ul>
        <li>“How’s your week been?”</li>
        <li>“Anything interesting happen recently?”</li>
        <li>“How was work today?”</li>
        <li>“What are your weekend plans?”</li>
      </ul>
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ❌ Wrong cards → Star it → Retest<br/>
      📝 Still wrong? Copy into today's notes<br/>
      📌 Students MUST memorize flashcards consistently
    </li>

    <li>
      <strong>Storytell the Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📖 Diary must include:
      <ul>
        <li>Characters</li>
        <li>Quotes</li>
        <li>Interesting flow</li>
      </ul>
      🔄 Student should ask you questions too<br/>
      🧠 Summarize diary without looking → Check AI edits → Add good expressions to flashcards<br/>
      ⬆️ Upgrade the diary using new grammar if possible
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      📘 Continue the textbook<br/>
      🗣️ Test them verbally on expressions<br/>
      ❗ Add slow/wrong expressions to flashcards<br/>
      ✍️ Try out intermediate level test questions per chapter
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Storytelling Diary (or Work Diary)</li>
    <li>Solve another textbook test & grade it</li>
    <li>📌 Keep a steady pace – don’t just talk!</li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Keep working on current or next textbook chapter</li>
  </ul>
`;

  const intermediateTemplate4 = `
  <h1>📚 Class Template</h1>

  <h2>🗓️ Date:</h2>
  <h3>Class Title:</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      🕐 Duration: 5–7 minutes<br/>
      ✅ Check if students did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting class<br/>
      🌟 Check if they used the “star” function to study flashcards<br/>
      📋 Copy long-form homework into “collect bulk answers template”
    </li>

    <li>
      <strong>Student-Driven Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🗣️ Let students start the conversation using memorized expressions<br/>
      ❓ Make sure they also ask you questions during small talk
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ❌ Wrong cards → Star it → Retest<br/>
      📝 Still wrong? Copy into today's notes<br/>
      📌 Students MUST memorize flashcards regularly
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🧠 Summarize diary without looking → Review AI edits<br/>
      ✍️ Add good expressions to flashcards<br/>
      📘 Refer to related expressions in the textbook<br/>
      ⬆️ Upgrade the diary to include new grammar
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🎯 Goal: Understand → Memorize → Use<br/>
      📄 Do textbook tests in class or assign them as homework based on the student
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (use new grammar learned)</li>
    <li>If you’ve reached a test section: Solve & Grade it at home</li>
    <li>Give a chapter test topic (under 10 sentences)<br/>
        📝 This can replace the diary if the student is short on time
    </li>
  </ul>
`;
  const intermediateTemplate5 = `
  <h1>📚 Class Template</h1>

  <h3>Class Title</h3>

  <ol>
    <li>
      <strong>Student-Driven Small Talk</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🗣️ Encourage students to begin the conversation using memorized expressions<br/>
      ❓ Make sure they ask you questions as well
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      🕐 Duration: 15 minutes<br/>
      ❌ Wrong cards → Star it → Retest<br/>
      📝 Still wrong? Copy into today's notes<br/>
      📌 Students MUST continue to memorize flashcards
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🧠 Summarize without looking → Check AI edits<br/>
      ✍️ Add strong expressions to flashcards<br/>
      📘 Upgrade using new grammar and refer to textbook expressions
    </li>

    <li>
      <strong>Textbook</strong><br/>
      🕐 Duration: 15 minutes<br/>
      🎯 Understand → Memorize → Use<br/>
      📄 Tests can be done in class or assigned for homework
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (with new grammar)</li>
    <li>Complete textbook test (solve & grade at home if reached)</li>
    <li>Write a chapter test topic (under 10 sentences)<br/>
        📝 May be used in place of a diary if short on time
    </li>
  </ul>
`;


  const businessTemplate1 = `
  <h1>📚 Business Class Template</h1>

  <ol>
    <li>
      <strong>Go Over Notion Goals</strong><br/>
      🕐 Duration: 5 minutes
    </li>

    <li>
      <strong>Casual Self Introduction Writing</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Write Business Diary Together</strong><br/>
      🕐 Duration: 15 minutes<br/>
      <em>Example:</em><br/>
      지금 연구하고 있는 제품에 대한 셈플 생산을 위해서 12시간 근무를 했다 → Yesterday, I had a 12 hour shift making samples for our new vitamin B5 supplement.<br/>
      다양한 설비를 조작하며 셈플이 나오게 실험들을 했다 → So I conducted various experiments to get a secure sample.
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Homework Prep</strong><br/>
      🕐 Duration: 10 minutes<br/>
      🛠️ Set up Fluent App: <a href="https://fluent-five.vercel.app/">https://fluent-five.vercel.app/</a><br/>
      📱 Add to mobile home screen (iPhone Safari / Android Chrome)<br/>
      🔗 Set up Kakao Channel link: <a href="http://pf.kakao.com/_ndxoZG/chat">http://pf.kakao.com/_ndxoZG/chat</a>
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards (use the ‘star’ function properly)</li>
    <li>Work Diary (focus on one task or meeting)</li>
    <li>Write Business Self Introduction (distinct from casual, work-focused)</li>
    <li>Memorize the casual self introduction in bulk</li>
    <li>Message teacher if you can’t find or use your flashcards</li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Review casual self introduction</li>
    <li>Edit business self introduction</li>
    <li>Storytell the work diary (go into detail about the topic)</li>
  </ul>
`;

  const businessTemplate2 = `
  <h1>📚 Advanced Business Class Template</h1>

  <ol>
    <li>
      <strong>Student Driven Small Talk</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Previous Quizlet Review</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>Business or Storytelling Diary Review</strong><br/>
      🕐 Duration: 15 minutes
    </li>

    <li>
      <strong>In Depth Work Conversations</strong><br/>
      🕐 Duration: 15 minutes
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Work Diary or Storytelling Diary (focus on one appointment or one work task)</li>
    <li>Write 1 in-depth work conversation topic (5–10 sentences)</li>
    <li>Memorize the previous homework (keep it around 5–10 sentences, not too long)</li>
  </ul>

  <h2>📌 Recommended Plan for Next Class</h2>
  <ul>
    <li>Review memorized topic</li>
    <li>Write new topic</li>
    <li>Storytell the diary (go into detail about the topic)</li>
  </ul>
`;

  const businessTemplate3 = `
  <h1>💼 Business Conversation Topics Guide</h1>

  <p>Use examples to explain, but keep answers under 15 sentences for memorization.<br/>
  Choose topics based on the student’s background. Feel free to adjust.</p>

  <ul>
    <li>Tell me about the company that you work at in detail.</li>
    <li>Tell me about your specific role at your company in detail.</li>
    <li>Tell me about a typical day at work in chronological order.</li>
    <li>Tell me about your team and department. What is your team in charge of?</li>
    <li>Are you satisfied with your job? Why or why not?</li>
    <li>What was your previous job? Why did you change jobs?</li>
    <li>What is your plan for the next 10 years?</li>
    <li>When do you usually get stressed? How do you handle stress?</li>
    <li>What motivates you to work harder or be better?</li>
    <li>What are your strengths and weaknesses? Give examples.</li>
    <li>Are there any coworkers you dislike? Spill some office gossip.</li>
    <li>How would your colleagues describe you?</li>
    <li>Are there any coworkers you like? Why do you admire them?</li>
    <li>What was the biggest challenge you’ve faced at work, and how did you overcome it?</li>
    <li>What skills have you developed the most through your job, and how?</li>
    <li>Have you ever made a mistake at work? What happened and how did you handle it?</li>
    <li>What’s your work-life balance like? Do you think it’s healthy? Why or why not?</li>
    <li>How do you stay productive or focused during long or difficult workdays?</li>
    <li>Tell me about some unique culture in your company.</li>
    <li>If you could change one thing about your current job, what would it be and why?</li>
  </ul>
`;

  const businessTemplate5 = `
   <h2>📚 Business Template 5</h2>

   <p><strong>Use examples to explain but keep the answers under 15 sentences to be able to memorize</strong></p>

   <p><strong>Tell me about your most memorable projects that shaped your career. Tell me in detail with examples about these projects.</strong></p>

   <ol>
     <li>Project 1 Title:</li>
     <li>Project 2 Title:</li>
     <li>Project 3 Title:</li>
   </ol>
 `;


  interface Note {
    _id: string;
    student_name: string;
    class_date: string;
    date: string;
    original_text: string;
    homework?: string;
    nextClass?: string; // Added nextClass property
  }

  const [searchedNotes, setSearchedNotes] = useState<Note[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const PersistentHeading = Extension.create({
    name: "persistentHeading",

    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          const { state, dispatch } = editor.view;
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name.startsWith("heading")) {
            const level = node.attrs.level;
            const shouldKeepHighlight = editor.isActive("highlight");

            splitBlock(state, dispatch);
            editor.commands.setNode("heading", { level });

            if (shouldKeepHighlight) {
              editor.commands.setMark("highlight");
            }

            return true;
          }

          return false;
        },
      };
    },
  });

  const CustomHighlight = Highlight.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      };
    },
  });

  const [activeTab, setActiveTab] = useState("beginner");

  type TabKey = "beginner" | "intermediate" | "business";

  const templates: Record<TabKey, string[]> = {
    beginner: [
      notesTemplate1,
      notesTemplate2,
      notesTemplate3,
      notesTemplate4,
      notesTemplate5,
    ],
    intermediate: [
      intermediateTemplate1,
      intermediateTemplate2,
      intermediateTemplate3,
      intermediateTemplate4,
      intermediateTemplate5,
    ],
    business: [
      businessTemplate1,
      businessTemplate2,
      businessTemplate3,
      businessTemplate5,
    ],
  };

  const [homework, setHomework] = useState("");
  const [nextClass, setNextClass] = useState("");
  const latestNote = searchedNotes[0]; // already reversed = newest first
  const latestHomework = latestNote?.homework || "";
  const latestNextClass = latestNote?.nextClass || "";
  const [activeOption, setActiveOption] = useState<"option1" | "option2" | "option3">(
    "option1"
  );

  useEffect(() => {
    const fetchStudentNotes = async () => {
      const studentParam = searchParams?.get("student_name");
      if (!studentParam) return;

      setSearchLoading(true);
      setSearchError(null);
      setSearchedNotes([]);

      try {
        const res = await fetch(
          `/api/quizlet/student/${encodeURIComponent(studentParam)}`
        );
        if (!res.ok) throw new Error("No student found");

        const data: Note[] = await res.json();
        if (!data || data.length === 0) {
          setSearchError("No student available.");
        } else {
          setSearchedNotes(data);
        }
      } catch {
        setSearchError("No student available.");
      } finally {
        setSearchLoading(false);
      }
    };

    fetchStudentNotes();
  }, [searchParams]);

  const [studentList, setStudentList] = useState<string[]>([]);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<string[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const group_student_names: string[] =
    selectedGroupStudents.length > 0
      ? [student_name, ...selectedGroupStudents]
      : [student_name];

  // Fetch student list
  useEffect(() => {
    const fetchStudentList = async () => {
      try {
        const URL = `/api/diary/${type}/${user}`;
        const response = await fetch(URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch student list");

        const data: string[] = await response.json();
        setStudentList(data.filter((name) => name !== student_name)); // exclude current student
      } catch (error) {
        console.error("Error fetching student list:", error);
      }
    };

    fetchStudentList();
  }, [type, user, student_name]);

  const editor = useEditor({
    extensions: [StarterKit, CustomHighlight, Underline, PersistentHeading],
    content: original_text,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setOriginal_text(html);
      saveTempClassNote(html);
    },
  });

  useEffect(() => {
    const loadTempNote = async () => {
      if (!student_name || !editor) return;

      try {
        const res = await fetch(
          `/api/quizlet/temp?student_name=${encodeURIComponent(student_name)}`
        );
        if (!res.ok) throw new Error("Failed to fetch class note draft");

        const data = await res.json();
        if (data?.original_text) {
          setOriginal_text(data.original_text);
          editor.commands.setContent(data.original_text); // 👈 Load into editor
        }
      } catch (err) {
        console.error("Failed to load saved class note:", err);
      }
    };

    loadTempNote();
  }, [student_name, editor]);

  useEffect(() => {
    if (editor && original_text !== editor.getHTML()) {
      editor.commands.setContent(original_text);
    }
  }, [original_text]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!original_text || original_text.trim() === "") return;

      e.preventDefault();
      e.returnValue = "지금 페이지를 나가면, 입력한 정보가 모두 삭제됩니다.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [original_text]);

  // 클라이언트 측 렌더링이 아직 완료되지 않았을 경우 간단한 로딩 표시
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F8F9FA]">
      {/* 로딩 오버레이 - 토스 스타일 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* 성공 메시지 - 토스 스타일 */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-72 bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 animate-scale-in">
            <div className="w-16 h-16 bg-[#3182F6] rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#191F28] mb-2">저장 완료</h2>
            <p className="text-[#8B95A1] text-center text-sm leading-relaxed">
              수업 노트가 성공적으로
              <br />
              저장되었습니다.
            </p>
          </div>
        </div>
      )}

      {/* 헤더 - 토스 스타일 */}
      <header className="bg-white border-b border-[#F2F4F6] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                user_id
              )}`;
              router.push(redirectUrl);
            }}
            className="p-2 hover:bg-[#F8F9FA] rounded-xl transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#4E5968]"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#191F28]">Class Note</h1>
            {(group_student_names?.length > 0 || student_name) && (
              <div className="px-4 py-2 bg-[#F2F8FF] rounded-full border border-[#E8F3FF]">
                <span className="text-sm font-semibold text-[#3182F6]">
                  {group_student_names?.length > 0
                    ? group_student_names.join(", ")
                    : student_name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all font-semibold text-sm shadow-sm"
          >
            Group Class
          </button>

          {/* 날짜 선택기 - 토스 스타일 */}
          <div className="relative">
            <input
              type="date"
              name="class_date"
              id="class_date"
              defaultValue={formatToISO(next_class_date)}
              onChange={(e) => setClassDate(formatToSave(e.target.value))}
              className="px-4 py-2.5 bg-white border border-[#E5E8EB] rounded-xl focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 transition-all text-sm font-medium text-[#4E5968] w-40"
              required
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B95A1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>

          {/* 작성 가이드 툴팁 버튼 - 토스 스타일 */}
          <div className="relative group">
            <button
              type="button"
              className="p-2.5 text-[#8B95A1] hover:bg-[#F8F9FA] rounded-xl transition-colors"
              aria-label="작성 가이드"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>

            {/* 툴팁 내용 - 토스 스타일 */}
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#F2F4F6] rounded-2xl shadow-xl p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
              <p className="text-sm text-[#4E5968] leading-relaxed">
                Curriculum 1, 2, 3 버튼을 클릭해서 템플릿을 불러오세요.
              </p>
            </div>
          </div>

          {/* 닫기 버튼 - 토스 스타일 */}
          <button
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                user_id
              )}`;
              router.push(redirectUrl);
            }}
            className="p-2.5 text-[#8B95A1] hover:bg-[#F8F9FA] rounded-xl transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <form
        onSubmit={handleSaveClick}
        className="flex-grow flex flex-col overflow-hidden"
      >
        {/* 메인 컨텐츠 영역 */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          <div className="p-6 flex flex-col h-full gap-6">
            {/* Toolbar - 토스 스타일 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F2F4F6] shrink-0">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("bold")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("italic")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("underline")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Underline
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 1 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editor) return;

                    const { state } = editor;
                    const { from, to } = state.selection;
                    const paragraphs: {
                      start: number;
                      end: number;
                      text: string;
                    }[] = [];

                    // Step 1: Collect paragraph ranges
                    state.doc.nodesBetween(from, to, (node, pos) => {
                      if (node.type.name === "paragraph") {
                        const text = node.textContent.trim();
                        if (text.length > 0) {
                          paragraphs.push({
                            start: pos,
                            end: pos + node.nodeSize,
                            text,
                          });
                        }
                      }
                    });

                    // Step 2: Apply numbering from bottom to top to avoid offset shift
                    paragraphs
                      .slice()
                      .reverse()
                      .forEach(({ start, end, text }, idx, arr) => {
                        const number = arr.length - idx; // Top-down numbering
                        editor.commands.insertContentAt(
                          { from: start, to: end },
                          {
                            type: "paragraph",
                            content: [
                              {
                                type: "text",
                                text: `${number}. ${text}`,
                              },
                            ],
                          }
                        );
                      });

                    editor.chain().focus().run();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                >
                  Numbering
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("paragraph")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHighlight().run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("highlight")
                      ? "bg-[#FFE066] text-black shadow-sm"
                      : "bg-[#FFE066] text-black hover:bg-[#FFCC02]"
                  }`}
                >
                  Highlight
                </button>
              </div>
            </div>

            <div className="flex-grow flex gap-6 overflow-hidden">
              {/* Left: Editor - 메인 영역 (75% width) */}
              <div className="flex-[3] overflow-y-auto border border-[#F2F4F6] rounded-2xl p-6 bg-white shadow-sm">
                <EditorContent
                  editor={editor}
                  className="prose max-w-none min-h-[400px] custom-editor"
                />
              </div>

              {/* Right: Templates + Homework - 사이드 영역 (25% width) */}
              <div className="flex-[1] flex flex-col gap-3 min-w-[320px] overflow-y-auto">
                {/* 탭 스위치 - 토스 스타일 */}
                <div className="bg-white rounded-2xl p-1 shadow-sm border border-[#F2F4F6] shrink-0">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setActiveOption("option1")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option1"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Templates
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option2")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option2"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Previous Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option3")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option3"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Test Materials
                    </button>
                  </div>
                </div>

                {/* 컨텐츠 영역 */}
                {activeOption === "option1" && (
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Template Selection + Choose Template 통합 - 토스 스타일 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <h3 className="text-xs font-bold text-[#191F28] mb-2">
                        Templates
                      </h3>
                      <div className="grid grid-cols-3 gap-1 mb-3">
                        {(Object.keys(templates) as TabKey[]).map((key) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-2 py-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                              activeTab === key
                                ? "bg-[#3182F6] text-white shadow-sm"
                                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6]"
                            }`}
                          >
                            {key.replace("curriculum", "C")}
                          </button>
                        ))}
                      </div>

                      {/* Choose Template 버튼들 */}
                      {activeTab && (
                        <div className="space-y-1">
                          {templates[activeTab as TabKey].map((text, idx) => {
                            // 버튼 텍스트를 위한 함수
                            const getButtonText = () => {
                              if (activeTab === "beginner") {
                                const beginnerLabels = [
                                  "The First Class",
                                  "The Second Class",
                                  "The Third Class",
                                  "The Base Template",
                                  "The Clean Base Template",
                                ];
                                return (
                                  beginnerLabels[idx] || `Beginner ${idx + 1}`
                                );
                              }

                              if (activeTab === "intermediate") {
                                const intermediateLabels = [
                                  "The First Class",
                                  "The Second Class",
                                  "The Third Class",
                                  "The Base Template",
                                  "The Clean Base Template",
                                ];
                                return (
                                  intermediateLabels[idx] ||
                                  `Intermediate ${idx + 1}`
                                );
                              }
                              if (activeTab === "business") {
                                const businessLabels = [
                                  "The First Class",
                                  "The Base Class Template",
                                  "In Depth Business Conversation Topic List",
                                  "Memorable Projects",
                                ];
                                return (
                                  businessLabels[idx] || `Business ${idx + 1}`
                                );
                              }
                              return `${
                                activeTab.charAt(0).toUpperCase() +
                                activeTab.slice(1)
                              } ${idx + 1}`;
                            };

                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setOriginal_text(text)}
                                disabled={loading}
                                className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all disabled:opacity-50 shadow-sm"
                              >
                                {getButtonText()}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Homework Input - 더 큰 크기 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="homework"
                            className="block text-sm font-bold text-[#191F28] mb-1"
                          >
                            Homework <span className="text-[#FF6B6B]">*</span>
                          </label>
                          <textarea
                            id="homework"
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                            className="w-full border border-[#F2F4F6] bg-white rounded-xl px-3 py-2 text-sm resize-none h-20 focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 transition-all placeholder-[#8B95A1]"
                            placeholder="숙제 내용을 입력하세요..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#191F28] mb-1">
                            Last Homework
                          </label>
                          <div className="bg-[#F8F9FA] text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl p-2 h-16 whitespace-pre-wrap overflow-y-auto">
                            {latestHomework
                              ? latestHomework.slice(0, 150) +
                                (latestHomework.length > 150 ? "..." : "")
                              : "No previous homework found."}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Class Input - 더 큰 크기 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="nextClass"
                            className="block text-sm font-bold text-[#191F28] mb-1"
                          >
                            Next Class <span className="text-[#FF6B6B]">*</span>
                          </label>
                          <textarea
                            id="nextClass"
                            value={nextClass}
                            onChange={(e) => setNextClass(e.target.value)}
                            className="w-full border border-[#F2F4F6] bg-white rounded-xl px-3 py-2 text-sm resize-none h-20 focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 transition-all placeholder-[#8B95A1]"
                            placeholder="다음 수업 계획을 입력하세요..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#191F28] mb-1">
                            For Today Class
                          </label>
                          <div className="bg-[#F8F9FA] text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl p-2 h-16 whitespace-pre-wrap overflow-y-auto">
                            {latestNextClass
                              ? latestNextClass.slice(0, 150) +
                                (latestNextClass.length > 150 ? "..." : "")
                              : "No previous next class found."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeOption === "option2" && (
                  <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm flex-1 flex flex-col">
                    <h3 className="text-xs font-bold text-[#191F28] mb-1">
                      Level Test
                    </h3>
                    <div className="hover:bg-blue-50 mb-1">
                      <Link
                        href={`/teacher/student/test?user=${user}&student_name=${student_name}`}
                        className="text-md text-[#191F28] inline-flex items-center justify-center p-2 rounded-lg transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                      {student_name} Level Test
                      </Link>
                    </div>
                    <h3 className="text-xs font-bold text-[#191F28] mb-3">
                      Previous Notes
                    </h3>

                    <div className="flex-1 overflow-y-auto">
                      {searchLoading && (
                        <div className="text-[#8B95A1] text-xs flex items-center gap-2 py-4">
                          <div className="w-3 h-3 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
                          Loading notes...
                        </div>
                      )}

                      {searchError && (
                        <div className="text-[#FF6B6B] text-xs p-2 bg-[#FFF5F5] rounded-xl border border-[#FFE5E5] mb-3">
                          {searchError}
                        </div>
                      )}

                      {searchedNotes.length > 0 && (
                        <div className="space-y-2">
                          {[...searchedNotes].map((note) => (
                            <div
                              key={note._id}
                              onClick={() => {
                                const newWindow = window.open("", "_blank");
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Class Note - ${note.date}</title>
                                        <style>
                                          body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background-color: #f8f9fa;
                                            padding: 2rem;
                                          }
                              
                                          .container {
                                            max-width: 800px;
                                            margin: 0 auto;
                                            background-color: white;
                                            border: 1px solid #f2f4f6;
                                            border-radius: 16px;
                                            padding: 2rem;
                                            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                                          }
                              
                                          h2 {
                                            font-size: 1.5rem;
                                            margin-bottom: 1rem;
                                            color: #191f28;
                                            font-weight: 700;
                                          }
                              
                                          h3 {
                                            font-size: 1.25rem;
                                            margin-top: 2rem;
                                            margin-bottom: 0.75rem;
                                            color: #191f28;
                                            font-weight: 700;
                                          }
                              
                                          p, li {
                                            font-size: 1rem;
                                            line-height: 1.6;
                                            color: #4e5968;
                                          }
                              
                                          ul, ol {
                                            padding-left: 1.5rem;
                                            margin-bottom: 1rem;
                                          }
                              
                                          hr {
                                            margin: 2rem 0;
                                            border-color: #f2f4f6;
                                          }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="container">
                                          <h2>Class Note (${note.date})</h2>
                                          ${note.original_text}
                                          ${
                                            note.homework
                                              ? `<hr/><h3>Homework</h3><p>${note.homework}</p>`
                                              : ""
                                          }
                                          ${
                                            note.nextClass
                                              ? `<hr/><h3>Next Class</h3><p>${note.nextClass}</p>`
                                              : ""
                                          }
                                          
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                  newWindow.document.close();
                                }
                              }}
                              className="cursor-pointer border border-[#F2F4F6] bg-[#FAFBFC] p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                            >
                              <p className="text-xs text-[#3182F6] mb-1 font-semibold">
                                {note.date}
                              </p>
                              <div
                                className="text-xs text-[#8B95A1] line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    note.original_text.slice(0, 80) + "...",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeOption === "option3" && (
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <h3 className="text-xs font-bold text-[#191F28] mb-2">Test Materials</h3>

                      {/* Beginner Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-2">Beginner</h4>
                      <div className="space-y-1">
                        {["Mock Test Prep Class 1", "Mock Test Prep Class 2", "Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
                          <button
                            type="button"
                            key={`Beginner: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Beginner: ${label}`)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Intermediate Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-4">Intermediate</h4>
                      <div className="space-y-1">
                        {["Mock Test Prep Class 1", "Mock Test Prep Class 2", "Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
                          <button
                            type="button"
                            key={`Intermediate: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Intermediate: ${label}`)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 - 토스 스타일 */}
        <div className="w-full bg-white border-t border-[#F2F4F6] py-6 px-6 flex gap-4">
          <button
            type="button"
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                user_id
              )}`;
              router.push(redirectUrl);
            }}
            className="flex-1 py-4 rounded-2xl text-[#8B95A1] text-sm font-bold border border-[#F2F4F6] hover:bg-[#F8F9FA] transition-all"
            disabled={loading}
          >
            취소하기
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-4 rounded-2xl text-white text-sm font-bold transition-all shadow-sm ${
              loading
                ? "bg-[#DEE2E6] cursor-not-allowed"
                : "bg-[#3182F6] hover:bg-[#1B64DA]"
            }`}
          >
            저장하기
          </button>
        </div>
      </form>

      {/* 모달들은 기존과 동일하게 유지하되 토스 스타일 적용 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-[90%] max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[#191F28]">
              Select Group Students
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {studentList.map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-3 text-sm p-3 rounded-xl hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupStudents.includes(name)}
                    onChange={() =>
                      setSelectedGroupStudents((prev) =>
                        prev.includes(name)
                          ? prev.filter((n) => n !== name)
                          : [...prev, name]
                      )
                    }
                    className="w-5 h-5 rounded-lg border-2 border-[#F2F4F6] text-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                  <span className="font-semibold text-[#191F28]">{name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl hover:bg-[#F8F9FA] transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all font-semibold shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        /* 데이트 픽커 스타일 오버라이드 */
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          cursor: pointer;
        }

        textarea::placeholder {
          color: #8b95a1;
          font-size: 14px;
        }

        /* 전체 고정 레이아웃 */
        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* 텍스트 영역 스크롤 */
        textarea {
          overflow-y: auto;
        }

        /* 포커스 시 아웃라인 없애기 */
        textarea:focus {
          outline: none;
          box-shadow: none;
        }

        /* 스크롤바 스타일링 - 토스 스타일 */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #e5e8eb;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }

        /* line-clamp 유틸리티 */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {translating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-80 bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-[#191F28]">
              Translating Quizlets...
            </p>
            <p className="text-sm text-[#8B95A1] mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {translationModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-[90%] max-w-4xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#191F28]">
              Review Translations
            </h2>
            <p className="text-sm text-[#4E5968] mb-4 p-4 bg-[#F8F9FA] rounded-2xl border border-[#F2F4F6] leading-relaxed">
              Please revise any awkward translations before saving.
            </p>
            <div className="overflow-hidden rounded-2xl border border-[#F2F4F6]">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="text-left bg-[#F8F9FA] border-b border-[#F2F4F6]">
                    <th className="p-4 w-8 text-center font-bold text-[#191F28]"></th>
                    <th className="p-4 font-bold text-[#191F28]">English</th>
                    <th className="p-4 font-bold text-[#191F28]">Korean</th>
                    <th className="p-4 font-bold text-[#191F28] text-center">Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {quizletLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="p-4 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="p-4">
                        <textarea
                          value={line.eng}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].eng = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </td>
                      <td className="p-4">
                        <textarea
                          value={line.kor}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].kor = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...quizletLines];
                            updated.splice(idx, 1);
                            setQuizletLines(updated);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete this line"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>



              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setTranslationModalOpen(false)}
                className="px-6 py-3 text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl hover:bg-[#F8F9FA] transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const payload = {
                      quizletData: {
                        student_names: group_student_names,
                        class_date,
                        date,
                        original_text,
                      },
                      eng_quizlet: quizletLines.map((l) => l.eng),
                      kor_quizlet: quizletLines.map((l) => l.kor),
                      homework,
                      nextClass,
                    };

                    const res = await fetch("/api/quizlet/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });

                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData?.error || "Save failed.");
                    }

                    setTranslationModalOpen(false);
                    setSaveSuccess(true);

                    setTimeout(() => {
                      router.push(
                        `/teacher/home?user=${user}&type=${type}&id=${user_id}`
                      );
                    }, 1500);
                  } catch (err) {
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Unknown error saving data."
                    );
                  }
                }}
                className="px-6 py-3 text-sm bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all flex items-center gap-2 font-semibold shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 내보내기
export default function ClassPageWrapper(): ReactNode {
  return (
    <Suspense fallback={<div>Loading Diary Page...</div>}>
      <ClassPage />
    </Suspense>
  );
}

function ClassPage(): ReactNode {
  return <ClassPageContent />;
}
