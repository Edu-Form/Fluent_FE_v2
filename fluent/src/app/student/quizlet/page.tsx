"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiX } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation";

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
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [, setLoading] = useState(true);

  const fetchQuizletData = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizlet/${type}/${user}`);
      const quizletData: QuizletCardProps[] = await response.json();
      const sortedData = quizletData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
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

  const currentDate = currentCard ? new Date(currentCard.date) : new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 상단 날짜 표시 */}
      <div className="relative bg-gradient-to-r from-[#3f4166] to-[#2a2b44] text-white p-2 sm:p-4">
        <h1 className="text-lg sm:text-2xl font-bold text-center">
          {year}년 {month}월 {day}일 {weekday}
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
                        {new Date(item.date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 카드 컨테이너 - 화면 꽉 차게 수정 */}
      <div className="flex-1 relative overflow-hidden">
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

      {/* 페이지네이션 인디케이터 */}
      <div className="py-2 flex justify-center gap-2 bg-white">
        {data.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setCurrentCard(data[idx]);
            }}
            className={`w-2 h-2 rounded-full ${
              idx === currentIndex ? "bg-[#3f4166]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <>
      <div className="h-screen flex flex-col">
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <div className="flex-1 ">
            <QuizletPageContent />
          </div>
          {/* 네비게이션 바 */}
          <Navigation mobileOnly={true} defaultActiveIndex={2} />
        </Suspense>
      </div>
    </>
  );
}
