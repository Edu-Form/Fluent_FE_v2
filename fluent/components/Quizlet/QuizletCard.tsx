"use client";
import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FiCalendar } from "react-icons/fi";
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import { RiHome6Fill } from "react-icons/ri";
import {
  BsShuffle,
  BsStar,
  BsStarFill,
  BsBookmarkStar,
  BsBookmarkStarFill,
  BsPlayFill,
  BsPauseFill,
} from "react-icons/bs";
import { Download, Copy, Check } from "lucide-react";
import { jsPDF } from "jspdf";
import { useSwipeable } from "react-swipeable";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // 현재 URL 경로 가져오기
  const isStudentPage = pathname?.includes("/teacher"); // /student 포함 여부 체크

  // URL 파라미터 안전하게 가져오기
  const getParam = (name: string): string => {
    try {
      return searchParams?.get(name) || "";
    } catch (error) {
      console.error(`파라미터 가져오기 오류 (${name}):`, error);
      return "";
    }
  };
  const user = getParam("user");
  const type = getParam("type");
  const user_id = getParam("id");

  const engWords = content.eng_quizlet || [];
  const korWords = content.kor_quizlet || [];

  // 복사 기능 관련 상태
  const [isCopied, setIsCopied] = useState(false);

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
  const [audioBuffers] = useState<AudioBuffers>({});
  const [isPreparingAudio] = useState<boolean>(false);

  // 자동 재생 일시 정지 상태
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 즐겨찾기 알림을 위한 상태
  const [showAlert, setShowAlert] = useState(false);

  // 재생 속도 상태
  const [playbackRate] = useState<number>(0.8);

  // Replace the prepareAllAudioData function with this simpler version that doesn't pre-load
  // 현재 카드 텍스트 복사 함수
  const copyCurrentText = async () => {
    try {
      const currentText = isFlipped
        ? cards[currentCard][0]
        : cards[currentCard][1];
      await navigator.clipboard.writeText(currentText);
      setIsCopied(true);

      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("복사 실패:", error);
      // 복사 실패 시 fallback으로 선택 영역 생성
      const textArea = document.createElement("textarea");
      textArea.value = isFlipped
        ? cards[currentCard][0]
        : cards[currentCard][1];
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  // Add component unmounted flag - CRITICAL ADDITION
  const componentUnmountedRef = useRef(false);

  // Replace the toggleAutoPlay function
  const toggleAutoPlay = useCallback(async (): Promise<void> => {
    if (autoPlayButtonCooldown) return;

    setAutoPlayButtonCooldown(true);
    setTimeout(() => setAutoPlayButtonCooldown(false), cooldownTime);

    if (!isAutoPlaying) {
      // Start autoplay immediately without pre-loading audio
      setIsAutoPlaying(true);
      setIsPaused(false);
      setAutoPlayPhase(0);
      setIsFlipped(false);
      setCurrentCard(0);
    } else {
      // Stop autoplay
      stopAutoPlay();
    }
  }, [isAutoPlaying, cooldownTime]);

  // Add audio control ref to prevent multiple simultaneous audio
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 자동 재생 일시 정지 토글
  const togglePause = useCallback((): void => {
    if (pauseButtonCooldown) return;

    setPauseButtonCooldown(true);
    setTimeout(() => setPauseButtonCooldown(false), cooldownTime);

    setIsPaused((prev) => !prev);
  }, [pauseButtonCooldown]);

  // Update the stopAutoPlay function to also stop current audio
  const stopAutoPlay = useCallback((): void => {
    if (stopButtonCooldown) return;

    setStopButtonCooldown(true);
    setTimeout(() => setStopButtonCooldown(false), cooldownTime);

    // Clear any existing timer
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Reset all auto-play related states
    setIsAutoPlaying(false);
    setIsPaused(false);
    setAutoPlayPhase(0);

    setTimeout(() => {
      setIsFlipped(false);
    }, 100);
  }, [stopButtonCooldown, cooldownTime]);

  useEffect(() => {
    const engWords = content.eng_quizlet || [];
    const korWords = content.kor_quizlet || [];
    const newCards = engWords.map((eng, index) => [
      eng,
      korWords[index] || "",
      "0",
    ]);
    setCards(newCards);
    setOriginalCards(newCards);
    setCurrentCard(0);
    setIsFlipped(false);
  }, [content]);

  // CRITICAL FIX: Replace the entire auto-play useEffect with proper cleanup checks
  useEffect(() => {
    const clearAutoPlayTimer = (): void => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };

    // Stop any currently playing audio when autoplay stops
    if (!isAutoPlaying && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (isAutoPlaying && !isPaused && !componentUnmountedRef.current) {
      const handleAutoPlayStep = async (): Promise<void> => {
        // CRITICAL: Check if component is still mounted and autoplay is still active
        if (componentUnmountedRef.current || !isAutoPlaying || isPaused) {
          return;
        }

        const text = isFlipped ? cards[currentCard][0] : cards[currentCard][1];

        try {
          // Stop any previously playing audio
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
          }

          // CRITICAL: Check again before making API call
          if (componentUnmountedRef.current || !isAutoPlaying || isPaused) {
            return;
          }

          const response = await fetch("/api/quizlet/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          // CRITICAL: Check again after API call
          if (componentUnmountedRef.current || !isAutoPlaying || isPaused) {
            return;
          }

          if (response.ok) {
            const audioBlob = await response.blob();

            // CRITICAL: Check again after blob creation
            if (componentUnmountedRef.current || !isAutoPlaying || isPaused) {
              return;
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            // Store reference to current audio
            currentAudioRef.current = audio;

            audio.preload = "auto";
            audio.playbackRate = playbackRate;
            audio.volume = 1.0;

            await new Promise<void>((resolve) => {
              let hasResolved = false;

              const cleanup = () => {
                if (!hasResolved) {
                  hasResolved = true;
                  audio.removeEventListener("canplay", onCanPlay);
                  audio.removeEventListener("ended", onEnded);
                  audio.removeEventListener("error", onError);
                  audio.removeEventListener("loadstart", onLoadStart);
                  audio.removeEventListener("loadeddata", onLoadedData);
                  URL.revokeObjectURL(audioUrl);
                  if (currentAudioRef.current === audio) {
                    currentAudioRef.current = null;
                  }
                  resolve();
                }
              };

              const onLoadStart = () => {
                console.log("Audio loading started");
              };

              const onLoadedData = () => {
                console.log("Audio data loaded, duration:", audio.duration);
              };

              const onCanPlay = () => {
                // CRITICAL: Triple-check we're still in autoplay mode before playing
                if (
                  componentUnmountedRef.current ||
                  !isAutoPlaying ||
                  isPaused
                ) {
                  cleanup();
                  return;
                }

                console.log("Audio can play, starting playback");
                audio.play().catch((e) => {
                  console.warn("Audio play failed:", e);
                  cleanup();
                });
              };

              const onEnded = () => {
                console.log("Audio playback ended normally");
                cleanup();
              };

              const onError = (e: any) => {
                console.warn("Audio error:", e);
                cleanup();
              };

              audio.addEventListener("loadstart", onLoadStart);
              audio.addEventListener("loadeddata", onLoadedData);
              audio.addEventListener("canplay", onCanPlay);
              audio.addEventListener("ended", onEnded);
              audio.addEventListener("error", onError);

              // Extended timeout - but should rely on 'ended' event primarily
              setTimeout(() => {
                if (!hasResolved) {
                  console.warn(
                    "Audio timeout after 20 seconds - this should be rare"
                  );
                  cleanup();
                }
              }, 20000); // Increased to 20 seconds for very long audio

              if (audio.readyState >= 2) {
                onCanPlay();
              } else {
                audio.load();
              }
            });
          } else {
            console.warn("TTS request failed, skipping audio");
            // Continue without audio after a short delay
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.warn("Audio error, continuing without sound:", error);
          // Continue autoplay without audio after a short delay
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // CRITICAL: Check again if still in autoplay mode before proceeding
        if (componentUnmountedRef.current || !isAutoPlaying || isPaused) {
          return;
        }

        // Move to next step
        if (isFlipped) {
          // Was showing English, move to next card
          setCurrentCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
          setIsFlipped(false);
        } else {
          // Was showing Korean, flip to English
          setIsFlipped(true);
        }

        // Schedule next step with a small delay to allow UI update
        if (!componentUnmountedRef.current && isAutoPlaying && !isPaused) {
          autoPlayTimerRef.current = setTimeout(() => {
            // CRITICAL: Final check before recursive call
            if (!componentUnmountedRef.current) {
              handleAutoPlayStep();
            }
          }, 500); // Short delay before next audio
        }
      };

      // Start the auto-play sequence
      handleAutoPlayStep();
    }

    return clearAutoPlayTimer;
  }, [
    isAutoPlaying,
    isPaused,
    isFlipped,
    currentCard,
    cards.length,
    autoPlay,
    playbackRate,
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
  async function TTSAudio(text: string, skipOnError: boolean = false) {
    if (isTTSLoading) return;

    setIsTTSLoading(true);

    try {
      const response = await fetch("/api/quizlet/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.warn("TTS Error:", response.status, response.statusText);
        if (skipOnError) {
          setIsTTSLoading(false);
          return;
        }
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Enhanced audio settings
      audio.preload = "auto";
      audio.playbackRate = playbackRate;
      audio.volume = 1.0;

      // Wait for audio to fully play
      await new Promise<void>((resolve) => {
        let hasEnded = false;

        const cleanup = () => {
          if (!hasEnded) {
            hasEnded = true;
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            URL.revokeObjectURL(audioUrl);
            setIsTTSLoading(false);
            resolve();
          }
        };

        const onCanPlay = () => {
          console.log("Manual TTS audio ready, duration:", audio.duration);
          audio.play().catch((e) => {
            console.warn("Manual audio play failed:", e);
            cleanup();
          });
        };

        const onEnded = () => {
          console.log("Manual TTS audio ended");
          cleanup();
        };

        const onError = (e: any) => {
          console.warn("Manual TTS audio error:", e);
          cleanup();
        };

        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);

        // Longer timeout for manual playback (user initiated)
        setTimeout(() => {
          if (!hasEnded) {
            console.warn("Manual audio timeout after 15 seconds");
            cleanup();
          }
        }, 15000);

        if (audio.readyState >= 2) {
          onCanPlay();
        } else {
          audio.load();
        }
      });
    } catch (error) {
      console.error("TTS error:", error);
      setIsTTSLoading(false);
      if (!skipOnError) {
        throw error;
      }
    }
  }

  // Update the readCardText function to use the improved TTS
  const readCardText = useCallback(() => {
    if (isTTSLoading) return;

    const text = isFlipped ? cards[currentCard][0] : cards[currentCard][1];
    TTSAudio(text, false); // Don't skip on error for manual playback
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

  // CRITICAL CLEANUP EFFECT - This must be the LAST useEffect
  useEffect(() => {
    // Set mounted flag
    componentUnmountedRef.current = false;

    return () => {
      // CRITICAL: Set unmounted flag FIRST
      componentUnmountedRef.current = true;

      // Cleanup function to run when component unmounts
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }

      // Clean up any remaining audio blob URLs
      Object.values(audioBuffers).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });

      // Force stop all autoplay states
      setIsAutoPlaying(false);
      setIsPaused(false);
    };
  }, []);

  const handleDateSelect = (index: number) => {
    if (onSelectCard) {
      // 다른 날짜 카드로 변경 시 현재 상태 초기화
      setIsFlipped(false);
      setCurrentCard(0);
      setIsCheckedView(false);
      setIsBookmark(false);

      // CRITICAL: Stop autoplay when switching cards
      stopAutoPlay();

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
  {
    /* 카드가 있을 경우 */
  }
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* 헤더 영역 - 반응형으로 개선 */}
      <div className="py-3 px-3 sm:py-4 sm:px-4 bg-white shadow-sm z-10">
        {/* 날짜 선택 및 학생 이름 - 학생은 x */}
        <div className="flex  sm:flex-row items-center justify-between mb-2 sm:mb-0">
          {isStudentPage && (
            <span
              className="text-gray-500 text-sm flex items-center border border-gray-200 rounded-full py-1 px-3   cursor-pointer hover:bg-blue-500 hover:text-white max-w-fit"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <FiCalendar className="mr-1" />
              <span className="truncate">
                {isNaN(currentDate.getTime()) ? content.date : formattedDate}
              </span>
            </span>
          )}
          {/*홈 닫기 버튼 - 학생은 x*/}
          {isStudentPage && (
            <button
              onClick={() => {
                const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                  user
                )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                  user_id
                )}`;
                router.push(redirectUrl);
              }}
              className="p-2 rounded-lg hover:bg-[#F2F4F8] transition-colors"
              aria-label="닫기"
            >
              <RiHome6Fill className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>

        {/* 기능 버튼들  */}
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

      <div className="flex-grow flex flex-col justify-center p-4">
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
              className={`w-full flex-1 flex flex-col items-center justify-center py-3 px-2 sm:py-4 sm:px-4 relative ${
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
              {/* 카드 내부 우상단 버튼들 */}
              <div className="absolute top-3 right-3 flex space-x-2 z-10">
                {/* 즐겨찾기 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 클릭 이벤트 방지
                    checkCurrentCard();
                  }}
                  disabled={isAutoPlaying || isPreparingAudio}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${
                    isAutoPlaying || isPreparingAudio
                      ? "bg-gray-200/70 text-gray-400"
                      : favoriteCards[currentCard]
                      ? "bg-yellow-100/90 text-yellow-500 hover:bg-yellow-200/90"
                      : "bg-white/70 text-gray-500 hover:bg-white/90"
                  } transition-colors shadow-sm`}
                  title="즐겨찾기"
                >
                  {favoriteCards[currentCard] ? (
                    <BsStarFill className="text-lg" />
                  ) : (
                    <BsStar className="text-lg" />
                  )}
                </button>

                {/* 복사 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 클릭 이벤트 방지
                    copyCurrentText();
                  }}
                  disabled={isAutoPlaying || isPreparingAudio}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${
                    isAutoPlaying || isPreparingAudio
                      ? "bg-gray-200/70 text-gray-400"
                      : isCopied
                      ? "bg-green-100/90 text-green-600"
                      : "bg-white/70 text-gray-500 hover:bg-white/90"
                  } transition-colors shadow-sm`}
                  title="현재 텍스트 복사"
                >
                  {isCopied ? (
                    <Check className="text-lg" />
                  ) : (
                    <Copy className="text-lg" />
                  )}
                </button>
              </div>

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
              <div className=" px-6 w-full">
                <div className="flex justify-between mb-6 text-xs text-gray-500">
                  <span></span>
                  <span className="font-semibold text-xs border-2 border-blue-500 px-3 py-1.5 rounded-full bg-white text-blue-500">
                    {currentCard + 1} / {cards.length}
                  </span>
                  <span></span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 하단 컨트롤 영역 */}
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
              {/* 읽기 버튼 */}
              <button
                onClick={readCardText}
                disabled={isTTSLoading || isAutoPlaying || isPreparingAudio}
                className={`w-14 h-14 flex items-center justify-center rounded-full ${
                  isTTSLoading
                    ? "bg-blue-500 text-white"
                    : isAutoPlaying || isPreparingAudio
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200"
                } shadow-sm transition-colors`}
                title="단어 읽기"
              >
                {isTTSLoading ? (
                  <LoadingSpinner />
                ) : (
                  <HiOutlineSpeakerWave className="text-2xl" />
                )}
              </button>

              {/* 자동재생 버튼 */}
              <button
                onClick={isAutoPlaying ? togglePause : toggleAutoPlay}
                disabled={
                  isPreparingAudio ||
                  autoPlayButtonCooldown ||
                  pauseButtonCooldown
                }
                className={`w-20 h-14 rounded-full flex items-center justify-center ${
                  isPreparingAudio ||
                  autoPlayButtonCooldown ||
                  pauseButtonCooldown
                    ? "bg-gray-200 text-gray-400"
                    : isAutoPlaying
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                } transition-colors shadow-sm`}
                title={
                  isAutoPlaying ? (isPaused ? "재생" : "일시정지") : "자동 재생"
                }
              >
                {isPreparingAudio ? (
                  <LoadingSpinner />
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    stopButtonCooldown
                      ? "bg-gray-300 text-gray-500"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  } transition-colors shadow-sm`}
                  title="정지"
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
