"use client";

// TypeScript로 변환한 코드

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiX } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation";

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
  const [loading, setLoading] = useState<boolean>(true);

  const fetchQuizletData = useCallback(async () => {
    if (!user || !type) return;

    try {
      const response = await fetch(`/api/quizlet/${type}/${user}`);
      const quizletData: QuizletCardProps[] = await response.json();

      // 여기서는 날짜를 Date 객체로 변환하지 않고 문자열 그대로 정렬
      // 날짜 형식이 일관적이라면(YYYY-MM-DD) 문자열 정렬도 잘 작동함
      const sortedData = [...quizletData].sort((a, b) => {
        // 간단히 최신 데이터가 앞에 오도록 내림차순 정렬
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
      <div className="w-full h-[100vh] flex items-center justify-center bg-white">
        <div className="text-gray-500 text-center p-4">
          <p className="mb-2 text-xl">퀴즐렛 데이터가 없습니다</p>
          <p className="text-sm">나중에 다시 확인해 주세요</p>
        </div>
      </div>
    );
  }

  // 서버에서 받은 날짜 문자열 형식으로 표시
  const displayDate = currentCard.date || "날짜 정보 없음";

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 상단 날짜 표시 */}
      <div className="relative bg-blue-500 text-white p-2 sm:p-4">
        <h1 className="text-lg sm:text-2xl font-bold text-center">
          {displayDate}
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

        {/* 날짜 선택 팝업 */}
        <AnimatePresence>
          {isDatePickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-end"
            >
              <div className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    날짜 선택
                  </h2>

                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                {/* 날짜 목록 */}
                <div className="overflow-y-auto max-h-[50vh]">
                  {data.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleDateSelect(item.date)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-base text-gray-800">
                        {item.date}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 카드 컨테이너 - 네비게이션 바를 위한 하단 여백 추가 */}
      <div className="flex-1 relative overflow-hidden pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex"
          >
            {/* Quizlet Content */}
            <div className="w-full overflow-y-auto">
              <QuizletCard content={currentCard} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<LoadingScreen message="Loading..." />}>
        <div className="flex-1 overflow-hidden">
          <QuizletPageContent />
        </div>
        {/* 네비게이션 바 - sticky로 적용 */}
        <div className="sticky bottom-0 left-0 right-0 z-20">
          <Navigation mobileOnly={true} defaultActiveIndex={2} />
        </div>
      </Suspense>
    </div>
  );
}
