"use client";

import { useState, useEffect, Suspense, ReactNode, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
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
  <h2>🗓️ Date:</h2>
  <h3>The First Class</h3>

  <ol>
    <li>
      <strong>Go Over Notion Goals</strong><br/>
      ✅ 주 2회 3~6개월 목표!<br/>
      ⚠️ 레벨 1 이하는 더 걸릴 수도 있다<br/>
      ❗ 숙제 안 해오고 수업 빠지기 시작하면 더 오래 걸릴 수 있다
    </li>

    <li>
      <strong>Self Introduction</strong><br/>
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
      📘 Pace: Finish Chapter 1 in 4–8 classes for Level 1–2 students
    </li>

    <li>
      <strong>Homework Prep</strong><br/>
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
  <h2>🗓️ Date:</h2>
  <h3>The Second Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      ✅ Check if students did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before class<br/>
      🌟 Check if they used the “star” function for flashcards<br/>
      📋 Copy completed self-introductions into the “collect bulk answers template”
    </li>

    <li>
      <strong>Small Talk</strong><br/>
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
      🔁 Focus on memorizing self-introductions<br/>
      ❌ If sentences are wrong → Star it → Retest → Still wrong? Copy into today’s notes<br/>
      🔀 Shuffle and review about half the Quizlet deck per class
    </li>

    <li>
      <strong>Write Diary Together</strong><br/>
      📖 Read example diaries in Chapter 1 that match their level<br/>
      📌 Direct them to refer to those expressions in Quizlet when writing their next diary
    </li>

    <li>
      <strong>Textbook</strong><br/>
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
  <h2>🗓️ Date:</h2>
  <h3>The Third Class</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      ✅ Check if the student did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting<br/>
      🌟 Check if they used the “star” function on flashcards
    </li>

    <li>
      <strong>Small Talk</strong><br/>
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
      🧠 Negotiate flashcard count: 30–60 cards<br/>
      ❌ Wrong answers → Star → Retest → Still wrong? Add to today’s notes<br/>
      🔀 Shuffle & review ~50% of the Quizlet deck each class
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      💬 Follow the diary conversation examples in Chapter 1<br/>
      📘 Refer to ‘diary expressions’ test in Chapter 1<br/>
      1️⃣ Student tells the diary without looking<br/>
      2️⃣ Open the AI-edited diary → Read through mistakes<br/>
      ✍️ Add easy/common mistakes + strong sentences to today’s notes for future flashcards
    </li>

    <li>
      <strong>Textbook</strong><br/>
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
  <h2>🗓️ Date:</h2>
  <h3>Class Title</h3>

  <ol>
    <li>
      <strong>Homework Check</strong><br/>
      ✅ Check if the student did their homework<br/>
      ✍️ If no diary: Give 5 minutes to write a 3-sentence diary before starting<br/>
      🌟 Check if they used the “star” function on flashcards
    </li>

    <li>
      <strong>Small Talk</strong><br/>
      💬 Review small talk using memorized expressions<br/>
      🔄 Have the student ask questions back (2-way conversation)
    </li>

    <li>
      <strong>Flashcard Review</strong><br/>
      ❌ Wrong cards → Star → Retest → Still wrong? Add to today’s notes<br/>
      🔀 Shuffle & review ~50% of the Quizlet deck each class
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
      🧠 Student summarizes the diary without looking<br/>
      📖 Look at AI-edited version → Add good expressions to flashcards<br/>
      ➕ Refer to textbook’s diary-related expressions<br/>
      🔁 Help the student upgrade the diary with new grammar
    </li>

    <li>
      <strong>Textbook</strong><br/>
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
  <h2>🗓️ Date:</h2>
  <h3>Class Title</h3>

  <ol>
    <li>
      <strong>Check Homework</strong>
    </li>

    <li>
      <strong>Small Talk</strong><br/>
    </li>

    <li>
      <strong>Previous Flashcards Review</strong><br/>
    </li>

    <li>
      <strong>Talk About Diary</strong><br/>
    </li>

    <li>
      <strong>Textbook</strong><br/>
    </li>
  </ol>

  <h2>📚 Recommended Homework</h2>
  <ul>
    <li>Study Flashcards</li>
    <li>Write Diary (including new grammar learned)</li>
    <li>Include a test if reached (solve and grade it for homework)</li>
  </ul>
`;

  const BegMockTest1 = `<h1>📘 Mock Test 1</h1>
<p><strong>Tip 1:</strong> Keep taking mock tests every class</p>
<p><strong>Tip 2:</strong> Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests</p>
<p><strong>Tip 3:</strong> It will take some students 3 classes to prepare for the level test and some students over 16 classes</p>
<p>It depends on how seriously they memorize and review their flashcards.</p>
<p>It’s a memorization test.</p>
<p>Students must get 70% correct to pass.</p>
<h2>Part 1: 날짜</h2>
<p>날짜 물어봐주시고 대답해주세요.</p>
<p>요일 물어봐주시고 대답해주세요.</p>
<h2>Part 2: 인사</h2>
<p>Please greet me in 3 different ways.</p>
<p>Do not use easy greetings.</p>
<h2>Part 3: 자기소개</h2>
<p>Long time no see, can you introduce yourself again? (bulk answer)</p>
<h2>Part 4: 취미</h2>
<p>Tell me more about your hobbies in detail (bulk answer)</p>
<h2>Part 5: 직업</h2>
<p>Can you tell me more about your job? (bulk answer)</p>
<h2>Part 6: 과거형 대화</h2>
<p>What did you do today / before class / last weekend / yesterday? (freeform answer)</p>
<h2>Part 7: 미래형 대화</h2>
<p>What are you going to do / after class / this weekend / on friday? (freeform answer)</p>
<h2>Part 8: 3인칭 단수 대화</h2>
<p>Tell me about your best friend (or a coworker) (bulk answer)</p>
<h2>Part 9: 시간 & 날짜 (grammar memorization)</h2>
<p>오늘 몇일인가요? 2월 12일 입니다.</p>
<p>생일이 언제인가요? 5월 31일 입니다.</p>
<p>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</p>
<p>무슨 요일인가요? → 오늘은 수요일이에요</p>
<p>지금 몇시인지 아시나요? → 지금 12시 반이에요</p>
<p>학원 오는데 얼마나 걸리나요? → 한 30분 정도 걸려요 (it takes about half an hour)</p>
<p>미국 언제 갈꺼야? 8월 7일쯤 갈거야.</p>
<p>아침 먹고 나서 2가지</p>
<p>퇴근 하고 나서 2가지</p>
<p>출근 하기 전에 2가지</p>
<h2>Part 10: 과거형 / be 동사 / 일반동사 / 질문 (grammar memorization)</h2>
<p>그녀는 행복하지 않았어.</p>
<p>얼마나 오래 영어를 가르쳤니?</p>
<p>어떤 영화 봤어?</p>
<p>그녀는 어떤 음식 좋아한데?</p>
<p>얼마나 자주 운동하니?</p>
<p>어떤 영화를 좋아하니?</p>
<p>어떤 게임을 했어?</p>
<p>프랑스 어디에서 살았어?</p>
<p>잘 잤어?</p>
<p>너의 가족은 어디에 살아?</p>
<p>아버님은 어떤 회사에서 일하셔?</p>
<p>가족과 같이 사니?</p>
<p>그녀는 학교에 가?</p>
<p>가족과 친하니?</p>
<p>그녀는 영어를 공부해?</p>
<p>그는 피자를 좋아해</p>
<p>그는 무슨 공부를 하니?</p>
<p>그녀는 매일 독서해</p>
<p>내 휴가는 11월 13일부터 12월 6일까지야.</p>
<p>나는 7월 7일에 출장이 있어.</p>
<p>8월에 계획이 있어?</p>
<p>일요일에 언제 집에 왔어?</p>
<p>지난 주말에 어디 갔어?</p>
<h2>Part 11: 미래형 (grammar memorization)</h2>
<p>내일 뭐할거니? (will & be going to V)</p>
<p>너 주말에 뭐할거야? (2가지 방법)</p>
<p>토요일에 나 친구 만나러 강남갈거야</p>
<p>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</p>
<p>나 내일 미국으로 여행갈거야</p>
<p>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야</p>
<p>너는? 너는 오늘 수업 끝나고 뭐할거니?</p>
<h2>Part 12: to 부정사 8개 (grammar memorization)</h2>
<p>너 햄버거 먹고 싶니?</p>
<p>나는 미래에 경찰이 되기로 결정했어</p>
<p>나는 요즘 일찍 일어나려고 노력중이야</p>
<p>내 남동생이 울기 시작했어</p>
<p>너는 운동하는거 좋아하니?</p>
<p>퇴근하고 술 먹고 싶어</p>
<p>그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해</p>
<p>그는 카페에 가기 위해 압구정에 가야해</p>
<p>저녁을 아내와 같이 먹고 싶었어.</p>
<p>아내는 늦게까지 일해야 했어.</p>
<p>다음 날 6시에 일어나야 해서 일찍 잤어.</p>
<p>저는 넷플릭스 보면서 치킨 먹는 것을 좋아해</p>
<h2>Part 13: 위해의 2가지 to V / for N (grammar memorization)</h2>
<p>나는 친구를 만나기 위해 홍대에 갔어</p>
<p>나는 부모님을 뵙기 위해 일본에 갔어</p>
<p>나갈 준비를 했어. / 출근 준비를 했어.</p>
<p>친구들을 만나러 홍대에 갔어.</p>
<p>수업을 위해 홍대에 왔어.</p>
<p>나 너를 위해 선물 샀어</p>
<p>나는 2년 동안 일 하러 일본에 가고 싶어 내 커리어를 위해</p>
<h2>Part 14: 동안 3가지 (grammar memorization)</h2>
<p>나는 아침을 먹는 동안 티비를 봤어</p>
<p>나는 휴가 동안 집에 있었어</p>
<p>3시간 동안 울었어</p>
<p>일 년 동안 영어 공부했어</p>
<p>방학 동안 나는 미국에 갔어</p>
<p>집에 있는 동안 유투브를 봤어</p>
<p>제가 술을 마시는 동안 비가 그쳤어요</p>
<p>공부를 하는 동안 배가 고파졌어요</p>
<h2>Part 15: ing 4가지 (grammar memorization)</h2>
<p>운동하는 것은 재미있어</p>
<p>요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요</p>
<p>나는 피곤했지만 계속 일했어</p>
<p>나는 취했지만 계속 술을 마셨어</p>
<p>술은 몸에 안 좋아</p>
<p>나는 공부하는 것을 좋아해</p>
<p>나는 피곤했지만 계속 퀴즐렛을 공부했어</p>
<p>운동은 건강에 좋아</p>
<p>나는 요즘 여행하는 중이야</p>
<p>여행하는 것은 내 꿈이야</p>
<p>나는 어제 축구하는 동안 넘어졌어</p>
<p>그것은 피곤했어</p>
<p>TV 보는 것은 재미있어</p>
<p>나 뛸 거야</p>
<p>나 골프 잘쳐</p>
<p>나 요리 못해</p>
<p>난 그녀가 나한테 연락하길 기다리고 있어 (I’m waiting for her to contact me)</p>
<p>그는 졸려지기 시작했어 (I’m starting to get sleepy)</p>
<p>나 취할 예정이야 (I’m planning to get drunk)</p>
<p>나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)</p>
<h2>Part 16: 추가 필수 생활 표현 (grammar memorization)</h2>
<p>주말에 재미있는거 했어?</p>
<p>일 외로 다른 것도 하셨나요?</p>
<p>일 외로는 특별한 것 없었습니다</p>
<p>아무것도 안했어</p>
<p>일하느라 바빴어.</p>
<p>친구랑 이야기하느라 바빴어.</p>
<p>어땠어? 재미있었어? → 네 재미있었어요!</p>
<p>홍대에 사람이 많아</p>
<h2>Recommended Homework</h2>
<p>Add all bulk answers + grammar mistakes to the flashcards</p>
<p>Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers\" tab with their most recent answers.</p>
<p>From this point on it really depends on how good the student is at memorizing.</p>
`;

  const BegMockTest2 = `<h1>📘 Mock Test 2</h1> <p><strong>Tip 1:</strong> Keep taking mock tests every class </p><p><strong>Tip 2:</strong> Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests.
</p><p><strong>Tip 3:</strong> It will take some students 3 classes to prepare for the level test and some students over 16 classes.
<p>It depends on how seriously they memorize and review their flashcards.</p>
<p>It’s a memorization test.</p>
<p>Students must get 70% correct to pass.</p>
</p><h2>Part 17: 비교급 (grammar memorization) 맥주가 소주보다 좋은데 와인이 최고야 맥주가 소주보다 비싼데 와인이 제일 비싸 제 방은 거의 고시원 만큼 작아요 미국은 캐나다 만큼 멀어요 교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.
<p>어제보다 기분이 나아요.</p>
<p>너 영어 많이 늘었다!</p>
<p>저 골프 많이 늘었어요.</p>
<p>데이빗이 아팠는데 좋아졌어요.</p>
<p>사라가 영어 실력이 좋아졌어요.</p>
<p>이제 거의 [데이비드만큼 잘해요].</p>
<p>데에빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요.</p>
<p>* 조깅이 하이킹보다 더 힘들어요.* Part 18:횟수 (grammar memorization) 저는 보통 가족을 한달에 4번 정도 봐요 저는 2주에 1번 정도 운동을 하는 것 같아요 주 3회 영어 공부하기 시작했어요.</p>
<p>저는 3달에 2번 정도 여행을 가요 Part 19:부정 질문 (grammar memorization) 너 돈 있지 않아?</p>
<p>너 안배고파?</p>
<p>너 안피곤해?</p>
<p>너 저녁 안먹었어?</p>
<p>너 여자친구 있지 않았어?</p>
<p>저 여자애 영어 하지 않아?</p>
<p>너 누나가 영국 살지 않아?</p>
<p>다시 해보지 그래요?</p>
<p>(why don’t you try again?) 그냥 집에 있으면 안돼요?</p>
<p>(can’t you just stay home?) 지금 집에 가는 것은 어떨까?</p>
<p>(why don’t we go home now?) 이번에 내가 내는 것은 어때?</p>
<p>(why don’t I pay this time?) 우리 그냥 내일 가면 안돼?</p>
<p>(can’t we go tomorrow instead?) Part 20: have pp 3가지 (grammar memorization) 발리 가본적 있어?</p>
<p>두리안 먹어본 적 있어?</p>
<p>해리포터 본 적 있어?</p>
<p>동방신기 들어본 적 있어?</p>
<p>응 나 먹어봤지!</p>
<p>아니 가본 적 없어 한번도 들어본 적 없어 한번도 가본 적 없어 Part 21: 가족 Tell me about your family in detail.</p>
<p>How many members are there?</p>
<p>What do they do?</p>
<p>Let’s have a short conversation.</p>
<p>Please ask me at least 5 questions about my family during the conversation.</p>
<p>Family Question Bank (make sure they ask at least 5 questions when talking to you) (please have the questions connect naturally) 가족을 얼마나 자주 보나요?</p>
<p>가족에 대해 말해주세요 가족 인원이 몇명인가요?</p>
<p>형재 자매가 몇명인가요?</p>
<p>가족과 친한가요?</p>
<p>부모님에 대해 말해주세요 어떤 일을 하시나요?</p>
<p>남편은 어떤 회사에서 일하시나요?</p>
<p>아드님은 미래에 뭘 하실 계획인가요?</p>
<p>혼자 사세요?</p>
<p>아니면 부모님이랑 사시나요?</p>
<p>가족 중 누구랑 가장 친한가요?</p>
<p>형제자매랑 나이 차이가 어떻게 되나요?</p>
<p>몇살 더 많아요?</p>
<p>직업들이 어떻게 되시나요?</p>
<p>Part 22: 집 & 동네 What neighborhood do you live in?</p>
<p>Tell me in detail.</p>
<p>What do you like about your neighborhood?</p>
<p>what are the characteristics?</p>
<p>Tell me about your house in detail.</p>
<p>tell me about your room?</p>
<p>Let’s have a short conversation.</p>
<p>Please ask me at least 5 questions about my house and neighborhood.</p>
<p>House Question Bank (make sure they ask at least 5 questions when talking to you) 몇층에 사시나요?</p>
<p>아파트 사세요 집에 사세요?</p>
<p>저는 이 집에 3년동안 살았습니다 경치가 좋아요 집의 가장 마음에 드는 방이 어디에요?</p>
<p>집의 가장 마음에 드는 가구가 뭐에요?</p>
<p>집에 대해 가장 마음에 드는 점이 뭔가요?</p>
<p>어떤 동네에 사시나요?</p>
<p>이 지역에 얼마나 오래 살았어요?</p>
<p>그게 홈플러스 근처인가요?</p>
<p>이사하고 싶어요?</p>
<p>집에 만족하시나요?</p>
<p>Part 23: 기둥표현 Beginner Pillar Expressions (ask 20 out of the pool) 뭘 해야 할지 모르겠어.</p>
<p>그 셔츠를 어디서 사야 할지 모르겠어.</p>
<p>나 지금 시험 공부하고 있어.</p>
<p>나 처음으로 초밥 먹어봤어.</p>
<p>원하면 우리 영화 볼 수 있어.</p>
<p>밖에 비 오고 있어.</p>
<p>파리에 가고 싶어.</p>
<p>방금 점심 다 먹었어.</p>
<p>우리 산책했어.</p>
<p>이 앱 사용하는 방법 알려줄 수 있어?</p>
<p>어쨌든 다음 주제로 넘어가자.</p>
<p>숙제 끝내야 해.</p>
<p>오늘 좀 피곤해.</p>
<p>다쳤어.</p>
<p>/ 아파.</p>
<p>엄청 더워.</p>
<p>규칙을 따라야 해.</p>
<p>다음 주에 만나는 거 기대돼.</p>
<p>인도 음식 먹어본 적 있어?</p>
<p>돈 많이 벌고 싶어.</p>
<p>출근하는 길이야.</p>
<p>맛집 발견했어!</p>
<p>건강하게 먹어야 해.</p>
<p>오랜만에 옛 친구를 우연히 만났어.</p>
<p>벌써 늦었네, 집에 가자.</p>
<p>새로운 과제 하고 있어.</p>
<p>새 컴퓨터 설정해야 해.</p>
<p>"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.</p>
<p>그녀는 그림을 정말 잘 그려.</p>
<p>외투 입어, 밖에 추워.</p>
<p>우유 다 떨어졌어.</p>
<p>약 받아와야 해.</p>
<p>도와줄 수 있어?</p>
<p>스페인어 배우는 것에 관심 있어.</p>
<p>비행기 한 시간 후에 출발해.</p>
<p>열쇠 찾고 있어.</p>
<p>나가기 전에 문 꼭 잠가.</p>
<p>새 차 마음에 들어.</p>
<p>방금 집에 왔어.</p>
<p>한국은 김치로 유명해.</p>
<p>그럴 가치 없어.</p>
<p>3일 연속으로.</p>
<p>말했듯이.</p>
<p>왕복 8시간 운전했어.</p>
<p>추천해?</p>
<p>누구한테 물어봐야 할지 모르겠어.</p>
<p>자신이 없어.</p>
<p>부산에서 해변 축제 하고 있었어.</p>
<p>사진 보여줄게!</p>
<p>돈 받았어?</p>
<p>요금이 가성비 좋았어.</p>
<p>벌금이 50만 원이었어.</p>
<p>오랜만에 중학교 친구들 만났어.</p>
<p>네가 원하는 대로 해도 돼.</p>
<p>구체적으로, 그녀가 나한테 교회 가라고 했어.</p>
<p>그녀에게 가방 사줬어.</p>
<p>그녀가 전화를 끊었어.</p>
<p>/ 내가 전화를 받았어.</p>
<p>커뮤니티 행사 기대돼.</p>
<p>아이들을 돌봐야 해.</p>
<p>고양이 돌보느라 바빴어.</p>
<p>블로그 써보는 게 좋을 것 같아.</p>
<p>마음에 들었으면 좋겠어.</p>
<p>잘됐으면 좋겠어.</p>
<p>살 안 쪘으면 좋겠어.</p>
<p>(살 좀 빠졌으면 좋겠어.) 빨리 나았으면 좋겠어.</p>
<p>이번 겨울에 한국에 있을 거야.</p>
<p>그들이 나한테 음식 많이 사줬어.</p>
<p>요즘 와인에 푹 빠졌어.</p>
<p>실수하는 거 싫어.</p>
<p>퇴근하고 나서 올래?</p>
<p>안타깝게도, 다행히도, 나에 대해 말하자면, 운전할지 자전거 탈지 고민했어.</p>
<p>A를 할지 B를 할지.</p>
<p>이건 습관이 되면 안 될 것 같아.</p>
<p>미안해할 필요 없어.</p>
<p>괜찮아.</p>
<p>근데 장소가 어디였지?</p>
<p>그녀가 나한테 3만 원 빌렸어.</p>
<p>이 가방 7만 7천 원이야.</p>
<p>대화가 이상하게 흘러갔어.</p>
<p>결론적으로, 프로젝트는 성공했어.</p>
<p>요약하자면, 올해 목표를 달성했어.</p>
<p>전체적으로, 정말 좋은 경험이었어.</p>
<p>운동한 지 5년 됐어.</p>
<p>결국, 다 잘 해결됐어.</p>
<p>돈 낭비였어.</p>
<p>보통, 원래, 결국, 하루 종일, 그녀는 스페인에 안 가기로 했어.</p>
<p>내성적인 사람 / 외향적인 사람 “편리하다”를 영어로 어떻게 말해?</p>
<p>> “convenient”이라고 해.</p>
<p>“convenient”가 무슨 뜻이야?</p>
<p>> “편리하다”라는 뜻이야.</p>
<p>어제 쉬는 날이었어.</p>
<p>오늘 재미있게 보내길 바래!</p>
<p>지난번이랑 완전 똑같아.</p>
<p>그녀를 다시 만날지 고민 중이야.</p>
<p>회의 말고 다른 재미있는 일 했어?</p>
<p>다음 행사에 참석 못 해?</p>
<p>그거 무례한 거 아니야?</p>
<p>네가 원할 때 언제든 갈 수 있어.</p>
<p>일하느라 바빴어.</p>
<p>그녀가 연락할 때까지 그냥 기다리고 있어.</p>
<p>힘들었어.</p>
<p>/ 즐거웠어.</p>
<p>10시쯤 시작하자.</p>
<p>조금 짜증났어 살짝 민망해 (쪽팔려) 검색했어 (검색해봤어) 내일모레레 미안, 나 이 전화 받아야해 잘 되길 바래 나 살 안쪘으면 좋겠다 약속 (일정 약속) Answer Key I don’t know what to do I don’t know where to buy that shirt.</p>
<p>I’m currently studying for my exams.</p>
<p>I tried sushi for the first time.</p>
<p>If you want, we can watch a movie.</p>
<p>It’s raining outside.</p>
<p>I want to visit Paris.</p>
<p>I just finished my lunch.</p>
<p>We took a walk.</p>
<p>Can you show me how to use this app?</p>
<p>Anyway, let’s move on to the next topic.</p>
<p>I need to finish my homework.</p>
<p>I’m feeling a little tired today.</p>
<p>I got hurt.</p>
<p>/ I’m sick It’s super hot.</p>
<p>You must follow the rules.</p>
<p>I look forward to seeing you next week.</p>
<p>Have you ever tried Indian food?</p>
<p>I want to earn a lot of money.</p>
<p>I’m on the way to work.</p>
<p>I found a great restaurant!</p>
<p>You should eat healthy.</p>
<p>I ran into an old friend.</p>
<p>It’s late already, let’s go home.</p>
<p>I’m working on a new assignment.</p>
<p>I need to set up my new computer.</p>
<p>I looked up “how to say hi in Spanish.” She’s really good at painting.</p>
<p>Put on your jacket.</p>
<p>It’s cold outside.</p>
<p>We ran out of milk.</p>
<p>I need to pick up my medicine.</p>
<p>Can you give me a hand?</p>
<p>I’m interested in learning Spanish.</p>
<p>My flight will take off in an hour.</p>
<p>I’m looking for my keys.</p>
<p>Make sure you lock the door before you leave.</p>
<p>I’m satisfied with my new car.</p>
<p>I just came back home Korea is famous for Kimchi it’s not worth it three days in a row As I said / As I told you / As I mentioned I drove for 8 hours there and back (two ways) (back and forth) Do you recommend it?</p>
<p>I don’t know who to ask I’m not confident Busan was holding a beach festival I’ll show you a picture!</p>
<p>Did you get paid yet?</p>
<p>The fee was very cost efficient The fine was 500,000 won I met my middle school friends for the first time in a while (first time in a long time) You can do whatever you want Specifically, she wanted me to go to church I bought her a bag She hung up the phone / I picked up the phone I’m looking forward to the community event I have to take care of my kids I was busy taking care of my cats I think you should write a blog I hope you like it (move to intermediate?) I hope [it goes well] (move to intermediate?) I hope I don’t gain weight (lose weight) (move to intermediate?) I hope you get better (move to intermediate?) I’m gonna be in korea this winter They bought me a lot of food I’m really into wine these days I don't like making mistakes Why don’t you come after getting off work?</p>
<p>Unfortunately, Thankfully, To tell you about myself, I was deciding [whether to drive or to ride a bike].</p>
<p>Whether to do A or B I don’t think this should be a habit you dont have to be sorry.</p>
<p>it’s okay By the way, where is the venue again?</p>
<p>she owes me 30,000won This bag costs 77,000won the conversation got weird In conclusion, the project was a success.</p>
<p>In summary, we achieved our goals this year.</p>
<p>All in all, it was a great experience.</p>
<p>I’ve worked out for 5 years now In the end, everything worked out fine.</p>
<p>it was a waste of money Normally, Originally, Eventually, for the whole day she decided not to go to spain an introvert / an extrovert how do you say “편리하다" in english?</p>
<p>> you say “convenient” what does “convenient” mean?</p>
<p>> it means “편리하다" yesterday was my day off I want you to have fun today!</p>
<p>it’s exactly the same as last time I am deciding whether to meet her again or not other than the meeting, did you do anything fun?</p>
<p>can’t I attend the next event?</p>
<p>isn’t that rude?</p>
<p>I can come whenever you want I was busy with work I’m just waiting for her to contact me.</p>
<p>I had a hard time / I had a good time let’s start at like 10 ish it was really annoying I’m slightly embarrassed I looked it up The day after tomorrow sorry I have to take this call.</p>
<p>I hope [it goes well] I hope I don’t gain weight Appointment</h2><p></p>
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

  const IntMockTest1 = `
  <h1>📘 Mock Test 1</h1> <p><strong>Tip 1:</strong> Keep taking mock tests every class </p><p><strong>Tip 2:</strong> Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests.
</p><p><strong>Tip 3:</strong> It will take some students 3 classes to prepare for the level test and some students over 16 classes.
<p>It depends on how seriously they memorize and review their flashcards.</p>
<p>It’s a memorization test.</p>
<p>Students must get 70% correct to pass.</p>
</p><p><strong>Tip 4:</strong> All intermediate bulk answers must include advanced grammar </p><h2>Part 1: 날짜 날짜 물어봐주시고 대답해주세요.
<p>요일 물어봐주시고 대답해주세요.</p>
<p>추가 날짜 (grammar test) 7월 20일 / 11월 30일 / 2월 12일 / 4월 15일 / 8월 22일 / 9월 31일 지금 몇시인지 아시나요?</p>
<p>> 지금 12시 반이에요 (현재 시간으로) 학원 오는데 얼마나 걸리나요?</p>
<p>> 한 30분 정도 걸려요 (it takes about half an hour) 미국 언제 갈꺼야?</p>
<p>> 8월 7일쯤 갈거야.</p>
<p>(i’m gonna go on august 7th) Part 2: 인사 Please greet me in 3 different ways.</p>
<p>Do not use easy greetings.</p>
<p>Part 3: 자기소개 Long time no see, can you introduce yourself again?</p>
<p>(bulk answer) all intermediate bulk answers must include advanced grammar Part 4: 취미 Tell me more about your hobbies in detail (bulk answer) Part 5: 직업 Can you tell me more about your job?</p>
<p>(bulk answer) Part 6: 생활의 낙 what do you look forward to in your day?</p>
<p>Part 7: 일 질문 (아래 질문 중 해당되는 최소 3개) there may be follow up questions I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might Tell me about a typical day at work Tell me about your most recent project What was your previous job?</p>
<p>Why are you taking a break from work?</p>
<p>How are you enjoying taking a break from school / work?</p>
<p>How is being a housewife treating you?</p>
<p>(student / an employee) do you like your company or school?</p>
<p>what about your major?</p>
<p>tell me about your team and position?</p>
<p>what do you plan to do for work in your future do you like school?</p>
<p>how is it different from other schools?</p>
<p>do you like your homeroom class?</p>
<p>do you like your homeroom teacher?</p>
<p>are there any professors / managers / coworkers that you like?</p>
<p>Part 8: 스토리텔링 (아래 질문 중 2개) Must use advanced grammar Good storytelling = incorporating characters, dialogue, and an entertaining flow.</p>
<p>(practice makes perfect) Tell me about something unexpected that happened recently Tell me about the most memorable fight or argument you had with someone that you know Tell me some office gossip.</p>
<p>(maybe someone you dislike at work) Tell me about a situation that annoyed you at work Tell me about how your kids upset you or made you laugh Part 9: 관계대명사 & 명사절 (아래 중 7개) (grammar memorization) 저 여자가 [제가 어제 만난 여자]에요.</p>
<p>[제가 좋아했던 그 여자]가 이사 갔어요.</p>
<p>[제가 만난 그 남자]는 코미디언이었어요.</p>
<p>제가 [당신이 만난 사람]을 봤어요.</p>
<p>[제가 어제 뭘 했는지] 기억이 안 나요.</p>
<p>[그녀가 이게 예쁘다고] 말했어요.</p>
<p>[제가 어릴 때], 저는 아팠어요.</p>
<p>제가 [왜 그녀가 화났는지] 모르겠어요.</p>
<p>제가 [당신이 어디 있는지] 알아요.</p>
<p>그게 [제가 우유를 못 마시는 이유]에요.</p>
<p>제가 [당신이 거짓말한 걸] 알아요.</p>
<p>[제가 예쁘지 않다고] 생각했어요.</p>
<p>제가 [1000원짜리 물]을 샀어요.</p>
<p>[제가 좋아하는 음식]은 피자예요.</p>
<p>[제가 일하는 회사]는 부산에 있어요.</p>
<p>제가 좋아하는 장면은 [주인공이 악당과 싸우는 장면]이에요.</p>
<p>제가 좋아하는 [여자를 만났어요].</p>
<p>[그게 바로 당신을 좋아하는 이유예요].</p>
<p>제가 [포레스트 검프라는 영화]를 봤어요.</p>
<p>저는 [유명한 케이팝 보이그룹인 BTS]를 좋아해요.</p>
<p>나는 그가 내 이름을 기억하는지 궁금해.</p>
<p>나는 네가 여행을 즐겼기를 바라.</p>
<p>그녀는 왜 늦었는지 설명했어.</p>
<p>내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.</p>
<p>나는 오늘이 그녀의 생일이라는 걸 잊었어.</p>
<p>나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.</p>
<p>그가 쓴 보고서가 이 프로젝트의 핵심 자료야.</p>
<p>그가 언급했던 프로젝트가 드디어 시작됐어.</p>
<p>내가 다니는 헬스장은 24시간 운영해.</p>
<p>그녀가 요리한 음식이 오늘의 메인 요리야.</p>
<p>내가 매일 이용하는 지하철역이 이번 주에 공사 중이야.</p>
<p>Recommended Homework: Add all bulk answers + grammar mistakes to the flashcards Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers" tab with their most recent answers.</p>
<p>From this point on it really depends on how good the student is at memorizing</h2><p></p>
  `;

  const IntMockTest2 = `
  <h1>📘 Mock Test 2</h1> <p><strong>Tip 1:</strong> Keep taking mock tests every class </p><p><strong>Tip 2:</strong> Use the “collect bulk answers”, “filter grammar”, and “filter pillar expressions” while taking these mock tests.
</p><p><strong>Tip 3:</strong> It will take some students 3 classes to prepare for the level test and some students over 16 classes.
<p>It depends on how seriously they memorize and review their flashcards.</p>
<p>It’s a memorization test.</p>
<p>Students must get 70% correct to pass.</p>
</p><p><strong>Tip 4:</strong> All intermediate bulk answers must include advanced grammar </p><h2>Part 10: 영화 (또는 애니, 웹툰, 드라마, 책, 등등) (최소 2개) What movie did you watch recently?
<p>What was the story about in detail?</p>
<p>What is your all time favorite movie?</p>
<p>What was the story about in detail?</p>
<p>Why do you like this movie so much?</p>
<p>Tell me about your favorite actor or actress and why you like them.</p>
<p>What did they come out in?</p>
<p>what TV program did you watch when you were a kid?</p>
<p>what is it about?</p>
<p>Part 11: 인사 Let’s have a conversation.</p>
<p>Please ask me about my childhood, where I grew up, and how I came to korea.</p>
<p>(refer to the expressions below) Make the student ask you about 5~10 questions about yourself and your foreign background Must use at least 5 of the following questions (The flow of questioning must be natural) For David Where did you grow up?</p>
<p>Where in the states did you live?</p>
<p>What state are you from?</p>
<p>Do you miss living in america?</p>
<p>Are you planning to go back anytime soon?</p>
<p>Where do you like living better?</p>
<p>Korea or the US?</p>
<p>How long has it been since you lived in the US?</p>
<p>What’s the best part about living in korea?</p>
<p>(being back in korea) Do you speak any other lanugages?</p>
<p>Did you live anywhere else other than the US?</p>
<p>(any other countries) Where did you go to school?</p>
<p>For other teachers (try to memorize this one as well) Are you teaching full time?</p>
<p>Where did you learn your english?</p>
<p>(how to speak english) how long did you live in ~ How long has it been since you came back to korea?</p>
<p>what brings you back to korea?</p>
<p>Are you staying for good?</p>
<p>or are you just visiting for a while?</p>
<p>Where do you prefer living?</p>
<p>What do you miss about your home country?</p>
<p>Have you traveled in other countries as well?</p>
<p>Did you get to travel a lot in korea?</p>
<p>What’s the best part about living in Germany?</p>
<p>How is korea treating you?</p>
<p>What was your job back in California?</p>
<p>Are there any places you recommend to visit back in France?</p>
<p>How many languages do you speak?</p>
<p>How is korea compared to Europe?</p>
<p>How’s the food treating you?</p>
<p>Part 12: 술 All answers must incorporate storytelling & advanced grammar When is the last time that you drank?</p>
<p>Do you drink often?</p>
<p>Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing) Recommend a pub and explain why you like it what can I order there?</p>
<p>What do they serve?</p>
<p>Ask me 5 drinking questions & have a small conversation with me regarding the topic The questions cannot all be too easy and must connect like a conversation Part 13: 연애 All answers must incorporate storytelling & advanced grammar Tell me about your most recent dating experience Why didn’t it work out?</p>
<p>/ How is the relationship going?</p>
<p>What are your thoughts about marriage and kids?</p>
<p>What is your ideal type?</p>
<p>Does that person match your ideal type?</p>
<p>Do you have a crush on someone right now?</p>
<p>what kind of person are they?</p>
<p>Tell me about your ex (if it’s okay to ask) Ask me 5 dating questions & have a small conversation with me regarding the topic The questions cannot all be too easy and must connect like a conversation What is your ideal date?</p>
<p>Part 14: 아플 때 All answers must incorporate storytelling & advanced grammar Tell me about the last time you were sick.</p>
<p>How were you sick and how painful was it?</p>
<p>How did you recover?</p>
<p>Tell me about the last time you hurt yourself physically.</p>
<p>What happened and how painful was it?</p>
<p>How did you deal with it?</p>
<p>Are you stressed nowadays?</p>
<p>What are you stressed about?</p>
<p>How are you dealing with it?</p>
<p>When is the last time that you went to the hospital?</p>
<p>Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic The questions cannot all be too easy and must connect like a conversation Part 15: 기둥표현들 (20개 물어보기) 가능하면 헬스장에 갈 수도 있어.</p>
<p>이 영화는 해리 포터와 비슷해.</p>
<p>그게 우리가 지난번에 본 거 아니야?</p>
<p>그 영화는 우리가 지난주에 본 거야.</p>
<p>오랜만에 옛 친구와 안부를 나눴어.</p>
<p>(근황토크) 한국에서 가장 유명한 레스토랑 중 하나에서 식사했어.</p>
<p>날씨에 따라 달라.</p>
<p>나는 모든 종류의 음악을 좋아하지만, 특히 재즈를 사랑해.</p>
<p>어떻게든 프로젝트를 끝냈어.</p>
<p>프로젝트가 어려웠지만, 그래도 끝냈어.</p>
<p>원래는 해외여행을 계획했지만, 대신 집에 있기로 결정했어.</p>
<p>보통 나는 매일 아침 7시에 일어나.</p>
<p>결론적으로 2가지 결국에는 2가지 드디어 2가지 결과로서 내가 파티에 가지 않은 이유는 일 때문에 너무 지쳤기 때문이야.</p>
<p>내가 고향을 마지막으로 방문한 것은 아주 오래 전이야.</p>
<p>버스를 놓쳤어.</p>
<p>그래서 늦었어.</p>
<p>등산은 힘들었지만, 그만한 가치가 있었어.</p>
<p>개인적으로, 나는 이것이 최선의 선택이라고 생각해.</p>
<p>건강에 좋지 않다는 걸 알지만, 어쩔 수 없어.</p>
<p>150만원은 달러로 얼마야?</p>
<p>그는 나에게 30만원을 빚졌어.</p>
<p>대화가 이상해졌어.</p>
<p>카페에서 전 애인을 만났을 때 어색했어.</p>
<p>이 프로젝트를 통해 그녀를 잘 알게 됐어.</p>
<p>(close 아님) 우리는 아직 서로를 알아가는 중이야.</p>
<p>그 영화를 보는 것은 시간 낭비였어.</p>
<p>그 비싼 가방을 사는 것은 돈 낭비였어.</p>
<p>내가 너라면, 매니저와 얘기할 거야.</p>
<p>이것 좀 도와줄 수 있을까?</p>
<p>결국 그 행사에 자원봉사를 하게 됐어.</p>
<p>왠지 그 노래에 대해 계속 생각이 났어.</p>
<p>그녀는 내내 조용했어.</p>
<p>그런데, 장소가 어디였지?</p>
<p>어쩔 수 없어.</p>
<p>어제 소개팅을 가기로 했는데 취소됐어.</p>
<p>그렇게 했어야 했는데.</p>
<p>내가 너라면 그렇게 했을 거야.</p>
<p>결국 시험에 늦었어.</p>
<p>중간고사를 거의 다 끝냈어.</p>
<p>우리 아이들이 잘 어울려서 기뻐.</p>
<p>내가 너라면, 나도 긴장됐을 거야.</p>
<p>왠지 잠을 잘 수 없었어.</p>
<p>대략 5만원 정도 들었어.</p>
<p>빨리 끝내자.</p>
<p>그만한 가치가 있었어!</p>
<p>/ 그만한 가치가 없었어.</p>
<p>네가 자고 있을 거라고 생각했어.</p>
<p>다이어트 중이라서 체중을 줄이려고 노력 중이야.</p>
<p>지난 2주 동안 체중이 많이 늘었어.</p>
<p>넷플릭스 시리즈의 이 밈이 소셜 미디어에서 바이럴했어.</p>
<p>난 그걸 믿지 않아!</p>
<p>일반적으로, 달리기에서 여자들은 남자들을 따라가지 못해.</p>
<p>행사에 더 일찍 왔어야 했는데!</p>
<p>하지만 교통이 혼잡했어.</p>
<p>낙관적인 / 비관적인 응원할게!</p>
<p>/ 널 응원해!</p>
<p>얼마나 오래 밖에 있었어?</p>
<p>우리는 서로 그다지 잘 맞지 않아.</p>
<p>우리 사이에 잘 안 될 것 같아.</p>
<p>그게 정말 필요해?</p>
<p>오늘 당직이야 (야간 근무) 어제 우리가 산 것보다 두 배나 비싸 (두 배의 가격) 그냥 안 가면 안 돼?</p>
<p>어떻게 될지 두고 보자!</p>
<p>가야 한다는 압박감을 느꼈어 / 나한테 압박 주지 마!</p>
<p>아무도 그 이유를 몰라.</p>
<p>그가 떠났다는 것도 몰랐어.</p>
<p>왜 그런 거야?</p>
<p>그게 무슨 상관이야?</p>
<p>너에게 부담을 주고 싶지 않아.</p>
<p>그가 안타까웠어.</p>
<p>너의 의견으로는 어떤 게 제일 좋아?</p>
<p>그 돈을 너한테 쓰는 게 낫겠어.</p>
<p>술 마시러 가는 것보다 운동하러 가는 게 낫겠어.</p>
<p>당황한 / 당황스러운 좀 주제에서 벗어나지만...</p>
<p>10명 중 9명은 그렇게 할 거야.</p>
<p>다시 생각해보니, 그 가방을 사지 말았어야 했어.</p>
<p>나는 "프렌즈" TV 쇼에 완전히 빠졌어.</p>
<p>말 끊어서 미안해.</p>
<p>약 먹는 걸 잊었어.</p>
<p>사업은 어떻게 돼가?</p>
<p>부럽다 / 네가 부러워.</p>
<p>내가 말했는지 모르겠네.</p>
<p>너와는 관련이 없어 / 너와는 아무 상관이 없어.</p>
<p>지난 2개월 동안 분위기를 읽어 / 조심스럽게 행동해 짧은 방문인데도 항상 내가 음식값을 내야 해.</p>
<p>나 얘기는 그만하고, 너희 얘기 좀 해봐.</p>
<p>모니터 암이 뭔지 알아?</p>
<p>정신적 붕괴가 왔어.</p>
<p>나 자신에게 매우 실망했어.</p>
<p>네가 나를 사랑하는 한 네가 일만 하면 돼.</p>
<p>내가 아는 바로는 걱정 마, 내가 먼저 연락할게.</p>
<p>최악의 상황이 뭐야?</p>
<p>신기하게도, 나이가 먹을수록 (2가지) 시간이 갈수록 다시 고민중이야 나 FOMO 있어 이거 처음부터 만들었어 너무 신사다 (예의바르다) 그녀는 완벽주의자야 너 편하게 말할 수 있었으면 좋겠어 다른 이야기긴 한데 (3가지) 밤샜다 (2가지) 해볼만해 (2가지) Answer Key Intermediate Pillar expressions (ask 20) I might go to the gym later if I can.</p>
<p>This movie is similar to Harry potter isn’t that what we watched last time?</p>
<p>The movie is one that we watched last week.</p>
<p>I caught up with an old friend for the first time in a while.</p>
<p>I dined at one of the most famous restaurants in Korea.</p>
<p>It depends on the weather.</p>
<p>I like all kinds of music, but I specifically love jazz.</p>
<p>I finished the project somehow even though the project was difficult, I finished it (even if) Originally, I planned to travel abroad, but I decided to stay home instead.</p>
<p>Normally, I wake up at 7 AM every day.</p>
<p>All in all / In conclusion eventually / In the end finally / at last As a result The reason that I didn’t go to the party was because I was too drained from work.</p>
<p>The last time that I visited my hometown was ages ago.</p>
<p>I missed the bus.</p>
<p>That’s why I was late.</p>
<p>The hike was tough, but it was worth it.</p>
<p>Personally, I think this is the best option.</p>
<p>I know it’s unhealthy, but I can’t help it.</p>
<p>How much is 1,500,000 won in dollars?</p>
<p>He owes me 300,000 won.</p>
<p>The conversation got weird.</p>
<p>It felt awkward when I met my ex at the café.</p>
<p>I got to know her well through this project.</p>
<p>we’re still getting to know each other Watching that movie was a waste of time.</p>
<p>Buying that expensive bag was a waste of money.</p>
<p>If I were you, I would talk to the manager.</p>
<p>Would you mind helping me with this?</p>
<p>I ended up volunteering for the event.</p>
<p>For some reason, I couldn’t stop thinking about that song.</p>
<p>She was quiet for the whole time.</p>
<p>By the way, where is the venue again?</p>
<p>I can’t help it I was supposed to go on a blind date yesterday but it got canceled I should’ve {~했었어야 했다} I would’ve {나라면 ~를 했을 것이다} I ended up being late to the test I’m pretty much done with my midterms I’m glad that our kids got along if I were you, I would be nervous too I couldn’t sleep for some reason it cost roughly 50,000won let’s get it over with it was worth it!</p>
<p>/ it wasn’t worth it I figured that you were sleeping I’m trying to lose weight because I’m on a diet.</p>
<p>I gained a lot of weight over the last 2 weeks.</p>
<p>this meme from a netflix series went viral on social media.</p>
<p>(it blew up) I don’t buy it!</p>
<p>generally, girls can’t keep up with guys when running I should’ve come to the event earlier!</p>
<p>but the traffic was heavy.</p>
<p>optimistic / pessimistic I’m cheering for you!</p>
<p>/ I’m rooting for you!</p>
<p>how long did you stay out?</p>
<p>we’re not that compatible with each other it’s not gonna work out between us is that even neccesary?</p>
<p>I’m on duty today (the night shift) it’s twice as expensive as the one we bought yesterday (twice the price) why can’t we just not go?</p>
<p>we’ll see how it goes!</p>
<p>I felt pressured to go / stop pressuring me!</p>
<p>no one knows why I didn’t even know that he left why is that the case?</p>
<p>what does that have to do with anything?</p>
<p>I don’t want to burden you I felt bad for him In your opinion, which one is the best?</p>
<p>I would rather spend that money on you I would rather go work out than go drink embarrassed / embarrassing this is kind of a tangent but ..</p>
<p>9 out of 10 people would do that on second thought, I should’ve never bought that bag I’m totally obsessed with the TV show “friends” sorry to cut you off I forgot to take my medicine how is your business going?</p>
<p>I'm jealous / I envy you I'm not sure if I told you it’s not related with / it doesn’t have anything to do with you for the last 2 months read the room / walk on eggshells I always have to pay for food even though it’s a short visit.</p>
<p>enough about me, tell me about you guys do you know what a monitor arm is?</p>
<p>I had a mental breakdown I was very disappointed in myself as long as you love me as long as you do your work, it’s all good from what I know don’t worry, I’ll reach out first what’s the worst case scenario?</p>
<p>interestingly enough, As I get older / the older I get As time goes by I’m having second thoughts I have FOMO (fear of missing out) we made this from scratch he’s such a gentleman she’s a perfectionist I want to be able to say it more comfortably that was a tangent / that was off topic / we sidetracked a bit I pulled an all nighter / I stayed up all night it's worth a try Pillar Vocab (ask 10) 보아하니 / 듣자 하니 엄밀히 말하면 / 기술적으로 협상하다 정착하다 / 자리 잡다 재무 감사 은퇴하다 동시에 까다로운 주식과 채권에 투자하다 고려하다 / 생각하다 ~을 언급하다 / ~을 참조하다 ~에 관하여 / ~와 관련하여 회의적인 피해망상적인 / 과민한 자극하다 유능한 직원 시간을 잘 지키는 / 시간 엄수하는 정치 욕설 / 욕하기 총각 파티 / 신부 파티 (결혼 전 파티) 스트리퍼들 (춤추는 사람들) 장소 / 개최지 의무적인 / 필수의 무언가가 유행하고 있다 망설이고 있어요 편리한 직설적인 / 솔직한 숙소 / 숙박 시설 다과 / 음료수들 야망 있는 / 포부가 큰 느긋한 / 여유로운 (혹은 "진정해"라는 표현으로도 사용) 기진맥진한 / 매우 지친 꽃뱀들 (돈만 노리는 사람들) 일생에 한 번뿐인 기회 귀걸이 / 목걸이 / 팔찌들 치아 교정기 (브레이스) 치실 (플로스) 섬세하고 배려심 있는 존중하는 / 예의 있는 오글거리는 / 민망한 증명하다 / 승인(허가)하다 선거에서 투표하다 장례식 공통 친구들 ~을 이용하다 (부정적 뉘앙스 포함 가능) 병가를 내다 (아프다고 연락하다) 집착하는 / 푹 빠진 첫째로 / 둘째로 직설적인 / 솔직한 Vocab (ask 10) > make fun phrases chapter apparently, technically, negotiate settle down financial audit retire simultaneously picky invest in stocks and bonds consider refer to regarding ~ skeptical paranoid(delete?) stimulate a competent employee punctual politics swearing / cussing / cursing bachelor party / bridal shower strippers venue mandatory something is trending i’m hesitating convenient straightforward / direct accommodation refreshments / beverages ambitious chill exhausted gold diggers once in a lifetime opportunity earrings / necklaces / bracelets braces floss sensitive and caring respectful cringy prove / approval vote for the election funeral mutual friends take advantage of call in sick obsessed first of all / second of all straightforward Recommended Homework: Add all bulk answers + grammar mistakes to the flashcards Teachers must filter out the ones that the students know for sure from the “filter grammar” & “filter pillar expressions” as well as updating the “collect bulk answers" tab with their most recent answers.</p>
<p>From this point on it really depends on how good the student is at memorizing</h2><p></p>
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
      BegMockTest1,
      BegMockTest2,
    ],
    intermediate: [
      intermediateTemplate1,
      intermediateTemplate2,
      intermediateTemplate3,
      intermediateTemplate4,
      intermediateTemplate5,
      IntMockTest1,
      IntMockTest2,
    ],
    business: [
      businessTemplate1,
      businessTemplate2,
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
                                  "Mock Test 1",
                                  "Mock Test 2",
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
                                  "Mock Test 1",
                                  "Mock Test 2",
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
                        {["Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
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
                        {["Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
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

                      {/* Business Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-2">Business</h4>
                      <div className="space-y-1">
                        {["In Depth Business Conversation Topic List","Memorable Projects"].map((label) => (
                          <button
                            type="button"
                            key={`Beginner: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Business: ${label}`)}`;
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
