"use client";
import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

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
  const [isCheckedView, setIsCheckedView] = useState(false); //false면 별이 있고 true면 별이 없는 상태
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [favoriteCards, setFavoriteCards] = useState<{
    [key: number]: boolean;
  }>({});
  const [isBookmark, setIsBookmark] = useState(false);

  // 즐겨찾기 알림을 위한 상태 추가
  const [showAlert, setShowAlert] = useState(false);

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

    setIsFlipped(false);
    setCurrentCard(0);

    if (isCheckedView) {
      // 즐겨찾기 보기에서 전체 보기로 전환
      console.log("전체 카드로 전환:", cards);
      setCards(originalCards);
      setIsCheckedView(false);
      setIsBookmark(false);
    } else {
      // 전체 보기에서 즐겨찾기 보기로 전환
      const checkedCards = cards.filter((card) => card[2] === "1"); // 즐겨찾기된 카드만 필터링
      console.log("즐겨찾기 카드:", checkedCards);

      if (checkedCards.length === 0) {
        // 즐겨찾기된 카드가 없을 경우 알림 표시
        setShowAlert(true);
        // 3초 후 알림 자동 닫기
        setTimeout(() => setShowAlert(false), 1000);
      } else {
        // 즐겨찾기된 카드가 있을 경우 즐겨찾기 모드로 전환
        setOriginalCards(cards);
        setCards(checkedCards);
        setIsCheckedView(true);
        setIsBookmark(true);
      }
    }
  }

  function shuffled() {
    shuffleCards(cards);
    setCards([...cards]);
  }

  const downloadQuizlet = async () => {
    if (!Array.isArray(cards) || cards.length === 0) {
      alert("No data available to download.");
      return;
    }

    console.log(content.date);
    console.log(cards);

    // Load font
    const response = await fetch("/fonts/NanumGothic-Regular.ttf");
    const fontData = await response.arrayBuffer();
    const fontBase64 = btoa(
      new Uint8Array(fontData).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const doc = new jsPDF();
    doc.setFontSize(10);

    // Embed Korean font
    doc.addFileToVFS("NanumGothic-Regular.ttf", fontBase64);
    doc.addFont("NanumGothic-Regular.ttf", "NanumGothic", "normal");
    doc.setFont("NanumGothic");

    // Add title at the top with dynamic date
    doc.setFontSize(16); // Bigger font for title
    doc.text(`Quizlet for ${content.date}`, 10, 15); // Title with date

    doc.setFontSize(10);
    let y = 25; // Initial Y position
    const margin = 10; // Left margin
    const maxWidth = 180; // Maximum width for text before wrapping

    cards.forEach(([english, korean], index) => {
      // Split long text into multiple lines
      const engLines = doc.splitTextToSize(
        `${index + 1}. ${english}`,
        maxWidth
      );
      const korLines = doc.splitTextToSize(`   → ${korean}`, maxWidth);

      // Print English lines
      engLines.forEach((line: any) => {
        doc.text(line, margin, y);
        y += 5; // Move down
      });

      // Print Korean lines
      korLines.forEach((line: any) => {
        doc.text(line, margin, y);
        y += 5; // Move down
      });

      y += 5; // Extra space before next entry

      // Page break if the content reaches the bottom
      if (y > 280) {
        doc.addPage();
        y = 10; // Reset Y for new page
      }
    });

    doc.save(`${content.date} ${content.student_name}'s Quizlet.pdf`);
  };

  // function Audio(text: string) {
  //   if ("speechSynthesis" in window) {
  //     console.log("Audio activated.");
  //     const speech = new SpeechSynthesisUtterance(text);
  //     speech.lang = "en-US";
  //     speech.pitch = 1;
  //     speech.rate = 1;
  //     window.speechSynthesis.speak(speech);
  //   } else {
  //     console.log("Speech synthesis is not supported in this browser.");
  //   }
  // }

  async function TTSAudio(text: string) {
    const response = await fetch("/api/quizlet/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        console.error("Error:", await response.text());
        return;
    }

    // Get the audio response as a blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play the audio
    const audio = new Audio(audioUrl);
    audio.play();
}

  const readCardText = () => {
    const text = isFlipped ? cards[currentCard][0] : cards[currentCard][1];
    TTSAudio(text); // Call the Audio function with the selected text
  };

  const handleNextCard = () => {
    console.log("ArrowRight");
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  useEffect(() => {
    // 컴포넌트가 마운트되거나 content가 변경될 때 카드 초기화
    if (content && content.eng_quizlet && content.kor_quizlet) {
      const newCards = content.eng_quizlet.map((eng, index) => [
        eng,
        content.kor_quizlet[index] || "",
        "0", // 모든 카드를 즐겨찾기 해제 상태로 초기화
      ]);

      setCards(newCards);
      setOriginalCards(newCards);
      setCurrentCard(0);
      setIsFlipped(false);
      setIsCheckedView(false);
      setIsBookmark(false);

      // 즐겨찾기 상태 초기화
      const initialFavorites: { [key: number]: boolean } = {};
      newCards.forEach((_, index) => {
        initialFavorites[index] = false;
      });
      setFavoriteCards(initialFavorites);
    }
  }, [content]);

  // 키보드 방향키 카드 네비게이션
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        handleNextCard();
      } else if (event.key === "ArrowLeft") {
        handlePrevCard();
      } else if (event.key === "ArrowDown") {
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleNextCard, handlePrevCard]);

  // 키보드 / 키로 읽기 기능
  useEffect(() => {
    const handleSlashKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        readCardText();
      }
    };

    window.addEventListener("keydown", handleSlashKey);

    return () => {
      window.removeEventListener("keydown", handleSlashKey);
    };
  }, [content, currentCard, isFlipped, readCardText]);

  const handleDateSelect = (index: number) => {
    if (onSelectCard) {
      // 다른 날짜 카드로 변경 시 현재 상태 초기화
      setIsFlipped(false);
      setCurrentCard(0);
      setIsCheckedView(false);
      setIsBookmark(false);

      // 선택한 날짜의 카드 데이터 로드 요청
      onSelectCard(index);
    }
    setIsDatePickerOpen(false);
  };
  const currentDate = new Date(content.date);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; //  0, 1
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
            onClick={downloadQuizlet}
            className="flex items-center justify-center gap-2 p-2 px-4 rounded-full bg-blue-500 backdrop-blur-sm text-white hover:bg-white hover:text-[#436bff] shadow-sm transition-colors"
          >
            PDF <Download className="w-5 h-5" />
          </button>
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
          {isNaN(currentDate.getTime()) ? content.date : formattedDate}
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
              className={`w-full sm:max-w-4xl sm:h-4/5 bg-white rounded-3xl hover:bg-[#e9f2ff] shadow-xl flex items-center justify-center p-10 transform transition-all duration-300 relative ${
                isFlipped
                  ? "text-black border-4 border-sky-200  hover:bg-[#e9f2ff] scale-105  shadow-sky-100 "
                  : ""
              }`}
            >
              {/* 즐겨찾기 버튼을 카드 내부 오른쪽 상단에 배치 */}
              {!isCheckedView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card flip
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
              )}

              <div className="text-center w-full overflow-auto">
                <h2 className="text-2xl font-bold leading-tight sm:text-7xl max-h-[400px] overflow-auto">
                  {isFlipped ? cards[currentCard][0] : cards[currentCard][1]}
                </h2>
                <p
                  className={`mt-8 text-gray-400 sm:text-xl text-sm ${
                    isFlipped ? "text-gray-400" : ""
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
            {currentCard + 1} / {cards.length}
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
                {isNaN(new Date(item.date).getTime())
                  ? item.date
                  : new Date(item.date).toLocaleDateString("ko-KR")}
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

      {/* 커스텀 알림창 */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-gray-300 bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white px-8 py-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center gap-4 w-72 h-48"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: 0.05,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {content.student_name?.charAt(0) || "?"}
                </div>
                <span className="font-medium text-sm text-gray-700 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                  {content.student_name || "학생"}
                </span>
              </div>

              <p className="text-gray-800 font-medium text-center text-lg">
                등록된 즐겨찾기가 없습니다
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
