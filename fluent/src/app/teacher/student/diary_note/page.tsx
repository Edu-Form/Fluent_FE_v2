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
const DiaryPageContent: React.FC = () => {
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

  const postQuizlet = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      // 데이터 유효성 검사
      if (!class_date) {
        throw new Error("수업 날짜를 입력해주세요.");
      }

      if (!original_text || original_text.trim().length === 0) {
        throw new Error("퀴즐렛 내용을 입력해주세요.");
      }

      const payload = {
        student_name: student_name || "",
        class_date,
        date,
        original_text,
      };

      const response = await fetch(`/api/diary/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      console.log(payload);

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
      console.error("퀴즐렛 저장 오류:", error);
      alert(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
              다이어리가 성공적으로 저장되었습니다.
              <br />
              교사 홈 페이지로 이동합니다.
            </p>
          </div>
        </div>
      )}

      {/* 헤더 - Sticky 적용 */}
      <header className="bg-white border-b border-[#F2F4F6] py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="p-4 text-2xl font-bold text-[#191F28]">Diary</h1>
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
                    작성 가이드
                  </h3>
                </div>
                <ul className="text-xs text-[#4E5968] space-y-2">
                  <li className="flex items-start">
                    <span className="text-[#f63131] mr-2 text-sm leading-5">
                      •
                    </span>
                    <span className="font-medium">
                      번호를 꼭 적어주세요 1. 2. 3. 으로!!
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#3182F6] mr-2 text-sm leading-5">
                      •
                    </span>
                    <span>수업 중 배운 중요한 내용을 요약해 주세요.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#3182F6] mr-2 text-sm leading-5">
                      •
                    </span>
                    <span>
                      학생이 어려워하는 부분을 중점적으로 기록해 주세요.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#3182F6] mr-2 text-sm leading-5">
                      •
                    </span>
                    <span>다음 수업에서 복습할 내용을 포함해 주세요.</span>
                  </li>
                </ul>
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
        onSubmit={postQuizlet}
        className="flex-grow flex flex-col overflow-hidden"
      >
        {/* 메인 텍스트 영역 - 화면에 꽉 채움 */}
        <div className="flex-grow flex flex-col relative">
          <textarea
            id="original_text"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setOriginal_text(e.target.value)
            }
            className="flex-grow w-full p-10 text-5xl font-bold focus:outline-none bg-white text-[#333D4B] resize-none"
            placeholder="일기를 작성해주세요"
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

// 서버 렌더링에 안전한 로딩 폴백
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
    <div className="bg-white rounded-3xl shadow-lg p-6 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-3 text-[#4E5968]">로딩 중...</p>
    </div>
  </div>
);

// 메인 내보내기
export default function QuizletPage(): ReactNode {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiaryPageContent />
    </Suspense>
  );
}
