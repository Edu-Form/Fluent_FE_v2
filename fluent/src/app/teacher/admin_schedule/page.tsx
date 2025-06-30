"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import {
  Calendar as Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import "react-day-picker/dist/style.css";
import AddRoom from "@/components/addroom";
import VariousRoom from "@/components/VariousRoom";

// 주간 뷰 달력 컴포넌트
interface Schedule {
  _id: string;
  room_name: string;
  date: string;
  time: number;
  duration: number;
  teacher_name: string;
  student_name: string;
}

interface WeeklyCalendarProps {
  onDateSelect?: (date: Date) => void;
  onAddSchedule?: () => void;
}

interface SchedulesByDateAndTime {
  [dateKey: string]: {
    [timeKey: string]: Schedule[];
  };
}

// 필터 상태 인터페이스
interface FilterState {
  teachers: string[];
  rooms: string[];
}

// 개선된 스케줄 블록 컴포넌트
interface ScheduleBlockProps {
  schedule: Schedule;
  roomColor: string;
}

const ScheduleBlock: React.FC<ScheduleBlockProps> = React.memo(
  ({ schedule, roomColor }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e: React.MouseEvent) => {
      setShowTooltip(true);
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleMouseLeave = () => {
      setShowTooltip(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (showTooltip) {
        setTooltipPosition({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const handleTouchStart = () => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    };

    return (
      <>
        <div
          className={`flex-1 p-1.5 rounded-md text-white text-xs font-medium shadow-sm cursor-pointer 
          transition-all duration-200 ease-in-out
          hover:shadow-md hover:scale-[1.02] hover:z-10
          active:scale-95
          ${roomColor}
        `}
          style={{
            height: `${Math.max(schedule.duration * 35, 45)}px`,
            minHeight: "45px",
            position: "relative",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
        >
          <div className="font-semibold text-xs leading-tight mb-0.5">
            {schedule.student_name}
          </div>

          {schedule.room_name && (
            <div className="text-xs opacity-80 leading-tight">
              {schedule.room_name}호
            </div>
          )}
        </div>

        {/* 커스텀 툴팁 */}
        {showTooltip && (
          <div
            className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm max-w-xs border border-gray-700"
            style={{
              left: Math.min(tooltipPosition.x + 10, window.innerWidth - 200),
              top: Math.max(tooltipPosition.y - 10, 10),
              pointerEvents: "none",
            }}
          >
            <div className="font-semibold mb-2 text-blue-400">
              {schedule.time}:00 수업
            </div>
            <div className="space-y-1">
              <div>
                학생:{" "}
                <span className="font-medium">{schedule.student_name}</span>
              </div>
              <div>
                선생님:{" "}
                <span className="font-medium">{schedule.teacher_name}</span>
              </div>
              <div>
                강의실:{" "}
                <span className="font-medium">{schedule.room_name}호</span>
              </div>
              <div>
                수업시간:{" "}
                <span className="font-medium">{schedule.duration}시간</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ScheduleBlock.displayName = "ScheduleBlock";

// 고정 사이드바 필터 컴포넌트
interface FixedFilterSidebarProps {
  teachers: string[];
  rooms: string[];
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const FixedFilterSidebar: React.FC<FixedFilterSidebarProps> = ({
  teachers,
  rooms,
  activeFilters,
  onFilterChange,
}) => {
  const roomColorMap: { [key: string]: string } = {
    HF1: "bg-blue-500",
    HF2: "bg-green-500",
    HF3: "bg-purple-500",
    HF4: "bg-orange-500",
    HF5: "bg-pink-500",
    "2-3": "bg-yellow-400",
  };

  const getRoomColor = (roomName: string): string => {
    const roomKey = roomName.replace(/호$/, "");
    return roomColorMap[roomKey] || "bg-gray-500";
  };

  const handleTeacherToggle = (teacher: string) => {
    const newTeachers = activeFilters.teachers.includes(teacher)
      ? activeFilters.teachers.filter((t) => t !== teacher)
      : [...activeFilters.teachers, teacher];

    onFilterChange({
      ...activeFilters,
      teachers: newTeachers,
    });
  };

  const handleRoomToggle = (room: string) => {
    const newRooms = activeFilters.rooms.includes(room)
      ? activeFilters.rooms.filter((r) => r !== room)
      : [...activeFilters.rooms, room];

    onFilterChange({
      ...activeFilters,
      rooms: newRooms,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      teachers: teachers,
      rooms: rooms,
    });
  };

  const selectAllTeachers = () => {
    onFilterChange({
      ...activeFilters,
      teachers: teachers,
    });
  };

  const selectAllRooms = () => {
    onFilterChange({
      ...activeFilters,
      rooms: rooms,
    });
  };

  return (
    <div className="w-80 bg-white shadow-xl border-r border-gray-200 flex flex-col">
      {/* 사이드바 헤더 */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">필터 설정</h2>
        </div>
      </div>

      {/* 사이드바 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 선생님 필터 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">선생님</h3>
            <div className="space-x-2">
              <button
                onClick={selectAllTeachers}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                전체 선택
              </button>
              <button
                onClick={() =>
                  onFilterChange({ ...activeFilters, teachers: [] })
                }
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                전체 해제
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teachers.map((teacher) => (
              <label
                key={teacher}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.teachers.includes(teacher)}
                  onChange={() => handleTeacherToggle(teacher)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">
                  {teacher}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 강의실 필터 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">강의실</h3>
            <div className="space-x-2">
              <button
                onClick={selectAllRooms}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                전체 선택
              </button>
              <button
                onClick={() => onFilterChange({ ...activeFilters, rooms: [] })}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                전체 해제
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {rooms.map((room) => (
              <label
                key={room}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.rooms.includes(room)}
                  onChange={() => handleRoomToggle(room)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full ${getRoomColor(room)}`}
                  ></div>
                  <span className="text-sm text-gray-700 font-medium">
                    {room}호
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 사이드바 푸터 */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={clearAllFilters}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          모든 필터 보이기
        </button>
      </div>
    </div>
  );
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  onDateSelect,
  onAddSchedule,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [schedulesByDateTime, setSchedulesByDateTime] =
    useState<SchedulesByDateAndTime>({});
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);

  // 기본 선생님 목록
  const defaultTeachers = [
    "David",
    "Serah",
    "Chris",
    "Phil",
    "Seo Jung",
    "Jeff",
    "Dooho",
    "Konnie",
    "Joonseok",
    "Eric",
    "Jack",
    "Juno",
  ];

  // 기본 강의실 목록
  const defaultRooms = ["HF1", "HF2", "HF3", "HF4", "HF5", "2-3"];

  const [filters, setFilters] = useState<FilterState>({
    teachers: defaultTeachers,
    rooms: defaultRooms,
  });

  // 시간 슬롯 (8시부터 23시까지)
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8);

  // 주간 날짜 계산
  const getWeekDates = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      return weekDate;
    });
  };

  const weekDates = getWeekDates(currentDate);

  // 유니크한 선생님과 강의실 목록 추출
  const getUniqueTeachers = (): string[] => {
    const scheduleTeachers = [
      ...new Set(allSchedules.map((s) => s.teacher_name)),
    ].filter(Boolean);
    // 기본 선생님 목록과 스케줄에서 나온 선생님들을 합치고 중복 제거
    const allTeachers = [...new Set([...defaultTeachers, ...scheduleTeachers])];
    return allTeachers.sort();
  };

  const getUniqueRooms = (): string[] => {
    const scheduleRooms = [
      ...new Set(allSchedules.map((s) => s.room_name)),
    ].filter(Boolean);
    // 기본 강의실 목록과 스케줄에서 나온 강의실들을 합치고 중복 제거
    const allRooms = [...new Set([...defaultRooms, ...scheduleRooms])];
    return allRooms.sort();
  };

  // 필터링된 스케줄 계산
  const getFilteredSchedules = (): Schedule[] => {
    return allSchedules.filter((schedule) => {
      const teacherMatch = filters.teachers.includes(schedule.teacher_name);
      const roomMatch = filters.rooms.includes(schedule.room_name);

      return teacherMatch && roomMatch;
    });
  };

  // 주간 스케줄을 가져오는 함수
  const fetchWeekSchedules = async (weekDates: Date[]) => {
    try {
      const schedulePromises = weekDates.map(async (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const dateStr = `${year}. ${month}. ${day}.`;

        const encodedDate = encodeURIComponent(dateStr);
        const url = `/api/schedules/all/${encodedDate}`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(
              `Failed to fetch schedules for ${dateStr} (${response.status})`
            );
            return [];
          }
          const data = await response.json();
          return data;
        } catch (error) {
          console.error(`Error fetching schedules for ${dateStr}:`, error);
          return [];
        }
      });

      const allDaySchedules = await Promise.all(schedulePromises);
      const schedules = allDaySchedules.flat();

      setAllSchedules(schedules);
      return schedules;
    } catch (error) {
      console.error("Error fetching week schedules:", error);
      return [];
    }
  };

  // 필터링된 스케줄을 날짜와 시간별로 그룹화
  useEffect(() => {
    const filteredSchedules = getFilteredSchedules();

    const grouped: SchedulesByDateAndTime = {};
    filteredSchedules.forEach((schedule: Schedule) => {
      const dateKey = schedule.date.replace(/\./g, "").replace(/\s/g, "");
      const timeKey = schedule.time.toString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      if (!grouped[dateKey][timeKey]) {
        grouped[dateKey][timeKey] = [];
      }
      grouped[dateKey][timeKey].push(schedule);
    });

    setSchedulesByDateTime(grouped);
  }, [allSchedules, filters]);

  useEffect(() => {
    const loadWeekSchedules = async () => {
      const schedules = await fetchWeekSchedules(weekDates);

      // 새로운 강의실이 있다면 필터에 추가 (선생님은 이미 기본값으로 설정됨)
      if (schedules.length > 0) {
        const uniqueRooms = getUniqueRooms();

        setFilters((prevFilters) => ({
          ...prevFilters,
          rooms: uniqueRooms,
        }));
      }
    };
    loadWeekSchedules();
  }, [currentDate]);

  // 날짜 키 생성 함수
  const getDateKey = (date: Date): string => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  // 주 이동 함수
  const goToPrevWeek = (): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = (): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = (): void => {
    setCurrentDate(new Date());
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date): void => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // 오늘 날짜 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 현재 주의 월과 년도 표시
  const getWeekTitle = (): string => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];

    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월`;
    } else {
      return `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월 - ${
        lastDate.getMonth() + 1
      }월`;
    }
  };

  // 강의실별 고정 색상 매핑
  const getRoomColor = (roomName: string): string => {
    const roomColorMap: { [key: string]: string } = {
      HF1: "bg-blue-500",
      HF2: "bg-green-500",
      HF3: "bg-purple-500",
      HF4: "bg-orange-500",
      HF5: "bg-pink-500",
      "2-3": "bg-yellow-400",
    };

    const roomKey = roomName.replace(/호$/, "");
    return roomColorMap[roomKey] || "bg-gray-500";
  };

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="flex h-screen bg-white">
      {/* 고정 사이드바 */}
      <FixedFilterSidebar
        teachers={getUniqueTeachers()}
        rooms={getUniqueRooms()}
        activeFilters={filters}
        onFilterChange={setFilters}
      />

      {/* 메인 캘린더 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevWeek}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all duration-200 text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={goToNextWeek}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all duration-200 text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              {getWeekTitle()}
            </h1>
          </div>

          <button
            onClick={onAddSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm"
          >
            <Plus size={16} />
            수업 추가
          </button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="flex-1 bg-white m-4 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
            <div className="p-4 text-gray-500 font-medium text-sm"></div>
            {weekDates.map((date, index) => (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 border-r border-gray-200 last:border-r-0"
              >
                <div className="text-gray-600 text-sm font-medium mb-1">
                  {weekdays[index]}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isToday(date)
                      ? "bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      : "text-gray-800"
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* 시간별 스케줄 그리드 */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-gray-100 min-h-[60px] hover:bg-gray-50/50 transition-colors duration-150"
              >
                {/* 시간 라벨 */}
                <div className="p-2 text-gray-500 text-xs font-medium flex items-start bg-gray-50/50 border-r border-gray-200">
                  {hour === 12
                    ? "12 PM"
                    : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
                </div>

                {/* 각 요일의 해당 시간 스케줄 */}
                {weekDates.map((date) => {
                  const dateKey = getDateKey(date);
                  const timeKey = hour.toString();
                  const schedules =
                    schedulesByDateTime[dateKey]?.[timeKey] || [];

                  return (
                    <div
                      key={`${dateKey}-${timeKey}`}
                      className="p-1 border-r border-gray-100 relative last:border-r-0"
                    >
                      <div className="flex gap-2 h-full">
                        {schedules.map((schedule) => (
                          <ScheduleBlock
                            key={schedule._id}
                            schedule={schedule}
                            roomColor={getRoomColor(schedule.room_name)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 강의실 색상 가이드 */}
        <div className="flex justify-center p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-6 gap-3 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">HF1호</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">HF2호</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">HF3호</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">HF4호</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-700">HF5호</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-700">2-3호</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SchedulePage = () => {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariousRoomOpen, setIsVariousRoomOpen] = useState(false);
  const [, setSelectedDate] = useState<Date>(new Date());

  const openAddSchedule = () => setIsModalOpen(true);
  const closeAddSchedule = () => setIsModalOpen(false);
  const closeVariousSchedule = () => setIsVariousRoomOpen(false);

  const handleDateSelect = (date: Date) => {
    console.log("날짜 선택됨:", date);
    setSelectedDate(date);
  };

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .schedule-container {
        display: flex;
        width: 100%;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        backdrop-filter: blur(4px);
      }

      @media (max-width: 768px) {
        .schedule-container {
          padding: 0;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="schedule-container">
      {/* 주간 캘린더 전체 화면 */}
      <div className="w-full h-full">
        <WeeklyCalendar
          onDateSelect={handleDateSelect}
          onAddSchedule={openAddSchedule}
        />
      </div>

      {/* AddRoom 모달 */}
      {type !== "student" && isModalOpen && (
        <div className="modal-overlay">
          <AddRoom closeAddSchedule={closeAddSchedule} />
        </div>
      )}

      {/* VariousRoom 모달 */}
      {type !== "student" && isVariousRoomOpen && (
        <div className="modal-overlay">
          <VariousRoom closeVariousSchedule={closeVariousSchedule} />
        </div>
      )}
    </div>
  );
};

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulePage />
    </Suspense>
  );
}
