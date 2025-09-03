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
import { FiUsers } from "react-icons/fi";
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

interface GroupedSchedule {
  room_name: string;
  time: string;
  time_range: string;
  students: string[];
  isGroup: boolean;
  groupNumber?: number;
}

function convertTo12HourFormat(time24: string) {
  const time = parseInt(time24, 10);
  const suffix = time >= 12 ? "PM" : "AM";
  const hours12 = time % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12} ${suffix}`;
}

// KST-safe, WITH trailing dot
const today_formatted = (tz = "Asia/Seoul") => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((acc: any, p) => ((acc[p.type] = p.value), acc), {});
  return `${parts.year}. ${parts.month}. ${parts.day}.`; // ← trailing dot added
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

  // 같은 시간과 장소 그룹핑 함수
  const groupSchedulesByTimeAndLocation = (
    schedules: ScheduleData[]
  ): GroupedSchedule[] => {
    const grouped: { [key: string]: GroupedSchedule } = {};
    let groupCounter = 1;

    schedules.forEach((schedule) => {
      const key = `${schedule.time}-${schedule.room_name}`;

      if (grouped[key]) {
        // 이미 존재하는 그룹에 학생 추가
        grouped[key].students.push(schedule.student_name);
        grouped[key].isGroup = true;
      } else {
        // 새로운 그룹 생성
        grouped[key] = {
          room_name: schedule.room_name,
          time: schedule.time,
          time_range: schedule.time_range,
          students: [schedule.student_name],
          isGroup: false,
          groupNumber: undefined,
        };
      }
    });

    // 그룹 번호 할당 (2명 이상인 그룹에만)
    Object.values(grouped).forEach((group) => {
      if (group.students.length > 1) {
        group.isGroup = true;
        group.groupNumber = groupCounter++;
      }
    });

    return Object.values(grouped);
  };

  const filteredData = day_schedule_data.filter((schedule) =>
    schedule.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSchedules = groupSchedulesByTimeAndLocation(filteredData);

  // 5가지 색상 테마 정의
  const colorThemes = [
    {
      // 테마 1: 블루
      containerClass:
        "bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 overflow-hidden shadow-sm",
      headerClass: "bg-gradient-to-r from-blue-100 to-cyan-100",
      badgeClass:
        "bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium",
      iconClass: "text-blue-500",
      studentNumberClass:
        "w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white",
      footerClass: "text-gray-700 bg-gray-50 border-gray-200",
      borderColor: "#93c5fd",
    },
    {
      // 테마 2: 그린
      containerClass:
        "bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 overflow-hidden shadow-sm",
      headerClass: "bg-gradient-to-r from-green-100 to-emerald-100",
      badgeClass:
        "bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium",
      iconClass: "text-green-500",
      studentNumberClass:
        "w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-medium text-white",
      footerClass: "text-gray-700 bg-gray-50 border-gray-200",
      borderColor: "#86efac",
    },
    {
      // 테마 3: 퍼플
      containerClass:
        "bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200 overflow-hidden shadow-sm",
      headerClass: "bg-gradient-to-r from-purple-100 to-violet-100",
      badgeClass:
        "bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium",
      iconClass: "text-purple-500",
      studentNumberClass:
        "w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-medium text-white",
      footerClass: "text-gray-700 bg-gray-50 border-gray-200",
      borderColor: "#c4b5fd",
    },
    {
      // 테마 4: 오렌지
      containerClass:
        "bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 overflow-hidden shadow-sm",
      headerClass: "bg-gradient-to-r from-orange-100 to-amber-100",
      badgeClass:
        "bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium",
      iconClass: "text-orange-500",
      studentNumberClass:
        "w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-medium text-white",
      footerClass: "text-gray-700 bg-gray-50 border-gray-200",
      borderColor: "#fdba74",
    },
    {
      // 테마 5: 핑크
      containerClass:
        "bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 overflow-hidden shadow-sm",
      headerClass: "bg-gradient-to-r from-pink-100 to-rose-100",
      badgeClass:
        "bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium",
      iconClass: "text-pink-500",
      studentNumberClass:
        "w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-xs font-medium text-white",
      footerClass: "text-gray-700 bg-gray-50 border-gray-200",
      borderColor: "#f9a8d4",
    },
  ];

  // 그룹 수업 스타일 설정 - 그룹 번호에 따라 색상 순환
  const getGroupStyles = (isGroup: boolean, groupNumber?: number) => {
    if (!isGroup) {
      return {
        containerClass:
          "bg-white rounded-lg border border-gray-200 overflow-hidden",
        headerClass: "bg-white",
        badgeClass: "",
        iconClass: "text-gray-400",
        studentNumberClass: "",
        footerClass: "",
        borderColor: "transparent",
      };
    }

    // 그룹 번호에 따라 색상 순환 (0부터 시작하므로 -1)
    const themeIndex = ((groupNumber || 1) - 1) % colorThemes.length;
    return colorThemes[themeIndex];
  };

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
          {groupedSchedules.filter((g) => g.isGroup).length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <p className="text-sm text-blue-600 font-medium">
                {groupedSchedules.filter((g) => g.isGroup).length}개의 그룹 수업
              </p>
            </div>
          )}
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
        {groupedSchedules.length > 0 ? (
          groupedSchedules.map((schedule, index) => {
            const styles = getGroupStyles(
              schedule.isGroup,
              schedule.groupNumber
            );

            return (
              <div key={index} className={styles.containerClass}>
                {/* 그룹 수업 헤더 */}
                {schedule.isGroup && (
                  <div
                    className={`px-3 py-2 ${styles.headerClass} border-b border-gray-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center`}
                          style={{
                            backgroundColor: styles.iconClass.includes("blue")
                              ? "#3b82f6"
                              : styles.iconClass.includes("green")
                              ? "#10b981"
                              : styles.iconClass.includes("purple")
                              ? "#8b5cf6"
                              : styles.iconClass.includes("orange")
                              ? "#f97316"
                              : "#ec4899",
                          }}
                        >
                          <FiUsers className="text-white text-sm" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <CiLocationOn className="text-gray-400" />
                              <span className="font-medium text-gray-800 text-sm">
                                {schedule.room_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <IoTimeOutline className="text-gray-400" />
                              <span className="font-medium text-gray-800 text-sm">
                                {convertTo12HourFormat(schedule.time)}
                              </span>
                            </div>
                            <span className={styles.badgeClass}>
                              {schedule.students.length}명
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3">
                  {/* 개별 수업의 시간 및 장소 정보 (그룹이 아닌 경우만) */}
                  {!schedule.isGroup && (
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <CiLocationOn className="text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {schedule.room_name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IoTimeOutline className="text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {convertTo12HourFormat(schedule.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 학생 목록 */}
                  <div className="space-y-3">
                    {schedule.students.map((studentName, studentIndex) => (
                      <div
                        key={studentIndex}
                        className={`flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 ${
                          schedule.isGroup && studentIndex > 0
                            ? "pt-3 border-t border-gray-200"
                            : ""
                        }`}
                      >
                        {/* 학생 정보 */}
                        <div className="flex items-center space-x-2">
                          <h2 className="text-base font-medium text-gray-900">
                            {studentName || "Unknown"}
                          </h2>
                        </div>

                        {/* 액션 버튼 그룹 */}
                        <div className="flex flex-wrap gap-1 justify-start md:justify-end w-full md:w-auto">
                          <Link
                            href={`/teacher/student/class_record?user=${user}&type=${type}&id=${user_id}&student_name=${studentName}`}
                            className="flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded text-xs transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LuCircleFadingPlus className="text-blue-500 text-sm" />
                            <span className="text-blue-700">Class Record</span>
                          </Link>

                          <Link
                            href={`/teacher/student/quizlet?user=${user}&type=${type}&id=${user_id}&student_name=${studentName}`}
                            className="flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded text-xs transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <TbCardsFilled className="text-indigo-500 text-sm" />
                            <span className="text-indigo-700">Quizlet</span>
                          </Link>

                          <Link
                            href={`/teacher/student/diary?user=${user}&type=${type}&id=${user_id}&student_name=${studentName}`}
                            className="flex items-center space-x-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded text-xs transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <PiBookBookmarkFill className="text-orange-500 text-sm" />
                            <span className="text-orange-700">Diary</span>
                          </Link>

                          <button
                            onClick={() => openScheduleModal(studentName)}
                            className="flex items-center space-x-1 px-2 py-1 bg-green-50 hover:bg-green-100 rounded text-xs transition-colors"
                          >
                            <BsCalendarPlus className="text-green-500 text-sm" />
                            <span className="text-green-700">스케줄</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
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
