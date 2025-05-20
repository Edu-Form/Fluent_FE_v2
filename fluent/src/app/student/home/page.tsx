"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/navigation"; // 네비게이션 컴포넌트 import

import { Check, Calendar, BookOpen, PenLine } from "lucide-react";

// 동적 컴포넌트 로딩 추가
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });
// 이미지 캐러셀 컴포넌트 import (동적으로 로드)
const ImageCarousel = dynamic(() => import("@/components/ImageCarousel"), {
  ssr: false,
});
const TeacherNotice = dynamic(() => import("@/components/TeacherNotice"), {
  ssr: false,
});

// 로딩 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-[70px]"></div>
);

const CarouselLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-48"></div>
);

const NoticeLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-32"></div>
);

interface ScheduleData {
  date: string;
  duration: number;
  room_name: string;
  student_name: string;
  teacher_name: string;
  time: number;
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
  const [, setUserCredits] = useState<string | number>("");
  const [isDiaryCompleted, setIsDiaryCompleted] = useState(false);
  const [isQuizletCompleted, setIsQuizletCompleted] = useState(false);
  const [, setNext_schedule_data] = useState<ScheduleData | null>(null);

  const router = useRouter();

  // 현재 날짜/시간 표시용 상태
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 형식 변환 함수
  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 날짜 형식 변환 함수
  const formatDate = () => {
    return currentTime.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  useEffect(() => {
    const fetchData = async () => {
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

  function Quizlet() {
    router.push(`/student/quizlet?${quizlet_url_data}`);
  }
  function Diary() {
    router.push(`/student/diary?${diary_url_data}`);
  }
  function Schedule() {
    router.push(`/student/schedule?${url_data}`);
  }

  // 모바일 레이아웃 - Fluent 스타일
  const MobileLayout = () => (
    <div className="flex flex-col gap-2 pb-20">
      {/* 상단 헤더 이미지 */}
      <div className="w-full h-[200px] bg-gray-800 relative">
      
        <div className="absolute top-4 left-4 text-white text-3xl font-bold">
          Fluent
        </div>
      </div>

      {/* 두 개의 카드 (시간 및 인사말) */}
      <div className="flex gap-2 mt-4 px-2">
        {/* 시간 카드 */}
        <div className="w-1/2 bg-blue-300 rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-white">{formatTime()}</div>
          <div className="text-sm text-blue-800 mt-2">{formatDate()}</div>
        </div>

        {/* 인사말 카드 */}
        <div className="w-1/2 bg-blue-300 rounded-2xl p-6 flex flex-col items-start justify-center">
          <div className="text-lg font-bold text-blue-900">안녕하세요,</div>
          <div className="text-xl font-bold text-blue-900">{user || '재민'}님</div>
        </div>
      </div>

      {/* 숙제 카드 */}
      <div className="mx-2 mt-2">
        <div className="bg-blue-300 rounded-2xl p-6">
          <div className="text-xl font-bold text-blue-900 mb-3">HomeWork</div>
          
          <div className="space-y-2">
            <button
              onClick={() => setIsDiaryCompleted(!isDiaryCompleted)}
              className={`w-full rounded-xl p-3 text-left flex items-center justify-between transition-all ${
                isDiaryCompleted
                  ? "bg-blue-500 text-white"
                  : "bg-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center">
                <PenLine className="mr-2 w-5 h-5" />
                <span className="font-medium">Diary 작성</span>
              </div>
              <div
                className={`p-1 rounded-full ${
                  isDiaryCompleted ? "bg-white" : "bg-blue-100"
                }`}
              >
                <Check
                  className={`w-4 h-4 ${
                    isDiaryCompleted ? "text-blue-500" : "text-blue-900/30"
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setIsQuizletCompleted(!isQuizletCompleted)}
              className={`w-full rounded-xl p-3 text-left flex items-center justify-between transition-all ${
                isQuizletCompleted
                  ? "bg-blue-500 text-white"
                  : "bg-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center">
                <BookOpen className="mr-2 w-5 h-5" />
                <span className="font-medium">Quizlet 학습</span>
              </div>
              <div
                className={`p-1 rounded-full ${
                  isQuizletCompleted ? "bg-white" : "bg-blue-100"
                }`}
              >
                <Check
                  className={`w-4 h-4 ${
                    isQuizletCompleted ? "text-blue-500" : "text-blue-900/30"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 이벤트 카드 - 피자 & 보드게임 */}
      <div className="mx-2 mt-2">
        <div className="bg-blue-300 rounded-2xl overflow-hidden">
          <div className="flex">
            {/* 이벤트 포스터 이미지 */}
            <div className="w-1/3 p-2">
            
            </div>
            
            {/* 이벤트 정보 */}
            <div className="w-2/3 p-4 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white">PIZZA AND<br />BOARD GAMES</h3>
              <p className="text-blue-900 mt-2">Saturday, MAY 24, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* 기타 정보 */}
      <div className="mt-2">
        <Suspense fallback={<CarouselLoader />}>
          <ImageCarousel />
        </Suspense>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* 모바일 레이아웃 */}
      <div className="block md:hidden">
        <MobileLayout />
      </div>

      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex md:flex-col md:gap-6 p-4">
        <div className="rounded-lg bg-white shadow-lg">
          <Suspense fallback={<SkeletonLoader />}>
            <Alert />
          </Suspense>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-lg flex-1">
          <Suspense fallback={<SkeletonLoader />}>
            <Announcement />
          </Suspense>
        </div>
        
        <div className="space-y-2 mt-6">
          <div className="flex flex-row gap-10">
            <div onClick={Schedule} className="cursor-pointer flex-1 transition-transform hover:scale-105">
              <EnterBtn id="schedule" image="/images/ScheduleCardMain.svg" />
            </div>

            <div onClick={Quizlet} className="cursor-pointer flex-1 transition-transform hover:scale-105">
              <EnterBtn id="quizlet" image="/images/QuizletCardMain.svg" />
            </div>

            <div onClick={Diary} className="cursor-pointer flex-1 transition-transform hover:scale-105">
              <EnterBtn id="diary" image="/images/DiaryCardMain.svg" />
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 빨간색 영역 (모바일에서만 표시) */}
      <div className="fixed bottom-0 left-0 w-full h-14 bg-red-500 md:hidden"></div>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white">
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