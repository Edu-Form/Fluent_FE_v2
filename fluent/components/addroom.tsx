"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Loader,
  Plus,
  Trash,
  AlertCircle,
} from "lucide-react";

interface ScheduleModalProps {
  closeAddSchedule: () => void;
}

interface ClassSchedule {
  id: string;
  date: Date;
  formattedDate: string;
  time: string;
  room: string;
  status: "pending" | "success" | "conflict";
  registered?: boolean;
}

// 기존 수업 데이터 인터페이스
interface ExistingClass {
  _id: string;
  date: string;
  time: string;
  room_name: string;
  student_name: string;
  teacher_name: string;
  duration: string;
}

export default function MultiAddRoom({ closeAddSchedule }: ScheduleModalProps) {
  // 날짜 선택 상태
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // 공통 시간 및 강의실
  const [commonTime, setCommonTime] = useState("");
  const [commonRoom, setCommonRoom] = useState("");
  // 고정 강의실 목록
  const roomList = ["HF1", "HF2", "HF3", "HF4", "HF5", "2-3"];
  const [duration] = useState("1");

  // 학생 관련 상태
  const [studentName, setStudentName] = useState("");
  const [studentList, setStudentList] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 수업 일정 상태
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);

  // 기존 수업 데이터
  const [existingClasses, setExistingClasses] = useState<ExistingClass[]>([]);

  // 세션 관리
  const [currentSession, setCurrentSession] = useState(1); // 1: 정보 입력, 2: 충돌 확인, 3: 완료
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 등록 결과
  const [registrationResults, setRegistrationResults] = useState<{
    successful: number;
    failed: number;
  }>({ successful: 0, failed: 0 });

  // 현재 월 표시 관리
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 교사 정보
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";
  const type = searchParams.get("type");
  const [teacherName, setTeacherName] = useState(user);

  // 초기화 및 학생 목록 가져오기
  useEffect(() => {
    if (user) {
      setTeacherName(user);
    }

    // 학생 목록 가져오기
    async function fetchStudentList() {
      try {
        const URL = `/api/diary/${type}/${user}`;
        const response = await fetch(URL, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch student list");
        }

        const data: string[] = await response.json();
        setStudentList(data);
      } catch (error) {
        console.error("Error fetching student list:", error);
      }
    }

    // 기존 수업 데이터 가져오기
    async function fetchExistingClasses() {
      try {
        const URL = `/api/schedules/${type}/${user}`;
        const response = await fetch(URL, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch existing classes");
        }

        const data: ExistingClass[] = await response.json();
        setExistingClasses(data);
      } catch (error) {
        console.error("Error fetching existing classes:", error);
      }
    }

    if (user && type) {
      fetchStudentList();
      fetchExistingClasses();
    }
  }, [user, type]);

  // 날짜 형식 변환 함수
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // 학생 선택 처리
  const handleStudentSelect = (name: string) => {
    setStudentName(name);
    setIsDropdownOpen(false);
  };

  // 날짜 선택 처리
  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    // 이미 선택된 날짜인지 확인
    const dateExists = selectedDates.some(
      (date) =>
        date.getDate() === day &&
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
    );

    if (dateExists) {
      // 이미 선택된 날짜라면 제거
      setSelectedDates(
        selectedDates.filter(
          (date) =>
            !(
              date.getDate() === day &&
              date.getMonth() === currentMonth.getMonth() &&
              date.getFullYear() === currentMonth.getFullYear()
            )
        )
      );
    } else {
      // 새로운 날짜라면 추가
      setSelectedDates([...selectedDates, selectedDate]);
    }
  };

  // 달력 컴포넌트
  const CustomCalendar = () => {
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    // 요일 헤더
    const dayNameElements = dayNames.map((day) => (
      <div
        key={`header-${day}`}
        className="text-center w-9 h-9 flex items-center justify-center font-medium text-gray-600"
      >
        {day}
      </div>
    ));

    // 빈 칸 채우기
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9"></div>);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDates.some(
        (date) =>
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
      );

      days.push(
        <div
          key={`day-${day}`}
          className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 ${
            isSelected
              ? "bg-blue-500 text-white shadow-md"
              : "hover:bg-blue-100 hover:text-blue-600"
          }`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="p-4 bg-white rounded-xl h-full flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {currentMonth.toLocaleString("ko-KR", { month: "long" })} {year}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">{dayNameElements}</div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  // 선택된 날짜 표시 컴포넌트
  const SelectedDates = () => {
    if (selectedDates.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
          달력에서 날짜를 선택해주세요
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedDates.map((date, index) => (
          <div
            key={index}
            className="flex items-center bg-blue-50 rounded-lg border border-blue-100 pl-3 pr-1 py-1"
          >
            <span className="text-sm font-medium text-gray-800 mr-1">
              {formatDate(date)}
            </span>
            <button
              onClick={() =>
                setSelectedDates(selectedDates.filter((_, i) => i !== index))
              }
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-blue-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 시간 선택 컴포넌트
  const TimeSelector = () => {
    const timeOptions = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col space-y-2 mt-4">
        <label className="text-sm font-medium text-gray-700">수업 시간</label>
        <div className="grid grid-cols-6 gap-2">
          {timeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setCommonTime(t.toString())}
              className={`p-2 rounded-md text-sm ${
                commonTime === t.toString()
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t}:00
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 충돌 체크 함수 (실제 데이터 기반)
  const checkRealConflict = (
    formattedDate: string,
    time: string,
    room: string
  ): boolean => {
    // 기존 수업 데이터와 충돌이 있는지 확인
    return existingClasses.some(
      (existingClass) =>
        existingClass.date === formattedDate &&
        existingClass.time === time &&
        existingClass.room_name === room
    );
  };

  // 다음 단계로 진행 (충돌 확인)
  function checkSchedules() {
    if (
      selectedDates.length === 0 ||
      !commonTime ||
      !commonRoom ||
      !studentName
    ) {
      alert("날짜, 시간, 강의실, 학생을 모두 선택해주세요");
      return;
    }

    // 수업 일정 생성
    const newSchedules: ClassSchedule[] = selectedDates.map((date) => {
      const formattedDate = formatDate(date);
      const hasConflict = checkRealConflict(
        formattedDate,
        commonTime,
        commonRoom
      );

      return {
        id: Math.random().toString(36).substring(2, 9),
        date: date,
        formattedDate: formattedDate,
        time: commonTime,
        room: commonRoom,
        status: hasConflict ? "conflict" : "success",
      };
    });

    setSchedules(newSchedules);
    setCurrentSession(2); // 충돌 확인 화면으로 이동
  }

  // 특정 수업 일정의 방 변경
  const changeRoomForSchedule = (scheduleId: string, newRoom: string) => {
    const updatedSchedules = schedules.map((schedule) => {
      if (schedule.id === scheduleId) {
        // 실제 충돌 확인
        const hasConflict = checkRealConflict(
          schedule.formattedDate,
          schedule.time,
          newRoom
        );

        return {
          ...schedule,
          room: newRoom,
          status: hasConflict ? ("conflict" as const) : ("success" as const),
        };
      }
      return schedule;
    });

    setSchedules(updatedSchedules);
  };

  // 뒤로가기 처리
  function goBack() {
    if (currentSession === 2) {
      setCurrentSession(1);
    } else if (currentSession === 3) {
      setCurrentSession(2);
    }
  }

  // 수업 삭제 처리
  const removeSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId));
  };

  // 모든 수업 예약 처리
  async function saveClasses() {
    // 충돌이 있는지 확인
    const hasConflicts = schedules.some(
      (schedule) => schedule.status === "conflict"
    );

    if (hasConflicts) {
      alert("아직 충돌이 있는 수업이 있습니다. 모든 충돌을 해결해주세요.");
      return;
    }

    if (schedules.length === 0) {
      alert("등록할 수업이 없습니다.");
      return;
    }

    // 등록 중 상태로 변경
    setIsSubmitting(true);

    // 서버에 실제 수업 등록 요청
    let successCount = 0;
    let failCount = 0;

    // 모든 수업에 대해 API 호출
    const updatedSchedules = [...schedules];

    for (let i = 0; i < updatedSchedules.length; i++) {
      const schedule = updatedSchedules[i];

      try {
        const response = await fetch("/api/schedules/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_name: schedule.room,
            date: schedule.formattedDate,
            time: schedule.time,
            duration: duration,
            teacher_name: teacherName,
            student_name: studentName,
          }),
        });

        if (response.ok) {
          successCount++;
          updatedSchedules[i] = { ...schedule, registered: true };
        } else {
          failCount++;
          updatedSchedules[i] = { ...schedule, registered: false };
        }
      } catch (error) {
        console.error("수업 등록 오류:", error);
        failCount++;
        updatedSchedules[i] = { ...schedule, registered: false };
      }
    }

    setRegistrationResults({
      successful: successCount,
      failed: failCount,
    });

    setSchedules(updatedSchedules);
    setIsSubmitting(false);
    setCurrentSession(3); // 완료 화면으로 이동
  }

  // 완료 후 새로고침
  const handleFinish = () => {
    window.location.reload(); // 페이지 새로고침
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="relative w-[80vw] h-[80vh] bg-gray-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b bg-white">
            {/* 스텝 인디케이터 */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentSession === 1 ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="w-16 border-t border-dashed border-gray-300"></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  currentSession === 2 ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="w-16 border-t border-dashed border-gray-300"></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  currentSession === 3 ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {teacherName && teacherName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold">
                  {teacherName} 선생님의 다중 수업 등록
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAddSchedule}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 세션 1: 기본 정보 입력 */}
          {currentSession === 1 && (
            <div className="flex flex-1 overflow-hidden">
              {/* 왼쪽 패널: 날짜 선택 */}
              <div className="w-1/2 p-4 overflow  -y-auto">
                <CustomCalendar />

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    선택된 수업 일정
                  </h3>
                  <SelectedDates />
                </div>
              </div>

              {/* 오른쪽 패널: 시간, 학생, 강의실 선택 */}
              <div className="w-1/2 p-4 border-l border-gray-200 bg-white overflow-y-auto">
                {/* 시간 선택 */}
                <TimeSelector />

                {/* 학생 선택 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학생 선택
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Input
                        placeholder="학생 이름 입력 또는 선택"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="pr-10"
                      />
                      <div
                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <Users size={18} className="text-gray-400" />
                      </div>
                    </div>

                    {isDropdownOpen && studentList.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {studentList
                          .filter((name) =>
                            name
                              .toLowerCase()
                              .includes(studentName.toLowerCase())
                          )
                          .map((name) => (
                            <div
                              key={name}
                              onClick={() => handleStudentSelect(name)}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                            >
                              {name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 강의실 선택 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    강의실 선택
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {roomList.map((roomName, index) => (
                      <button
                        key={index}
                        onClick={() => setCommonRoom(roomName)}
                        className={`px-3 py-2 rounded-md text-sm transition-colors ${
                          commonRoom === roomName
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {roomName}호
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택 요약 */}
                {(selectedDates.length > 0 ||
                  commonTime ||
                  studentName ||
                  commonRoom) && (
                  <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      수업 등록 정보
                    </h3>
                    <div className="flex flex-col space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">날짜</span>
                        <span className="font-medium">
                          {selectedDates.length}개 선택됨
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">시간</span>
                        <span className="font-medium">
                          {commonTime ? `${commonTime}:00` : "선택 필요"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">학생</span>
                        <span className="font-medium">
                          {studentName || "선택 필요"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">강의실</span>
                        <span className="font-medium">
                          {commonRoom ? `${commonRoom}호` : "선택 필요"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 다음 단계 버튼 */}
                <button
                  onClick={checkSchedules}
                  disabled={
                    selectedDates.length === 0 ||
                    !commonTime ||
                    !commonRoom ||
                    !studentName
                  }
                  className={`w-full mt-6 h-12 rounded-lg text-white font-medium transition-colors ${
                    selectedDates.length > 0 &&
                    commonTime &&
                    commonRoom &&
                    studentName
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Plus size={18} className="inline mr-1" />
                  수업 일정 추가하기
                </button>
              </div>
            </div>
          )}

          {/* 세션 2: 방 선택 및 충돌 해결 */}
          {currentSession === 2 && (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* 헤더 */}
              <div className="flex items-center mb-6">
                <button
                  onClick={goBack}
                  className="mr-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold">
                    {schedules.length}개 수업 등록 확인 - {studentName} 학생
                  </h2>
                  <p className="text-sm text-gray-500">
                    공통 수업 시간: {commonTime}:00
                  </p>
                </div>
              </div>

              {/* 등록 요약 */}
              <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  등록 상태 요약
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">등록 가능</p>
                    <p className="text-2xl font-bold text-green-600">
                      {schedules.filter((s) => s.status === "success").length}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">충돌 발생</p>
                    <p className="text-2xl font-bold text-red-600">
                      {schedules.filter((s) => s.status === "conflict").length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">전체 수업</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {schedules.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* 수업 목록 및 충돌 상태 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-lg border ${
                      schedule.status === "conflict"
                        ? "border-red-200 bg-red-50"
                        : schedule.status === "success"
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            schedule.status === "conflict"
                              ? "bg-red-100 text-red-500"
                              : schedule.status === "success"
                              ? "bg-green-100 text-green-500"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {schedule.status === "conflict" ? (
                            <AlertCircle size={16} />
                          ) : schedule.status === "success" ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {schedule.formattedDate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.time}:00 | 강의실: {schedule.room}호
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {schedule.status === "conflict" ? (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full mr-2">
                            충돌
                          </span>
                        ) : schedule.status === "success" ? (
                          <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full mr-2">
                            가능
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mr-2">
                            대기
                          </span>
                        )}
                        <button
                          onClick={() => removeSchedule(schedule.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 충돌이 있는 경우 다른 강의실 선택 UI */}
                    {schedule.status === "conflict" && (
                      <div className="mt-2 border-t border-red-200 pt-2">
                        <p className="text-sm text-red-500 mb-2">
                          다른 강의실 선택:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {roomList
                            .filter((r) => r !== schedule.room)
                            .map((roomName) => (
                              <button
                                key={roomName}
                                onClick={() =>
                                  changeRoomForSchedule(schedule.id, roomName)
                                }
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                              >
                                {roomName}호
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 하단 버튼 */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={saveClasses}
                  disabled={
                    schedules.length === 0 ||
                    schedules.some((s) => s.status === "conflict") ||
                    isSubmitting
                  }
                  className={`px-6 py-2 rounded-lg font-medium flex items-center ${
                    schedules.length > 0 &&
                    !schedules.some((s) => s.status === "conflict") &&
                    !isSubmitting
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={18} className="animate-spin mr-2" />
                      등록 중...
                    </>
                  ) : (
                    "수업 등록하기"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 세션 3: 완료 화면 */}
          {currentSession === 3 && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-md mx-auto mt-8 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  완료되었습니다
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  {registrationResults.successful}개의 수업이 성공적으로
                  등록되었습니다.
                  {registrationResults.failed > 0 && (
                    <span className="text-red-500 block mt-1">
                      {registrationResults.failed}개 수업은 등록에 실패했습니다.
                    </span>
                  )}
                </p>

                <div className="bg-white p-5 rounded-lg shadow-sm mb-10 w-full">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">
                    수업 등록 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">학생</p>
                      <p className="font-medium text-gray-800">{studentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">강사</p>
                      <p className="font-medium text-gray-800">{teacherName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">시간</p>
                      <p className="font-medium text-gray-800">
                        {commonTime}:00
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">강의실</p>
                      <p className="font-medium text-gray-800">
                        {schedules.every((s) => s.room === schedules[0]?.room)
                          ? schedules[0]?.room + "호"
                          : "다양한 강의실"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full h-12 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
