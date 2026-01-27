"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/navigation"; // 네비게이션 컴포넌트 import
import StudentPopup from "@/components/StudentPopup";
import { X, History } from "lucide-react";
import { MdDiamond } from "react-icons/md";

// 동적 컴포넌트 로딩 추가
const Alert = dynamic(() => import("@/components/StudentAlert"), {
  ssr: false,
});
// 이미지 캐러셀 컴포넌트 import (동적으로 로드)
const ImageCarousel = dynamic(() => import("@/components/ImageCarousel"), {
  ssr: false,
});

// 로딩 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-[70px]"></div>
);

const CarouselLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-48"></div>
);

const ImageLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-40"></div>
);

interface ScheduleData {
  date: string;
  duration: number;
  room_name: string;
  student_name: string;
  teacher_name: string;
  time: number;
}

interface HomeworkData {
  _id?: string;
  student_name?: string;
  class_date?: string;
  date?: string;
  original_text?: string;
  homework?: string;
  eng_quizlet?: string[];
  kor_quizlet?: string[];
}


function next_schedule(data: any) {
  const today = new Date();
  const formattedToday = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (const item of data) {
    if (item.date >= formattedToday) {
      return item;
    }
  }

  return null;
}




const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const url_data = `user=${user}&type=${type}&id=${user_id}`;

  const quizlet_url_data = `user=${user}&type=${type}&id=${user_id}&func=quizlet`;
  const diary_url_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;
  const diary_note_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;
  const [userCredits, setUserCredits] = useState<string | number>("");
  const [, setNext_schedule_data] = useState<ScheduleData | null>(null);
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  function Payment() {
  router.push(`/student/payment?${url_data}`);
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user_id) return;
      try {
        const URL = `/api/user/${user_id}`;
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        setUserCredits(data.credits);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchScheduleData = async () => {
      try {
        const URL = `/api/schedules/${type}/${user}`;
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        const next = next_schedule(data);
        setNext_schedule_data(next);
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      }
    };

    if (user_id) {
      fetchData();
    }

    if (user && type) {
      fetchScheduleData();
    }
  }, [user_id, user, type]);

  // 숙제 데이터 가져오기
  useEffect(() => {
    const fetchHomework = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/homework/${user}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          // 404 means no homework found, which is okay
          if (response.status === 404) {
            setHomeworkData(null);
            setIsLoading(false);
            return;
          }
          throw new Error("숙제 데이터를 가져오는데 실패했습니다.");
        }

        const data = await response.json();

        if (!data || typeof data !== "object") {
          setHomeworkData(null);
        } else {
          setHomeworkData({
            homework: data?.homework ?? "",
            class_date: data?.class_date ?? "",
            original_text: data?.original_text ?? "",
            eng_quizlet: data?.eng_quizlet ?? [],
            kor_quizlet: data?.kor_quizlet ?? [],
          });
        }

      } catch (err) {
        console.error("숙제 데이터 로딩 오류:", err);
        setError("숙제 데이터를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomework();
  }, [user]);

  function Quizlet() {
    router.push(`/student/quizlet?${quizlet_url_data}`);
  }
  function Diary() {
    router.push(`/student/diary?${diary_url_data}`);
  }
  function Schedule() {
    router.push(`/student/schedule?${url_data}`);
  }
  function Write() {
    router.push(`/student/diary_note?${diary_note_data}`);
  }

  // 최신 소식 카드 컴포넌트
  const FluentNewsCard = () => {
    const [showLargeImage, setShowLargeImage] = useState(false);

    return (
      <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative">
            <Suspense fallback={<ImageLoader />}>
              <img
                src="/images/Fluent_Notice.jpeg"
                alt="Fluent 공지사항"
                className="w-full h-48 object-cover"
              />

              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/80"></div>

              {/* 헤더 오버레이 (상단) */}
              <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                  <h2 className="text-base font-bold text-white">
                    Fluent 최신 소식
                  </h2>
                </div>
              </div>

              {/* 텍스트 오버레이 (하단) */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white text-xl font-bold mb-1">
                  PIZZA AND BOARD GAMES
                </div>
                <div className="text-white/90 text-sm flex items-center justify-between">
                  <span>Saturday, MAY 24, 2025</span>
                  <button
                    className="bg-white text-black rounded-full text-xs px-3 py-1 font-medium"
                    onClick={() => setShowLargeImage(true)}
                  >
                    더보기
                  </button>
                </div>
              </div>
            </Suspense>
          </div>
        </div>

        {/* 확대된 이미지 모달 */}
        {showLargeImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLargeImage(false)}
          >
            <div className="relative max-w-lg w-full">
              <img
                src="/images/Fluent_Notice.jpeg"
                alt="Fluent 공지사항"
                className="w-full h-auto rounded-xl"
              />
              <div className="absolute top-0 right-0 -mt-4 -mr-4">
                <button
                  className="bg-white text-black rounded-full p-2 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLargeImage(false);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-xl">
                <p className="text-white/90 text-sm">
                  Davids English에서 진행하는 영어 회화 모임에 여러분을
                  초대합니다! 피자를 먹으며 다양한 보드게임을 통해 영어로
                  대화하는 시간을 가져보세요. 영어 레벨 5 이상 참가 가능합니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const MobileLayout = () => {
    // 현재 시간 상태
    const [currentTime, setCurrentTime] = useState(new Date());

    // 시간 업데이트 효과
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    // 시간 포맷팅 함수
    const formatTime = () => {
      return currentTime.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    // 날짜 포맷팅 함수
    const formatDate = () => {
      const today = currentTime;
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = days[today.getDay()];
      return `${today.getMonth() + 1}월 ${today.getDate()}일 ${dayName}요일`;
    };

    return (
      <div className="flex flex-col gap-4 pb-20">

        {/* 🔵 STUDENT BANNER (mobile only, inline) */}
        <StudentPopup />
        
        {/* 영어 학습 캐러셀 */}
        <div className="relative">
          <div className="text-3xl font-bold text-indigo-800 p-2 mb-1">
            Fluent
          </div>
          <Suspense fallback={<CarouselLoader />}>
            <ImageCarousel />
          </Suspense>
        </div>

        {/* 인사말 카드  */}
        <div className="bg-blue-50 rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-lg">
                    {user ? user.charAt(0) : "F"}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">안녕하세요</div>
                  <div className="text-lg font-bold text-gray-900">
                    {user || "Fluent"} 님
                  </div>
                </div>
              </div>
              
              {/* 크레딧 결제 및 내역 버튼 */}
              {user_id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/student/payment/history?user=${encodeURIComponent(user || "")}&type=${type || "student"}&id=${user_id}&tab=credits`)}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-full px-3 py-2 shadow-sm hover:bg-gray-200 transition-all text-xs font-medium"
                    title="수업 기록"
                  >
                    <History className="text-gray-600 w-4 h-4" />
                  </button>
                  <button
                    onClick={Payment}
                    className="flex items-center gap-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full px-4 py-2.5 shadow-md hover:from-amber-500 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95"
                  >
                    <MdDiamond className="text-white text-lg" />
                    <div className="flex flex-col items-start">
                      <span className="text-white font-semibold text-sm">수업 횟수</span>
                      <span className="text-white font-bold text-xs leading-tight">
                        {Number(userCredits || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">{formatDate()}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 선생님의 노트 카드  */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-1 h-5 bg-blue-500 rounded-base mr-2"></div>
              <h2 className="text-lg font-bold text-gray-800">오늘의 숙제</h2>
            </div>
            {homeworkData && (
              <span className="text-xs text-gray-400">
                {homeworkData.class_date}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-center h-24">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-gray-500">숙제 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-gray-700 text-sm mt-2">
                데이터를 불러오지 못했습니다. 다시 시도해주세요.
              </p>
            </div>
          ) : homeworkData ? (
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {homeworkData.homework}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                현재 등록된 숙제가 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* 최신 소식 카드 - 이미지 오버레이 스타일 */}
        <FluentNewsCard />

        {/* 학습 메뉴 버튼들 - 모바일용 */}
        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div
              onClick={Quizlet}
              className="cursor-pointer transition-transform active:scale-95"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 shadow-sm border border-indigo-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-indigo-700">QUIZLET</h3>
                    <p className="text-xs text-indigo-600">학습하기</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={Write}
              className="cursor-pointer transition-transform active:scale-95"
            >
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-blue-700">Write</h3>
                    <p className="text-xs text-blue-600">일기 작성</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={Diary}
              className="cursor-pointer transition-transform active:scale-95"
            >
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 shadow-sm border border-orange-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-orange-700">DIARY</h3>
                    <p className="text-xs text-orange-600">일기 보기</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col w-full min-h-screen p-2 sm:p-4 gap-2 sm:gap-4 bg-gray-50">
      {/* 모바일 레이아웃 */}
      <div className="block md:hidden">
        <MobileLayout />
      </div>
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {/* 시간 표시 - Alert 컴포넌트 */}
        <div className="rounded-lg bg-white shadow-lg">
          <Suspense fallback={<SkeletonLoader />}>
            <Alert />
          </Suspense>
        </div>
        {/* 오늘의 학생 공지 */}
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg flex-1 ">
          <Suspense fallback={<SkeletonLoader />}>
            <ErrorBoundary>
              <Announcement />
            </ErrorBoundary>
          </Suspense>
        </div>
        {/* 학습 메뉴 버튼들 + 글쓰기 버튼 */}
        <div className="space-y-2 mt-6">
          <div className="flex flex-row gap-2 sm:gap-6">
            <div
              onClick={Schedule}
              className="cursor-pointer flex-1 transition-transform hover:scale-105"
            >
              <EnterBtn id="schedule" image="/images/ScheduleCardMain.svg" />
            </div>

            <div
              onClick={Quizlet}
              className="cursor-pointer flex-1 transition-transform hover:scale-105"
            >
              <EnterBtn id="quizlet" image="/images/QuizletCardMain.svg" />
            </div>

            <div
              onClick={Write}
              className="cursor-pointer flex-1 transition-transform hover:scale-105"
            >
              <EnterBtn id="write" image="/images/card.svg" />
            </div>

            <div
              onClick={Diary}
              className="cursor-pointer flex-1 transition-transform hover:scale-105"
            >
              <EnterBtn id="diary" image="/images/DiaryCardMain.svg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="animate-pulse text-gray-500">페이지 로딩 중...</div>
        </div>
      }
    >
      <HomePage />
      {/* 모바일에서만 네비게이션 표시 */}
      <Navigation mobileOnly={true} defaultActiveIndex={0} />
    </Suspense>
  );
}

function ErrorBoundary({ children }: any) {
  return (
    <div>
      {children}
    </div>
  );
}

ErrorBoundary.getDerivedStateFromError = function () {
  return { hasError: true };
};

ErrorBoundary.prototype.componentDidCatch = function (error: any) {
  console.error("Announcement Error:", error);
};

