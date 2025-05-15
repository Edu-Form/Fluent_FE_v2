"use client";
import { useState, Suspense, useEffect, useCallback, useRef } from "react";
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
  BsPlayFill,
  BsPauseFill,
} from "react-icons/bs";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { useSwipeable } from "react-swipeable";

// 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

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

// 오디오 버퍼를 위한 인터페이스 정의
interface AudioBuffers {
  [key: string]: string;
}

function shuffleCards(cards: string[][]) {
  // Fisher-Yates 셔플 알고리즘
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
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

  // 버튼 쿨다운 관련 상태
  const [autoPlayButtonCooldown, setAutoPlayButtonCooldown] = useState(false);
  const [pauseButtonCooldown, setPauseButtonCooldown] = useState(false);
  const [stopButtonCooldown, setStopButtonCooldown] = useState(false);
  const cooldownTime = 3000; // 3초

  // 단어 쌍 생성
  const [cards, setCards] = useState(
    engWords.map((eng, index) => [eng, korWords[index] || "", "0"])
  );
  const [originalCards, setOriginalCards] = useState(cards);
  const [isCheckedView, setIsCheckedView] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [favoriteCards, setFavoriteCards] = useState<{
    [key: number]: boolean;
  }>({});
  const [isBookmark, setIsBookmark] = useState(false);

  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // 자동 재생 관련 상태 및 변수
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoPlay] = useState(3000); // 기본 3초 간격
  const [, setAutoPlayPhase] = useState(0);

  // TTS 로딩 상태
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  // 오디오 버퍼 상태
  const [audioBuffers, setAudioBuffers] = useState<AudioBuffers>({});
  const [isPreparingAudio, setIsPreparingAudio] = useState<boolean>(false);

  // 자동 재생 일시 정지 상태
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 즐겨찾기 알림을 위한 상태
  const [showAlert, setShowAlert] = useState(false);

  // 재생 속도 상태
  const [playbackRate] = useState<number>(0.8);

  // 모든 카드의 TTS 데이터를 미리 준비하는 함수
  async function prepareAllAudioData(): Promise<AudioBuffers> {
    setIsPreparingAudio(true);
    const buffers: AudioBuffers = {};

    try {
      // 각 카드의 한국어와 영어 텍스트에 대해 TTS 데이터 준비
      for (let i = 0; i < cards.length; i++) {
        // 한국어 오디오 준비
        const korResponse = await fetch("/api/quizlet/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cards[i][1] }),
        });

        // 영어 오디오 준비
        const engResponse = await fetch("/api/quizlet/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cards[i][0] }),
        });

        if (korResponse.ok && engResponse.ok) {
          const korBlob = await korResponse.blob();
          const engBlob = await engResponse.blob();

          buffers[`${i}_kor`] = URL.createObjectURL(korBlob);
          buffers[`${i}_eng`] = URL.createObjectURL(engBlob);
        }
      }

      setAudioBuffers(buffers);
    } catch (error) {
      console.error("Error preparing audio data:", error);
    }

    setIsPreparingAudio(false);
    return buffers;
  }

  // 자동 재생 토글 시 오디오 데이터 준비
  const toggleAutoPlay = useCallback(async (): Promise<void> => {
    if (autoPlayButtonCooldown) return;

    setAutoPlayButtonCooldown(true);
    setTimeout(() => setAutoPlayButtonCooldown(false), cooldownTime);

    if (!isAutoPlaying) {
      // 자동 재생 시작
      setIsPreparingAudio(true);

      // 자동 재생 시작 전에 오디오 데이터 준비
      if (Object.keys(audioBuffers).length < cards.length * 2) {
        const buffers = await prepareAllAudioData();
        if (Object.keys(buffers).length < cards.length * 2) {
          // 준비 실패 시 자동 재생 시작하지 않음
          setIsPreparingAudio(false);
          return;
        }
      }

      setIsPreparingAudio(false);
      setIsAutoPlaying(true);
      setIsPaused(false);
      setAutoPlayPhase(0);
      setIsFlipped(false);
      setCurrentCard(0);
    } else {
      // 자동 재생 중지
      stopAutoPlay();
    }
  }, [isAutoPlaying, cards.length, audioBuffers]);

  // 자동 재생 일시 정지 토글
  const togglePause = useCallback((): void => {
    if (pauseButtonCooldown) return;

    setPauseButtonCooldown(true);
    setTimeout(() => setPauseButtonCooldown(false), cooldownTime);

    setIsPaused((prev) => !prev);
  }, [pauseButtonCooldown]);

  // 자동 재생 완전 중지
  const stopAutoPlay = useCallback((): void => {
    if (stopButtonCooldown) return;

    setStopButtonCooldown(true);
    setTimeout(() => setStopButtonCooldown(false), cooldownTime);

    // 현재 타이머 정리
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    // 자동 재생 상태 초기화
    setIsAutoPlaying(false);
    setIsPaused(false);
    setAutoPlayPhase(0);
  }, []);

  // 자동 재생 기능 구현
  useEffect(() => {
    const clearAutoPlayTimer = (): void => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };

    if (isAutoPlaying && !isPaused) {
      const playCurrentAudio = async (): Promise<void> => {
        const audioKey = isFlipped
          ? `${currentCard}_eng`
          : `${currentCard}_kor`;

        if (audioBuffers[audioKey]) {
          const audio = new Audio(audioBuffers[audioKey]);

          // 재생 속도 설정
          audio.playbackRate = playbackRate;

          // 오디오 재생이 끝나면 다음 단계로 진행
          return new Promise<void>((resolve) => {
            audio.onended = (): void => resolve();
            audio.onerror = (): void => resolve(); // 에러 발생해도 계속 진행
            audio.play().catch(() => resolve()); // 재생 실패해도 계속 진행
          });
        }

        return Promise.resolve(); // 오디오가 없으면 즉시 다음 단계로 진행
      };

      const handleAutoPlayStep = async (): Promise<void> => {
        // 현재 오디오 재생
        await playCurrentAudio();

        // 일시정지 상태 확인
        if (isPaused) return;

        // 다음 단계 결정
        if (isFlipped) {
          // 영어 카드를 보여주고 있었다면, 다음 카드로 이동
          setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
          setIsFlipped(false); // 한글 카드로 전환
        } else {
          // 한글 카드를 보여주고 있었다면, 영어 카드로 뒤집기
          setIsFlipped(true);
        }

        // 다음 단계 예약 (일시정지 상태가 아닐 때만)
        if (!isPaused) {
          autoPlayTimerRef.current = setTimeout(() => {
            handleAutoPlayStep();
          }, autoPlay);
        }
      };

      // 첫 단계 시작
      handleAutoPlayStep();
    }

    return clearAutoPlayTimer;
  }, [
    isAutoPlaying,
    isPaused,
    isFlipped,
    currentCard,
    cards.length,
    audioBuffers,
    autoPlay,
  ]);

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
      setCards(originalCards);
      setIsCheckedView(false);
      setIsBookmark(false);
    } else {
      // 전체 보기에서 즐겨찾기 보기로 전환
      const checkedCards = cards.filter((card) => card[2] === "1"); // 즐겨찾기된 카드만 필터링

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
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 폰트 로드
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

    // 한글 폰트 임베딩
    doc.addFileToVFS("NanumGothic-Regular.ttf", fontBase64);
    doc.addFont("NanumGothic-Regular.ttf", "NanumGothic", "normal");
    doc.setFont("NanumGothic");

    // 상단에 제목 추가
    doc.setFontSize(16);
    doc.text(`Quizlet for ${content.date}`, 10, 15);

    doc.setFontSize(10);
    let y = 25; // 시작 Y 위치
    const margin = 10; // 왼쪽 여백
    const maxWidth = 180; // 텍스트 래핑 전 최대 너비

    cards.forEach(([english, korean], index) => {
      // 긴 텍스트를 여러 줄로 분할
      const engLines = doc.splitTextToSize(
        `${index + 1}. ${english}`,
        maxWidth
      );
      const korLines = doc.splitTextToSize(`   → ${korean}`, maxWidth);

      // 영어 줄 인쇄
      engLines.forEach((line: any) => {
        doc.text(line, margin, y);
        y += 5; // 아래로 이동
      });

      // 한국어 줄 인쇄
      korLines.forEach((line: any) => {
        doc.text(line, margin, y);
        y += 5; // 아래로 이동
      });

      y += 5; // 다음 항목 전 여분의 공간

      // 페이지 하단에 도달하면 페이지 나누기
      if (y > 280) {
        doc.addPage();
        y = 10; // 새 페이지에 대한 Y 재설정
      }
    });

    doc.save(`${content.date} ${content.student_name}'s Quizlet.pdf`);
  };

  // TTS 함수
  async function TTSAudio(text: string) {
    setIsTTSLoading(true); // 로딩 시작

    try {
      const response = await fetch("/api/quizlet/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("Error:", await response.text());
        setIsTTSLoading(false); // 에러 발생 시 로딩 종료
        return;
      }

      // 오디오 응답을 blob으로 가져오기
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 오디오 재생
      const audio = new Audio(audioUrl);

      // 재생 속도 설정
      audio.playbackRate = playbackRate;

      // 오디오 재생이 끝나면 로딩 상태 해제
      audio.onended = () => {
        setIsTTSLoading(false);
      };

      // 오디오 재생 실패 시 로딩 상태 해제
      audio.onerror = () => {
        console.error("Audio playback failed");
        setIsTTSLoading(false);
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsTTSLoading(false); // 에러 발생 시 로딩 종료
    }
  }

  const readCardText = useCallback(() => {
    if (isTTSLoading) return; // 이미 로딩 중이면 중복 실행 방지

    const text = isFlipped ? cards[currentCard][0] : cards[currentCard][1];
    TTSAudio(text); // 선택된 텍스트로 TTS 함수 호출
  }, [isFlipped, cards, currentCard, isTTSLoading]);

  const handleNextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
  }, [cards.length]);

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  }, [cards.length]);

  // 스와이프 핸들러 설정
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === "Left" || eventData.dir === "Right") {
        setSwipeDirection(eventData.dir);
        setSwipeOffset(eventData.deltaX);
      }
    },
    onSwiped: (eventData) => {
      const threshold = 75; // 스와이프 임계값

      if (eventData.dir === "Left" && Math.abs(eventData.deltaX) > threshold) {
        handleNextCard();
      } else if (
        eventData.dir === "Right" &&
        Math.abs(eventData.deltaX) > threshold
      ) {
        handlePrevCard();
      }

      // 스와이프 상태 초기화
      setSwipeDirection(null);
      setSwipeOffset(0);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    trackTouch: true,
  });

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

      // 오디오 버퍼 초기화
      setAudioBuffers({});
    }
  }, [content]);

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
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const weekday = currentDate.toLocaleDateString("ko-KR", { weekday: "long" });
  const formattedDate = `${year}년 ${month}월 ${day}일 ${weekday}`;

  // 카드가 없을 경우 빈 화면 표시
  if (cards.length === 0) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
        {/* 상단 헤더 - 모바일 최적화 */}
        <div className="py-4 px-4 bg-white shadow-sm z-10">
          <div className="flex flex-col">
            <span
              className="text-gray-500 text-sm mb-1 flex items-center"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <FiCalendar className="mr-1" />
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </span>
            <h1 className="text-2xl font-bold">등록된 퀴즐렛이 없습니다</h1>
          </div>
        </div>

        {/* 빈 카드 화면 */}
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl text-gray-400">?</span>
          </div>
          <p className="text-gray-500 text-center">
            학생에게 아직 등록된 퀴즐렛이 없습니다.
          </p>
        </div>

        {/* 하단 네비게이션 바 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-30">
          <div className="flex justify-around items-center">
            <button
              onClick={downloadQuizlet}
              disabled={true}
              className="flex items-center justify-center gap-2 p-2 px-4 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm transition-colors"
            >
              PDF <Download className="w-5 h-5" />
            </button>

            <button
              disabled={true}
              className="p-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm transition-colors"
            >
              <HiOutlineSpeakerWave className="w-5 h-5" />
            </button>
            <button
              disabled={true}
              className="p-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm transition-colors"
            >
              <BsBookmarkStar className="w-5 h-5" />
            </button>
            <button
              disabled={true}
              className="p-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm transition-colors"
            >
              <BsShuffle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
      {/* 상단 헤더 - 모바일 최적화 (여백 추가) + PC 버전에서 네비게이션 버튼 추가 */}
      <div className="py-6 px-5 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className="text-gray-500 text-base mb-2 flex items-center border-2 py-1 px-4 rounded-full border-gray-200 cursor-pointer hover:bg-blue-500 hover:text-white"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <FiCalendar className="mr-2" />
              {isNaN(currentDate.getTime()) ? content.date : formattedDate}
            </span>
          </div>
        </div>

        {/* PC 버전에서만 보이는 네비게이션 버튼들 */}
        <div className="flex  md:flex items-center justify-between space-x-3">
          <h1 className="text-2xl font-bold mb-1 ml-1">
            {content.student_name}
          </h1>

          <div className="flex space-x-3">
            {/* 다운로드 버튼 */}
            <div className="relative group">
              <button
                onClick={downloadQuizlet}
                disabled={isAutoPlaying || isPreparingAudio}
                className={`flex items-center justify-center p-2 rounded-full ${
                  isAutoPlaying || isPreparingAudio
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
                } shadow-sm transition-colors`}
                aria-label="단어장 다운로드"
              >
                <Download className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  단어장 다운로드
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0 h-0 w-0"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* TTS 버튼 */}
            <div className="relative group">
              <button
                onClick={readCardText}
                disabled={isTTSLoading || isAutoPlaying || isPreparingAudio}
                className={`p-2 rounded-full ${
                  isTTSLoading
                    ? "bg-blue-500 text-white"
                    : isAutoPlaying || isPreparingAudio
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                } shadow-sm transition-colors`}
                aria-label="단어 읽기"
              >
                {isTTSLoading ? (
                  <LoadingSpinner />
                ) : (
                  <HiOutlineSpeakerWave className="w-5 h-5" />
                )}
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  단어 읽기
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0 h-0 w-0"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 즐겨찾기 버튼 */}
            <div className="relative group">
              <button
                onClick={playCheckedCards}
                disabled={isAutoPlaying || isPreparingAudio}
                className={`p-2 rounded-full ${
                  isAutoPlaying || isPreparingAudio
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                } shadow-sm transition-colors`}
                aria-label="즐겨찾기 단어"
              >
                {isBookmark ? (
                  <BsBookmarkStarFill className="w-5 h-5 text-yellow-500" />
                ) : (
                  <BsBookmarkStar className="w-5 h-5" />
                )}
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  즐겨찾기 단어
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0 h-0 w-0"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 섞기 버튼 */}
            <div className="relative group">
              <button
                onClick={shuffled}
                disabled={isAutoPlaying || isPreparingAudio}
                className={`p-2 rounded-full ${
                  isAutoPlaying || isPreparingAudio
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                } shadow-sm transition-colors`}
                aria-label="단어 섞기"
              >
                <BsShuffle className="w-5 h-5" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  단어 섞기
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0 h-0 w-0"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-1 rounded-full"
          style={{
            width: `${((currentCard + 1) / cards.length) * 100}%`,
          }}
        ></div>
      </div>

      {/* 카드 컨텐츠 영역 - 화면 꽉 차게 비율 맞춤 */}
      <div
        className="flex-grow flex items-center justify-center px-4 pb-2 pt-2"
        {...(!isAutoPlaying && !isPreparingAudio ? swipeHandlers : {})}
      >
        {/* 카드 내용 (화면 꽉 차게) */}
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={{
            x: swipeOffset,
            opacity: swipeDirection ? 0.9 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div
            onClick={() =>
              !isAutoPlaying && !isPreparingAudio && setIsFlipped(!isFlipped)
            }
            className={`w-full h-[60vh] flex flex-col items-center justify-center py-4 ${
              isAutoPlaying
                ? "bg-purple-50"
                : isPreparingAudio
                ? "bg-gray-50"
                : "bg-white active:bg-sky-50"
            } rounded-2xl shadow-md ${
              isFlipped
                ? "text-blue-600 border-2 border-sky-200"
                : "border border-gray-200"
            } ${isAutoPlaying && !isFlipped ? "border-purple-300" : ""}
     ${isAutoPlaying && isFlipped ? "border-pink-200 bg-pink-50" : ""}
     ${isCheckedView ? "bg-[#f0f8ff]" : ""}`}
          >
            {isPreparingAudio ? (
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-8 h-8 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
                <p className="text-xl font-medium text-gray-500">
                  오디오 준비 중...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center px-6 flex-grow flex flex-col items-center justify-center">
                  {/* 메인 카드 텍스트 */}
                  <h2 className="text-4xl sm:text-5xl font-bold mb-8">
                    {isFlipped ? cards[currentCard][0] : cards[currentCard][1]}
                  </h2>

                  {/*  텍스트 */}
                  <p className={`text-gray-400 text-sm`}>
                    {isAutoPlaying
                      ? isPaused
                        ? "일시정지됨"
                        : `자동재생 중 ${isFlipped ? "영어" : "한글"}`
                      : `화면을 탭하여 ${isFlipped ? "한국어" : "영어"}로 전환`}
                  </p>
                </div>

                {/* 카드 진행 상황 인디케이터 */}
                <div className="mt-4 px-6 w-full">
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span></span>
                    <span className="font-semibold text-xs border-2 border-blue-500 px-3 py-1.5 rounded-full bg-white text-blue-500">
                      {currentCard + 1} / {cards.length}
                    </span>
                    <span></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* 탐색 컨트롤 - 큰 이전/다음 버튼 */}
      <div className="flex justify-between items-center px-6 py-5 bg-white border-t border-gray-100">
        <button
          onClick={handlePrevCard}
          disabled={isAutoPlaying || isPreparingAudio}
          className={`p-3 rounded-full ${
            isAutoPlaying || isPreparingAudio
              ? "bg-gray-100 text-gray-300"
              : "bg-blue-100 text-blue-600 active:bg-blue-200"
          } transition-colors`}
        >
          <IoIosArrowBack className="text-3xl" />
        </button>

        <div className="flex space-x-3">
          {/* 즐겨찾기 버튼 - 크기 증가 */}
          <button
            onClick={checkCurrentCard}
            disabled={isAutoPlaying || isPreparingAudio}
            className={`p-3 rounded-full ${
              isAutoPlaying || isPreparingAudio
                ? "bg-gray-300 text-gray-500"
                : favoriteCards[currentCard]
                ? "bg-yellow-100 text-yellow-500"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            } transition-colors`}
          >
            {favoriteCards[currentCard] ? (
              <BsStarFill className="text-2xl" />
            ) : (
              <BsStar className="text-2xl" />
            )}
          </button>

          {/* 재생 버튼 변경 - 자동 재생 시 일시정지 버튼으로 전환 */}
          <button
            onClick={isAutoPlaying ? togglePause : toggleAutoPlay}
            disabled={
              isPreparingAudio || autoPlayButtonCooldown || pauseButtonCooldown
            }
            className={`p-3 rounded-full ${
              isPreparingAudio || autoPlayButtonCooldown || pauseButtonCooldown
                ? "bg-gray-300 text-gray-500"
                : isAutoPlaying
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            } transition-colors relative`}
          >
            {isPreparingAudio ? (
              <LoadingSpinner />
            ) : pauseButtonCooldown ? (
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="text-blue-300"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="62.83"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="62.83"
                      dur="3s"
                      fill="freeze"
                    />
                  </circle>
                </svg>
              </div>
            ) : isAutoPlaying ? (
              isPaused ? (
                <BsPlayFill className="text-2xl" />
              ) : (
                <BsPauseFill className="text-2xl" />
              )
            ) : (
              <BsPlayFill className="text-2xl" />
            )}
          </button>

          {/* 정지 버튼 - 자동 재생 중에만 표시 */}
          {isAutoPlaying && (
            <button
              onClick={stopAutoPlay}
              disabled={stopButtonCooldown}
              className={`p-3 rounded-full ${
                stopButtonCooldown
                  ? "bg-gray-400 text-white"
                  : "bg-gray-700 text-white"
              } transition-colors`}
            >
              {stopButtonCooldown ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="text-gray-300"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="62.83"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="62.83"
                        dur="3s"
                        fill="freeze"
                      />
                    </circle>
                  </svg>
                </div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                </svg>
              )}
            </button>
          )}
        </div>

        <button
          onClick={handleNextCard}
          disabled={isAutoPlaying || isPreparingAudio}
          className={`p-3 rounded-full ${
            isAutoPlaying || isPreparingAudio
              ? "bg-gray-100 text-gray-300"
              : "bg-blue-100 text-blue-600 active:bg-blue-200"
          } transition-colors`}
        >
          <IoIosArrowForward className="text-3xl" />
        </button>
      </div>

      {/* 모바일 탭 바 네비게이션 */}
      {/* <div className="md:hidden bg-white border-t border-gray-200 py-3">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={downloadQuizlet}
            disabled={isAutoPlaying || isPreparingAudio}
            className="flex flex-col items-center justify-center w-1/4 py-2"
          >
            <Download
              className={`w-6 h-6 mb-1 ${
                isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            <span
              className={`text-xs ${
                isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              다운로드
            </span>
          </button>

          <button
            onClick={readCardText}
            disabled={isTTSLoading || isAutoPlaying || isPreparingAudio}
            className="flex flex-col items-center justify-center w-1/4 py-2"
          >
            <HiOutlineSpeakerWave
              className={`w-6 h-6 mb-1 ${
                isTTSLoading
                  ? "text-blue-500"
                  : isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            <span
              className={`text-xs ${
                isTTSLoading
                  ? "text-blue-500"
                  : isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              듣기
            </span>
          </button>

          <button
            onClick={playCheckedCards}
            disabled={isAutoPlaying || isPreparingAudio}
            className="flex flex-col items-center justify-center w-1/4 py-2"
          >
            {isBookmark ? (
              <BsBookmarkStarFill
                className={`w-6 h-6 mb-1 ${
                  isAutoPlaying || isPreparingAudio
                    ? "text-gray-400"
                    : "text-yellow-500"
                }`}
              />
            ) : (
              <BsBookmarkStar
                className={`w-6 h-6 mb-1 ${
                  isAutoPlaying || isPreparingAudio
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              />
            )}
            <span
              className={`text-xs ${
                isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : isBookmark
                  ? "text-yellow-500"
                  : "text-gray-600"
              }`}
            >
              즐겨찾기
            </span>
          </button>

          <button
            onClick={shuffled}
            disabled={isAutoPlaying || isPreparingAudio}
            className="flex flex-col items-center justify-center w-1/4 py-2"
          >
            <BsShuffle
              className={`w-6 h-6 mb-1 ${
                isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            <span
              className={`text-xs ${
                isAutoPlaying || isPreparingAudio
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              섞기
            </span>
          </button>
        </div>
      </div> */}

      {/* 날짜 선택 팝업 */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] max-w-md max-h-[80%] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">날짜 선택</h3>
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-4">
              {allCards.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  이용 가능한 날짜가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {allCards.map((item, idx) => (
                    <button
                      key={item._id}
                      onClick={() => handleDateSelect(idx)}
                      className={`w-full text-left px-4 py-3 ${
                        idx === currentIndex
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      } rounded-lg transition-colors flex justify-between items-center`}
                    >
                      <span>
                        {isNaN(new Date(item.date).getTime())
                          ? item.date
                          : new Date(item.date).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              weekday: "long",
                            })}
                      </span>
                      {idx === currentIndex && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 즐겨찾기 없음 알림창 */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white px-6 py-5 rounded-xl shadow-xl"
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
              <p className="text-center text-gray-800">
                즐겨찾기한 단어가 없습니다.
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
export { QuizletCardContent };
