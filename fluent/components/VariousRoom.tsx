"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface ScheduleModalProps {
  closeVariousSchedule: () => void;
}

export default function VariousRoom({
  closeVariousSchedule,
}: ScheduleModalProps) {
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";
  const type = searchParams.get("type");
  const [teacherName] = useState(user);

  // 기존 상태 변수 방식으로 복원
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [time, setTime] = useState<number | "">("");

  const [studentName, setStudentName] = useState("");
  const [studentList, setStudentList] = useState<string[]>([]); // 학생 리스트
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태

  const [results, setResults] = useState<any>(null); // API 응답 데이터 저장
  const [showSecondSession, setShowSecondSession] = useState(false); // 두 번째 세션 전환 여부
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [roomList, setRoomList] = useState<string[]>([]); // 방 리스트
  const [room, setRoom] = useState(""); // 방 이름
  const [registerStatus, setRegisterStatus] = useState("수업등록"); // Initial button text

  // 강의실 검색 관련 상태 추가
  const [isSearching, setIsSearching] = useState(false); // 검색 모달 상태
  const [searchLoading, setSearchLoading] = useState(true); // 검색 로딩 상태

  useEffect(() => {
    // Fetch student list from API
    async function fetchStudentList() {
      try {
        const URL = `/api/diary/${type}/${user}`;
        const response = await fetch(URL, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch student list");
        }

        const data: string[] = await response.json();
        setStudentList(data); // 학생 리스트 업데이트
      } catch (error) {
        console.error("Error fetching student list:", error);
      }
    }

    if (user && type) {
      fetchStudentList();
    }
  }, [user, type]);

  // 달력 관련 유틸리티 함수
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
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

  // 날짜 선택 핸들러
  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    // 이미 선택된 날짜인지 확인
    const dateExists = dates?.some(
      (date) =>
        date.getDate() === day &&
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
    );

    if (dateExists) {
      // 이미 선택된 날짜라면 제거
      setDates(
        dates?.filter(
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
      setDates([...(dates || []), selectedDate]);

      // 새 날짜를 추가할 때 기존에 선택된 강의실 초기화
      setRoom("");
      setRoomList([]);
    }
  };

  async function fetchAvailableRooms() {
    if (!dates || dates.length === 0) return;

    // 서버에서 예상하는 형식으로 데이터 준비
    const formattedDates = dates.map((date) =>
      date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );

    // 모든 날짜에 동일한 시간 적용
    const timeValue = typeof time === "number" ? time : 0;

    const body = {
      dates: formattedDates,
      time: timeValue,
      duration: 1,
      teacher_name: teacherName,
      student_name: studentName,
    };

    try {
      const response = await fetch(`/api/schedules/auto/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowSecondSession(true); // 두 번째 세션으로 전환
        alert("수업이 등록되었습니다!"); // Alert 메시지 출력
      } else {
        alert("Failed to fetch available rooms.");
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  async function saveClass() {
    window.location.reload(); // 새로 고침
  }

  const handleStudentSelect = (name: string) => {
    setStudentName(name);
    setIsDropdownOpen(false); // 드롭다운 닫기
  };

  // 날짜 포맷 함수 - 화면 표시용
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 시간 포맷 함수
  const formatTime = (timeValue: number | ""): string => {
    return timeValue === "" ? "" : `${String(timeValue).padStart(2, "0")}:00`;
  };

  // 날짜 삭제 함수
  const removeDate = (date: Date) => {
    if (!dates) return;
    setDates(dates.filter((d) => d.getTime() !== date.getTime()));

    // 날짜 삭제 시 기존에 선택된 강의실 초기화
    setRoom("");
    setRoomList([]);
  };

  // 달력 렌더링
  const renderCalendar = () => {
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
        className="text-center w-12 h-10 flex items-center justify-center font-medium text-gray-600"
      >
        {day}
      </div>
    ));

    // 빈 칸 채우기
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-12 h-12"></div>);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = dates?.some(
        (date) =>
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
      );

      days.push(
        <div
          key={`day-${day}`}
          className={`w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 ${
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
      <div className="p-6 bg-white rounded-xl shadow-sm h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentMonth.toLocaleString("ko-KR", { month: "long" })} {year}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={goToPreviousMonth}
              className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
            >
              &lt;
            </button>
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">{dayNameElements}</div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="relative w-[80vw] h-[80vh] bg-gray-50 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
          {/* 헤더 */}
          <div className="p-4 md:p-6 border-b bg-white">
            {/* 스텝 인디케이터 - 중앙 정렬 */}
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  !showSecondSession ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="w-16 border-t border-dashed border-gray-300"></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  showSecondSession ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="w-16 border-t border-dashed border-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold">
                  {user} 선생님의 수업 등록
                </h2>
              </div>

              <button
                type="button"
                onClick={closeVariousSchedule}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {!showSecondSession ? (
            <div className="flex flex-1 overflow-hidden">
              {/* 왼쪽 패널: 달력 */}
              <div className="w-1/2 p-4 md:p-6 overflow-y-auto">
                {renderCalendar()}
              </div>

              {/* 오른쪽 패널: 입력 영역 */}
              <div className="w-1/2 p-4 md:p-6 border-l border-gray-200 overflow-y-auto bg-white flex flex-col">
                {/* 학생 선택 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    학생 선택
                  </label>
                  <div className="relative">
                    <div
                      className="border border-gray-300 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-lg ${
                            studentName ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {studentName || "학생을 선택하세요"}
                        </span>
                        <div className="flex items-center">
                          {studentName && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                setStudentName("");
                              }}
                              className="mr-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                          <svg
                            width="12"
                            height="6"
                            viewBox="0 0 12 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform ${
                              isDropdownOpen ? "rotate-180" : ""
                            }`}
                          >
                            <path
                              d="M1 1L6 5L11 1"
                              stroke="#888"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
                        <div className="flex items-center px-4 border-b bg-slate-100">
                          <Search />
                          <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-3 bg-slate-100 focus:outline-none"
                            placeholder="학생 이름 검색..."
                          />
                        </div>
                        {studentList.length > 0 ? (
                          studentList
                            .filter((name) =>
                              name
                                .toLowerCase()
                                .includes(studentName.toLowerCase())
                            )
                            .map((name) => (
                              <div
                                key={name}
                                onClick={() => handleStudentSelect(name)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                {name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500">
                            학생이 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 선택된 날짜 표시 - 개선된 디자인 */}
                <div className="flex-grow">
                  {dates && dates.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-4">
                        선택된 수업 일정
                      </h3>
                      <div className="space-y-4 max-h-[calc(100%-3rem)] overflow-y-auto pr-2">
                        {dates.map((date, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {/* 날짜 헤더 부분 */}
                            <div className="bg-blue-50 p-3 flex justify-between items-center rounded-t-lg border-b border-gray-200">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800">
                                  {formatDate(date)}
                                </span>
                              </div>
                              <button
                                onClick={() => removeDate(date)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* 시간 및 방 설정 부분 */}
                            <div className="p-4">
                              {/* 시간 설정 */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                  수업 시간
                                </label>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => {
                                      const newTime =
                                        typeof time === "number"
                                          ? (time - 1 + 24) % 24
                                          : 23;
                                      setTime(newTime);
                                      // 시간이 변경되면 기존 방 선택 초기화
                                      setRoom("");
                                      setRoomList([]);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-l-lg hover:bg-gray-200 transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    value={
                                      time === ""
                                        ? ""
                                        : String(time).padStart(2, "0")
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "") {
                                        setTime("");
                                        // 시간이 변경되면 기존 방 선택 초기화
                                        setRoom("");
                                        setRoomList([]);
                                      } else {
                                        const num = parseInt(val, 10);
                                        if (
                                          !isNaN(num) &&
                                          num >= 0 &&
                                          num < 24
                                        ) {
                                          setTime(num);
                                          // 시간이 변경되면 기존 방 선택 초기화
                                          setRoom("");
                                          setRoomList([]);
                                        }
                                      }
                                    }}
                                    className="w-16 h-10 text-center text-base outline-none border border-gray-300"
                                    placeholder="00"
                                  />
                                  <button
                                    onClick={() => {
                                      const newTime =
                                        typeof time === "number"
                                          ? (time + 1) % 24
                                          : 1;
                                      setTime(newTime);
                                      // 시간이 변경되면 기존 방 선택 초기화
                                      setRoom("");
                                      setRoomList([]);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-r-lg hover:bg-gray-200 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* 강의실 검색 및 선택 - 개선된 모달 디자인 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                  강의실
                                </label>

                                {/* 강의실 검색 버튼 */}
                                <button
                                  onClick={async () => {
                                    if (time === "") {
                                      alert("수업 시간을 먼저 설정해주세요");
                                      return;
                                    }

                                    setIsSearching(true); // 검색 모달 표시
                                    setSearchLoading(true); // 로딩 상태 활성화

                                    try {
                                      const all_rooms = await fetch(
                                        `/api/schedules/search_rooms/${formatDate(
                                          date
                                        )}/${time}/`
                                      );
                                      const json_all_rooms =
                                        await all_rooms.json();
                                      setRoomList(json_all_rooms);
                                      setSearchLoading(false); // 로딩 상태 해제
                                    } catch (error) {
                                      console.error("방 검색 오류:", error);
                                      alert("방 검색 중 오류가 발생했습니다.");
                                      setIsSearching(false);
                                    }
                                  }}
                                  className="flex items-center justify-center w-full py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-all group"
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-2 transition-transform group-hover:scale-110"
                                  >
                                    <path
                                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  강의실 검색
                                </button>

                                {/* 강의실 검색 모달 */}
                                {isSearching && (
                                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                                    <div
                                      className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-scale-in"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* 모달 헤더 */}
                                      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
                                        <h3 className="text-lg font-semibold flex items-center">
                                          <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mr-2"
                                          >
                                            <path
                                              d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 6.99998H15M9 10.5H12"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          이용 가능한 강의실
                                        </h3>
                                        <button
                                          onClick={() => setIsSearching(false)}
                                          className="text-white hover:text-blue-100 transition-colors"
                                        >
                                          <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                          >
                                            <path
                                              d="M18 6L6 18M6 6L18 18"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                        </button>
                                      </div>

                                      {/* 모달 본문 */}
                                      <div className="p-4">
                                        <div className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                                          <div className="text-gray-500 mr-2">
                                            <svg
                                              width="20"
                                              height="20"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                            >
                                              <path
                                                d="M12 8V12L15 15M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <div className="text-sm text-gray-500">
                                              선택된 날짜 및 시간
                                            </div>
                                            <div className="font-medium">
                                              {formatDate(date)},{" "}
                                              {formatTime(time)}
                                            </div>
                                          </div>
                                        </div>

                                        {searchLoading ? (
                                          // 로딩 상태
                                          <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                            <p>강의실을 검색 중입니다...</p>
                                          </div>
                                        ) : roomList.length > 0 ? (
                                          // 강의실 목록
                                          <div className="overflow-y-auto max-h-60">
                                            <div className="grid grid-cols-1 gap-2">
                                              {roomList.map(
                                                (roomName, index) => (
                                                  <div
                                                    key={index}
                                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                                                      room === roomName
                                                        ? "bg-blue-50 border border-blue-200 shadow-sm"
                                                        : "hover:bg-gray-50 border border-gray-100"
                                                    }`}
                                                    onClick={() =>
                                                      setRoom(roomName)
                                                    }
                                                  >
                                                    <div
                                                      className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 border transition-colors ${
                                                        room === roomName
                                                          ? "border-blue-500 bg-blue-500"
                                                          : "border-gray-300"
                                                      }`}
                                                    >
                                                      {room === roomName && (
                                                        <svg
                                                          width="12"
                                                          height="12"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                          xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                          <path
                                                            d="M5 13L9 17L19 7"
                                                            stroke="white"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                          />
                                                        </svg>
                                                      )}
                                                    </div>
                                                    <div className="flex-1">
                                                      <p
                                                        className={`font-medium ${
                                                          room === roomName
                                                            ? "text-blue-700"
                                                            : "text-gray-800"
                                                        }`}
                                                      >
                                                        {roomName}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        이용 가능한 강의실
                                                      </p>
                                                    </div>
                                                    <div
                                                      className={`w-2 h-2 rounded-full ${
                                                        room === roomName
                                                          ? "bg-green-500"
                                                          : "bg-gray-300"
                                                      }`}
                                                    ></div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          // 검색 결과 없음
                                          <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                                            <svg
                                              width="40"
                                              height="40"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              className="mb-2 text-gray-300"
                                            >
                                              <path
                                                d="M10 3H3V10H10V3Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M21 3H14V10H21V3Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M21 14H14V21H21V14Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M10 14H3V21H10V14Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                            <p>이용 가능한 강의실이 없습니다</p>
                                            <p className="text-sm mt-1">
                                              다른 시간대를 선택해보세요
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* 모달 하단 버튼 */}
                                      <div className="border-t border-gray-200 p-4 flex justify-between">
                                        <button
                                          onClick={() => setIsSearching(false)}
                                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                          취소
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (room) {
                                              setIsSearching(false);
                                            } else {
                                              alert("강의실을 선택해주세요");
                                            }
                                          }}
                                          className={`px-4 py-2 rounded-lg ${
                                            room
                                              ? "bg-blue-500 text-white hover:bg-blue-600"
                                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                          } transition-colors`}
                                        >
                                          선택 완료
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 선택된 강의실 표시 */}
                                {room && (
                                  <div className="mt-3 flex items-center p-3 bg-green-50 border border-green-100 rounded-lg text-green-800 animate-fade-in">
                                    <div className="w-8 h-8 bg-white rounded-full border border-green-200 flex items-center justify-center mr-3 shadow-sm">
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-green-600">
                                        선택된 강의실
                                      </p>
                                      <p className="font-semibold">{room}</p>
                                    </div>
                                    <button
                                      onClick={() => setRoom("")}
                                      className="text-green-600 hover:text-green-800 transition-colors"
                                    >
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                      >
                                        <path
                                          d="M18 6L6 18M6 6L18 18"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}

                                {/* 등록 버튼 */}
                                <button
                                  onClick={async () => {
                                    if (!room) {
                                      alert("강의실을 선택해주세요.");
                                      return;
                                    }

                                    setRegisterStatus("등록 중..."); // 로딩 상태 표시

                                    try {
                                      const response = await fetch(
                                        `/api/schedules/`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            room_name: room,
                                            date: formatDate(date),
                                            time: time,
                                            duration: "1",
                                            teacher_name: teacherName,
                                            student_name: studentName,
                                          }),
                                        }
                                      );

                                      if (response.ok) {
                                        setRegisterStatus("등록 완료!");
                                        // 성공 표시 잠시 후 원래 상태로
                                        setTimeout(() => {
                                          setRegisterStatus("수업등록");
                                        }, 2000);
                                      } else {
                                        setRegisterStatus("등록 실패");
                                        setTimeout(() => {
                                          setRegisterStatus("수업등록");
                                        }, 2000);
                                      }
                                    } catch (error) {
                                      console.error("수업 등록 오류:", error);
                                      setRegisterStatus("등록 실패");
                                      setTimeout(() => {
                                        setRegisterStatus("수업등록");
                                      }, 2000);
                                    }
                                  }}
                                  disabled={!room || time === ""}
                                  className={`w-full py-2 rounded text-white text-center font-medium mt-4 ${
                                    room && time !== ""
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-gray-300 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {registerStatus}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-4 text-gray-300"
                      >
                        <path
                          d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-lg">달력에서 날짜를 선택해주세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 두 번째 세션 - 결과 표시 화면 (개선된 버전) */
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-full mb-10">
                    <svg
                      className="w-6 h-6 inline-block mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    성공적으로 등록되었습니다
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    수업 등록 결과
                  </h2>
                  <p className="text-gray-600 mt-2 mb-10">
                    {results && results.all_dates.length}개의 수업이
                    등록되었습니다.
                  </p>
                </div>

                {/* 결과 카드 목록 */}
                <div className="space-y-4">
                  {results &&
                    results.all_dates.map((date: string, index: number) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow overflow-hidden"
                      >
                        <div className="flex p-4 border-b border-gray-100">
                          <div className="w-14 h-14 bg-blue-500 text-white rounded-lg flex flex-col items-center justify-center mr-4 shadow-sm">
                            {/* 날짜에서 일자 추출 */}
                            <span className="text-xl font-bold">
                              {new Date(
                                date.replace(
                                  /(\d{2})\.(\d{2})\.(\d{4})/,
                                  "$3-$2-$1"
                                )
                              ).getDate()}
                            </span>
                            <span className="text-xs">
                              {new Date(
                                date.replace(
                                  /(\d{2})\.(\d{2})\.(\d{4})/,
                                  "$3-$2-$1"
                                )
                              ).toLocaleString("ko-KR", { month: "short" })}
                            </span>
                          </div>

                          <div className="flex flex-col justify-center">
                            <h3 className="font-semibold text-lg text-gray-800">
                              {date}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <span className="mr-4 flex items-center">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1"
                                >
                                  <path
                                    d="M12 8V12L15 15M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {results.time}:00
                              </span>
                              {/* <span className="flex items-center">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1"
                                >
                                  <path
                                    d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H15M9 11H15M9 15H13"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                60분
                              </span> */}
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 flex justify-between items-center bg-white">
                          <div className="flex items-center">
                            <div>
                              <span className="text-sm text-gray-500">
                                학생
                              </span>
                              <p className="font-medium text-gray-800">
                                {studentName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M5 21L3 21M5 21H19M9 6.99998H15M9 10.5H12"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">
                                강의실
                              </span>
                              <p className="font-medium text-gray-800">
                                {results.all_rooms[index]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="p-4 md:p-6 border-t bg-white flex justify-between">
            {!showSecondSession ? (
              <>
                <button
                  onClick={closeVariousSchedule}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg text-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={fetchAvailableRooms}
                  disabled={
                    !dates ||
                    dates.length === 0 ||
                    time === "" ||
                    !teacherName ||
                    !studentName
                  }
                  className={`px-8 py-3 rounded-lg text-lg ${
                    dates &&
                    dates.length > 0 &&
                    time !== "" &&
                    teacherName &&
                    studentName
                      ? "bg-blue-500 text-white hover:bg-blue-600transition-colors"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  일정 등록하기
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSecondSession(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg text-lg hover:bg-gray-200 transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={saveClass}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg text-lg hover:bg-blue-600 transition-colors"
                >
                  완료
                </button>
              </>
            )}
          </div>
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
