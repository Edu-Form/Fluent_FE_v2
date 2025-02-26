"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/navigation"; // 네비게이션 컴포넌트 import
import { MdDiamond } from "react-icons/md";
import {
  Check,
  Calendar,
  Clock,
  BookOpen,
  ExternalLink,
  User,
} from "lucide-react";

// 동적 컴포넌트 로딩 추가
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });

// 로딩 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-[70px]"></div>
);

// 모바일 감지 hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 초기 검사
    checkMobile();

    // 윈도우 리사이즈 리스너 설정
    window.addEventListener("resize", checkMobile);

    // 클린업
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

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

function convertTo12HourFormat(time24: number) {
  const suffix = time24 >= 12 ? "PM" : "AM";
  const hours12 = time24 % 12 || 12;
  return `${hours12} ${suffix}`;
}

const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const url_data = `user=${user}&type=${type}&id=${user_id}`;

  const quizlet_url_data = `user=${user}&type=${type}&id=${user_id}&func=quizlet`;
  const diary_url_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;
  const [userCredits, setUserCredits] = useState(5);
  const [isDiaryCompleted, setIsDiaryCompleted] = useState(false);
  const [isQuizletCompleted, setIsQuizletCompleted] = useState(false);
  const [next_schedule_data, setNext_schedule_data] =
    useState<ScheduleData | null>(null);

  const router = useRouter();
  const isMobile = useMobileDetection();

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
    <div className="flex flex-col gap-3">
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
          <div className="bg-amber-50 rounded-xl p-3 mt-auto">
            <div className="flex items-center gap-2">
              <MdDiamond className="text-amber-600 text-xl" />
              <div>
                <p className="text-xs text-amber-700 font-medium">Credit</p>
                <p className="text-xl font-bold text-amber-700 leading-tight">
                  {userCredits.toLocaleString()}
                </p>
              </div>
            </div>
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

      {/* 다음 수업 정보 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            다음 수업
          </h2>
          <button
            onClick={Schedule}
            className="flex items-center text-blue-600 text-sm font-medium"
          >
            전체 일정
            <ExternalLink className="ml-1 w-3 h-3" />
          </button>
        </div>

        {next_schedule_data ? (
          <div className="p-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <div className="mr-3 bg-white p-2 rounded-full shadow-sm">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">날짜</p>
                  <p className="text-lg font-bold text-gray-900">
                    {next_schedule_data.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="flex items-center mb-1">
                  <Clock className="w-4 h-4 text-indigo-600 mr-2" />
                  <p className="text-xs text-gray-600">시간</p>
                </div>
                <p className="text-base font-bold text-gray-900">
                  {convertTo12HourFormat(next_schedule_data.time)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                  <p className="text-xs text-gray-600">강의실</p>
                </div>
                <p className="text-base font-bold text-gray-900">
                  {next_schedule_data.room_name}
                </p>
              </div>

              {next_schedule_data.teacher_name && (
                <div className="bg-violet-50 rounded-xl p-3 col-span-2">
                  <div className="flex items-center mb-1">
                    <User className="w-4 h-4 text-violet-600 mr-2" />
                    <p className="text-xs text-gray-600">선생님</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    {next_schedule_data.teacher_name} 선생님
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="bg-gray-100 inline-flex rounded-full p-3 mb-3">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-600">
              예정된 수업이 없습니다
            </p>
            <p className="text-sm text-gray-400 mt-1">
              새로운 수업 일정이 생기면 알려드릴게요
            </p>
          </div>
        )}
      </div>

      {/* 공지사항 */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h2 className="text-md font-bold text-gray-900 mb-3 flex items-center">
          <span className="inline-block w-2 h-4 bg-blue-500 rounded mr-2"></span>
          공지사항
        </h2>

        <div className="space-y-2">
          <div className="border-l-2 border-blue-400 pl-3 py-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm text-gray-900">
                3월 학사일정 안내
              </h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                중요
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              2월 20일부터 3월 학생스케줄을 짜주세요.
            </p>
            <p className="text-xs text-gray-400 mt-1">2024.02.05</p>
          </div>

          <div className="border-l-2 border-gray-300 pl-3 py-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm text-gray-900">
                교재 변경 안내
              </h3>
              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                공지
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              다음 달부터 플랫폼 디자인이 변경될 예정입니다.
            </p>
            <p className="text-xs text-gray-400 mt-1">2024.02.04</p>
          </div>
        </div>
      </div>

      {/* 모바일에서 하단 여백 추가 */}
      <div className="h-16" />
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full p-2 sm:p-4 gap-2 sm:gap-4 bg-gray-50">
      {isMobile ? (
        <MobileLayout />
      ) : (
        <>
          {/* 데스크톱 레이아웃 */}
          {/* 시간 표시 - Alert 컴포넌트 */}
          <div className="rounded-lg bg-white shadow-lg">
            <Suspense fallback={<SkeletonLoader />}>
              <Alert />
            </Suspense>
          </div>

          {/* 오늘의 학생 공지 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg flex-1">
            <Suspense fallback={<SkeletonLoader />}>
              <Announcement />
            </Suspense>
          </div>

          {/* 학습 메뉴 버튼들 */}
          <div className="space-y-2">
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
        </>
      )}
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
