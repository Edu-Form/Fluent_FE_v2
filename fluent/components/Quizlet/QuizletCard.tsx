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
import { usePathname } from "next/navigation";

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
  const pathname = usePathname(); // 현재 URL 경로 가져오기
  const isStudentPage = pathname?.includes("/teacher"); // /student 포함 여부 체크

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
  // async function prepareAllAudioData(): Promise<AudioBuffers> {
  //   setIsPreparingAudio(true);
  //   const buffers: AudioBuffers = {};

  //   try {
  //     // 각 카드의 한국어와 영어 텍스트에 대해 TTS 데이터 준비
  //     for (let i = 0; i < cards.length; i++) {
  //       // 한국어 오디오 준비
  //       const korResponse = await fetch("/api/quizlet/tts", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ text: cards[i][1] }),
  //       });

  //       // 영어 오디오 준비
  //       const engResponse = await fetch("/api/quizlet/tts", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ text: cards[i][0] }),
  //       });

  //       if (korResponse.ok && engResponse.ok) {
  //         const korBlob = await korResponse.blob();
  //         const engBlob = await engResponse.blob();

  //         buffers[`${i}_kor`] = URL.createObjectURL(korBlob);
  //         buffers[`${i}_eng`] = URL.createObjectURL(engBlob);
  //       }
  //     }

  //     setAudioBuffers(buffers);
  //   } catch (error) {
  //     console.error("Error preparing audio data:", error);
  //   }

  //   setIsPreparingAudio(false);
  //   return buffers;
  // }

  async function prepareAllAudioData(): Promise<AudioBuffers> {
    setIsPreparingAudio(true);
    const buffers: AudioBuffers = {};

    try {
      const promises = cards.map((card, i) => {
        const engFetch = fetch("/api/quizlet/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: card[0] }), // English
        }).then((res) =>
          res.blob().then((blob) => {
            buffers[`${i}_eng`] = URL.createObjectURL(blob);
          })
        );

        const korFetch = fetch("/api/quizlet/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: card[1] }), // Korean
        }).then((res) =>
          res.blob().then((blob) => {
            buffers[`${i}_kor`] = URL.createObjectURL(blob);
          })
        );

        return Promise.all([engFetch, korFetch]);
      });

      await Promise.all(promises.flat());

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
            {isStudentPage && (
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
            )}
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
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* 헤더 영역 - 반응형으로 개선 */}
      <div className="py-3 px-3 sm:py-4 sm:px-4 bg-white shadow-sm z-10">
        {/* 날짜 선택 및 학생 이름 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-0">
          {isStudentPage && (
            <span
              className="text-gray-500 text-sm flex items-center border border-gray-200 rounded-full py-1 px-3 mb-2 sm:mb-0 cursor-pointer hover:bg-blue-500 hover:text-white max-w-fit"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <FiCalendar className="mr-1" />
              <span className="truncate">
                {isNaN(currentDate.getTime()) ? content.date : formattedDate}
              </span>
            </span>
          )}
        </div>

        {/* 기능 버튼들 - 모바일에서는 공간 절약을 위해 크기 축소 */}
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-xl font-bold">{content.student_name}</h1>
          <div className="flex space-x-2">
            <button
              onClick={downloadQuizlet}
              disabled={isAutoPlaying || isPreparingAudio}
              className={`p-1.5 sm:p-2 rounded-full ${
                isAutoPlaying || isPreparingAudio
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
              } shadow-sm`}
              title="단어장 다운로드"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={readCardText}
              disabled={isTTSLoading || isAutoPlaying || isPreparingAudio}
              className={`p-1.5 sm:p-2 rounded-full ${
                isTTSLoading
                  ? "bg-blue-500 text-white"
                  : isAutoPlaying || isPreparingAudio
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              } shadow-sm`}
              title="단어 읽기"
            >
              {isTTSLoading ? (
                <LoadingSpinner />
              ) : (
                <HiOutlineSpeakerWave className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <button
              onClick={playCheckedCards}
              disabled={isAutoPlaying || isPreparingAudio}
              className={`p-1.5 sm:p-2 rounded-full ${
                isAutoPlaying || isPreparingAudio
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              } shadow-sm`}
              title="즐겨찾기 단어"
            >
              {isBookmark ? (
                <BsBookmarkStarFill
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isBookmark ? "text-yellow-500" : ""
                  }`}
                />
              ) : (
                <BsBookmarkStar className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <button
              onClick={shuffled}
              disabled={isAutoPlaying || isPreparingAudio}
              className={`p-1.5 sm:p-2 rounded-full ${
                isAutoPlaying || isPreparingAudio
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              } shadow-sm`}
              title="단어 섞기"
            >
              <BsShuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-blue-500 h-1"
          style={{
            width: `${((currentCard + 1) / cards.length) * 100}%`,
          }}
        ></div>
      </div>

      <div className="flex-grow flex flex-col  justify-center p-4">
        {" "}
        {/* 카드 컨텐츠 영역 - 반응형 높이 조정 */}
        <div
          className="flex-col flex items-center justify-center p-2 sm:p-4 min-h-0 relative"
          {...(!isAutoPlaying && !isPreparingAudio ? swipeHandlers : {})}
        >
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
              className={`w-full flex-1 flex flex-col items-center justify-center py-3 px-2 sm:py-4 sm:px-4 ${
                isAutoPlaying
                  ? "bg-purple-50"
                  : isPreparingAudio
                  ? "bg-gray-50"
                  : "bg-white active:bg-sky-50"
              } rounded-xl shadow-md ${
                isFlipped
                  ? "text-blue-600 border-2 border-sky-200"
                  : "border border-gray-200"
              } ${isAutoPlaying && !isFlipped ? "border-purple-300" : ""}
            ${isAutoPlaying && isFlipped ? "border-pink-200 bg-pink-50" : ""}
            ${isCheckedView ? "bg-[#f0f8ff]" : ""}`}
              style={{ minHeight: "40vh", maxHeight: "60vh" }}
            >
              {isPreparingAudio ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                  <p className="text-base sm:text-xl font-medium text-gray-500">
                    오디오 준비 중...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center px-2 sm:px-6 flex-grow flex flex-col items-center justify-center">
                    {/* 메인 카드 텍스트 - 반응형 폰트 크기 */}
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-8 break-words text-center max-w-full">
                      {isFlipped
                        ? cards[currentCard][0]
                        : cards[currentCard][1]}
                    </h2>

                    {/* 안내 텍스트 */}
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {isAutoPlaying
                        ? isPaused
                          ? "일시정지됨"
                          : `자동재생 중 ${isFlipped ? "영어" : "한글"}`
                        : `화면을 탭하여 ${
                            isFlipped ? "한국어" : "영어"
                          }로 전환`}
                    </p>
                  </div>
                </>
              )}

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
            </div>
          </motion.div>

          {/* 탐색 컨트롤 - 모바일 네비게이션 스타일 */}

          <div className="flex w-full mt-6 items-center justify-center">
            {/* 이전 버튼 */}
            <button
              onClick={handlePrevCard}
              disabled={isAutoPlaying || isPreparingAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isAutoPlaying || isPreparingAudio
                  ? "bg-gray-200 text-gray-400"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300"
              } transition-colors`}
            >
              <IoIosArrowBack className="text-2xl" />
            </button>

            {/* 중앙 컨트롤 그룹 */}
            <div className="flex items-center mx-8 space-x-4">
              {/* 즐겨찾기 버튼 */}
              <button
                onClick={checkCurrentCard}
                disabled={isAutoPlaying || isPreparingAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAutoPlaying || isPreparingAudio
                    ? "bg-gray-200 text-gray-400"
                    : favoriteCards[currentCard]
                    ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                } transition-colors`}
              >
                {favoriteCards[currentCard] ? (
                  <BsStarFill className="text-xl" />
                ) : (
                  <BsStar className="text-xl" />
                )}
              </button>

              {/* 재생/일시정지 버튼 */}
              <button
                onClick={isAutoPlaying ? togglePause : toggleAutoPlay}
                disabled={
                  isPreparingAudio ||
                  autoPlayButtonCooldown ||
                  pauseButtonCooldown
                }
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isPreparingAudio ||
                  autoPlayButtonCooldown ||
                  pauseButtonCooldown
                    ? "bg-gray-200 text-gray-400"
                    : isAutoPlaying
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-colors`}
              >
                {isPreparingAudio ? (
                  <LoadingSpinner />
                ) : isAutoPlaying ? (
                  isPaused ? (
                    <BsPlayFill className="text-xl" />
                  ) : (
                    <BsPauseFill className="text-xl" />
                  )
                ) : (
                  <BsPlayFill className="text-xl" />
                )}
              </button>

              {/* 정지 버튼 - 자동 재생 중에만 표시 */}
              {isAutoPlaying && (
                <button
                  onClick={stopAutoPlay}
                  disabled={stopButtonCooldown}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    stopButtonCooldown
                      ? "bg-gray-300 text-gray-500"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  } transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                  </svg>
                </button>
              )}
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={handleNextCard}
              disabled={isAutoPlaying || isPreparingAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isAutoPlaying || isPreparingAudio
                  ? "bg-gray-200 text-gray-400"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300"
              } transition-colors`}
            >
              <IoIosArrowForward className="text-2xl" />
            </button>
          </div>
        </div>
      </div>

      {/* 모달 다이얼로그들 - z-index 및 포지셔닝 조정 */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] max-w-md max-h-[80%] overflow-y-auto">
            {/* 모달 내용 */}
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
            {/* 날짜 목록 */}
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
                      <span className="truncate">
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
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>
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
