"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import QuizletCard from "@/components/Quizlet/QuizletCard";

const QuizletPage = () => {
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

  const fetchQuizletData = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizlet/${type}/${user}`);
      const quizletData: QuizletCardProps[] = await response.json();
      const sortedData = quizletData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setData(sortedData);
      setCurrentCard(sortedData[0]);
    } catch (error) {
      console.error("Failed to fetch quizlet data:", error);
    }
  }, [type, user]);

  useEffect(() => {
    fetchQuizletData();
  }, [fetchQuizletData]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setCurrentCard(data[(currentIndex + 1) % data.length]);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setCurrentCard(data[(currentIndex - 1 + data.length) % data.length]);
  };

  const handleDateSelect = (date: string) => {
    const selectedIndex = data.findIndex((item) => item.date === date);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      setCurrentCard(data[selectedIndex]);
    }
    setIsDatePickerOpen(false);
  };

  if (!data.length) return null;

  const currentDate = currentCard ? new Date(currentCard.date) : new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="w-full h-full">
      <div className="relative flex w-full h-full items-center justify-center p-10">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-2 z-10 p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
        >
          <FiChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 z-10 p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
        >
          <FiChevronRight size={24} />
        </button>

        {/* Card Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Date Header */}
            <div className="relative bg-gradient-to-r from-[#3f4166] to-[#2a2b44] text-white p-2 sm:p-4">
              <h1 className="text-lg sm:text-2xl font-bold text-center">
                {year}년 {month}월 {day}일 {weekday}
              </h1>

              {/* Date Selection Trigger */}
              <div
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
              >
                <FiCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">날짜 선택</span>
                <div className="px-1.5 py-0.5 bg-white/20 rounded-md text-xs animate-pulse">
                  Click!
                </div>
              </div>

              {/* Date Selection Popup */}
              {isDatePickerOpen && (
                <div className="absolute top-full left-4 mt-2 z-50 bg-white rounded-lg shadow-xl">
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {data.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => handleDateSelect(item.date)}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        {new Date(item.date).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quizlet Content */}
            <div className="overflow-y-auto h-[calc(100vh-200px)] sm:max-h-[calc(80vh-80px)]">
              <QuizletCard content={currentCard} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
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
    </div>
  );
};

export default QuizletPage;
