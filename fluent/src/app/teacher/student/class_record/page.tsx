"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

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

  const postCurriculum = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!homework.trim()) {
      alert("Homework field is required.");
      return;
    }
    
    setLoading(true);

    try {
      // 데이터 유효성 검사
      if (!class_date) {
        throw new Error("수업 날짜를 입력해주세요.");
      }

      if (!original_text || original_text.trim().length === 0) {
        throw new Error("수업 내용을 입력해주세요.");
      }

      const payload = {
        student_name: student_name || "",
        class_date,
        date,
        original_text,
        homework,
        nextClass: nextClass || "",
      };

      const response = await fetch(`/api/quizlet/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      console.log("Response:", response);

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          try {
            // 안전한 리다이렉션 처리
            const redirectUrl = `/teacher/home?user=${encodeURIComponent(
              user
            )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
              user_id
            )}`;
            router.push(redirectUrl);
          } catch (error) {
            console.error("리다이렉션 오류:", error);
            // 오류 발생 시 기본 경로로 이동
            router.push("/teacher/home");
          }
        }, 1500);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "저장에 실패했습니다." }));
        throw new Error(errorData.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("커리큘럼 저장 오류:", error);
      alert(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
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

  <h3>🔜 Next Class</h3>
  <p>Continue practicing 일반동사 + be 동사 Q&A</p>
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



  const [activeTab, setActiveTab] = useState("beginner");

  type TabKey = "beginner" | "intermediate" | "business";

  const templates: Record<TabKey, string[]> = {
    beginner: [
      notesTemplate1,
      notesTemplate2,
      notesTemplate3,
    ],
    intermediate: [
      intermediateTemplate1, intermediateTemplate2, intermediateTemplate3
    ],
    business: [
      businessTemplate1, businessTemplate2 
    ],
  };

  const [homework, setHomework] = useState("");
  const [nextClass, setNextClass] = useState("");
  const [activeOption, setActiveOption] = useState<"option1" | "option2">("option1");




  const editor = useEditor({
    extensions: [StarterKit, Highlight, Underline],
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


  // 클라이언트 측 렌더링이 아직 완료되지 않았을 경우 간단한 로딩 표시
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F9FAFB]">
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-28 h-28 bg-white rounded-3xl shadow-lg flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-96 bg-white rounded-3xl shadow-lg flex flex-col items-center justify-center p-8 animate-scale-in">
            <div className="w-14 h-14 bg-[#20D16B] rounded-full flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#191F28] mb-2">저장 완료</h2>
            <p className="text-[#4E5968] text-center">
              커리큘럼이 성공적으로 저장되었습니다.
              <br />
              교사 홈 페이지로 이동합니다.
            </p>
          </div>
        </div>
      )}

      {/* 헤더 - Sticky 적용 */}
      <header className="bg-white border-b border-[#F2F4F6] py-4 sticky top-0 z-10">
        <div className="max-w-full-xl px-5 flex items-center justify-between mx-10">
          <div className="flex items-center space-x-3">
            <h1 className="p-4 text-3xl font-bold text-[#191F28]">
              Class Note
            </h1>
            {student_name && (
              <div className="px-5 py-1.5 bg-[#F2F4F8] rounded-full">
                <span className="text-xl font-bold text-[#1f5eff]">
                  {student_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">

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
                className="px-3 py-2 bg-white text-sm border border-[#E5E8EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182F6]/30 focus:border-[#3182F6] transition-colors text-[#333D4B] w-40"
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
                className="p-2 rounded-lg text-[#3182F6] hover:bg-[#F2F4F8] transition-colors"
                aria-label="작성 가이드"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E8EB] rounded-xl shadow-lg p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                <div className="flex items-center space-x-2 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3182F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <h3 className="text-sm font-bold text-[#3182F6]">
                    Curriculumn 1, 2, 3버튼을 클릭해서 템플릿을 불러오세요.
                  </h3>
                </div>
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
              className="p-2 rounded-lg hover:bg-[#F2F4F8] transition-colors"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
        onSubmit={postCurriculum}
        className="flex-grow flex flex-col overflow-hidden"
      >
        {/* 메인 텍스트 영역 - 화면에 꽉 채움 & 내부 스크롤 */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          <div className="p-6 flex flex-col h-full">

            {/* Toolbar */}
            <div className="flex gap-2 mb-4 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('bold') ? 'bg-black text-white' : ''}`}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('italic') ? 'bg-black text-white' : ''}`}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('underline') ? 'bg-black text-white' : ''}`}
              >
                Underline
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-black text-white' : ''}`}
              >
                H1
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-black text-white' : ''}`}
              >
                H2
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-black text-white' : ''}`}
              >
                H3
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('bulletList') ? 'bg-black text-white' : ''}`}
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={`px-3 py-1 border rounded ${editor?.isActive('paragraph') ? 'bg-black text-white' : ''}`}
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHighlight().run()}
                className={`px-3 py-1 border-2 bg-[#d0f8dc] rounded ${editor?.isActive('highlight') ? 'bg-green-50 text-black' : ''}`}
              >
                Quizlet Highlighter
              </button>
            </div>

            <div className="flex-grow flex gap-4 overflow-hidden">
              {/* Left: Editor - 2/3 width */}
              <div className="flex-[2] overflow-y-auto border rounded p-4 bg-white">
                <EditorContent editor={editor} className="prose max-w-none min-h-[300px] custom-editor" />
              </div>

              {/* Right: Templates + Homework - 1/3 width */}
              <div className="flex-[1] flex flex-col gap-6">
                <div className="flex justify-end">
                  <div className="w-full flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveOption("option1")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeOption === "option1"
                          ? "bg-[#d0f8dc] text-black"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Option 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option2")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeOption === "option2"
                          ? "bg-[#d0f8dc] text-black"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Search Previous Class Notes
                    </button>
                  </div>
                </div>


                {/* Conditional content inside the same right panel */}
                {activeOption === "option1" && (
                  <>
                    {/* Template Tabs */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-2">💡 Select a Template</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(templates) as TabKey[]).map((key) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors duration-200 border 
                              ${activeTab === key
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                          >
                            {key} Class
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Buttons */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Choose a Template</h4>
                      <div className="flex flex-wrap gap-3">
                        {templates[activeTab as TabKey].map((text, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setOriginal_text(text)}
                            disabled={loading}
                            className="px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-medium hover:bg-[#1B64DA] active:bg-[#0051CC] transition-colors shadow-sm disabled:opacity-50"
                          >
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Homework Input */}
                    <div className="mt-6 flex flex-col gap-2">
                      <label htmlFor="homework" className="text-lg font-bold text-gray-700">
                        📌 Homework<span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="homework"
                        value={homework}
                        onChange={(e) => setHomework(e.target.value)}
                        className="border bg-white rounded px-3 py-2 text-md resize-none min-h-[190px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                        required
                      />
                    </div>

                    {/* Next Class Input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="nextClass" className="text-lg font-bold text-gray-700">
                        🔜 Next Class<span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="nextClass"
                        value={nextClass}
                        onChange={(e) => setNextClass(e.target.value)}
                        className="border bg-white rounded px-3 py-2 text-md resize-none min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                        required
                      />
                    </div>
                  </>
                )}

                {activeOption === "option2" && (
                  <div className="p-4 border border-dashed rounded bg-white text-gray-600 text-sm italic">
                    Searching Class Notes...
                  </div>
                )}
            </div>
          </div>

        </div>

        {/* 상단 원 버튼 */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex space-x-1">
            <div className="w-4 h-4 rounded-full bg-[#FF5F57]"></div>
              <div className="w-4 h-4 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-4 h-4 rounded-full bg-[#28C840]"></div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 - Sticky */}
        <div className="w-full bg-white border-t border-[#E5E8EB] py-4 px-5 sticky bottom-0 z-10 flex gap-3">
          <button
            type="button"
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(user_id)}`;
              router.push(redirectUrl);
            }}
            className="flex-1 py-3 rounded-xl text-[#4E5968] text-sm font-medium border border-[#E5E8EB] hover:bg-[#F9FAFB] transition-colors"
            disabled={loading}
          >
            취소하기
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 rounded-xl text-white text-sm font-medium ${
              loading
                ? "bg-[#DEE2E6] cursor-not-allowed"
                : "bg-[#3182F6] hover:bg-[#1B64DA] active:bg-[#0051CC] transition-colors"
            }`}
            disabled={loading}
          >
            저장하기
          </button>
        </div>
      </form>


      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

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
          color: #b0b8c1;
          font-size: 2.5rem;
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

        
      `}</style>
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
