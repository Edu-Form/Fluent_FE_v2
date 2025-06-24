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
    <h1>📚 Notes Template</h1>

    <h2>✅ Tasks</h2>
    <ul>
      <li>Add Polishing Expressions (70%)</li>
      <li>Add New Expressions (30%)</li>
      <li>Use Textbook Grammar & Expressions throughout</li>
    </ul>

    <h3>📖 The First Class</h3>
    <ol>
      <li><strong>Go Over Notion Goals</strong><br/>🕐 Duration: 5 minutes</li>
      <li><strong>Self Introduction</strong><br/>🕐 Duration: 15 minutes<br/>📝 Task: Add to Flashcards<br/>
        Include:
        <ul>
          <li>Name</li>
          <li>Age</li>
          <li>Job</li>
          <li>Job Details</li>
          <li>Hobbies</li>
        </ul>
        (4–7 sentences is enough)
      </li>
      <li><strong>Small Talk</strong><br/>🕐 Duration: 15 minutes<br/>📌 If the student is below level 3 → Do Textbook for 30 minutes instead</li>
      <li><strong>Textbook Work</strong><br/>🕐 Duration: 15 minutes<br/>📘 Pace: Finish Chapter 1 in about 4–8 classes</li>
      <li><strong>App Downloads & Setup</strong><br/>🕐 Duration: 10 minutes<br/>📲 Download:
        <ul>
          <li>Quizlet App</li>
          <li>Google Docs App</li>
        </ul>
        📤 Share this file via email<br/>📎 Send Kakao Channel link
      </li>
    </ol>

  `;

  const notesTemplate2 = `
    <h2>📚 The Second Class</h2>

    <ol>
      <li><strong>Small Talk</strong> (5–15 minutes)<br/>- What did you do yesterday?<br/>- How are you?<br/>- When did you wake up? What did you do after that?</li>
      <li><strong>Previous Flashcards Review</strong> (15 minutes)<br/>- Check if they memorized their self introduction</li>
      <li><strong>Write Diary Together</strong> (15 minutes)<br/>- Refer to the diary examples in Chapter 1</li>
      <li><strong>Textbook</strong> (15 minutes)<br/>- Add slow/wrong expressions to Quizlet</li>
    </ol>
  `;

  const notesTemplate3 = `
    <h2>📚 The Third Class</h2>

    <ol>
      <li><strong>Small Talk</strong> (5–15 minutes)</li>
      <li><strong>Previous Flashcards Review</strong> (15 minutes)<br/>- Negotiate flashcard amount (30–60)</li>
      <li><strong>Talk About Diary</strong> (15 minutes)<br/>- Refer to diary conversation examples in Chapter 1</li>
      <li><strong>Textbook</strong> (15 minutes)<br/>- Add wrong/slow expressions from test or verbal checks</li>
    </ol>

  `;
  const notesTemplate4 = `
    <h2>📚 The Fourth Class</h2>

    <ol>
      <li><strong>Small Talk</strong> (15 minutes)<br/>
        - Sometimes let your student start the small talk with memorized expressions<br/>
        - Make sure you have them ask you questions as well
      </li>
      <li><strong>Previous Flashcards Review</strong> (15 minutes)<br/>
        - Wrong cards > 'star' it > test them again > if they still get it wrong copy and paste it in today's notes<br/>
        - Students MUST memorize their flashcards
      </li>
      <li><strong>Talk about diary</strong> (15 minutes)<br/>
        - Summarize the diary without looking > look at edits > add good expressions to flashcards<br/>
        - Refer to diary related expressions in textbook<br/>
        - Upgrade diary to include new grammar
      </li>
      <li><strong>Textbook</strong> (15 minutes)<br/>
        - Understand > Memorize > Use<br/>
        - You can do the tests in class or for homework depending on the student
      </li>
    </ol>
    
    <h3>📝 Recommended Homework:</h3>
    <ol>
      <li>Flashcards</li>
      <li>Diary (including new grammar learned)</li>
      <li>Include a test if you have reached it (solve and grade it for homework)</li>
    </ol>
  `;

  const notesTemplate5 = `
    <h2>📚 The Fifth Class</h2>

    <ol>
      <li><strong>Small Talk</strong> (15 minutes)</li>
      <li><strong>Previous Flashcards Review</strong> (15 minutes)</li>
      <li><strong>Talk about diary</strong> (15 minutes)</li>
      <li><strong>Textbook</strong> (15 minutes)</li>
    </ol>
    
    <h3>📝 Recommended Homework:</h3>
    <ol>
      <li>Flashcards</li>
      <li>Diary (including new grammar learned)</li>
      <li>Include a test if you have reached it (solve and grade it for homework)</li>
    </ol>
  `;

  const notesTemplate9 = `
  <h2>Grading Rubric</h2>
  <ol>
    <li>Must get over 65% correct + major bulk answers all correct</li>
    <li>Forgive: a, the, plural s, and sentences that mean the same thing and sound natural</li>
    <li>Will fail the question if it takes too long for student to respond</li>
    <li>The test will keep being updated so please adjust your mock tests according to this page</li>
  </ol>

  <h2>Rules</h2>
  <p>You can share the actual questions with the students. You can even share the link for the test.</p>
  <ol>
    <li>I will try to finish the test in 45 minutes and give feedback for 15 minutes.</li>
    <li>Take notes via google docs</li>
    <li>Key: * = small mistake (will forgive) / ** = this mistake will affect grade / *** = big mistake (should not appear at this level)</li>
  </ol>

  <h2>How students usually fail</h2>
  <ol>
    <li><strong>Simply not memorizing the expressions</strong>
      <ol>
        <li>if your student took class properly, these sentences shouldn't be too difficult to memorize. They should already know 80% of the sentence but will make small mistakes when you test them. Use the pressure from the exam to do make sure students know these expressions for sure.</li>
        <li>You already know what will come out on the test. If the student still gets it wrong, they just didn't study or are not qualified to take this test.</li>
      </ol>
    </li>
    <li><strong>The Teacher didn't help students make long form scripts</strong>
      <ol>
        <li>There are no curveballs with the long form speaking questions. Help students write responses that you know will pass and make sure to buff out any small grammar mistakes through mock tests.</li>
      </ol>
    </li>
    <li><strong>You didn't take enough mock tests</strong>
      <ol>
        <li>you think they know, they think they know, but sometimes they still get it wrong regardless</li>
        <li>make sure you start mock testing at least 1 month before the exam.</li>
        <li>me personally I just put everything they get wrong into quizlet > and then do the mock test again.
          <ol>
            <li>(no need to review everything via quizlet. just review via another mock test)</li>
          </ol>
        </li>
        <li>record the mock tests and send it to them</li>
      </ol>
    </li>
    <li>If your students don't study, just mock test them. If they still don't study have them fail the test.</li>
    <li>Have students write out the long form responses for homework instead of the diary to save prep time.
      <ol>
        <li>of course you may need to edit and upgrade their answers to help them pass</li>
      </ol>
    </li>
  </ol>

  <h2>The Test Starts Here</h2>
  
  <h3>Timer: 0 minute mark</h3>
  <h4>Basic Questions</h4>
  
  <h5>Date: 한국말로 물어보고 답하기</h5>
  <ol>
    <li>오늘 날짜가 어떻게 되나요?</li>
    <li>오늘 무슨 요일인가요?</li>
  </ol>

  <h5>Greet the teacher: can you say hi to me in 3 different ways? (aim for the harder ones)</h5>
  <ol>
    <li>how are you today? > I'm good and you?</li>
    <li>how was your day? > it was good and yours?</li>
    <li>what did you do today? > there was nothing special</li>
    <li>How have you been? > I've been good</li>
    <li>how is it going? > it's going well</li>
    <li>how are you doing? > I'm doing well</li>
    <li>what's going on? > nothing special</li>
    <li>what's up? > nothing much</li>
    <li>how is everything? > everything is good</li>
    <li>is everything going well? > yeah, everything's good</li>
    <li>What's on your mind? > nothing much (there's nothing on my mind)</li>
    <li>It's been a while! Long time no see > Yeah it's been a while! How are you?</li>
    <li>Let's catch up sometime!</li>
    <li>…and more!</li>
  </ol>

  <h5>Common Questions (ask all)</h5>
  <ol>
    <li>Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize]</li>
    <li>What are your hobbies? Tell me in more detail. [Verbal Nouns] [Like to]</li>
    <li>What do you do? (what is your job?) Tell me more about your job. [Must memorize]</li>
  </ol>

  <h3>Timer: 10 minute mark</h3>
  <h4>Additional Questions (All 5 questions are mandatory) (Must say this in bulk) (5~10 sentences)</h4>
  <ul>
    <li>What did you do today / this morning / yesterday? [past tense]</li>
    <li>What are you going to do tomorrow/ on the weekend? [future tense] [be going to V]</li>
    <li>Can you tell me about your best friend? [3rd person singular] [likes / does / is]
      <ol>
        <li>can you tell me about a close coworker or colleague?</li>
      </ol>
    </li>
  </ul>

  <h3>Timer: 15 minute mark</h3>
  <h4>Grammar Questions (번역시험) (Ask at least 3 questions for each group)</h4>

  <h5>1. 시간 & 날짜</h5>
  <ol>
    <li>오늘 몇일인가요? 2월 12일 입니다.</li>
    <li>생일이 언제인가요? 5월 31일 입니다.</li>
    <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
    <li>무슨 요일인가요? > 오늘은 수요일이에요</li>
    <li>지금 몇시인지 아시나요? > 지금 12시 반이에요</li>
    <li>학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)</li>
    <li>미국 언제 갈꺼야? 8월 7일쯤 갈거야.</li>
    <li>아침 먹고 나서 2가지</li>
    <li>퇴근 하고 나서 2가지</li>
    <li>출근 하고 나서 2가지</li>
  </ol>

  <h5>2. 과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)</h5>
  <ol>
    <li>그녀는 행복하지 않았어.</li>
    <li>얼마나 오래 영어를 가르쳤니?</li>
    <li>어떤 영화 봤어?</li>
    <li>그녀는 어떤 음식 좋아한데?</li>
    <li>얼마나 오래 영어를 가르쳤니?</li>
    <li>얼마나 자주 운동하니?</li>
    <li>어떤 영화를 좋아하니?</li>
    <li>어떤 게임을 했어?</li>
    <li>프랑스 어디에서 살았어?</li>
    <li>잘 잤어?</li>
    <li>너의 가족은 어디에 살아?</li>
    <li>아버님은 어떤 회사에서 일하셔?</li>
    <li>어떤 영화를 봤어?</li>
    <li>가족과 같이 사니?</li>
    <li>그녀는 학교에 가?</li>
    <li>가족과 친하니?</li>
    <li>그녀는 영어를 공부해?</li>
    <li>그는 피자를 좋아해</li>
    <li>그는 무슨 공부를 하니?</li>
    <li>그녀는 매일 독서해</li>
    <li>내 휴가는 11월 13일부터 12월 6일까지야.</li>
    <li>나는 7월 7일에 출장이 있어.</li>
    <li>8월에 계획이 있어?</li>
    <li>일요일에 언제 집에 왔어?</li>
    <li>지난 주말에 어디 갔어?</li>
  </ol>

  <h5>3. 미래형 (ask at least 3) (make sure they know both be going to V & will)</h5>
  <ol>
    <li>내일 뭐할거니? (will & be going to V)</li>
    <li>너 주말에 뭐할거야? (2가지 방법)</li>
    <li>토요일에 나 친구 만나러 강남갈거야</li>
    <li>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</li>
    <li>나 내일 미국으로 여행갈거야</li>
    <li>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야</li>
    <li>너는? 너는 오늘 수업 끝나고 뭐할거니?</li>
  </ol>

  <h5>4. to 부정사 8개 (ask at least 3)</h5>
  <ol>
    <li>너 햄버거 먹고 싶니?</li>
    <li>나는 미래에 경찰이 되기로 결정했어</li>
    <li>나는 요즘 일찍 일어나려고 노력중이야</li>
    <li>내 남동생이 울기 시작했어</li>
    <li>너는 운동하는거 좋아하니?</li>
    <li>퇴근하고 술 먹고 싶어</li>
    <li>그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해</li>
    <li>그는 카페에 가기 위해 압구정에 가야해</li>
    <li>저녁을 아내와 같이 먹고 싶었어.</li>
    <li>아내는 늦게까지 일해야 했어.</li>
    <li>다음 날 6시에 일어나야 해서 일찍 잤어.</li>
    <li>저는 넷플릭스 보면서 치킨 먹는 것을 좋아해</li>
  </ol>

  <h3>Timer: 20 minute mark</h3>

  <h5>6. 위해의 2가지 to V / for N (ask at least 3)</h5>
  <ol>
    <li>나는 친구를 만나기 위해 홍대에 갔어</li>
    <li>나는 부모님을 뵙기 위해 일본에 갔어</li>
    <li>나갈 준비를 했어. / 출근 준비를 했어. ( I got ready for work / I got ready to go out)</li>
    <li>친구들을 만나러 홍대에 갔어.</li>
    <li>수업을 위해 홍대에 왔어.</li>
    <li>나 너를 위해 선물 샀어</li>
    <li>나는 2년 동안 일 하러 일본에 가고 싶어 내 커리어를 위해</li>
  </ol>

  <h5>7. 동안 3가지 (ask at least 3)</h5>
  <ol>
    <li>나는 아침을 먹는 동안 티비를 봤어</li>
    <li>나는 휴가 동안 집에 있었어</li>
    <li>3시간 동안 울었어</li>
    <li>일 년 동안 영어 공부했어</li>
    <li>방학 동안 나는 미국에 갔어</li>
    <li>집에 있는 동안 유투브를 봤어</li>
    <li>제가 술을 마시는 동안 비가 그쳤어요 *</li>
    <li>공부를 하는 동안 배가 고파졌어요 *</li>
  </ol>

  <h5>8. ing 4가지 (ask at least 5)</h5>
  <ol>
    <li>운동하는 것은 재미있어</li>
    <li>요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요</li>
    <li>나는 피곤했지만 계속 일했어</li>
    <li>나는 취했지만 계속 술을 마셨어</li>
    <li>술은 몸에 안 좋아</li>
    <li>나는 공부하는 것을 좋아해</li>
    <li>나는 피곤했지만 계속 퀴즐렛을 공부했어</li>
    <li>운동은 건강에 좋아</li>
    <li>나는 요즘 여행하는 중이야</li>
    <li>여행하는 것은 내 꿈이야</li>
    <li>나는 어제 축구하는 동안 넘어졌어</li>
    <li>그것은 피곤했어</li>
    <li>TV 보는 것은 재미있어</li>
    <li>나 뛸 거야</li>
    <li>나 골프 잘쳐</li>
    <li>나 요리 못해</li>
    <li>난 그녀가 나한테 연락하길 기다리고 있어 (I'm waiting for her to contact me)</li>
    <li>그는 졸려지기 시작했어 (I'm starting to get sleepy)</li>
    <li>나 취할 예정이야 (I'm planning to get drunk)</li>
    <li>나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)</li>
  </ol>

  <h5>9. 공감표현 empathy expressions (ask at least 2)</h5>
  <ol>
    <li>그거 정말 지루하겠다</li>
    <li>저 피자 엄청 맛있겠다</li>
    <li>너 진짜 피곤하겠다</li>
    <li>그 시험 엄청 어렵겠다</li>
    <li>그거 엄청 스트레스 받겠다 (that must be stressful)</li>
    <li>너 엄청 스트레스 받겠다</li>
    <li>너네 강아지 진짜 배고프겠다</li>
    <li>너 진짜 속상하겠다 / 그거 진짜 속상하겠다 (that must be upsetting)</li>
    <li>그거 엄청 흥미롭겠는걸? (that sounds interesting / that must be interesting)</li>
    <li>저거 내 차 같이 생겼다</li>
    <li>이 노래 kpop 같아</li>
  </ol>

  <h3>Timer: 25 minute mark</h3>

  <h5>1. 추가 필수 생활 표현 (ask at least 3)</h5>
  <ol>
    <li>주말에 재미있는거 했어?</li>
    <li>일 외로 다른 것도 하셨나요?</li>
    <li>일 외로는 특별한 것 없었습니다</li>
    <li>아무것도 안했어</li>
    <li>일하느라 바빴어.</li>
    <li>친구랑 이야기하느라 바빴어.</li>
    <li>어땠어? 재미있었어? > 네 재미있었어요!</li>
    <li>홍대에 사람이 많아</li>
  </ol>

  <h5>2. 비교급 (ask at least 3)</h5>
  <ol>
    <li>맥주가 소주보다 좋은데 와인이 최고야</li>
    <li>맥주가 소주보다 비싼데 와인이 제일 비싸</li>
    <li>제 방은 거의 고시원 만큼 작아요</li>
    <li>미국은 캐나다 만큼 멀어요</li>
    <li>교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.</li>
    <li>어제보다 기분이 나아요.</li>
    <li>너 영어 많이 늘었다!</li>
    <li>저 골프 많이 늘었어요.</li>
    <li>데이빗이 아팠는데 좋아졌어요.</li>
    <li>사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].</li>
    <li>데이빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요. *</li>
    <li>조깅이 하이킹보다 더 힘들어요. *</li>
  </ol>

  <h5>3. 횟수 (ask at least 2)</h5>
  <ol>
    <li>저는 보통 가족을 한달에 4번 정도 봐요</li>
    <li>저는 2주에 1번 정도 운동을 하는 것 같아요</li>
    <li>주 3회 영어 공부하기 시작했어요.</li>
    <li>저는 3달에 2번 정도 여행을 가요</li>
  </ol>

  <h5>4. 부정 질문 (ask at least 2)</h5>
  <ol>
    <li>너 돈 있지 않아?</li>
    <li>너 안배고파?</li>
    <li>너 안피곤해?</li>
    <li>너 저녁 안먹었어?</li>
    <li>너 여자친구 있지 않았어?</li>
    <li>저 여자애 영어 하지 않아?</li>
    <li>너 누나가 영국 살지 않아?</li>
    <li>다시 해보지 그래요? (why don't you try again?)</li>
    <li>그냥 집에 있으면 안돼요? (can't you just stay home?)</li>
    <li>지금 집에 가는 것은 어떨까? (why don't we go home now?)</li>
    <li>이번에 내가 내는 것은 어때? (why don't I pay this time?)</li>
    <li>우리 그냥 내일 가면 안돼? (can't we go tomorrow instead?)</li>
  </ol>

  <h5>5. have pp 3가지</h5>
  <ol>
    <li>발리 가본적 있어?</li>
    <li>두리안 먹어본 적 있어?</li>
    <li>해리포터 본 적 있어?</li>
    <li>동방신기 들어본 적 있어?</li>
    <li>응 나 먹어봤지!</li>
    <li>아니 가본 적 없어</li>
    <li>한번도 들어본 적 없어</li>
    <li>한번도 가본 적 없어</li>
  </ol>

  <h3>Timer: 30 minute mark</h3>

  <h2>Grading Rubric</h2>
  <ol>
    <li>Must get over 65% correct + major bulk answers all correct</li>
    <li>Forgive: a, the, plural s, and sentences that mean the same thing and sound natural</li>
    <li>Will fail the question if it takes too long for student to respond</li>
    <li>The test will keep being updated so please adjust your mock tests according to this page</li>
  </ol>

  <h2>Rules</h2>
  <p>You can share the actual questions with the students. You can even share the link for the test.</p>
  <ol>
    <li>I will try to finish the test in 45 minutes and give feedback for 15 minutes.</li>
    <li>Take notes via google docs</li>
    <li>Key: * = small mistake (will forgive) / ** = this mistake will affect grade / *** = big mistake (should not appear at this level)</li>
  </ol>

  <h2>How students usually fail</h2>
  <ol>
    <li><strong>Simply not memorizing the expressions</strong>
      <ol>
        <li>if your student took class properly, these sentences shouldn't be too difficult to memorize. They should already know 80% of the sentence but will make small mistakes when you test them. Use the pressure from the exam to do make sure students know these expressions for sure.</li>
        <li>You already know what will come out on the test. If the student still gets it wrong, they just didn't study or are not qualified to take this test.</li>
      </ol>
    </li>
    <li><strong>The Teacher didn't help students make long form scripts</strong>
      <ol>
        <li>There are no curveballs with the long form speaking questions. Help students write responses that you know will pass and make sure to buff out any small grammar mistakes through mock tests.</li>
      </ol>
    </li>
    <li><strong>You didn't take enough mock tests</strong>
      <ol>
        <li>you think they know, they think they know, but sometimes they still get it wrong regardless</li>
        <li>make sure you start mock testing at least 1 month before the exam.</li>
        <li>me personally I just put everything they get wrong into quizlet > and then do the mock test again.
          <ol>
            <li>(no need to review everything via quizlet. just review via another mock test)</li>
          </ol>
        </li>
        <li>record the mock tests and send it to them</li>
      </ol>
    </li>
    <li>If your students don't study, just mock test them. If they still don't study have them fail the test.</li>
    <li>Have students write out the long form responses for homework instead of the diary to save prep time.
      <ol>
        <li>of course you may need to edit and upgrade their answers to help them pass</li>
      </ol>
    </li>
  </ol>

  <h2>The Test Starts Here</h2>
  
  <h3>Timer: 0 minute mark</h3>
  <h4>Basic Questions</h4>
  
  <h5>Date: 한국말로 물어보고 답하기</h5>
  <ol>
    <li>오늘 날짜가 어떻게 되나요?</li>
    <li>오늘 무슨 요일인가요?</li>
  </ol>

  <h5>Greet the teacher: can you say hi to me in 3 different ways? (aim for the harder ones)</h5>
  <ol>
    <li>how are you today? > I'm good and you?</li>
    <li>how was your day? > it was good and yours?</li>
    <li>what did you do today? > there was nothing special</li>
    <li>How have you been? > I've been good</li>
    <li>how is it going? > it's going well</li>
    <li>how are you doing? > I'm doing well</li>
    <li>what's going on? > nothing special</li>
    <li>what's up? > nothing much</li>
    <li>how is everything? > everything is good</li>
    <li>is everything going well? > yeah, everything's good</li>
    <li>What's on your mind? > nothing much (there's nothing on my mind)</li>
    <li>It's been a while! Long time no see > Yeah it's been a while! How are you?</li>
    <li>Let's catch up sometime!</li>
    <li>…and more!</li>
  </ol>

  <h5>Common Questions (ask all)</h5>
  <ol>
    <li>Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize]</li>
    <li>What are your hobbies? Tell me in more detail. [Verbal Nouns] [Like to]</li>
    <li>What do you do? (what is your job?) Tell me more about your job. [Must memorize]</li>
  </ol>

  <h3>Timer: 10 minute mark</h3>
  <h4>Additional Questions (All 5 questions are mandatory) (Must say this in bulk) (5~10 sentences)</h4>
  <ul>
    <li>What did you do today / this morning / yesterday? [past tense]</li>
    <li>What are you going to do tomorrow/ on the weekend? [future tense] [be going to V]</li>
    <li>Can you tell me about your best friend? [3rd person singular] [likes / does / is]
      <ol>
        <li>can you tell me about a close coworker or colleague?</li>
      </ol>
    </li>
  </ul>

  <h3>Timer: 15 minute mark</h3>
  <h4>Grammar Questions (번역시험) (Ask at least 3 questions for each group)</h4>

  <h5>1. 시간 & 날짜</h5>
  <ol>
    <li>오늘 몇일인가요? 2월 12일 입니다.</li>
    <li>생일이 언제인가요? 5월 31일 입니다.</li>
    <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
    <li>무슨 요일인가요? > 오늘은 수요일이에요</li>
    <li>지금 몇시인지 아시나요? > 지금 12시 반이에요</li>
    <li>학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)</li>
    <li>미국 언제 갈꺼야? 8월 7일쯤 갈거야.</li>
    <li>아침 먹고 나서 2가지</li>
    <li>퇴근 하고 나서 2가지</li>
    <li>출근 하고 나서 2가지</li>
  </ol>

  <h5>2. 과거형 / be 동사 / 일반동사 / 질문 (ask at least 6)</h5>
  <ol>
    <li>그녀는 행복하지 않았어.</li>
    <li>얼마나 오래 영어를 가르쳤니?</li>
    <li>어떤 영화 봤어?</li>
    <li>그녀는 어떤 음식 좋아한데?</li>
    <li>얼마나 오래 영어를 가르쳤니?</li>
    <li>얼마나 자주 운동하니?</li>
    <li>어떤 영화를 좋아하니?</li>
    <li>어떤 게임을 했어?</li>
    <li>프랑스 어디에서 살았어?</li>
    <li>잘 잤어?</li>
    <li>너의 가족은 어디에 살아?</li>
    <li>아버님은 어떤 회사에서 일하셔?</li>
    <li>어떤 영화를 봤어?</li>
    <li>가족과 같이 사니?</li>
    <li>그녀는 학교에 가?</li>
    <li>가족과 친하니?</li>
    <li>그녀는 영어를 공부해?</li>
    <li>그는 피자를 좋아해</li>
    <li>그는 무슨 공부를 하니?</li>
    <li>그녀는 매일 독서해</li>
    <li>내 휴가는 11월 13일부터 12월 6일까지야.</li>
    <li>나는 7월 7일에 출장이 있어.</li>
    <li>8월에 계획이 있어?</li>
    <li>일요일에 언제 집에 왔어?</li>
    <li>지난 주말에 어디 갔어?</li>
  </ol>

  <h5>3. 미래형 (ask at least 3) (make sure they know both be going to V & will)</h5>
  <ol>
    <li>내일 뭐할거니? (will & be going to V)</li>
    <li>너 주말에 뭐할거야? (2가지 방법)</li>
    <li>토요일에 나 친구 만나러 강남갈거야</li>
    <li>우리 아마 저녁 먹고 수다 떨기 위해 카페갈거야</li>
    <li>나 내일 미국으로 여행갈거야</li>
    <li>나 오늘 수업 끝나고 집 가서 넷플릭스 볼거야</li>
    <li>너는? 너는 오늘 수업 끝나고 뭐할거니?</li>
  </ol>

  <h5>4. to 부정사 8개 (ask at least 3)</h5>
  <ol>
    <li>너 햄버거 먹고 싶니?</li>
    <li>나는 미래에 경찰이 되기로 결정했어</li>
    <li>나는 요즘 일찍 일어나려고 노력중이야</li>
    <li>내 남동생이 울기 시작했어</li>
    <li>너는 운동하는거 좋아하니?</li>
    <li>퇴근하고 술 먹고 싶어</li>
    <li>그녀는 집에 가서 그녀의 애들을 위해 요리해줘야해</li>
    <li>그는 카페에 가기 위해 압구정에 가야해</li>
    <li>저녁을 아내와 같이 먹고 싶었어.</li>
    <li>아내는 늦게까지 일해야 했어.</li>
    <li>다음 날 6시에 일어나야 해서 일찍 잤어.</li>
    <li>저는 넷플릭스 보면서 치킨 먹는 것을 좋아해</li>
  </ol>

  <h3>Timer: 20 minute mark</h3>

  <h5>6. 위해의 2가지 to V / for N (ask at least 3)</h5>
  <ol>
    <li>나는 친구를 만나기 위해 홍대에 갔어</li>
    <li>나는 부모님을 뵙기 위해 일본에 갔어</li>
    <li>나갈 준비를 했어. / 출근 준비를 했어. ( I got ready for work / I got ready to go out)</li>
    <li>친구들을 만나러 홍대에 갔어.</li>
    <li>수업을 위해 홍대에 왔어.</li>
    <li>나 너를 위해 선물 샀어</li>
    <li>나는 2년 동안 일 하러 일본에 가고 싶어 내 커리어를 위해</li>
  </ol>

  <h5>7. 동안 3가지 (ask at least 3)</h5>
  <ol>
    <li>나는 아침을 먹는 동안 티비를 봤어</li>
    <li>나는 휴가 동안 집에 있었어</li>
    <li>3시간 동안 울었어</li>
    <li>일 년 동안 영어 공부했어</li>
    <li>방학 동안 나는 미국에 갔어</li>
    <li>집에 있는 동안 유투브를 봤어</li>
    <li>제가 술을 마시는 동안 비가 그쳤어요 *</li>
    <li>공부를 하는 동안 배가 고파졌어요 *</li>
  </ol>

  <h5>8. ing 4가지 (ask at least 5)</h5>
  <ol>
    <li>운동하는 것은 재미있어</li>
    <li>요즘 저는 미국을 가기 위해 영어 공부를 하고 있어요</li>
    <li>나는 피곤했지만 계속 일했어</li>
    <li>나는 취했지만 계속 술을 마셨어</li>
    <li>술은 몸에 안 좋아</li>
    <li>나는 공부하는 것을 좋아해</li>
    <li>나는 피곤했지만 계속 퀴즐렛을 공부했어</li>
    <li>운동은 건강에 좋아</li>
    <li>나는 요즘 여행하는 중이야</li>
    <li>여행하는 것은 내 꿈이야</li>
    <li>나는 어제 축구하는 동안 넘어졌어</li>
    <li>그것은 피곤했어</li>
    <li>TV 보는 것은 재미있어</li>
    <li>나 뛸 거야</li>
    <li>나 골프 잘쳐</li>
    <li>나 요리 못해</li>
    <li>난 그녀가 나한테 연락하길 기다리고 있어 (I'm waiting for her to contact me)</li>
    <li>그는 졸려지기 시작했어 (I'm starting to get sleepy)</li>
    <li>나 취할 예정이야 (I'm planning to get drunk)</li>
    <li>나 라면 먹으러 갈려고 했는데, 시간이 부족했어. (I was planning to go eat ramen but I didn't have enough time)</li>
  </ol>

  <h5>9. 공감표현 empathy expressions (ask at least 2)</h5>
  <ol>
    <li>그거 정말 지루하겠다</li>
    <li>저 피자 엄청 맛있겠다</li>
    <li>너 진짜 피곤하겠다</li>
    <li>그 시험 엄청 어렵겠다</li>
    <li>그거 엄청 스트레스 받겠다 (that must be stressful)</li>
    <li>너 엄청 스트레스 받겠다</li>
    <li>너네 강아지 진짜 배고프겠다</li>
    <li>너 진짜 속상하겠다 / 그거 진짜 속상하겠다 (that must be upsetting)</li>
    <li>그거 엄청 흥미롭겠는걸? (that sounds interesting / that must be interesting)</li>
    <li>저거 내 차 같이 생겼다</li>
    <li>이 노래 kpop 같아</li>
  </ol>

  <h3>Timer: 25 minute mark</h3>

  <h5>1. 추가 필수 생활 표현 (ask at least 3)</h5>
  <ol>
    <li>주말에 재미있는거 했어?</li>
    <li>일 외로 다른 것도 하셨나요?</li>
    <li>일 외로는 특별한 것 없었습니다</li>
    <li>아무것도 안했어</li>
    <li>일하느라 바빴어.</li>
    <li>친구랑 이야기하느라 바빴어.</li>
    <li>어땠어? 재미있었어? > 네 재미있었어요!</li>
    <li>홍대에 사람이 많아</li>
  </ol>

  <h5>2. 비교급 (ask at least 3)</h5>
  <ol>
    <li>맥주가 소주보다 좋은데 와인이 최고야</li>
    <li>맥주가 소주보다 비싼데 와인이 제일 비싸</li>
    <li>제 방은 거의 고시원 만큼 작아요</li>
    <li>미국은 캐나다 만큼 멀어요</li>
    <li>교촌이 BBQ보다 맛있지만 푸라닥이 가장 맛있어요.</li>
    <li>어제보다 기분이 나아요.</li>
    <li>너 영어 많이 늘었다!</li>
    <li>저 골프 많이 늘었어요.</li>
    <li>데이빗이 아팠는데 좋아졌어요.</li>
    <li>사라가 영어 실력이 좋아졌어요. 이제 거의 [데이비드만큼 잘해요].</li>
    <li>데이빗이 사라보다 더 좋은 학생이지만 제프가 가장 좋은 학생이에요. *</li>
    <li>조깅이 하이킹보다 더 힘들어요. *</li>
  </ol>

  <h5>3. 횟수 (ask at least 2)</h5>
  <ol>
    <li>저는 보통 가족을 한달에 4번 정도 봐요</li>
    <li>저는 2주에 1번 정도 운동을 하는 것 같아요</li>
    <li>주 3회 영어 공부하기 시작했어요.</li>
    <li>저는 3달에 2번 정도 여행을 가요</li>
  </ol>

  <h5>4. 부정 질문 (ask at least 2)</h5>
  <ol>
    <li>너 돈 있지 않아?</li>
    <li>너 안배고파?</li>
    <li>너 안피곤해?</li>
    <li>너 저녁 안먹었어?</li>
    <li>너 여자친구 있지 않았어?</li>
    <li>저 여자애 영어 하지 않아?</li>
    <li>너 누나가 영국 살지 않아?</li>
    <li>다시 해보지 그래요? (why don't you try again?)</li>
    <li>그냥 집에 있으면 안돼요? (can't you just stay home?)</li>
    <li>지금 집에 가는 것은 어떨까? (why don't we go home now?)</li>
    <li>이번에 내가 내는 것은 어때? (why don't I pay this time?)</li>
    <li>우리 그냥 내일 가면 안돼? (can't we go tomorrow instead?)</li>
  </ol>

  <h5>5. have pp 3가지</h5>
  <ol>
    <li>발리 가본적 있어?</li>
    <li>두리안 먹어본 적 있어?</li>
    <li>해리포터 본 적 있어?</li>
    <li>동방신기 들어본 적 있어?</li>
    <li>응 나 먹어봤지!</li>
    <li>아니 가본 적 없어</li>
    <li>한번도 들어본 적 없어</li>
    <li>한번도 가본 적 없어</li>
  </ol>

  <h3>Timer: 30 minute mark</h3>

  <h2>주제별 질문 (Topic Questions)</h2>
  
  <h3>Family Topic</h3>
  <ul>
    <li>Tell me about your family in detail. How many members are there? What do they do?</li>
    <li>Let's have a short conversation. Please ask me at least 5 questions about my family during the conversation.</li>
    <li>Please compare you and someone from your family * (just 3 sentences)</li>
  </ul>
  
  <h4>Family Question Bank (make sure they ask at least 5 questions when talking to you)</h4>
  <ol>
    <li>가족을 얼마나 자주 보나요?</li>
    <li>가족에 대해 말해주세요</li>
    <li>가족 인원이 몇명인가요?</li>
    <li>형제 자매가 몇명인가요?</li>
    <li>가족과 친한가요?</li>
    <li>부모님에 대해 말해주세요 어떤 일을 하시나요?</li>
    <li>남편은 어떤 회사에서 일하시나요?</li>
    <li>아드님은 미래에 뭘 하실 계획인가요?</li>
    <li>혼자 사세요? 아니면 부모님이랑 사시나요?</li>
    <li>가족 중 누구랑 가장 친한가요?</li>
    <li>형제자매랑 나이 차이가 어떻게 되나요?</li>
    <li>몇살 더 많아요?</li>
    <li>직업들이 어떻게 되시나요?</li>
  </ol>

  <h3>House & Neighborhood Topic</h3>
  <ul>
    <li>What neighborhood do you live in? Tell me in detail. What do you like about your neighborhood? what are the characteristics?</li>
    <li>Tell me about your house in detail.
      <ul><li>tell me about your room?</li></ul>
    </li>
    <li>Please compare your old neighborhood to your new neighborhood ** (just 5 sentences)</li>
    <li>Let's have a short conversation. Please ask me at least 5 questions about my house and neighborhood.</li>
  </ul>

  <h4>House Question Bank (make sure they ask at least 5 questions when talking to you)</h4>
  <ol>
    <li>몇층에 사시나요?</li>
    <li>아파트 사세요 집에 사세요?</li>
    <li>저는 이 집에 3년동안 살았습니다</li>
    <li>경치가 좋아요</li>
    <li>집의 가장 마음에 드는 방이 어디에요?</li>
    <li>집의 가장 마음에 드는 가구가 뭐에요?</li>
    <li>집에 대해 가장 마음에 드는 점이 뭔가요?</li>
    <li>어떤 동네에 사시나요?</li>
    <li>이 지역에 얼마나 오래 살았어요?</li>
    <li>그게 홈플러스 근처인가요?</li>
    <li>이사하고 싶어요?</li>
    <li>집에 만족하시나요?</li>
  </ol>

  <h3>Timer: 40 minute mark</h3>
  <h2>Beginner Pillar Expressions (ask 20 out of the pool)</h2>
  
  <ol>
    <li>뭘 해야 할지 모르겠어.</li>
    <li>그 셔츠를 어디서 사야 할지 모르겠어.</li>
    <li>나 지금 시험 공부하고 있어.</li>
    <li>나 처음으로 초밥 먹어봤어.</li>
    <li>원하면 우리 영화 볼 수 있어.</li>
    <li>밖에 비 오고 있어.</li>
    <li>파리에 가고 싶어.</li>
    <li>방금 점심 다 먹었어.</li>
    <li>우리 산책했어.</li>
    <li>이 앱 사용하는 방법 알려줄 수 있어?</li>
    <li>어쨌든 다음 주제로 넘어가자.</li>
    <li>숙제 끝내야 해.</li>
    <li>오늘 좀 피곤해.</li>
    <li>다쳤어. / 아파.</li>
    <li>엄청 더워.</li>
    <li>규칙을 따라야 해.</li>
    <li>다음 주에 만나는 거 기대돼.</li>
    <li>인도 음식 먹어본 적 있어?</li>
    <li>돈 많이 벌고 싶어.</li>
    <li>출근하는 길이야.</li>
    <li>맛집 발견했어!</li>
    <li>건강하게 먹어야 해.</li>
    <li>오랜만에 옛 친구를 우연히 만났어.</li>
    <li>벌써 늦었네, 집에 가자.</li>
    <li>새로운 과제 하고 있어.</li>
    <li>새 컴퓨터 설정해야 해.</li>
    <li>"스페인어로 안녕"을 어떻게 말하는지 검색해봤어.</li>
    <li>그녀는 그림을 정말 잘 그려.</li>
    <li>외투 입어, 밖에 추워.</li>
    <li>우유 다 떨어졌어.</li>
    <li>약 받아와야 해.</li>
    <li>도와줄 수 있어?</li>
    <li>스페인어 배우는 것에 관심 있어.</li>
    <li>비행기 한 시간 후에 출발해.</li>
    <li>열쇠 찾고 있어.</li>
    <li>나가기 전에 문 꼭 잠가.</li>
    <li>새 차 마음에 들어.</li>
    <li>방금 집에 왔어.</li>
    <li>한국은 김치로 유명해.</li>
    <li>그럴 가치 없어.</li>
    <li>3일 연속으로.</li>
    <li>말했듯이.</li>
    <li>왕복 8시간 운전했어.</li>
    <li>추천해?</li>
    <li>누구한테 물어봐야 할지 모르겠어.</li>
    <li>자신이 없어.</li>
    <li>부산에서 해변 축제 하고 있었어.</li>
    <li>사진 보여줄게!</li>
    <li>돈 받았어?</li>
    <li>요금이 가성비 좋았어.</li>
    <li>벌금이 50만 원이었어.</li>
    <li>오랜만에 중학교 친구들 만났어.</li>
    <li>네가 원하는 대로 해도 돼.</li>
    <li>구체적으로,</li>
    <li>그녀가 나한테 교회 가라고 했어.</li>
    <li>그녀에게 가방 사줬어.</li>
    <li>그녀가 전화를 끊었어. / 내가 전화를 받았어.</li>
    <li>커뮤니티 행사 기대돼.</li>
    <li>아이들을 돌봐야 해.</li>
    <li>고양이 돌보느라 바빴어.</li>
    <li>블로그 써보는 게 좋을 것 같아.</li>
    <li>마음에 들었으면 좋겠어.</li>
    <li>잘됐으면 좋겠어.</li>
    <li>살 안 쪘으면 좋겠어. (살 좀 빠졌으면 좋겠어.)</li>
    <li>빨리 나았으면 좋겠어.</li>
    <li>이번 겨울에 한국에 있을 거야.</li>
    <li>그들이 나한테 음식 많이 사줬어.</li>
    <li>요즘 와인에 푹 빠졌어.</li>
    <li>실수하는 거 싫어.</li>
    <li>퇴근하고 나서 올래?</li>
    <li>안타깝게도,</li>
    <li>다행히도,</li>
    <li>나에 대해 말하자면,</li>
    <li>운전할지 자전거 탈지 고민했어.</li>
    <li>A를 할지 B를 할지.</li>
    <li>이건 습관이 되면 안 될 것 같아.</li>
    <li>미안해할 필요 없어. 괜찮아.</li>
    <li>근데 장소가 어디였지?</li>
    <li>그녀가 나한테 3만 원 빌렸어.</li>
    <li>이 가방 7만 7천 원이야.</li>
    <li>대화가 이상하게 흘러갔어.</li>
    <li>결론적으로, 프로젝트는 성공했어.</li>
    <li>요약하자면, 올해 목표를 달성했어.</li>
    <li>전체적으로, 정말 좋은 경험이었어.</li>
    <li>운동한 지 5년 됐어.</li>
    <li>결국, 다 잘 해결됐어.</li>
    <li>돈 낭비였어.</li>
    <li>보통,</li>
    <li>원래,</li>
    <li>결국,</li>
    <li>하루 종일,</li>
    <li>그녀는 스페인에 안 가기로 했어.</li>
    <li>내성적인 사람 / 외향적인 사람</li>
    <li>"편리하다"를 영어로 어떻게 말해? > "convenient"이라고 해.</li>
    <li>"convenient"가 무슨 뜻이야? > "편리하다"라는 뜻이야.</li>
    <li>어제 쉬는 날이었어.</li>
    <li>오늘 재미있게 보내길 바래!</li>
    <li>지난번이랑 완전 똑같아.</li>
    <li>그녀를 다시 만날지 고민 중이야.</li>
    <li>회의 말고 다른 재미있는 일 했어?</li>
    <li>다음 행사에 참석 못 해?</li>
    <li>그거 무례한 거 아니야?</li>
    <li>네가 원할 때 언제든 갈 수 있어.</li>
    <li>일하느라 바빴어.</li>
    <li>그녀가 연락할 때까지 그냥 기다리고 있어.</li>
    <li>힘들었어. / 즐거웠어.</li>
    <li>10시쯤 시작하자.</li>
  </ol>

  <h3>New Expressions</h3>
  <ol>
    <li>약속</li>
    <li>시험 잘 봐!</li>
    <li>빨리 나았으면 좋겠어.</li>
    <li>잘됐으면 좋겠어.</li>
    <li>살 안 쪘으면 좋겠어.</li>
    <li>빨리 나았으면 좋겠어.</li>
    <li>더치페이하자.</li>
    <li>미안, 이 전화 받아야 해.</li>
    <li>이 전화 받아도 돼? 중요한 거야.</li>
    <li>~해도 괜찮아? > 응, 괜찮아.</li>
    <li>A 대신 B를 샀어.</li>
    <li>I don't know what to do (move to intermediate?)</li>
    <li>I don't know where to buy that shirt. (move to intermediate?)</li>
    <li>I'm currently studying for my exams.</li>
    <li>I tried sushi for the first time.</li>
    <li>If you want, we can watch a movie.</li>
    <li>It's raining outside.</li>
    <li>I want to visit Paris.</li>
    <li>I just finished my lunch.</li>
    <li>We took a walk.</li>
    <li>Can you show me how to use this app?</li>
    <li>Anyway, let's move on to the next topic.</li>
    <li>I need to finish my homework.</li>
    <li>I'm feeling a little tired today.</li>
    <li>I got hurt. / I'm sick</li>
    <li>It's super hot.</li>
    <li>You must follow the rules.</li>
    <li>I look forward to seeing you next week.</li>
    <li>Have you ever tried Indian food?</li>
    <li>I want to earn a lot of money.</li>
    <li>I'm on the way to work.</li>
    <li>I found a great restaurant!</li>
    <li>You should eat healthy.</li>
    <li>I ran into an old friend.</li>
    <li>It's late already, let's go home.</li>
    <li>I'm working on a new assignment.</li>
    <li>I need to set up my new computer.</li>
    <li>I looked up "how to say hi in Spanish."</li>
    <li>She's really good at painting.</li>
    <li>Put on your jacket. It's cold outside.</li>
    <li>We ran out of milk.</li>
    <li>I need to pick up my medicine.</li>
    <li>Can you give me a hand?</li>
    <li>I'm interested in learning Spanish.</li>
    <li>My flight will take off in an hour.</li>
    <li>I'm looking for my keys.</li>
    <li>Make sure you lock the door before you leave.</li>
    <li>I'm satisfied with my new car.</li>
    <li>I just came back home</li>
    <li>Korea is famous for Kimchi</li>
    <li>it's not worth it</li>
    <li>three days in a row</li>
    <li>As I said / As I told you / As I mentioned</li>
    <li>I drove for 8 hours there and back (two ways) (back and forth)</li>
    <li>Do you recommend it?</li>
    <li>I don't know who to ask</li>
    <li>I'm not confident</li>
    <li>Busan was holding a beach festival</li>
    <li>I'll show you a picture!</li>
    <li>Did you get paid yet?</li>
    <li>The fee was very cost efficient</li>
    <li>The fine was 500,000 won</li>
    <li>I met my middle school friends for the first time in a while (first time in a long time)</li>
    <li>You can do whatever you want</li>
    <li>Specifically,</li>
    <li>she wanted me to go to church</li>
    <li>I bought her a bag</li>
    <li>She hung up the phone / I picked up the phone</li>
    <li>I'm looking forward to the community event</li>
    <li>I have to take care of my kids</li>
    <li>I was busy taking care of my cats</li>
    <li>I think you should write a blog</li>
    <li>I hope you like it (move to intermediate?)</li>
    <li>I hope [it goes well] (move to intermediate?)</li>
    <li>I hope I don't gain weight (lose weight) (move to intermediate?)</li>
    <li>I hope you get better (move to intermediate?)</li>
    <li>I'm gonna be in korea this winter</li>
    <li>They bought me a lot of food</li>
    <li>I'm really into wine these days</li>
    <li>I don't like making mistakes</li>
    <li>Why don't you come after getting off work?</li>
    <li>Unfortunately,</li>
    <li>Thankfully,</li>
    <li>To tell you about myself,</li>
    <li>I was deciding [whether to drive or to ride a bike].</li>
    <li>Whether to do A or B</li>
    <li>I don't think this should be a habit</li>
    <li>you dont have to be sorry. it's okay</li>
    <li>By the way, where is the venue again?</li>
    <li>she owes me 30,000won</li>
    <li>This bag costs 77,000won</li>
    <li>the conversation got weird</li>
    <li>In conclusion, the project was a success.</li>
    <li>In summary, we achieved our goals this year.</li>
    <li>All in all, it was a great experience.</li>
    <li>I've worked out for 5 years now</li>
    <li>In the end, everything worked out fine.</li>
    <li>it was a waste of money</li>
    <li>Normally,</li>
    <li>Originally,</li>
    <li>Eventually,</li>
    <li>for the whole day</li>
    <li>she decided not to go to spain</li>
    <li>an introvert / an extrovert</li>
    <li>how do you say "편리하다" in english? > you say "convenient"</li>
    <li>what does "convenient" mean? > it means "편리하다"</li>
    <li>yesterday was my day off</li>
    <li>I want you to have fun today!</li>
    <li>it's exactly the same as last time</li>
    <li>I am deciding whether to meet her again or not</li>
    <li>other than the meeting, did you do anything fun?</li>
    <li>can't I attend the next event?</li>
    <li>isn't that rude?</li>
    <li>I can come whenever you want</li>
    <li>I was busy with work</li>
    <li>I'm just waiting for her to contact me.</li>
    <li>I had a hard time / I had a good time</li>
    <li>let's start at like 10 ish</li>
  </ol>

  <h4>New (Additional)</h4>
  <ol>
    <li>Appointment</li>
    <li>good luck with your exams</li>
    <li>I hope you get better</li>
    <li>I hope [it goes well]</li>
    <li>I hope I don't gain weight</li>
    <li>I hope you get better</li>
    <li>let's split the bill</li>
    <li>oh sorry I have to take this call.</li>
    <li>can I take this call? it's important.</li>
    <li>Do you mind [if I do ~]? > no, I don't mind</li>
    <li>I bought A instead of B</li>
    <li>as soon as I arrived</li>
    <li>as long as you love me</li>
    <li>day after tomorrow</li>
    <li>from today / from now on</li>
    <li>I looked it up</li>
    <li>I'll look for a video</li>
    <li>lend / borrow / rent</li>
    <li>I'm slightly embarrassed</li>
    <li>it was really annoying</li>
    <li>it stressed her out a lot. / she was stressed</li>
  </ol>

  <h3>Timer: 45 minutes (Done)</h3>
`;

  const intermediateTemplate1 = `
    <h2>📚 The First Class (Intermediate)</h2>

    <ol>
      <li><strong>Go Over Notion Goals</strong> (3–5 minutes)</li>
      <li><strong>Small Talk</strong> (15 minutes)</li>
      <li><strong>Self Introduction</strong> (15 minutes)<br/>- Add to flashcards</li>
      <li><strong>Textbook</strong> (20 minutes)<br/>- Pace: Chapter 5 in 2–3 classes<br/>- Read storytelling examples</li>
      <li><strong>App Setup</strong> (5 minutes)<br/>
        <ul>
          <li>Download Quizlet App</li>
          <li>Download Google Docs App</li>
          <li>Send Kakao Channel link</li>
        </ul>
      </li>
    </ol>


  `;

  const intermediateTemplate2 = `
    <h2>📚 The Second Class (Intermediate)</h2>

    <ol>
      <li><strong>Student Driven Small Talk</strong> (15 minutes)<br/>- Let them ask questions first</li>
      <li><strong>Flashcards Review</strong> (15 minutes)<br/>- Check self introduction<br/>- Negotiate flashcard amount (30–100)</li>
      <li><strong>Storytell the Diary</strong> (15 minutes)<br/>- Follow-ups + your own example<br/>- Add slow expressions to Quizlet</li>
      <li><strong>Textbook</strong> (15 minutes)<br/>- Review test expressions</li>
    </ol>

    <h3>💬 Suggested Prompts</h3>
    <ul>
      <li>Unexpected event</li>
      <li>Fight/argument</li>
      <li>Office gossip</li>
      <li>Frustrating situation</li>
      <li>Funny story about kids</li>
    </ul>


  `;

  const intermediateTemplate3 = `
    <h2>📚 The Third Class (Intermediate)</h2>

    <ol>
      <li><strong>Student Driven Small Talk</strong> (15 minutes)</li>
      <li><strong>Flashcards Review</strong> (15 minutes)<br/>- Re-add important wrong answers</li>
      <li><strong>Storytell the Diary</strong> (15 minutes)<br/>- Add character, quotes, etc.</li>
      <li><strong>Textbook</strong> (15 minutes)<br/>- Continue chapter, verbal checks</li>
    </ol>


  `;

  const intermediateTemplate4 = `
   <h2>📚 The Fourth Class (Intermediate)</h2>

   <ol>
     <li><strong>Student Driven Small Talk</strong> (15 minutes)<br/>- Sometimes let your student start the small talk with memorized expressions<br/>- Make sure you have them ask you questions as well</li>
     <li><strong>Previous Flashcards Review</strong> (15 minutes)<br/>- Wrong cards > 'star' it > test them again > if they still get it wrong copy and paste it in today's notes<br/>- Students MUST memorize their flashcards</li>
     <li><strong>Talk about diary</strong> (15 minutes)<br/>- Summarize the diary without looking > look at edits > add good expressions to flashcards<br/>- Refer to diary related expressions in textbook<br/>- Upgrade diary to include new grammar</li>
     <li><strong>Textbook</strong> (15 minutes)<br/>- Understand > Memorize > Use<br/>- You can do the tests in class or for homework depending on the student</li>
   </ol>

   <h3>📝 Recommended Homework:</h3>
   <ol>
     <li>Flashcards</li>
     <li>Diary (including new grammar learned)</li>
     <li>Include a test if you have reached it (solve and grade it for homework)</li>
   </ol>
 `;

  const intermediateTemplate5 = `
   <h2>📚 The Fifth Class (Intermediate)</h2>

   <ol>
     <li><strong>Small Talk</strong> (15 minutes)</li>
     <li><strong>Previous Flashcards Review</strong> (15 minutes)</li>
     <li><strong>Talk about diary</strong> (15 minutes)</li>
     <li><strong>Textbook</strong> (15 minutes)</li>
   </ol>

   <h3>📝 Recommended Homework:</h3>
   <ol>
     <li>Flashcards</li>
     <li>Diary (including new grammar learned)</li>
     <li>Include a test if you have reached it (solve and grade it for homework)</li>
   </ol>
 `;

  const intermediateTemplate9 = `
  <h1>Intermediate Level Test</h1>
  
  <h2>Grading Rubric</h2>
  <ol>
    <li>Must get over 65% correct + major bulk answers all correct</li>
    <li>Forgive: a, the, plural s, and sentences that mean the same thing and sound natural</li>
    <li>Will fail the question if it takes too long for student to respond</li>
    <li>The test will keep being updated so please adjust your mock tests according to this page</li>
  </ol>

  <h2>Rules</h2>
  <p>You can share the actual questions with the students. You can even share the link for the test.</p>
  <ol>
    <li>I will try to finish the test in 45 minutes and give feedback for 15 minutes.</li>
    <li>Take notes via google docs</li>
    <li>Key: * = small mistake (will forgive) / ** = this mistake will affect grade / *** = big mistake (should not appear at this level)</li>
  </ol>

  <h2>How students usually fail</h2>
  <ol>
    <li><strong>Simply not memorizing the expressions</strong>
      <ol>
        <li>if your student took class properly, these sentences shouldn't be too difficult to memorize. They should already know 80% of the sentence but will make small mistakes when you test them. Use the pressure from the exam to do make sure students know these expressions for sure.</li>
        <li>You already know what will come out on the test. If the student still gets it wrong, they just didn't study or are not qualified to take this test.</li>
      </ol>
    </li>
    <li><strong>The Teacher didn't help students make long form scripts</strong>
      <ol>
        <li>There are no curveballs with the long form speaking questions. Help students write responses that you know will pass and make sure to buff out any small grammar mistakes through mock tests.</li>
      </ol>
    </li>
    <li><strong>You didn't take enough mock tests</strong>
      <ol>
        <li>you think they know, they think they know, but sometimes they still get it wrong regardless</li>
        <li>make sure you start mock testing at least 1 month before the exam.</li>
        <li>me personally I just put everything they get wrong into quizlet > and then do the mock test again.
          <ol>
            <li>(no need to review everything via quizlet. just review via another mock test)</li>
          </ol>
        </li>
        <li>record the mock tests and send it to them</li>
      </ol>
    </li>
    <li>If your students don't study, just mock test them. If they still don't study have them fail the test.</li>
    <li>Have students write out the long form responses for homework instead of the diary to save prep time.
      <ol>
        <li>of course you may need to edit and upgrade their answers to help them pass</li>
      </ol>
    </li>
  </ol>

  <h2>The Test Starts Here</h2>
  
  <h3>Timer: 0 minute mark</h3>
  <h4>Basic Questions</h4>
  
  <h5>Date: What is the date today? > must respond & ask the right questions</h5>
  <ol>
    <li>오늘 날짜가 어떻게 되나요?</li>
    <li>오늘 무슨 요일인가요?</li>
  </ol>

  <h5>시간 & 날짜 (NEW)</h5>
  <ol>
    <li>7월 20일 / 11월 30일 / 2월 12일 / 4월 15일</li>
    <li>지금 몇시인지 아시나요? > 지금 12시 반이에요 (현재 시간으로)</li>
    <li>학원 오는데 얼마나 걸리나요? > 한 30분 정도 걸려요 (it takes about half an hour)</li>
    <li>미국 언제 갈꺼야? > 8월 7일쯤 갈거야. (i'm gonna go on august 7th)</li>
  </ol>

  <h5>Greet the teacher: can you say hi to me in 3 different ways? (greetings that are in the "easy" level in the textbook will not count)</h5>
  <ol>
    <li>how is it going? > it's going well</li>
    <li>how are you doing? > I'm doing well</li>
    <li>what's going on? > nothing special</li>
    <li>what's up? > nothing much</li>
    <li>how is everything? > everything is good</li>
    <li>is everything going well? > yeah, everything's good</li>
    <li>What's on your mind? > nothing much (there's nothing on my mind)</li>
    <li>It's been a while! Long time no see > Yeah it's been a while! How are you?</li>
    <li>Let's catch up sometime!</li>
  </ol>

  <h3>Timer: 5 minute mark</h3>
  <h4>Common Questions (ask all)</h4>
  <ol>
    <li>Hi XX, long time no see, can you introduce yourself? [talking about oneself] [Must memorize an upgraded version]</li>
    <li>What are your hobbies nowadays? What are you into? Tell me in detail (Or: tell me about your hobbies in more detail!) [Must memorize upgraded version]</li>
    <li>what do you look forward to in your day?</li>
    <li>What do you do? (what is your job?) Tell me more about your job & company. [Must memorize upgraded version] (skip if it was mentioned in detail already)
      <ol>
        <li>Or : tell me about being a student. How is it? do you wanna grow up faster? (For students)</li>
      </ol>
    </li>
  </ol>
  <p>(There may be follow up questions to test their basic grammar and speed)</p>

  <h3>Timer: 10 minute mark</h3>
  <h4>Work questions (ask at least 3)</h4>
  <ul>
    <li>there may be follow up questions</li>
    <li>I am looking for any grammar mistakes, the use of advanced grammar, intermediate vocabulary, speed, natural flow
      <ul>
        <li>Advanced grammar = Have pp, could, should, relative pronouns, verbal nouns, might</li>
      </ul>
    </li>
  </ul>
  <ol>
    <li>Tell me about a typical day at work</li>
    <li>Tell me about your most recent project</li>
    <li>What was your previous job?</li>
    <li>Why are you taking a break from work?</li>
    <li>How are you enjoying taking a break from school / work?</li>
    <li>How is being a housewife treating you? (student / an employee)</li>
    <li>do you like your company or school? what about your major?</li>
    <li>tell me about your team and position?</li>
    <li>what do you plan to do for work in your future</li>
    <li>do you like school? how is it different from other schools?</li>
    <li>do you like your homeroom class?</li>
    <li>do you like your homeroom teacher?</li>
    <li>are there any professors / managers / coworkers that you like?</li>
  </ol>

  <h3>Timer: 15 minute mark</h3>
  <h4>Storytelling (ask at least 2)</h4>
  <ul>
    <li>Must use advanced grammar</li>
    <li>Good storytelling = incorporating characters, dialogue, and an entertaining flow. (practice makes perfect)</li>
  </ul>
  <ol>
    <li>Tell me about something unexpected that happened recently</li>
    <li>Tell me about the most memorable fight or argument you had with someone that you know</li>
    <li>Tell me some office gossip. (maybe someone you dislike at work)</li>
    <li>Tell me about a situation that annoyed you at work</li>
    <li>Tell me about how your kids upset you or made you laugh</li>
  </ol>

  <h3>Timer: 20 minute mark</h3>
  <h4>Grammar: Verbal Nouns and Relative Pronouns (ask at least 7)</h4>
  <ol>
    <li>저 여자가 [제가 어제 만난 여자]에요.</li>
    <li>[제가 좋아했던 그 여자]가 이사 갔어요.</li>
    <li>[제가 만난 그 남자]는 코미디언이었어요.</li>
    <li>제가 [당신이 만난 사람]을 봤어요.</li>
    <li>[제가 어제 뭘 했는지] 기억이 안 나요.</li>
    <li>[그녀가 이게 예쁘다고] 말했어요.</li>
    <li>[제가 어릴 때], 저는 아팠어요.</li>
    <li>제가 [왜 그녀가 화났는지] 모르겠어요.</li>
    <li>제가 [당신이 어디 있는지] 알아요.</li>
    <li>그게 [제가 우유를 못 마시는 이유]에요.</li>
    <li>제가 [당신이 거짓말한 걸] 알아요.</li>
    <li>[제가 예쁘지 않다고] 생각했어요.</li>
    <li>제가 [1000원짜리 물]을 샀어요.</li>
    <li>[제가 좋아하는 음식]은 피자예요.</li>
    <li>[제가 일하는 회사]는 부산에 있어요.</li>
    <li>제가 좋아하는 장면은 [주인공이 악당과 싸우는 장면]이에요.</li>
    <li>제가 좋아하는 [여자를 만났어요].</li>
    <li>[그게 바로 당신을 좋아하는 이유예요].</li>
    <li>제가 [포레스트 검프라는 영화]를 봤어요.</li>
    <li>저는 [유명한 케이팝 보이그룹인 BTS]를 좋아해요.</li>
    <li>나는 그가 내 이름을 기억하는지 궁금해.</li>
    <li>나는 네가 여행을 즐겼기를 바라.</li>
    <li>그녀는 왜 늦었는지 설명했어.</li>
    <li>내가 이걸 제시간에 끝낼 수 있을지 확신이 안 서.</li>
    <li>나는 오늘이 그녀의 생일이라는 걸 잊었어.</li>
    <li>나는 네가 내일 쉬는 날인 걸 알기 때문에 계획을 세웠어.</li>
    <li>그가 쓴 보고서가 이 프로젝트의 핵심 자료야.</li>
    <li>그가 언급했던 프로젝트가 드디어 시작됐어.</li>
    <li>내가 다니는 헬스장은 24시간 운영해.</li>
    <li>그녀가 요리한 음식이 오늘의 메인 요리야.</li>
    <li>내가 매일 이용하는 지하철역이 이번 주에 공사 중이야.</li>
  </ol>

  <h3>Timer: 25 minute mark</h3>
  <h2>Choose 3 of 5 topics to talk about (5 min each)</h2>

  <h4>Movies (ask at least 2) (must use multiple relative pronouns & verbal nouns)</h4>
  <p>(or TV shows, Anime, webtoons, books, entertainment shows)</p>
  <ol>
    <li>What movie did you watch recently?
      <ol>
        <li>What was the story about in detail?</li>
      </ol>
    </li>
    <li>What is your all time favorite movie?
      <ol>
        <li>What was the story about in detail?</li>
        <li>Why do you like this movie so much?</li>
      </ol>
    </li>
    <li>Ask me 3 questions about my movie taste and recommend a movie for me and explain why you think I would like it</li>
    <li>Tell me about your favorite actor or actress and why you like them. What did they come out in?</li>
    <li>what TV program did you watch when you were a kid? what is it about?</li>
  </ol>

  <h4>Talking to a foreigner</h4>
  <ul>
    <li>Let's have a conversation. Please ask me about my childhood, where I grew up, and how I came to korea. (refer to the expressions below)
      <ol>
        <li>Make the student ask you about 5~10 questions about yourself and your foreign background</li>
      </ol>
    </li>
    <li>Must use at least 5 of the following questions</li>
    <li>The flow of questioning must be natural</li>
  </ul>
  
  <h5>For David</h5>
  <ol>
    <li>Where did you grow up?</li>
    <li>Where in the states did you live?</li>
    <li>What state are you from?</li>
    <li>Do you miss living in america?</li>
    <li>Are you planning to go back anytime soon?</li>
    <li>Where do you like living better? Korea or the US?</li>
    <li>How long has it been since you lived in the US?</li>
    <li>What's the best part about living in korea? (being back in korea)</li>
    <li>Do you speak any other languages?</li>
    <li>Did you live anywhere else other than the US? (any other countries)</li>
    <li>Where did you go to school?</li>
  </ol>

  <h5>For other teachers (try to memorize this one as well)</h5>
  <ol>
    <li>Are you teaching full time?</li>
    <li>Where did you learn your english? (how to speak english)</li>
    <li>how long did you live in ~</li>
    <li>How long has it been since you came back to korea?</li>
    <li>what brings you back to korea?</li>
    <li>Are you staying for good? or are you just visiting for a while?</li>
    <li>Where do you prefer living?</li>
    <li>What do you miss about your home country?</li>
    <li>Have you traveled in other countries as well?</li>
    <li>Did you get to travel a lot in korea?</li>
    <li>What's the best part about living in Germany?</li>
    <li>How is korea treating you?</li>
    <li>What was your job back in California?</li>
    <li>Are there any places you recommend to visit back in France?</li>
    <li>How many languages do you speak?</li>
    <li>How is korea compared to Europe?</li>
    <li>How's the food treating you?</li>
  </ol>

  <h4>Drinking (ask at least 2)</h4>
  <ul>
    <li>All answers must incorporate storytelling & advanced grammar</li>
  </ul>
  <ol>
    <li>When is the last time that you drank?</li>
    <li>Do you drink often?</li>
    <li>Tell me about a embarrassing drinking experience (must explain situation well / express why it was embarrassing)</li>
    <li>Recommend a pub and explain why you like it
      <ol>
        <li>what can I order there? What do they serve?</li>
      </ol>
    </li>
    <li>Ask me 5 drinking questions & have a small conversation with me regarding the topic
      <ol>
        <li>The questions cannot all be too easy and must connect like a conversation</li>
      </ol>
    </li>
  </ol>

  <h4>Dating (ask at least 2)</h4>
  <ul>
    <li>All answers must incorporate storytelling & advanced grammar</li>
  </ul>
  <ol>
    <li>Tell me about your most recent dating experience</li>
    <li>Why didn't it work out? / How is the relationship going?</li>
    <li>What are your thoughts about marriage and kids?</li>
    <li>What is your ideal type? Does that person match your ideal type?</li>
    <li>Do you have a crush on someone right now? what kind of person are they?</li>
    <li>Tell me about your ex (if it's okay to ask)</li>
    <li>Ask me 5 dating questions & have a small conversation with me regarding the topic
      <ol>
        <li>The questions cannot all be too easy and must connect like a conversation</li>
      </ol>
    </li>
  </ol>

  <h4>Being sick (ask at least 2)</h4>
  <ul>
    <li>All answers must incorporate storytelling & advanced grammar</li>
  </ul>
  <ol>
    <li>Tell me about the last time you were sick. How were you sick and how painful was it? How did you recover?</li>
    <li>Tell me about the last time you hurt yourself physically. What happened and how painful was it? How did you deal with it?</li>
    <li>Are you stressed nowadays? What are you stressed about? How are you dealing with it?</li>
    <li>When is the last time that you went to the hospital?</li>
    <li>Ask me 5 questions about being sick or hurt and have a small conversation with me regarding the topic
      <ol>
        <li>The questions cannot all be too easy and must connect like a conversation</li>
      </ol>
    </li>
  </ol>

  <h3>Timer: 40 minute mark</h3>
`;

  const businessTemplate1 = `
    <h2>📚 The First Business Class</h2>

    <ol>
      <li><strong>Notion Goals</strong> (5 minutes)</li>
      <li><strong>Casual Self Intro Writing</strong> (15 minutes)</li>
      <li><strong>Write Business Diary</strong> (15 minutes)<br/>Example:<br/>
        - 지금 연구하고 있는 제품에 대한 셈플 생산을 위해서 12시간 근무를 했다 → Yesterday, I had a 12-hour shift making samples for our new vitamin B5 supplement.<br/>
        - 다양한 설비를 조작하며 셈플이 나오게 실험들을 했다 → So I conducted various experiments to get a secure sample.
      </li>
      <li><strong>Small Talk</strong> (15 minutes)</li>
      <li><strong>App Setup</strong> (10 minutes)
        <ul>
          <li>Download Quizlet App</li>
          <li>Download Google Docs App</li>
          <li>Send Kakao Channel link</li>
        </ul>
      </li>
    </ol>
  `;

  const businessTemplate2 = `
    <h2>📚 The Second Business Class</h2>

    <ol>
      <li><strong>Student Driven Small Talk</strong> (15 minutes)</li>
      <li><strong>Previous Quizlet Review</strong> (15 minutes)</li>
      <li><strong>Diary Review</strong> (15 minutes)</li>
      <li><strong>Business Curriculum</strong> (15 minutes)<br/>- Business self intro<br/>- In-depth work conversations</li>
    </ol>

  `;
  const businessTemplate3 = `
   <h2>📚 Business Template 3</h2>

   <p><strong>Use examples to explain but keep the answers under 15 sentences to be able to memorize</strong><br/>
   <strong>Choose the topics based on the student. You may change them a bit if you want</strong></p>

   <ol>
     <li>Tell me about the company that you work at in detail</li>
     <li>Tell me about your specific role at your company in detail</li>
     <li>Tell me about typical day at work in detail in chronological order</li>
     <li>Tell me about your team and department in detail. What is your team in charge of?</li>
     <li>Are you satisfied with your job? Why are you or aren't you satisfied with your job?</li>
     <li>What was your previous job? Why did you change jobs?</li>
     <li>What is your plan in the next 10 years?</li>
     <li>When do you usually get stressed? How do you handle stress?</li>
     <li>What motivates you to work harder or be better?</li>
     <li>What are your strengths and weaknesses? Give examples.</li>
     <li>Are there any coworkers you dislike? Spill the tea on some office gossip.</li>
     <li>How would your colleagues describe you?</li>
     <li>Are there any coworkers you like? why do you admire them?</li>
     <li>What was the biggest challenge you've faced at work, and how did you overcome it?</li>
     <li>What skills have you developed the most through your job, and how?</li>
     <li>Have you ever made a mistake at work? What happened and how did you handle it?</li>
     <li>What's your work-life balance like? Do you think it's healthy? Why or why not?</li>
     <li>How do you stay productive or focused during long or difficult workdays?</li>
     <li>Tell me about some unique culture in your company.</li>
     <li>If you could change one thing about your current job, what would it be and why?</li>
   </ol>
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
      notesTemplate9,
    ],
    intermediate: [
      intermediateTemplate1,
      intermediateTemplate2,
      intermediateTemplate3,
      intermediateTemplate4,
      intermediateTemplate5,
      intermediateTemplate9,
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
  const [activeOption, setActiveOption] = useState<"option1" | "option2">(
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
                                  "Actual Level Test",
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
                                  "Actual Level Test",
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
                    <th className="p-4 font-bold text-[#191F28]">English</th>
                    <th className="p-4 font-bold text-[#191F28]">Korean</th>
                  </tr>
                </thead>
                <tbody>
                  {quizletLines.map((line, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#F2F4F6] hover:bg-[#F8F9FA]"
                    >
                      <td className="p-4">
                        <textarea
                          value={line.eng}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].eng = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-3 border border-[#F2F4F6] rounded-xl bg-white text-black text-sm resize-none focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 transition-all"
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
                          className="w-full p-3 border border-[#F2F4F6] rounded-xl bg-white text-black text-sm resize-none focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 transition-all"
                        />
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
                        student_name,
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
