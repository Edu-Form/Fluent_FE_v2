"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { LuCircleFadingPlus } from "react-icons/lu";
import "react-day-picker/dist/style.css";

const DayPicker = dynamic(
  () => import("react-day-picker").then((mod) => mod.DayPicker),
  {
    ssr: false,
  }
);

const QuizletCard = dynamic(() => import("@/components/Quizlet/QuizletCard"), {
  ssr: false,
});

const QuizletModal = dynamic(
  () => import("@/components/Quizlet/QuizletModal"),
  {
    ssr: false,
  }
);

// Edit button
const content = {
  write: "Create Quizlet",
};

const QuizletPage = () => {
  const searchParams = useSearchParams();
  const student_name = searchParams.get("student_name");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<QuizletCardProps[]>([]); // 전체 Quizlet 데이터
  const [currentCard, setCurrentCard] = useState<QuizletCardProps | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 선택된 날짜

  const openIsModal = () => setIsModalOpen(true);
  const closeIsModal = () => setIsModalOpen(false);

  const fetchQuizletData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/quizlet/student/${student_name}`
      );
      const quizletData: QuizletCardProps[] = await response.json();
      console.log("Fetched Quizlet Data:", quizletData); // 데이터 확인
      setData(quizletData);
    } catch (error) {
      console.error("Failed to fetch quizlet data:", error);
    }
  }, [student_name]);

  useEffect(() => {
    fetchQuizletData();
  }, [fetchQuizletData]);

  // 날짜 선택 시 해당 Quizlet 데이터를 가져오기
  useEffect(() => {
    if (selectedDate) {
      const selectedCard = data.find(
        (item) =>
          new Date(item.date).toISOString().split("T")[0] === selectedDate
      );
      console.log("Selected Date:", selectedDate); // 선택된 날짜 확인
      console.log("Matched Card:", selectedCard); // 매칭 결과 확인
      setCurrentCard(selectedCard || null);
    }
  }, [selectedDate, data]);

  return (
    <div className="flex w-[80vw] h-full bg-white">
      {/* 사이드바 */}
      <div className="flex-col bg-white w-[10vw] min-h-full">
        <p className="px-5 my-8 text-gray-400 text-sm font-semibold">
          {student_name}&apos;s Quizlets
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col justify-center items-center gap-10 w-full p-10">
        <div className="flex w-full justify-center items-center gap-10">
          {/* DayPicker를 사용하여 날짜 선택 */}
          <div className="flex flex-col items-center w-full">
            <DayPicker
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => {
                const formattedDate = date?.toISOString().split("T")[0];
                console.log("Selected Date:", formattedDate);
                setSelectedDate(formattedDate || null);
              }}
              modifiers={{
                hasData: data.map((item) => {
                  const date = new Date(item.date);
                  return date;
                }),
              }}
              modifiersClassNames={{
                selected: "bg-blue-500 text-white",
                hasData: "bg-green-500 text-white",
              }}
            />
          </div>

          <div className="quizlet_card w-full">
            <QuizletCard
              content={
                currentCard
                  ? {
                      ...currentCard,
                      cards: currentCard.eng_quizlet.map((eng, index) => [
                        eng,
                        currentCard.kor_quizlet[index] || "",
                      ]),
                    }
                  : {
                      _id: "",
                      student_name: "",
                      date: "",
                      original_text: "",
                      eng_quizlet: [],
                      kor_quizlet: [],
                      cards: [],
                    }
              }
            />
          </div>
        </div>

        <div onClick={openIsModal} className="flex justify-end w-full">
          <button className="flex gap-4 bg-blue-500 text-white px-8 p-4 rounded-lg ">
            <LuCircleFadingPlus className="flxe justify-center item-center w-6 h-6" />
            {content.write}
          </button>
        </div>
        {isModalOpen && <QuizletModal closeIsModal={closeIsModal} />}
      </main>
    </div>
  );
};

// Suspense를 사용하여 QuizletPage를 감싸기
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizletPage />
    </Suspense>
  );
}
