"use client";

// TypeScript로 변환한 코드

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [currentIndex] = useState<number>(0);
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

  const [, setLoading] = useState<boolean>(true);

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

  return (
    <div className="w-full h-full flex flex-col bg-white">
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
