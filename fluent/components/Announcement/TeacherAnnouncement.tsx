import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CiLocationOn } from "react-icons/ci";
import { PiBookBookmarkFill } from "react-icons/pi";
import { TbCardsFilled } from "react-icons/tb";

import { Suspense } from "react";
import { IoTimeOutline } from "react-icons/io5";
import { LuCircleFadingPlus } from "react-icons/lu";
import { BsCalendarPlus } from "react-icons/bs";
import dynamic from "next/dynamic";

// 동적 임포트
const QuizletModal = dynamic(
  () => import("@/components/Quizlet/QuizletModal"),
  { ssr: false }
);

const AddRoom = dynamic(() => import("@/components/addroom"), { ssr: false });

interface ScheduleData {
  room_name: string;
  student_name: string;
  time: string;
  time_range: string;
}

function convertTo12HourFormat(time24: string) {
  const time = parseInt(time24, 10);
  const suffix = time >= 12 ? "PM" : "AM";
  const hours12 = time % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12} ${suffix}`;
}

const today_formatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}.`;
};

const AnnouncementPage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const today = today_formatted();

  const [day_schedule_data, setDay_schedule_data] = useState<ScheduleData[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuizletModalOpen, setIsQuizletModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const closeQuizletModal = () => {
    setIsQuizletModalOpen(false);
    setSelectedStudent(null);
  };

  // 스케줄 모달 제어 함수
  const openScheduleModal = (studentName: string) => {
    setSelectedStudent(studentName);
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedStudent(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      const URL = `/api/schedules/oneday_oneteacher/${today}/${user}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        const data = await res.json();
        setDay_schedule_data(data);
      } catch {
        console.log("Error fetching schedule data");
      }
    };
    fetchData();
  }, [user, today]);

  const filteredData = day_schedule_data.filter((schedule) =>
    schedule.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full p-4 space-y-4">
      {/* 헤더 섹션 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Today {filteredData.length} class
            {filteredData.length > 1 ? "es" : ""}
          </h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search student"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[280px] px-4 py-2 text-sm bg-gray-50 rounded-xl border-0
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 스케줄 리스트 */}
      <div className="space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((schedule, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                {/* 학생 정보 */}
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {schedule.student_name || "Unknown"}
                    </h2>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <CiLocationOn className="text-blue-400" />
                        <span>{schedule.room_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IoTimeOutline className="text-blue-400" />
                        <span>{convertTo12HourFormat(schedule.time)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="flex flex-wrap gap-2 justify-start md:justify-end w-full md:w-auto">
                  <Link
                    href={`/teacher/student/class_record?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                    className="flex items-center space-x-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LuCircleFadingPlus className="text-blue-500" />
                    <span className="text-xs text-blue-700">Class Record</span>
                  </Link>

                  <Link
                    href={`/teacher/student/quizlet?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                    className="flex items-center space-x-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TbCardsFilled className="text-indigo-500" />
                    <span className="text-xs text-indigo-700">Quizlet</span>
                  </Link>

                  <Link
                    href={`/teacher/student/diary?user=${user}&type=${type}&id=${user_id}&student_name=${schedule.student_name}`}
                    className="flex items-center space-x-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PiBookBookmarkFill className="text-orange-500" />
                    <span className="text-xs text-orange-700">Diary</span>
                  </Link>

                  <button
                    onClick={() => openScheduleModal(schedule.student_name)}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <BsCalendarPlus className="text-green-500" />
                    <span className="text-xs text-green-700">스케줄</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-[200px] bg-white rounded-xl border border-gray-100">
            <p className="text-lg font-medium text-gray-500">No class today</p>
          </div>
        )}
      </div>

      {/* 퀴즐렛 모달 */}
      {isQuizletModalOpen && selectedStudent && (
        <QuizletModal
          closeIsModal={closeQuizletModal}
          next_class_date={today}
        />
      )}

      {/* 스케줄 추가 모달 */}
      {isScheduleModalOpen && selectedStudent && (
        <AddRoom closeAddSchedule={closeScheduleModal} />
      )}
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
