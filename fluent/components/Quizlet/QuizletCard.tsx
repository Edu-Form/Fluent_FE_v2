"use client";
import { useState, Suspense, useEffect } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FiCalendar } from "react-icons/fi";
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import {
  BsShuffle,
  BsStar,
  BsStarFill,
  BsBookmarkStar,
  BsBookmarkStarFill,
} from "react-icons/bs";

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

function shuffleCards(cards: string[][]) {
  // Use a traditional Fisher-Yates (Durstenfeld) shuffle algorithm
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]]; // Swap pairs directly in the original array
  }
}

const QuizletCardContent = ({
  content,
  allCards = [],
  currentIndex = 0,
  onSelectCard,
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

  // 단어 쌍 생성
  const [cards, setCards] = useState(
    engWords.map((eng, index) => [eng, korWords[index] || "", "0"])
  );
  const [originalCards, setOriginalCards] = useState(cards);
  const [isCheckedView, setIsCheckedView] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<string[][] | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [favoriteCards, setFavoriteCards] = useState<{
    [key: number]: boolean;
  }>({});
  const [isBookmark, setIsBookmark] = useState(false);

  // currentCard가 변경될 때마다 즐겨찾기 상태 체크
  useEffect(() => {
    // 카드 변경 시 즐겨찾기 상태를 초기화하지 않고 해당 카드의 상태를 유지
  }, [currentCard]);

  function checkCurrentCard() {
    // 현재 카드의 즐겨찾기 상태 토글
    const newFavoriteCards = { ...favoriteCards };
    newFavoriteCards[currentCard] = !favoriteCards[currentCard];
    setFavoriteCards(newFavoriteCards);

    // 카드 데이터에도 상태 업데이트
    cards[currentCard][2] = cards[currentCard][2] === "0" ? "1" : "0";
    setCards([...cards]); // 상태 업데이트로 리렌더링 트리거
  }

  function playCheckedCards() {
    // 즐겨찾기 보기 상태 토글
    setIsCheckedView(!isCheckedView);
    setIsFlipped(false);
    setCurrentCard(0);

    if (isCheckedView) {
      // 즐겨찾기 보기에서 전체 보기로 전환
      console.log(cards);
      setCards(originalCards);
    } else {
      // 전체 보기에서 즐겨찾기 보기로 전환
      const checkedCards = cards.filter((card) => card[2] === "1"); // 즐겨찾기된 카드만 필터링
      console.log(checkedCards);
      setOriginalCards(cards);
      setCards(checkedCards);
      setIsBookmark(!isBookmark);
    }
  }

  function shuffled() {
    shuffleCards(cards);
    setCards([...cards]);
  }

  function Audio(text: string) {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "en-US";
      speech.pitch = 1;
      speech.rate = 1;
      window.speechSynthesis.speak(speech);
    } else {
      console.log("Speech synthesis is not supported in this browser.");
    }
  }

  function readCardText() {
    const text = isFlipped ? cards[currentCard][0] : cards[currentCard][1];
    Audio(text); // Call the Audio function with the selected text
  }

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) =>
      prev + 1 === (shuffledCards || cards).length ? 0 : prev + 1
    );
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) =>
      prev === 0 ? (shuffledCards || cards).length - 1 : prev - 1
    );
  };

  const handleDateSelect = (index: number) => {
    if (onSelectCard) {
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
  const formattedDate = `${year}년 ${month}월 ${day}일 ${weekday}`;

  // 카드가 없을 경우 빈 카드 디자인 표시 - 실제 카드와 동일한 레이아웃 활용
  if (cards.length === 0) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
        {/* 상단 컨트롤 바 */}
        <div className="py-2 px-4 flex justify-between items-center z-10 absolute top-0 left-0 right-0">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {content.student_name?.charAt(0) || "?"}
            </div>
            <span className="font-medium text-sm text-gray-700 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              {content.student_name || "학생"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 shadow-sm"
              disabled
            >
              <FiCalendar className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 shadow-sm"
              disabled
            >
              <HiOutlineSpeakerWave className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 shadow-sm"
              disabled
            >
              <BsBookmarkStar className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 shadow-sm"
              disabled
            >
              <BsShuffle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 날짜 표시 */}
        <div className="absolute top-14 left-0 right-0 flex justify-center">
          <div className="text-sm text-gray-700 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </div>
        </div>

        {/* 카드 컨텐츠 - 화면을 꽉 채우는 중앙 섹션 */}
        <div className="flex-grow flex items-stretch h-full">
          <div className="w-16 flex items-center justify-center cursor-not-allowed text-gray-200">
            <IoIosArrowBack className="text-4xl" />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center px-4">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full max-w-4xl h-4/5 bg-white rounded-3xl shadow-xl flex items-center justify-center p-8">
                <div className="text-center w-full">
                  <h2 className="text-4xl font-bold text-gray-300 mb-6">
                    등록된 퀴즐렛이 없습니다
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="w-16 flex items-center justify-center cursor-not-allowed text-gray-200">
            <IoIosArrowForward className="text-4xl" />
          </div>
        </div>

        {/* 카드 페이지 인디케이터 */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-gray-400 text-xl font-medium">0 / 0</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
      {/* 상단 컨트롤 바 */}
      <div className="py-2 px-4 flex justify-between items-center z-10 absolute top-0 left-0 right-0">
        <div className="flex items-center space-x-1">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {content.student_name?.charAt(0) || "?"}
          </div>
          <span className="font-medium text-sm text-gray-700 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            {content.student_name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-sm transition-colors"
          >
            <FiCalendar className="w-5 h-5" />
          </button>
          <button
            onClick={readCardText}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-sm transition-colors"
          >
            <HiOutlineSpeakerWave className="w-5 h-5" />
          </button>
          <button
            onClick={playCheckedCards}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-colors"
          >
            {isBookmark ? (
              <BsBookmarkStarFill className="w-5 h-5 text-yellow-500" />
            ) : (
              <BsBookmarkStar className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={shuffled}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-sm transition-colors"
          >
            <BsShuffle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 날짜 표시 */}
      <div className="absolute top-14 left-0 right-0 flex justify-center">
        <div className="text-sm text-gray-700 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
          {formattedDate}
        </div>
      </div>

      {/* 카드 컨텐츠  */}
      <div className="flex-grow flex items-stretch h-full">
        <div
          onClick={handlePrevCard}
          className="w-16 flex items-center justify-center cursor-pointer  hover:bg-[#b8d4ff] transition-colors text-gray-400 hover:text-gray-600"
        >
          <IoIosArrowBack className="text-4xl" />
        </div>

        <div
          className="flex-grow flex flex-col items-center justify-center"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={`w-full sm:max-w-4xl sm:h-4/5 bg-white rounded-3xl shadow-xl flex items-center justify-center p-10 transform transition-all duration-300 relative ${
                isFlipped ? "text-white bg-sky-300 scale-105" : ""
              }`}
            >
              {/* 즐겨찾기 버튼을 카드 내부 오른쪽 상단에 배치 */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 카드 뒤집힘 방지
                  checkCurrentCard();
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                {favoriteCards[currentCard] ? (
                  <BsStarFill className="w-6 h-6 text-yellow-500" />
                ) : (
                  <BsStar className="w-6 h-6 text-gray-400" />
                )}
              </button>

              <div className="text-center w-full">
                <h2 className="text-2xl font-bold leading-tight sm:text-7xl">
                  {isFlipped
                    ? cards[currentCard][0]
                    : cards[currentCard][1]}
                </h2>
                <p
                  className={`mt-8 text-gray-400 sm:text-xl text-sm ${
                    isFlipped ? "text-white" : ""
                  }`}
                >
                  탭하여 {isFlipped ? "한국어" : "영어"}로 전환
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={handleNextCard}
          className="w-16 flex items-center justify-center cursor-pointer hover:bg-[#b8d4ff] transition-colors text-gray-400 hover:text-gray-600"
        >
          <IoIosArrowForward className="text-4xl" />
        </div>
      </div>

      {/* 카드 페이지 인디케이터 */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
          <span className="text-gray-700 text-xl font-medium">
            {currentCard + 1} / {(shuffledCards || cards).length}
          </span>
        </div>
      </div>

      {/* Date Selection Popup */}
      {isDatePickerOpen && (
        <div className="absolute top-14 right-4 mt-2 z-50 bg-white rounded-lg shadow-lg">
          <div className="p-2 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-medium px-3 py-2 text-gray-500">
              날짜 선택
            </h3>
            {allCards.map((item, idx) => (
              <button
                key={item._id}
                onClick={() => handleDateSelect(idx)}
                className={`w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm ${
                  idx === currentIndex ? "bg-blue-50 text-blue-600" : ""
                }`}
              >
                {new Date(item.date).toLocaleDateString("ko-KR")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 하단 페이지네이션 인디케이터 */}
      {allCards.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="flex gap-1.5">
            {allCards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDateSelect(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-blue-500 w-5" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}
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
