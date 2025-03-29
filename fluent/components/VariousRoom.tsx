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
  const [teacherName, setTeacherName] = useState(user);

  // 기존 상태 변수 방식으로 복원
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [time, setTime] = useState<number | "">("");

  const [studentName, setStudentName] = useState("");
  const [studentList, setStudentList] = useState<string[]>([]); // 학생 리스트
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태

  const [results, setResults] = useState<any>(null); // API 응답 데이터 저장
  const [showSecondSession, setShowSecondSession] = useState(false); // 두 번째 세션 전환 여부
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
                        <div className="flex items-center px-4  border-b bg-slate-100">
                          <Search />
                          <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-3  bg-slate-100  focus:outline-none"
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

                {/* 수업 시간 설정 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    수업 시간
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const newTime =
                          typeof time === "number" ? (time - 1 + 24) % 24 : 23;
                        setTime(newTime);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-gray-100 text-lg rounded-l-lg hover:bg-gray-200 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={time === "" ? "" : String(time).padStart(2, "0")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setTime("");
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0 && num < 24) {
                            setTime(num);
                          }
                        }
                      }}
                      className="w-20 h-12 text-center text-lg outline-none border-y border-gray-300"
                      placeholder="00"
                    />
                    <button
                      onClick={() => {
                        const newTime =
                          typeof time === "number" ? (time + 1) % 24 : 1;
                        setTime(newTime);
                      }}
                      className="w-12 h-12 text-lg flex items-center justify-center bg-gray-100 rounded-r-lg hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 선택된 날짜 표시 */}
                <div className="flex-grow">
                  {dates && dates.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-4">
                        선택된 수업 일정
                      </h3>
                      <div className="space-y-3 max-h-[calc(100%-3rem)] overflow-y-auto pr-2">
                        {dates.map((date, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 bg-blue-50 flex justify-between items-center"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800 text-lg">
                                {formatDate(date)}
                              </span>
                              <span className="text-blue-600">
                                {formatTime(time)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeDate(date)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
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
                                />
                              </svg>
                            </button>
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
            <div className="flex-1 p-6 overflow-y-auto">
              <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
                수업 등록 결과
              </h2>
              <div className="space-y-4 max-w-3xl mx-auto">
                {results &&
                  results.all_dates.map((date: string, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-4">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-800 text-lg">
                          {date}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center text-gray-600">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2"
                          >
                            <path
                              d="M3 10H21M7 3V5M17 3V5M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-lg">
                            Room: {results.all_rooms[index]}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2"
                          >
                            <path
                              d="M12 8V12L15 15M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-lg">
                            Time: {results.time}:00
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                      ? "bg-blue-500 text-white hover:bg-blue-600 transition-colors"
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
      `}</style>
    </>
  );
}
