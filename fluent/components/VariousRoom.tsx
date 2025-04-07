"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Calendar from "./VariousRoom/Calendar";
import StudentSelect from "./VariousRoom/StudentSelect";
import TimeSelector from "./VariousRoom/TimeSelector";
import RoomSearchModal from "./VariousRoom/RoomSearchModal";
import { formatDate, formatTime } from "@/utils/formatters";

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
  const [, setRegisterStatus] = useState("수업등록"); // Initial button text

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

  // 시간 변경 핸들러
  const handleTimeChange = () => {
    // 시간이 변경되면 기존 방 선택 초기화
    setRoom("");
    setRoomList([]);
  };

  // 강의실 검색 핸들러
  const handleRoomSearch = async () => {
    if (time === "") {
      alert("수업 시간을 먼저 설정해주세요");
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    try {
      // 첫번째 날짜로 강의실 검색 (어차피 시간은 통일됨)
      if (dates && dates.length > 0) {
        const all_rooms = await fetch(
          `/api/schedules/search_rooms/${formatDate(dates[0])}/${time}/`
        );
        const json_all_rooms = await all_rooms.json();
        setRoomList(json_all_rooms);
      }
      setSearchLoading(false);
    } catch (error) {
      console.error("방 검색 오류:", error);
      alert("방 검색 중 오류가 발생했습니다.");
      setIsSearching(false);
    }
  };

  // 수업 등록 핸들러 - 모든 날짜에 동일한 시간, 강의실로 등록
  const registerSchedules = async () => {
    if (!dates || dates.length === 0) return;
    if (time === "" || !room) {
      alert("수업 시간과 강의실을 먼저 선택해주세요");
      return;
    }
    if (!studentName) {
      alert("학생을 선택해주세요");
      return;
    }

    setRegisterStatus("등록 중..."); // 로딩 상태 표시

    // 서버에서 예상하는 형식으로 데이터 준비
    const formattedDates = dates.map((date) => formatDate(date));

    // 모든 날짜에 대한 등록 성공 여부를 저장할 배열
    const successfulDates: string[] = [];
    const failedDates: string[] = [];
    const allRooms: string[] = [];

    // 각 날짜별로 등록 시도
    for (const date of formattedDates) {
      try {
        const response = await fetch(`/api/schedules/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_name: room,
            date: date,
            time: time,
            duration: "1",
            teacher_name: teacherName,
            student_name: studentName,
          }),
        });

        if (response.ok) {
          successfulDates.push(date);
          allRooms.push(room);
        } else {
          failedDates.push(date);
          allRooms.push(room);
        }
      } catch (error) {
        console.error("수업 등록 오류:", error);
        failedDates.push(date);
        allRooms.push(room);
      }
    }

    // 결과 저장
    setResults({
      all_dates: [...successfulDates, ...failedDates],
      successful_dates: successfulDates,
      failed_dates: failedDates,
      all_rooms: allRooms,
      time: time,
    });

    if (failedDates.length > 0) {
      alert(
        `${successfulDates.length}개 등록 성공, ${failedDates.length}개 등록 실패`
      );
    } else {
      alert("모든 수업이 등록되었숨다");
    }

    setRegisterStatus("수업등록");
    setShowSecondSession(true); // 두 번째 세션으로 전환
  };

  async function saveClass() {
    window.location.reload(); // 새로 고침
  }

  // 날짜 삭제 함수
  const removeDate = (date: Date) => {
    if (!dates) return;
    setDates(dates.filter((d) => d.getTime() !== date.getTime()));
  };

  // 선택된 날짜 표시 컴포넌트
  const SelectedDates = () => {
    if (!dates || dates.length === 0) {
      return (
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
      );
    }

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          선택된 수업 일정
        </h3>
        <div className="flex flex-wrap gap-2">
          {dates.map((date, index) => (
            <div
              key={index}
              className="flex items-center bg-blue-50 rounded-lg border border-blue-100 pl-3 pr-1 py-1"
            >
              <span className="text-sm font-medium text-gray-800 mr-1">
                {formatDate(date)}
              </span>
              <button
                onClick={() => removeDate(date)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-blue-100"
              >
                <svg
                  width="14"
                  height="14"
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
    );
  };

  // 공통 시간과 강의실 컴포넌트
  const CommonSettings = () => {
    if (!dates || dates.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-medium text-gray-700">공통 수업 정보</h3>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg flex items-start space-x-4">
          {/* 시간 설정 */}
          <div className="flex-1">
            <TimeSelector
              time={time}
              setTime={setTime}
              onTimeChange={handleTimeChange}
            />
          </div>

          {/* 강의실 설정 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              강의실
            </label>
            <div className="flex items-center">
              {!room ? (
                <button
                  onClick={handleRoomSearch}
                  className="w-full h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1"
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
              ) : (
                <div className="flex items-center justify-between w-full px-3 py-2 h-10 bg-green-50 text-green-600 border border-green-100 rounded-lg">
                  <span className="font-medium text-sm">{room}</span>
                  <button
                    onClick={() => setRoom("")}
                    className="text-green-500 hover:text-green-700 ml-2"
                  >
                    <svg
                      width="16"
                      height="16"
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
              )}
            </div>
          </div>
        </div>
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
                <Calendar
                  currentMonth={currentMonth}
                  goToPreviousMonth={goToPreviousMonth}
                  goToNextMonth={goToNextMonth}
                  dates={dates}
                  handleDateClick={handleDateClick}
                />
              </div>

              {/* 오른쪽 패널: 입력 영역 */}
              <div className="w-1/2 p-4 md:p-6 border-l border-gray-200 overflow-y-auto bg-white flex flex-col">
                {/* 학생 선택 */}
                <StudentSelect
                  studentName={studentName}
                  setStudentName={setStudentName}
                  studentList={studentList}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                />

                {/* 공통 시간과 강의실 설정 */}
                <CommonSettings />

                {/* 선택된 날짜들 표시 */}
                <div className="flex-grow">
                  <SelectedDates />
                </div>
              </div>
            </div>
          ) : (
            /* 두 번째 세션 - 결과 표시 화면 (개선된 버전) */
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  {results && results.failed_dates.length === 0 ? (
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
                  ) : (
                    <div className="inline-block bg-yellow-100 text-yellow-600 px-4 py-2 rounded-full mb-10">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                      일부 등록에 실패했습니다
                    </div>
                  )}
                  <h2 className="text-2xl font-semibold text-gray-800">
                    수업 등록 결과
                  </h2>
                  <p className="text-gray-600 mt-2 mb-10">
                    {results && results.successful_dates.length}개의 수업이
                    등록되었습니다.
                    {results &&
                      results.failed_dates.length > 0 &&
                      `, ${results.failed_dates.length}개 등록 실패`}
                  </p>

                  {/* 공통 정보 요약 표시 */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">학생</p>
                        <p className="font-medium text-gray-800">
                          {studentName}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">시간</p>
                        <p className="font-medium text-gray-800">{time}:00</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">강의실</p>
                        <p className="font-medium text-gray-800">{room}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 결과 카드 목록 */}
                <div className="space-y-4">
                  {results &&
                    results.all_dates.map((date: string, index: number) => {
                      const isSuccessful =
                        results.successful_dates.includes(date);
                      return (
                        <div
                          key={index}
                          className={`bg-white rounded-lg shadow-sm ${
                            isSuccessful
                              ? "border-l-4 border-green-500"
                              : "border-l-4 border-red-500"
                          } overflow-hidden`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center ${
                                  isSuccessful
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {isSuccessful ? (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M5 13L9 17L19 7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M6 18L18 6M6 6L18 18"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div className="text-lg font-medium text-gray-800">
                                  {date}
                                </div>
                                <div className="text-sm text-gray-500">
                                  강의실: {results.all_rooms[index]}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isSuccessful ? (
                                <span className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                                  등록 완료
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                                  등록 실패
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  onClick={registerSchedules}
                  disabled={
                    !dates ||
                    dates.length === 0 ||
                    time === "" ||
                    !teacherName ||
                    !studentName ||
                    !room
                  }
                  className={`px-8 py-3 rounded-lg text-lg ${
                    dates &&
                    dates.length > 0 &&
                    time !== "" &&
                    teacherName &&
                    studentName &&
                    room
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

      {/* 공통 강의실 검색 모달 */}
      <RoomSearchModal
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        searchLoading={searchLoading}
        roomList={roomList}
        room={room}
        setRoom={setRoom}
        date={dates && dates.length > 0 ? dates[0] : new Date()}
        time={time}
        formatDate={formatDate}
        formatTime={formatTime}
      />

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
