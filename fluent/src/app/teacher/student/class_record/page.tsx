"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const notesTemplate1 = `📚 Notes Template

    ✅ Tasks  
    - Add Polishing Expressions (70%)  
    - Add New Expressions (30%)  
    - Use Textbook Grammar & Expressions throughout  

    📖 The First Class

    1. Go Over Notion Goals  
    🕐 Duration: 5 minutes

    2. Self Introduction  
    🕐 Duration: 15 minutes  
    📝 Task: Add to Flashcards  
    Include:  
    - Name  
    - Age  
    - Job  
    - Job Details  
    - Hobbies  
    (4–7 sentences is enough)

    3. Small Talk  
    🕐 Duration: 15 minutes  
    📌 If the student is below level 3 → Do Textbook for 30 minutes instead

    4. Textbook Work  
    🕐 Duration: 15 minutes  
    📘 Pace: Finish Chapter 1 in about 4–8 classes (for Level 1–2 students)

    5. App Downloads & Setup  
    🕐 Duration: 10 minutes  
    📲 Download:  
    - Quizlet App  
    - Google Docs App  
    📤 Share this file via email  
    📎 Send Kakao Channel link

    📌 Homework  
    - Study Flashcards  
    - Message teacher if flashcards cannot be found

    🔜 Next Class  
    Focus on:  
    - 일반동사 + be 동사  
    - Practice Questions & Answers
    
    
    `;

  const notesTemplate2 = `📚 The Second Class

    1. Small Talk (5 ~ 15 minutes) — depending on level  
    - What did you do yesterday?  
    - How are you?  
    - When did you wake up? What did you do after that?

    2. Previous Flashcards Review (15 minutes)  
    - Make sure to check if they memorized their self introduction

    3. Write Diary Together (15 minutes)  
    - Refer to the diary examples in Chapter 1

    4. Textbook (15 minutes)  
    - Add textbook expressions that they are slow with or get wrong into their Quizlet

    📌 Homework  
    - Flashcards + Write a similar diary after studying flashcards

    🔜 Next Class  
    - Will go deeper into 일반동사 + be 동사 questions & answers
    
    
    `;

  const notesTemplate3 = `📚 The Third Class

    1. Small Talk (5 ~ 15 minutes) — depending on level  
    - What did you do yesterday?  
    - How are you?  
    - When did you wake up? What did you do after that?

    2. Previous Flashcards Review (15 minutes)  
    - Negotiate flashcard amount (30 ~ 60)

    3. Talk About Diary (15 minutes)  
    - Refer to the diary conversation examples in Chapter 1

    4. Textbook (15 minutes)  
    - If they took a test for homework, please add the expressions they got wrong to the flashcards  
    - Even if they got it right, if they can’t say it within 5 seconds it should be added as a polishing flashcard

    📌 Homework  
    - Flashcards  
    - Diary (including new grammar learned)  
    - If you reached a test, solve 1 test and grade at home

    🔜 Next Class  
    - Will go deeper into 일반동사 + be 동사 questions & answers  
    - Possibly introduce dates & harder diaries
    
    
    
    `;

  const handleText1 = async () => {
    setOriginal_text(notesTemplate1); // Assuming the API returns { numbered_text: "..." }
  };

  const handleText2 = async () => {
    setOriginal_text(notesTemplate2); // Assuming the API returns { numbered_text: "..." }
  };

  const handleText3 = async () => {
    setOriginal_text(notesTemplate3); // Assuming the API returns { numbered_text: "..." }
  };

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
            {/* Numbering 버튼 */}
            <button
              onClick={handleText1}
              className="flex items-center gap-2 px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-medium hover:bg-[#1B64DA] active:bg-[#0051CC] transition-colors shadow-sm"
              disabled={loading}
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
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              커리큘럼 1
            </button>

            <button
              onClick={handleText2}
              className="flex items-center gap-2 px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-medium hover:bg-[#1B64DA] active:bg-[#0051CC] transition-colors shadow-sm"
              disabled={loading}
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
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              커리큘럼 2
            </button>

            <button
              onClick={handleText3}
              className="flex items-center gap-2 px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-medium hover:bg-[#1B64DA] active:bg-[#0051CC] transition-colors shadow-sm"
              disabled={loading}
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
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              커리큘럼 3
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
        {/* 메인 텍스트 영역 - 화면에 꽉 채움 */}
        <div className="min-h-[95vh] flex-grow flex flex-col relative">
          <textarea
            id="original_text"
            value={original_text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setOriginal_text(e.target.value)
            }
            className="flex-grow w-full p-10 text-xl font-bold focus:outline-none bg-white text-[#333D4B] resize-none"
            placeholder="Curriculumn 1, 2, 3 버튼을 클릭해서 템플릿을 불러오세요."
            disabled={loading}
          ></textarea>

          {/* 텍스트 영역 꾸미기 - 상단 원 */}
          <div className="absolute top-3 right-3">
            <div className="flex space-x-1">
              <div className="w-4 h-4 rounded-full bg-[#FF5F57]"></div>
              <div className="w-4 h-4 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-4 h-4 rounded-full bg-[#28C840]"></div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 - Sticky 적용 */}
        <div className="w-full bg-white border-t border-[#E5E8EB] py-4 px-5 sticky bottom-0 z-10 flex gap-3">
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
            className="flex-1 py-3 rounded-xl text-[#4E5968] text-sm font-medium border border-[#E5E8EB] hover:bg-[#F9FAFB] transition-colors"
            disabled={loading}
          >
            취소하기
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 rounded-xl text-white text-sm font-medium
              ${
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
