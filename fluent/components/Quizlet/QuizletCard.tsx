"use client";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuCircleFadingPlus } from "react-icons/lu";

function shuffleCards(cards: string[][]) {
  const shuffled = [...cards]; // Create a copy to avoid mutating the original array

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap pairs
  }

  return shuffled;
}

// let items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// shuffleArray(items);
// console.log(items); // Mutated (shuffled) original array

const QuizletCardContent = ({
  content,
  allCards = [],
  currentIndex = 0,
  onNext,
  onPrev,
  onSelectCard,
  onCreateQuizlet,
}: {
  content: QuizletCardProps;
  allCards?: QuizletCardProps[];
  currentIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSelectCard?: (index: number) => void;
  onCreateQuizlet?: () => void;
}) => {
  const engWords = content.eng_quizlet || [];
  const korWords = content.kor_quizlet || [];

  // 단어 쌍 생성 - let에서 const로 변경 (ESLint prefer-const 오류 해결)
  const cards = engWords.map((eng, index) => [eng, korWords[index] || ""]);

  const [shuffledCards, setshuffledCards] = useState<string[][] | null>(null);

  // Random Shuffle
  function shuffled() {
    setshuffledCards(shuffleCards(cards));
    console.log(cards);
  }

  function Audio(text: string) {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'en-US';
      speech.pitch = 1;
      speech.rate = 1;
      window.speechSynthesis.speak(speech);
    } else {
      console.log("Speech synthesis is not supported in this browser.");
    }
  }

  function readCardText() {
    // Use the condition provided to select the text
    const text = shuffledCards ? shuffledCards[currentCard][0] : cards[currentCard][0];
    Audio(text);  // Call the Audio function with the selected text
  }

  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1)); 
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleDateSelect = (index: number) => {
    if (onSelectCard) {
      setshuffledCards(null);
      setCurrentCard(0);
      onSelectCard(index);
    }
    setIsDatePickerOpen(false);
  };

  const currentDate = new Date(content.date);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const weekday = currentDate.toLocaleDateString("ko-KR", { weekday: "long" });

  // 카드가 없을 경우 빈 카드 디자인 표시
  if (cards.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col">
        {/* 헤더 부분 */}
        <div className="relative bg-blue-500 text-white p-2 sm:p-4">
          <h1 className="text-lg sm:text-xl font-bold text-center">
            Quizlet Cards
          </h1>

          {/* Create Button */}
          {onCreateQuizlet && (
            <button
              onClick={onCreateQuizlet}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            >
              <LuCircleFadingPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Quizlet</span>
            </button>
          )}
        </div>

        <div className="flex-grow flex items-center justify-center p-4 sm:p-10">
          <div className="w-full max-w-lg">
            {/* 카드 컨테이너 */}
            <motion.div className="relative w-full aspect-[4/3] perspective-1000">
              <motion.div
                className="absolute w-full h-full bg-white rounded-xl shadow-sm flex items-center justify-center transition-all duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* 빈 카드 앞면 */}
                <div
                  className="absolute w-full h-full flex items-center justify-center p-6 text-center"
                  style={{
                    transform: "rotateY(0deg)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <div>
                    <div className="w-32 h-6 bg-gray-100 rounded-full mx-auto"></div>
                    <p className="text-xs text-gray-400 mt-3 font-medium">
                      탭하여 번역 보기
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            {/* 네비게이션 */}
            <div className="flex justify-between items-center mt-6">
              <button
                disabled
                className="p-2 rounded-full bg-white text-gray-300 shadow-sm cursor-not-allowed"
              >
                <IoIosArrowBack className="text-xl" />
              </button>

              <div className="text-gray-400 text-sm font-medium">0 / 0</div>

              <button
                disabled
                className="p-2 rounded-full bg-white text-gray-300 shadow-sm cursor-not-allowed"
              >
                <IoIosArrowForward className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 헤더 부분 */}
      <div className="relative bg-blue-500 text-white p-2 sm:p-4">
        <h1 className="text-lg sm:text-xl font-bold text-center">
          {year}년 {month}월 {day}일 {weekday}
          <div onClick={shuffled}>Shuffle Cards</div>
          <div onClick={readCardText}>Audio</div>
        </h1>

        {/* Navigation Buttons for Multiple Cards */}
        {allCards.length > 1 && (
          <>
            {/* Date Selection Trigger */}
            <div
              onClick={() => {
                setIsDatePickerOpen(!isDatePickerOpen);
                setshuffledCards(null);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            >
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm font-medium">날짜</span>
            </div>

            {/* Date Selection Popup */}
            {isDatePickerOpen && (
              <div className="absolute top-full left-4 mt-2 z-50 bg-white rounded-lg shadow-md">
                <div className="p-1 max-h-60 overflow-y-auto">
                  {allCards.map((item, idx) => (
                    <button
                      key={item._id}
                      onClick={() => handleDateSelect(idx)}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                    >
                      {new Date(item.date).toLocaleDateString("ko-KR")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/*  모달창 버튼 (혹시 몰라 남겨둡니다) */}
        {/* {onCreateQuizlet && (
          <button
            onClick={onCreateQuizlet}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
          >
            <LuCircleFadingPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Quizlet</span>
          </button>
        )} */}
      </div>

      {/* Main Content */}
      <div className="flex-grow relative">
        {/* Card Navigation Buttons for Multiple Cards */}

        <div className="flex bg-slate-50 items-center justify-center p-4 sm:p-10 h-full">
          <div className="w-full max-w-lg">
            {/* 카드 컨테이너 */}
            <div className="relative w-full aspect-[4/3]" onClick={() => setIsFlipped(!isFlipped)}>
              <div className="absolute w-full h-full bg-white rounded-xl shadow-lg flex items-center justify-center">
                {/* Front of the card */}
                {isFlipped ? (
                  <div className="absolute w-full h-full flex items-center justify-center p-6 text-center">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-600">
                        {shuffledCards ? shuffledCards[currentCard][0] : cards[currentCard][0]}
                      </h2>
                      <p className="text-xs text-blue-400 mt-3 font-medium">
                        탭하여 숨기기
                      </p>
                    </div>
                  </div>
                ) : (
                  // Back of the card
                  <div className="absolute w-full h-full flex items-center justify-center p-6 text-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {shuffledCards ? shuffledCards[currentCard][1] : cards[currentCard][1]}
                      </h2>
                      <p className="text-xs text-gray-400 mt-3 font-medium">
                        탭하여 번역 보기
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 프로그레스 바 */}
            <div className="mt-6 bg-gray-200 h-1 w-full rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentCard + 1) / cards.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* 네비게이션 */}
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={handlePrevCard}
                className="p-2 rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
              >
                <IoIosArrowBack className="text-xl" />
              </button>

              <div className="text-gray-700 text-sm font-medium">
                {currentCard + 1} / {cards.length}
              </div>

              <button
                onClick={handleNextCard}
                className="p-2 rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
              >
                <IoIosArrowForward className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Indicator */}
        {allCards.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
            {allCards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDateSelect(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-blue-500 w-3" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function QuizletCard({
  content,
  allCards,
  currentIndex,
  onNext,
  onPrev,
  onSelectCard,
  onCreateQuizlet,
}: {
  content: QuizletCardProps;
  allCards?: QuizletCardProps[];
  currentIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSelectCard?: (index: number) => void;
  onCreateQuizlet?: () => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-full bg-gray-50">
          <p className="text-gray-500 text-sm font-medium">
            카드를 불러오는 중...
          </p>
        </div>
      }
    >
      <QuizletCardContent
        content={content}
        allCards={allCards || []}
        currentIndex={currentIndex || 0}
        onNext={onNext}
        onPrev={onPrev}
        onSelectCard={onSelectCard}
        onCreateQuizlet={onCreateQuizlet}
      />
    </Suspense>
  );
}
