"use client";

// TypeScript로 변환한 코드

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation";

// 사파리 호환 날짜 변환 함수
const parseToSafariDate = (dateString: string): Date | null => {
  try {
    if (!dateString) return null;

    let isoString = "";

    // "2024. 12. 25." 형식 처리
    if (dateString.includes(". ")) {
      const parts = dateString.trim().replace(/\.$/, "").split(". ");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    // "2024-12-25" 형식이 이미 있는 경우
    else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      isoString = dateString;
    }
    // "2024/12/25" 형식 처리
    else if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    // 기타 형식 시도
    else {
      console.warn("지원하지 않는 날짜 형식:", dateString);
      return null;
    }
    if (!isoString) return null;

    // 사파리 호환 Date 생성 (시간대 문제 방지)
    const dateObj = new Date(isoString + "T00:00:00");

    return !isNaN(dateObj.getTime()) ? dateObj : null;
  } catch (error) {
    console.error("날짜 파싱 오류:", dateString, error);
    return null;
  }
};

// QuizletCardProps 인터페이스 정의
interface QuizletCardProps {
  _id: string;
  date: string;
  student_name: string;
  eng_quizlet: string[];
  kor_quizlet: string[];
  original_text: string;
  cards: any[];
}

// 동적 컴포넌트 로딩
const QuizletCard = dynamic(() => import("@/components/Quizlet/QuizletCard"), {
  ssr: false,
});

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Fluent" }: LoadingScreenProps) => (
  <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
    <div>{message}</div>
    <div className="mt-4 w-32 h-32"></div>
  </div>
);

const QuizletPageContent = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [data, setData] = useState<QuizletCardProps[]>([]);
  const [currentCard, setCurrentCard] = useState<QuizletCardProps>({
    _id: "",
    date: "",
    student_name: "",
    eng_quizlet: [],
    kor_quizlet: [],
    original_text: "",
    cards: [],
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [, setLoading] = useState<boolean>(true);

  // 범용 뷰포트 높이 계산 (모든 브라우저 지원)
  const [, setDynamicHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      // 다양한 뷰포트 높이 측정 방법
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const screenHeight = window.screen.height;

      // 가장 적절한 높이 선택 (브라우저별 대응)
      let targetHeight = windowHeight;

      // iOS Safari 대응
      if (
        window.navigator.userAgent.includes("Safari") &&
        !window.navigator.userAgent.includes("Chrome")
      ) {
        targetHeight = Math.min(windowHeight, screenHeight);
      }

      // Android Chrome/Samsung Internet 대응
      if (window.navigator.userAgent.includes("Android")) {
        // 주소창이 숨겨졌을 때와 표시될 때의 높이 차이 고려
        targetHeight = Math.max(windowHeight, documentHeight);
      }

      setDynamicHeight(targetHeight);

      // CSS 변수 설정 (여러 단위 조합)
      const vh = targetHeight * 0.01;
      document.documentElement.style.setProperty(
        "--app-height",
        `${targetHeight}px`
      );
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      document.documentElement.style.setProperty(
        "--safe-height",
        `${targetHeight - 80}px`
      ); // 네비게이션 바 높이 제외
    };

    // 초기 설정
    updateHeight();

    // 모든 가능한 이벤트에 대응
    const events = [
      "resize",
      "orientationchange",
      "scroll",
      "touchstart",
      "touchend",
      "load",
    ];

    events.forEach((event) => {
      window.addEventListener(event, updateHeight, { passive: true });
    });

    // Visual Viewport API 지원 브라우저에서 추가 대응
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
    }

    // 지연된 업데이트 (일부 브라우저에서 필요)
    const delayedUpdate = setTimeout(updateHeight, 100);
    const secondDelayedUpdate = setTimeout(updateHeight, 500);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateHeight);
      });

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
      }

      clearTimeout(delayedUpdate);
      clearTimeout(secondDelayedUpdate);
    };
  }, []);

  const fetchQuizletData = useCallback(async () => {
    if (!user || !type) return;

    try {
      const response = await fetch(`/api/quizlet/${type}/${user}`);
      const quizletData: QuizletCardProps[] = await response.json();

      const sortedData = [...quizletData].sort((a, b) => {
        return b.date.localeCompare(a.date);
      });

      setData(sortedData);
      if (sortedData.length > 0) {
        setCurrentCard(sortedData[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch quizlet data:", error);
      setLoading(false);
    }
  }, [type, user]);

  useEffect(() => {
    fetchQuizletData();
  }, [fetchQuizletData]);

  const handleDateSelect = (date: string) => {
    const selectedIndex = data.findIndex((item) => item.date === date);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      setCurrentCard(data[selectedIndex]);
    }
    setIsDatePickerOpen(false);
  };

  if (!data.length) {
    return (
      <div className="mobile-container w-full flex items-center justify-center bg-white">
        <div className="text-gray-500 text-center p-4">
          <p className="mb-2 text-xl">퀴즐렛 데이터가 없습니다</p>
          <p className="text-sm">나중에 다시 확인해 주세요</p>
        </div>
      </div>
    );
  }

  // 헤더에 표시할 날짜 포맷팅
  const rawDisplayDate = currentCard.date || "";
  let formattedHeaderDate = rawDisplayDate || "날짜 정보 없음";

  // 사파리 호환 날짜 포맷팅
  if (rawDisplayDate) {
    const parsedDate = parseToSafariDate(rawDisplayDate);
    if (parsedDate) {
      formattedHeaderDate = parsedDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
    }
  }

  return (
    <>
      <div className="mobile-container w-full flex flex-col bg-white">
        {/* 상단 날짜 표시 */}
        <div className="relative bg-blue-500 text-white p-2 sm:p-4 flex-shrink-0">
          <h1 className="text-lg sm:text-2xl font-bold text-center">
            {formattedHeaderDate}
          </h1>
          {/* 날짜 선택 버튼 */}
          <div
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
          >
            <FiCalendar className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              날짜 선택
            </span>
          </div>

          {/* 날짜 선택 팝업 - 중앙 모달로 변경 */}
          <AnimatePresence>
            {isDatePickerOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[70vh]"
                >
                  {/* 헤더 */}
                  <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-xl font-bold text-gray-800">
                      날짜 선택
                    </h2>
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center transition-all duration-200 shadow-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 날짜 목록 */}
                  <div className="overflow-y-auto max-h-[50vh] p-2">
                    {data.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          📋
                        </div>
                        <p className="text-sm">이용 가능한 날짜가 없습니다</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.map((item, idx) => {
                          // 사파리 호환 날짜 표시
                          const displayDateForItem = item.date;
                          let formattedDate = displayDateForItem;

                          // 디버깅 로그 추가
                          console.log("원본 날짜:", displayDateForItem);
                          const parsedDate =
                            parseToSafariDate(displayDateForItem);
                          console.log("파싱된 날짜:", parsedDate);

                          if (parsedDate) {
                            formattedDate = parsedDate.toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                              }
                            );
                            console.log("포맷된 날짜:", formattedDate);
                          }

                          return (
                            <button
                              key={item._id}
                              onClick={() => handleDateSelect(item.date)}
                              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                                idx === currentIndex
                                  ? "bg-blue-500 text-white shadow-md transform scale-[1.02]"
                                  : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                              } border border-transparent hover:border-blue-200`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {formattedDate}
                                </span>
                                {idx === currentIndex && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* 하단 여백 */}
                  <div className="h-4 bg-gradient-to-t from-gray-50 to-transparent"></div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 카드 컨테이너 */}
        <div className="content-container flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex"
            >
              <div className="w-full overflow-y-auto pb-safe-bottom">
                <QuizletCard content={currentCard} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 네비게이션 바 - 절대 고정 위치 */}
      <div className="navigation-bar">
        <Navigation mobileOnly={true} defaultActiveIndex={1} />
      </div>

      <style jsx global>{`
        /* 전역 CSS 리셋 및 설정 */
        /* * {
          box-sizing: border-box;
        } */

        /* html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        } */

        /* iOS Safari 및 모든 브라우저 대응 */
        /* html {
         
          height: 100%;
          height: -webkit-fill-available;
        } */

        /* body {
          min-height: 100vh;
          min-height: -webkit-fill-available;
          min-height: 100dvh; 
          position: relative;
        } */

        /* 메인 컨테이너 */
        .mobile-container {
          height: 100vh;
          height: -webkit-fill-available;
          height: 100dvh; /* Dynamic Viewport Height */
          height: var(--app-height, 100vh);
          max-height: 100vh;
          max-height: -webkit-fill-available;
          overflow: hidden;
        }

        /* 콘텐츠 영역 */
        .content-container {
          height: calc(100% - 60px); /* 헤더 높이 제외 */
          min-height: 0; /* flex shrink 허용 */
        }

        /* 네비게이션 바 */
        .navigation-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: white;
          border-top: 1px solid #e5e7eb;
          /* 모든 브라우저의 안전 영역 대응 */
          padding-bottom: env(safe-area-inset-bottom, 0);
          padding-bottom: constant(
            safe-area-inset-bottom,
            0
          ); /* iOS 11.0-11.2 */
        }

        /* 안전 영역 패딩 */
        .pb-safe-bottom {
          padding-bottom: 80px; /* 기본 네비게이션 높이 */
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
          padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0));
        }

        /* 스크롤 최적화 */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          overscroll-behavior-y: contain;
        }

        /* Android Chrome 주소창 대응 */
        @media screen and (max-width: 768px) {
          .mobile-container {
            height: calc(var(--vh, 1vh) * 100);
            height: var(--app-height, 100vh);
          }
        }

        /* 고해상도 디스플레이 대응 */
        @media screen and (-webkit-min-device-pixel-ratio: 2) {
          .mobile-container {
            height: var(--app-height, 100vh);
            max-height: var(--app-height, 100vh);
          }
        }

        /* Samsung Internet 대응 */
        @media screen and (max-width: 768px) and (orientation: portrait) {
          .mobile-container {
            height: var(--app-height, 100vh);
            min-height: var(--app-height, 100vh);
          }
        }

        /* Edge Mobile 대응 */
        @supports (-ms-ime-align: auto) {
          .mobile-container {
            height: calc(100vh - env(keyboard-inset-height, 0px));
          }
        }

        /* 최신 브라우저 Dynamic Viewport 단위 지원 */
        @supports (height: 100dvh) {
          .mobile-container {
            height: 100dvh;
            max-height: 100dvh;
          }
        }

        /* Small Viewport 단위 지원 (최소 높이 보장) */
        @supports (height: 100svh) {
          .mobile-container {
            min-height: 100svh;
          }
        }

        /* Large Viewport 단위 지원 (최대 높이 제한) */
        @supports (height: 100lvh) {
          .mobile-container {
            max-height: 100lvh;
          }
        }
      `}</style>
    </>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <QuizletPageContent />
    </Suspense>
  );
}
