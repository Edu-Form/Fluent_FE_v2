"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Dynamic imports
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const QuizletCard = dynamic(() => import("@/components/Quizlet/QuizletCard"), {
  ssr: false,
});

// Lottie animation을 동적으로 import
const LottieAnimation = dynamic(
  async () => {
    const animationData = await import("@/src/app/lotties/mainLoading.json");
    return function Animation() {
      return <Lottie animationData={animationData.default} />;
    };
  },
  { ssr: false }
);

interface QuizletCardProps {
  _id: string;
  date: string;
  student_name: string;
  eng_quizlet: string[];
  kor_quizlet: string[];
  original_text: string;
  cards: any[];
}

const QuizletPageContent = () => {
  const [data, setData] = useState<QuizletCardProps[]>([]);
  const [currentCard, setCurrentCard] = useState<QuizletCardProps | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const student_name = searchParams.get("student_name");

  const openIsModal = () => setIsModalOpen(true);

  useEffect(() => {
    const fetchQuizletData = async () => {
      try {
        const response = await fetch(`/api/quizlet/student/${student_name}`);

        if (!response.ok) {
          setData([]);
          setCurrentCard(null);
          return;
        }

        const quizletData = await response.json();

        const quizletArray = Array.isArray(quizletData)
          ? quizletData
          : Object.values(quizletData);

        if (quizletArray.length === 0) {
          setData([]);
          setCurrentCard(null);
          return;
        }

        const sortedData = quizletArray.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setData(sortedData);
        setCurrentCard(sortedData[0]);
      } catch (error) {
        console.error("Failed to fetch quizlet data:", error);
        setData([]);
        setCurrentCard(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizletData();
  }, [student_name]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setCurrentCard(data[(currentIndex + 1) % data.length]);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setCurrentCard(data[(currentIndex - 1 + data.length) % data.length]);
  };

  const handleSelectCard = (index: number) => {
    setCurrentIndex(index);
    setCurrentCard(data[index]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
        <div>Fluent</div>
        <div className="mt-4 w-32 h-32">
          <LottieAnimation />
        </div>
      </div>
    );
  }

  // 빈 컴포넌트를 생성하는 함수
  const createEmptyCard = () => {
    return {
      _id: "empty",
      date: new Date().toISOString(),
      student_name: student_name || "",
      eng_quizlet: [],
      kor_quizlet: [],
      original_text: "",
      cards: [],
    };
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      {!data || data.length === 0 ? (
        <QuizletCard
          content={createEmptyCard()}
          onCreateQuizlet={openIsModal}
        />
      ) : (
        <QuizletCard
          content={currentCard || data[0]}
          allCards={data}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onSelectCard={handleSelectCard}
          onCreateQuizlet={openIsModal}
        />
      )}

      <style jsx global>{`
        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        body > div,
        #__next {
          height: 100%;
        }

        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full">
          <div>Loading...</div>
        </div>
      }
    >
      <QuizletPageContent />
    </Suspense>
  );
}
