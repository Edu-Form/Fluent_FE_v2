"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/navigation"; // 네비게이션 컴포넌트 import

import { Check } from "lucide-react";

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

// function convertTo12HourFormat(time24: number) {
//   const suffix = time24 >= 12 ? "PM" : "AM";
//   const hours12 = time24 % 12 || 12;
//   return `${hours12} ${suffix}`;
// }

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

  // 모바일 레이아웃 컴포넌트
  const MobileLayout = () => (
    <div className="flex flex-col gap-3 pb-20">
      <div className="rounded-lg bg-white shadow-lg">
        <Suspense fallback={<SkeletonLoader />}>
          <Alert />
        </Suspense>
      </div>

      {/* 상단 박스 섹션 */}
      <div className="flex gap-3">
        {/* 인사말 박스 */}
        <div className="w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md flex flex-col justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">안녕하세요,</h1>
            <h1 className="text-xl font-bold text-gray-900">{user}님</h1>
          </div>
        </div>

        {/* 체크리스트 박스 */}
        <div className="w-1/2 bg-white rounded-lg shadow-md p-4 flex flex-col gap-3">
          <button
            onClick={() => setIsDiaryCompleted(!isDiaryCompleted)}
            className={`rounded-xl p-3 text-left flex items-center justify-between transition-all transform hover:scale-[1.02] ${
              isDiaryCompleted
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 hover:bg-opacity-90 border border-gray-100"
            }`}
          >
            <div className="flex flex-col">
              <h3 className="font-bold text-sm">Diary 작성</h3>
              <p
                className={`text-xs ${
                  isDiaryCompleted ? "text-white/80" : "opacity-70"
                }`}
              >
                {isDiaryCompleted ? "완료됨" : "시작하기"}
              </p>
            </div>
            <div
              className={`p-1 rounded-full ${
                isDiaryCompleted ? "bg-white/30" : "bg-gray-100"
              }`}
            >
              <Check
                className={`w-4 h-4 ${
                  isDiaryCompleted ? "text-white" : "text-gray-400"
                }`}
              />
            </div>
          </button>

          <button
            onClick={() => setIsQuizletCompleted(!isQuizletCompleted)}
            className={`rounded-xl p-3 text-left flex items-center justify-between transition-all transform hover:scale-[1.02] ${
              isQuizletCompleted
                ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md"
                : "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-900 hover:bg-opacity-90 border border-gray-100"
            }`}
          >
            <div className="flex flex-col">
              <h3 className="font-bold text-sm">Quizlet 학습</h3>
              <p
                className={`text-xs ${
                  isQuizletCompleted ? "text-white/80" : "opacity-70"
                }`}
              >
                {isQuizletCompleted ? "완료됨" : "시작하기"}
              </p>
            </div>
            <div
              className={`p-1 rounded-full ${
                isQuizletCompleted ? "bg-white/30" : "bg-gray-100"
              }`}
            >
              <Check
                className={`w-4 h-4 ${
                  isQuizletCompleted ? "text-white" : "text-gray-400"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-md">
        <h2 className="text-md font-bold text-gray-900 flex items-center">
          <span className="inline-block w-1.5 h-5 bg-blue-500 rounded mr-2"></span>
          공지사항
        </h2>

        <div className="h-36">
          <Suspense fallback={<NoticeLoader />}>
            <TeacherNotice />
          </Suspense>
        </div>
      </div>

      {/*영어 학습 캐러셀 */}
      <Suspense fallback={<CarouselLoader />}>
        <ImageCarousel />
      </Suspense>
    </div>
  );

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
            <Announcement />
          </Suspense>
        </div>
        {/* 학습 메뉴 버튼들 */}
        <div className="space-y-2 mt-6">
          <div className="flex flex-row gap-2 sm:gap-10">
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
