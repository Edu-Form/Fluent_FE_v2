"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

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

  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [time, setTime] = useState<number | "">("");

  const [studentName, setStudentName] = useState("");
  const [studentList, setStudentList] = useState<string[]>([]); // 학생 리스트
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태

  const [results, setResults] = useState<any>(null); // API 응답 데이터 저장
  const [showSecondSession, setShowSecondSession] = useState(false); // 두 번째 세션 전환 여부

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

  async function fetchAvailableRooms() {
    alert("수업이 등록되었습니다!"); // Alert 메시지 출력
    const formattedDates = dates
      ? dates.map((date) =>
          date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        )
      : [];

    const body = {
      dates: formattedDates,
      time: time,
      duration: 1,
      teacher_name: teacherName,
      student_name: studentName,
    };

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
    } else {
      alert("Failed to fetch available rooms.");
    }
  }

  async function saveClass() {
    window.location.reload(); // 새로 고침
  }

  const handleStudentSelect = (name: string) => {
    setStudentName(name);
    setIsDropdownOpen(false); // 드롭다운 닫기
  };
  return (
    <dialog
      id="schedule_modal"
      className="modal bg-slate-400 bg-opacity-50"
      open
    >
      <div className="flex flex-row relative">
        <div className="rounded-[3rem] p-5 bg-white">
          <div className="w-[400px] h-[750px]">
            {!showSecondSession ? (
              <>
                <button
                  type="button"
                  onClick={closeVariousSchedule}
                  className="btn btn-sm btn-circle btn-ghost absolute top-6 right-6"
                >
                  ✕
                </button>
                <div className="dot flex mx-5 mt-10 space-x-2">
                  <div className="w-[30px] h-[12px] bg-gradient-to-r from-[#6fdbff] to-[#ffb3fe] rounded-full"></div>
                  <div className="w-[12px] h-[12px] bg-[#D9D9D9] rounded-full"></div>
                </div>

                <div className="flex flex-col items-center mt-5">
                  <DayPicker
                    mode="multiple"
                    selected={dates}
                    onSelect={setDates}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 px-16 py-5 overflow-y-scroll max-h-[300px]">
                  <div className="flex flex-col items-start text-left h-[90px]">
                    <p className="text-lg font-semibold">When is your class?</p>
                    <p className="mt-3 text-md max-h-[48px] overflow-hidden text-ellipsis line-clamp-2">
                      {dates && dates.length > 0
                        ? dates
                            .map((date) =>
                              date.toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                            )
                            .join(", ")
                        : "Select a date"}
                    </p>
                  </div>

                  <div className="overflow-y-auto max-h-[500px]"></div>
                  <div>
                    <p className="text-lg font-semibold">
                      What time is your class?
                    </p>
                    <Input
                      type="number"
                      value={time}
                      onChange={(e) =>
                        setTime(
                          e.target.value ? parseInt(e.target.value, 10) : ""
                        )
                      }
                      placeholder="Enter time"
                      className="w-full"
                      min={0}
                      max={23}
                    />
                  </div>
                  {/* <div>
                    <p className="text-lg font-semibold">
                      Class Duration (hours)
                    </p>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) =>
                        setDuration(
                          e.target.value ? parseInt(e.target.value, 10) : ""
                        )
                      }
                      placeholder="Enter duration"
                      className="w-full"
                      min={1}
                      max={1}
                    />
                  </div> */}
                  <div>
                    <p className="text-lg font-semibold">Teacher Name</p>
                    <Input
                      value={teacherName}
                      readOnly
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Enter teacher name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <p className="text-lg font-semibold">Student Name</p>
                    <div className="relative">
                      <Input
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          setIsDropdownOpen(true); // 입력 시 드롭다운 열기
                        }}
                        placeholder="Enter student name"
                        className="w-full"
                        onFocus={() => setIsDropdownOpen(true)} // 포커스 시 드롭다운 열기
                      />
                      {/* 드롭다운 버튼 */}
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} // 클릭 시 토글
                        className="absolute inset-y-0 right-0 flex items-center cursor-pointer px-2"
                      >
                        ▼
                      </div>
                      {/* 드롭다운 */}
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-40 overflow-y-auto">
                          {studentList.length > 0 ? (
                            studentList
                              .filter((name) =>
                                name
                                  .toLowerCase()
                                  .includes(studentName.toLowerCase())
                              ) // 입력값과 일치하는 이름 필터링
                              .map((name) => (
                                <div
                                  key={name}
                                  onClick={() => handleStudentSelect(name)}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                >
                                  {name}
                                </div>
                              ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No students found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={fetchAvailableRooms}
                    disabled={!dates || !time || !teacherName || !studentName}
                    className={`w-4/5 h-14 mt-6 rounded-xl text-white ${
                      dates && time && teacherName && studentName
                        ? "bg-gradient-to-r from-[#6fdbff] to-[#ffb3fe]"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Generate Schedule
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="dot flex mx-5 mt-10 space-x-2">
                  <div className="w-[12px] h-[12px] bg-[#D9D9D9] rounded-full"></div>
                  <div className="w-[30px] h-[12px] bg-gradient-to-r from-[#6fdbff] to-[#ffb3fe] rounded-full"></div>
                </div>
                <div className="flex flex-col items-center">
                  <h2 className="text-lg font-semibold mt-3">
                    Schedule Results
                  </h2>
                  {results &&
                    results.all_dates.map((date: string, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between w-3/4 bg-gray-200 rounded-lg p-3 mt-3"
                      >
                        <p>{date}</p>
                        <p>Room: {results.all_rooms[index]}</p>
                        <p>Time: {results.time}</p>
                      </div>
                    ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={saveClass} // saveClass 호출
                    disabled={!results} // results가 없으면 버튼 비활성화
                    className="w-4/5 h-14 mt-6 bg-gradient-to-r from-[#6fdbff] to-[#ffb3fe] rounded-xl text-white"
                  >
                    close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
