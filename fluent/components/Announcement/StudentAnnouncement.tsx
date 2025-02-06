import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Check, Calendar, FileText, ClipboardList } from "lucide-react";
import { Clock, BookOpen } from "lucide-react";
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
  const [userCredits, setUserCredits] = useState(5);

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
      const URL2 = `/api/user/${user_id}`;
      try {
        const res2 = await fetch(URL2, { cache: "no-store" });
        const data2 = await res2.json();
        console.log(data2.credits);
        setUserCredits(data2.credits);
      } catch {
        console.log("Error fetching student data");
      }
    };

    fetchData();
    fetchData2();
  }, [user, type, user_id]);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-8xl  space-y-6">
        {/* 인사말 섹션 */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, {user}님
            </h1>
            <p className="text-gray-600 mt-1">
              오늘의 학습 계획을 확인해보세요
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 rounded-full px-8 py-4">
            <div className="flex  text-amber-700 items-center space-x-1">
              {" "}
              <MdDiamond />
              <p className="text-xl font-bold">Credit</p>
            </div>

            <span className="text-xl font-bold text-amber-700">
              {userCredits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 다음 수업 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">다음 수업</h2>
            <Link
              href={`/student/schedule?user=${user}&type=${type}&id=${user_id}`}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              전체 일정
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <Calendar className="w-6 h-6 text-blue-600" />,
                label: "날짜",
                value: next_schedule_data?.date || "예정된 수업 없음",
                bgColor: "bg-blue-50",
                textColor: "text-blue-900",
              },
              {
                icon: <Clock className="w-6 h-6 text-green-600" />,
                label: "시간",
                value: next_schedule_data
                  ? convertTo12HourFormat(next_schedule_data.time)
                  : "N/A",
                bgColor: "bg-green-50",
                textColor: "text-green-900",
              },
              {
                icon: <BookOpen className="w-6 h-6 text-purple-600" />,
                label: "강의실",
                value: next_schedule_data?.room_name || "N/A",
                bgColor: "bg-purple-50",
                textColor: "text-purple-900",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`${item.bgColor} rounded-xl p-4 flex items-center space-x-3`}
              >
                <div className="p-2 rounded-lg bg-white/50">{item.icon}</div>
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">{item.label}</h3>
                  <p className={`font-bold ${item.textColor}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 체크리스트 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            오늘의 체크리스트
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                title: "Diary 작성",
                completedBg: "bg-orange-500",
                uncompletedBg: "bg-orange-50",
                completedText: "text-orange-900",
                state: isDiaryCompleted,
                toggle: () => setIsDiaryCompleted(!isDiaryCompleted),
              },
              {
                icon: ClipboardList,
                title: "Quizlet 학습",
                completedBg: "bg-purple-500",
                uncompletedBg: "bg-purple-50",
                completedText: "text-purple-900",
                state: isQuizletCompleted,
                toggle: () => setIsQuizletCompleted(!isQuizletCompleted),
              },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.toggle}
                className={`rounded-xl p-5 text-left flex items-center justify-between transition-all ${
                  item.state
                    ? `${item.completedBg} text-white`
                    : `${item.uncompletedBg} ${item.completedText} hover:bg-opacity-80`
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-white/20">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm opacity-70">
                      {item.state ? "완료됨" : "시작하기"}
                    </p>
                  </div>
                </div>
                <Check
                  className={`w-6 h-6 ${
                    item.state ? "text-white" : "text-opacity-50"
                  }`}
                />
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
