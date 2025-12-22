import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Check, Calendar, FileText, ClipboardList } from "lucide-react";
import { Clock, BookOpen, ExternalLink } from "lucide-react";
import { MdDiamond } from "react-icons/md";

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

const AnnouncementPage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const [userCredits, setUserCredits] = useState<string | number>('');

  const [next_schedule_data, setNext_schedule_data] =
    useState<ScheduleData | null>(null);
  const [isDiaryCompleted, setIsDiaryCompleted] = useState(false);
  const [isQuizletCompleted, setIsQuizletCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const URL = `/api/schedules/${type}/${user}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        const next = next_schedule(data);
        setNext_schedule_data(next);
      } catch {
        console.log("Error fetching schedule data");
      }
    };

    const fetchData2 = async () => {
      if (!user_id) return;
      const URL2 = `/api/user/${user_id}`;
      try {
        const res2 = await fetch(URL2, { cache: "no-store" });
        const data2 = await res2.json();
        setUserCredits(data2.credits);
      } catch {
        console.log("Error fetching student data");
      }
    };

    fetchData();
    fetchData2();
  }, [user, type, user_id]);

  return (
    <div className="h-full flex flex-col">
      {/* 인사말 섹션 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            안녕하세요, {user}님
          </h1>
          <p className="text-sm text-gray-600">
            오늘의 학습 계획을 확인해보세요
          </p>
        </div>
        {user_id && (
          <Link
            href={`/student/payment?user=${user}&type=${type}&id=${user_id}`}
            className="flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 hover:bg-amber-100 transition"
          >
            <MdDiamond className="text-amber-600" />
            <div>
              <p className="text-xs text-amber-700 font-medium">수업 횟수</p>
              <p className="text-lg font-bold text-amber-700 leading-tight">
                {Number(userCredits || 0).toLocaleString()}
              </p>
            </div>
          </Link>
        )}

      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 다음 수업 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">다음 수업</h2>
            <Link
              href={`/student/schedule?user=${user}&type=${type}&id=${user_id}`}
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
            >
              전체 일정
              <ExternalLink className="ml-1 w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Calendar,
                label: "날짜",
                value: next_schedule_data?.date || "예정된 수업 없음",
                bgColor: "bg-blue-100",
                textColor: "text-blue-900",
                iconColor: "text-blue-600",
              },
              {
                icon: Clock,
                label: "시간",
                value: next_schedule_data
                  ? convertTo12HourFormat(next_schedule_data.time)
                  : "N/A",
                bgColor: "bg-indigo-100",
                textColor: "text-indigo-900",
                iconColor: "text-indigo-600",
              },
              {
                icon: BookOpen,
                label: "강의실",
                value: next_schedule_data?.room_name || "N/A",
                bgColor: "bg-violet-100",
                textColor: "text-violet-900",
                iconColor: "text-violet-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`${item.bgColor} rounded-xl p-3 flex items-center`}
              >
                <div className="mr-3 p-2 rounded-lg bg-white">
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-xs font-medium mb-0.5">{item.label}</h3>
                  <p className={`font-bold text-sm ${item.textColor}`}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 공지사항 섹션 */}
        <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <span className="inline-block w-2 h-4 bg-blue-500 rounded mr-2"></span>
            공지사항
          </h2>

          <div className="space-y-3">
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
                다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은
                담당자에게 문의해주세요.
              </p>
              <p className="text-xs text-gray-400 mt-1">2024.02.04</p>
            </div>
          </div>
        </div>{" "}
        {/* 체크리스트 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            오늘의 체크리스트
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: FileText,
                title: "Diary 작성",
                completedBg: "bg-gradient-to-r from-orange-500 to-amber-500",
                uncompletedBg: "bg-gradient-to-r from-orange-50 to-amber-50",
                completedText: "text-orange-900",
                state: isDiaryCompleted,
                toggle: () => setIsDiaryCompleted(!isDiaryCompleted),
              },
              {
                icon: ClipboardList,
                title: "Quizlet 학습",
                completedBg: "bg-gradient-to-r from-purple-500 to-violet-500",
                uncompletedBg: "bg-gradient-to-r from-purple-50 to-violet-50",
                completedText: "text-purple-900",
                state: isQuizletCompleted,
                toggle: () => setIsQuizletCompleted(!isQuizletCompleted),
              },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.toggle}
                className={`rounded-xl p-3 text-left flex items-center justify-between transition-all transform hover:scale-[1.02] ${
                  item.state
                    ? `${item.completedBg} text-white shadow-md`
                    : `${item.uncompletedBg} ${item.completedText} hover:bg-opacity-90 border border-gray-100`
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      item.state ? "bg-white/20" : "bg-white"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${item.state ? "text-white" : ""}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p
                      className={`text-xs ${
                        item.state ? "text-white/80" : "opacity-70"
                      }`}
                    >
                      {item.state ? "완료됨" : "시작하기"}
                    </p>
                  </div>
                </div>
                <div
                  className={`p-1 rounded-full ${
                    item.state ? "bg-white/30" : "bg-gray-100"
                  }`}
                >
                  <Check
                    className={`w-4 h-4 ${
                      item.state ? "text-white" : "text-gray-400"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Announcement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnnouncementPage />
    </Suspense>
  );
}
