"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function QuizletCard({
  content,
}: {
  content: QuizletCardProps;
}) {
  const engWords = content.eng_quizlet || [];
  const korWords = content.kor_quizlet || [];

  // 단어 쌍 생성
  const cards = engWords.map((eng, index) => [eng, korWords[index] || ""]);

  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNextCard = () => {
    setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
    setIsFlipped(false);
  };

  const handlePrevCard = () => {
    setCurrentCard((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
    setIsFlipped(false);
  };

  // 카드가 없을 경우 처리
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full bg-gray-100">
        <p className="text-gray-500">단어를 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gray-100 ">
      <div className="w-full max-w-lg">
        {/* 카드 컨테이너 */}
        <motion.div
          className="relative w-full aspect-[4/3] perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="absolute w-full h-full bg-white rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-700"
            animate={{
              rotateY: isFlipped ? 180 : 0,
              scale: isFlipped ? 1.05 : 1,
            }}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {/* 앞면 */}
            <div
              className="absolute w-full h-full flex items-center justify-center p-6 text-center"
              style={{
                transform: "rotateY(0deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <div>
                <h2 className="text-3xl font-bold text-[#121B5C]">
                  {cards[currentCard][1]}
                </h2>
                <p className="text-sm text-gray-500 mt-2">탭하여 번역 보기</p>
              </div>
            </div>

            {/* 뒷면 */}
            <div
              className="absolute w-full h-full flex items-center justify-center p-6 text-center bg-[#121B5C] rounded-2xl"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {cards[currentCard][0]}
                </h2>
                <p className="text-sm text-gray-300 mt-2">탭하여 숨기기</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        {/* 네비게이션 */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrevCard}
            className="p-2 rounded-full bg-gray-100 text-[#121B5C] shadow-sm hover:bg-gray-200 transition-colors"
          >
            <IoIosArrowBack className="text-2xl" />
          </button>

          <div className="text-[#121B5C] text-lg font-semibold">
            {currentCard + 1} / {cards.length}
          </div>

          <button
            onClick={handleNextCard}
            className="p-2 rounded-full bg-gray-100 text-[#121B5C] shadow-sm hover:bg-gray-200 transition-colors"
          >
            <IoIosArrowForward className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
