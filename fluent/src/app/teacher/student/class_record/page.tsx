"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
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

          // If current node is heading, keep the same type
          if (node.type.name.startsWith("heading")) {
            const level = node.attrs.level;

            splitBlock(state, dispatch);
            // Set same heading type for new node
            editor.commands.setNode("heading", { level });
            return true;
          }

          return false; // fallback to default behavior
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
  const latestHomework =
    searchedNotes[searchedNotes.length - 1]?.homework || "";
  const latestNextClass =
    searchedNotes[searchedNotes.length - 1]?.nextClass || "";
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
      setOriginal_text(editor.getHTML());
    },
  });

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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#FAFBFC]">
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center border">
            <div className="w-8 h-8 border-3 border-[#0064FF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
          <div className="w-80 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 animate-scale-in border">
            <div className="w-12 h-12 bg-[#0064FF] rounded-full flex items-center justify-center mb-4">
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
            <h2 className="text-lg font-semibold text-[#191F28] mb-2">
              저장 완료
            </h2>
            <p className="text-[#6B7684] text-center text-sm">
              커리큘럼이 성공적으로 저장되었습니다.
              <br />
              교사 홈 페이지로 이동합니다.
            </p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] py-4 sticky top-0 z-10">
        <div className="max-w-full-xl px-6 flex items-center justify-between mx-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-[#191F28]">
              Class Note
            </h1>
            {(group_student_names?.length > 0 || student_name) && (
              <div className="px-4 py-1.5 bg-[#F2F4F6] rounded-full">
                <span className="text-sm font-medium text-[#0064FF]">
                  {group_student_names?.length > 0
                    ? group_student_names.join(", ")
                    : student_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0064FF] text-white rounded-lg hover:bg-[#0056E0] transition-colors text-sm font-medium"
            >
              Group Class
            </button>

            {/* 날짜 선택기 */}
            <div className="relative">
              <input
                type="date"
                name="class_date"
                id="class_date"
                defaultValue={formatToISO(next_class_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setClassDate(formatToSave(e.target.value))
                }
                className="px-3 py-2 bg-white text-sm border border-[#E5E8EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0064FF]/20 focus:border-[#0064FF] transition-colors text-[#333D4B] w-36"
                required
                disabled={loading}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
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

            {/* 작성 가이드 툴팁 버튼 */}
            <div className="relative group">
              <button
                type="button"
                className="p-2 rounded-lg text-[#6B7684] hover:bg-[#F2F4F6] transition-colors"
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

              {/* 툴팁 내용 */}
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E8EB] rounded-lg shadow-lg p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                <p className="text-sm text-[#6B7684]">
                  Curriculumn 1, 2, 3버튼을 클릭해서 템플릿을 불러오세요.
                </p>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                  user
                )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                  user_id
                )}`;
                router.push(redirectUrl);
              }}
              className="p-2 rounded-lg hover:bg-[#F2F4F6] transition-colors"
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
                className="text-[#8B95A1]"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSaveClick}
        className="flex-grow flex flex-col overflow-hidden"
      >
        {/* 메인 텍스트 영역 */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          <div className="p-6 flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex gap-2 mb-4 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("bold")
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("italic")
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("underline")
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                Underline
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("heading", { level: 1 })
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("heading", { level: 2 })
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("heading", { level: 3 })
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("bulletList")
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => {
                  const selection = editor?.state.selection;
                  if (!selection || !editor) return;

                  const { from, to } = selection;
                  const selectedText = editor.state.doc.textBetween(
                    from,
                    to,
                    "\n"
                  );
                  const lines = selectedText.split("\n");
                  const numberedLines = lines
                    .map((line, idx) => `${idx + 1}. ${line}`)
                    .join("\n");

                  editor
                    .chain()
                    .focus()
                    .insertContentAt({ from, to }, numberedLines)
                    .run();
                }}
                className="px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
              >
                Numbering
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("paragraph")
                    ? "bg-[#0064FF] text-white border-[#0064FF]"
                    : "bg-white text-[#6B7684] border-[#E5E8EB] hover:border-[#0064FF] hover:text-[#0064FF]"
                }`}
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHighlight().run()}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  editor?.isActive("highlight")
                    ? "bg-[#FFE066] text-black border-[#FFE066]"
                    : "bg-[#FFE066] text-black border-[#FFE066] hover:bg-[#FFCC02]"
                }`}
              >
                Highlight
              </button>
            </div>

            <div className="flex-grow flex gap-6 overflow-hidden">
              {/* Left: Editor - 2/3 width */}
              <div className="flex-[2] overflow-y-auto border border-[#E5E8EB] rounded-lg p-4 bg-white">
                <EditorContent
                  editor={editor}
                  className="prose max-w-none min-h-[300px] custom-editor"
                />
              </div>

              {/* Right: Templates + Homework - 1/3 width */}
              <div className="flex-[1] flex flex-col gap-4">
                <div className="flex justify-end">
                  <div className="w-full flex border border-[#E5E8EB] rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setActiveOption("option1")}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        activeOption === "option1"
                          ? "bg-[#0064FF] text-white"
                          : "bg-white text-[#6B7684] hover:bg-[#F2F4F6]"
                      }`}
                    >
                      Templates
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option2")}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        activeOption === "option2"
                          ? "bg-[#0064FF] text-white"
                          : "bg-white text-[#6B7684] hover:bg-[#F2F4F6]"
                      }`}
                    >
                      Previous Notes
                    </button>
                  </div>
                </div>

                {/* Conditional content inside the same right panel */}
                {activeOption === "option1" && (
                  <>
                    {/* Template Tabs */}
                    <div className="p-4 bg-white border border-[#E5E8EB] rounded-lg">
                      <h3 className="text-sm font-semibold text-[#191F28] mb-3">
                        Select Template
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(templates) as TabKey[]).map((key) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                              activeTab === key
                                ? "bg-[#0064FF] text-white"
                                : "bg-[#F2F4F6] text-[#6B7684] hover:bg-[#E5E8EB]"
                            }`}
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Buttons */}
                    <div className="p-4 bg-white border border-[#E5E8EB] rounded-lg">
                      <h4 className="text-sm font-semibold text-[#191F28] mb-3">
                        Choose Template
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {templates[activeTab as TabKey].map((text, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setOriginal_text(text)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-[#0064FF] text-white rounded-lg text-sm font-medium hover:bg-[#0056E0] transition-colors disabled:opacity-50"
                          >
                            {activeTab.charAt(0).toUpperCase() +
                              activeTab.slice(1)}{" "}
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Homework Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Homework Input */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="homework"
                          className="text-sm font-semibold text-[#191F28]"
                        >
                          Homework <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="homework"
                          value={homework}
                          onChange={(e) => setHomework(e.target.value)}
                          className="border border-[#E5E8EB] bg-white rounded-lg px-3 py-2 text-sm resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#0064FF]/20 focus:border-[#0064FF] transition-colors"
                          required
                        />
                      </div>

                      {/* Right: Previous Homework */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#191F28]">
                          Last Homework
                        </label>
                        <div className="bg-[#F8F9FA] text-sm text-[#6B7684] border border-[#E5E8EB] rounded-lg p-3 min-h-[120px] whitespace-pre-wrap">
                          {latestHomework
                            ? latestHomework
                            : "No previous homework found."}
                        </div>
                      </div>
                    </div>

                    {/* Next Class Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Next Class Input */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="nextClass"
                          className="text-sm font-semibold text-[#191F28]"
                        >
                          Next Class <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="nextClass"
                          value={nextClass}
                          onChange={(e) => setNextClass(e.target.value)}
                          className="border border-[#E5E8EB] bg-white rounded-lg px-3 py-2 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#0064FF]/20 focus:border-[#0064FF] transition-colors"
                          required
                        />
                      </div>

                      {/* Right: Last Next Class */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#191F28]">
                          For Today Class
                        </label>
                        <div className="bg-[#F8F9FA] text-sm text-[#6B7684] border border-[#E5E8EB] rounded-lg p-3 min-h-[100px] whitespace-pre-wrap">
                          {latestNextClass
                            ? latestNextClass
                            : "No previous next class found."}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeOption === "option2" && (
                  <div className="flex flex-col gap-4 p-4 bg-white border border-[#E5E8EB] rounded-lg">
                    {searchLoading && (
                      <div className="text-[#6B7684] text-sm flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin"></div>
                        Loading notes...
                      </div>
                    )}

                    {searchError && (
                      <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                        {searchError}
                      </div>
                    )}

                    {searchedNotes.length > 0 && (
                      <div className="max-h-[500px] overflow-y-auto space-y-3">
                        {[...searchedNotes].reverse().map((note) => (
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
                                          background-color: #fafbfc;
                                          padding: 2rem;
                                        }
                            
                                        .container {
                                          max-width: 800px;
                                          margin: 0 auto;
                                          background-color: white;
                                          border: 1px solid #e5e8eb;
                                          border-radius: 12px;
                                          padding: 2rem;
                                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                                        }
                            
                                        h2 {
                                          font-size: 1.5rem;
                                          margin-bottom: 1rem;
                                          color: #191f28;
                                          font-weight: 600;
                                        }
                            
                                        h3 {
                                          font-size: 1.25rem;
                                          margin-top: 2rem;
                                          margin-bottom: 0.75rem;
                                          color: #191f28;
                                          font-weight: 600;
                                        }
                            
                                        p, li {
                                          font-size: 1rem;
                                          line-height: 1.6;
                                          color: #6b7684;
                                        }
                            
                                        ul, ol {
                                          padding-left: 1.5rem;
                                          margin-bottom: 1rem;
                                        }
                            
                                        hr {
                                          margin: 2rem 0;
                                          border-color: #e5e8eb;
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
                            className="cursor-pointer border border-[#E5E8EB] bg-white p-4 rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <p className="text-sm text-[#0064FF] mb-2 font-medium">
                              {note.date}
                            </p>
                            <div
                              className="prose max-w-none text-sm text-[#6B7684]"
                              dangerouslySetInnerHTML={{
                                __html:
                                  note.original_text.slice(0, 200) + "...",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="w-full bg-white border-t border-[#E5E8EB] py-4 px-6 sticky bottom-0 z-10 flex gap-3">
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
            className="flex-1 py-3 rounded-lg text-[#6B7684] text-sm font-medium border border-[#E5E8EB] hover:bg-[#F8F9FA] transition-colors"
            disabled={loading}
          >
            취소하기
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 rounded-lg text-white text-sm font-medium transition-colors ${
              loading
                ? "bg-[#DEE2E6] cursor-not-allowed"
                : "bg-[#0064FF] hover:bg-[#0056E0]"
            }`}
          >
            저장하기
          </button>
        </div>
      </form>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90%] max-w-md p-6 shadow-lg space-y-4 border">
            <h2 className="text-lg font-semibold text-[#191F28]">
              Select Group Students
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {studentList.map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-3 text-sm p-2 rounded hover:bg-[#F8F9FA] transition-colors cursor-pointer"
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
                    className="w-4 h-4 rounded border-2 border-[#E5E8EB] text-[#0064FF] focus:ring-[#0064FF]/20"
                  />
                  <span className="font-medium text-[#191F28]">{name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-[#6B7684] border border-[#E5E8EB] rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm bg-[#0064FF] text-white rounded-lg hover:bg-[#0056E0] transition-colors"
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

        /* 데이터 픽커 스타일 오버라이드 */
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

        /* 스크롤바 스타일링 */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f8f9fa;
        }

        ::-webkit-scrollbar-thumb {
          background: #e5e8eb;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>

      {translating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="w-80 bg-white rounded-lg shadow-lg p-6 flex flex-col items-center border">
            <div className="w-8 h-8 border-3 border-[#0064FF] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-[#191F28]">
              Translating Quizlets...
            </p>
            <p className="text-sm text-[#6B7684] mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {translationModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90%] max-w-4xl p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto border">
            <h2 className="text-xl font-semibold text-[#191F28]">
              Review Translations
            </h2>
            <p className="text-sm text-[#6B7684] mb-4 p-3 bg-[#F8F9FA] rounded-lg border border-[#E5E8EB]">
              Please revise any awkward translations before saving.
            </p>
            <div className="overflow-hidden rounded-lg border border-[#E5E8EB]">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="text-left bg-[#F8F9FA] border-b border-[#E5E8EB]">
                    <th className="p-3 font-semibold text-[#191F28]">
                      English
                    </th>
                    <th className="p-3 font-semibold text-[#191F28]">Korean</th>
                  </tr>
                </thead>
                <tbody>
                  {quizletLines.map((line, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#E5E8EB] hover:bg-[#F8F9FA]"
                    >
                      <td className="p-3">
                        <textarea
                          value={line.eng}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].eng = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-2 border border-[#E5E8EB] rounded-lg bg-white text-black text-sm resize-none focus:border-[#0064FF] focus:ring-2 focus:ring-[#0064FF]/20 transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <textarea
                          value={line.kor}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].kor = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-2 border border-[#E5E8EB] rounded-lg bg-white text-black text-sm resize-none focus:border-[#0064FF] focus:ring-2 focus:ring-[#0064FF]/20 transition-colors"
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
                className="px-4 py-2 text-sm text-[#6B7684] border border-[#E5E8EB] rounded-lg hover:bg-[#F8F9FA] transition-colors"
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
                className="px-4 py-2 text-sm bg-[#0064FF] text-white rounded-lg hover:bg-[#0056E0] transition-colors flex items-center gap-2"
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
