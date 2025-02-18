"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { AiOutlineLeft } from "react-icons/ai";
import { useSearchParams } from "next/navigation";

interface ScheduleModalProps {
  closeAddSchedule: () => void;
}

export default function AddRoom({ closeAddSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [room, setRoom] = useState("");
  const [duration] = useState("1");

  const [studentName, setStudentName] = useState("");
  const [studentList, setStudentList] = useState<string[]>([]); // 학생 리스트
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 열림 상태

  const [showRoomSelection, setShowRoomSelection] = useState(false); // 방넘김
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null); // 방 선택
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";
  const type = searchParams.get("type");
  const [teacherName, setTeacherName] = useState(user);

  useEffect(() => {
    if (user) {
      setTeacherName(user);
    }
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

  const handleStudentSelect = (name: string) => {
    setStudentName(name); // 선택한 이름으로 업데이트
    setIsDropdownOpen(false); // 드롭다운 닫기
  };

  // This function sends date and time data to API and receives a list of rooms.
  async function searchRooms() {
    const formattedDate = date
      ? date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

    const all_rooms = await fetch(
      `/api/schedules/search_rooms/${formattedDate}/${time}/`
    );
    const json_all_rooms = await all_rooms.json();

    console.log(json_all_rooms);
    setRoomList(json_all_rooms);
    setShowRoomSelection(true); // 상태 변경하여 다음 섹션으로 넘어가게 함
  }

  // 방 선택 핸들러
  function selectRoom(roomId: string) {
    setSelectedRoom(roomId); // 선택된 방 업데이트
    setRoom(roomId); // 선택된 방을 room 상태에 설정
  }

  // 뒤로가기 버튼 클릭 시 방 선택 섹션을 숨기고 첫 번째 섹션으로 돌아가기
  function goBackToDateTimeSelection() {
    setShowRoomSelection(false); // 첫 번째 섹션으로 돌아가기
  }

  async function saveClass() {
    const formattedDate = date
      ? date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

    const response = await fetch(`/api/schedules/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_name: room,
        date: formattedDate,
        time: time,
        duration: duration,
        teacher_name: teacherName,
        student_name: studentName,
      }),
    });

    if (response.status == 200) {
      alert("수업이 등록되었습니다!"); // Alert 메시지 출력
      window.location.reload(); // 새로고침
    } else {
      alert("수업 등록에 실패했습니다. 다시 시도해주세요."); // Alert 메시지 출력
      window.location.reload(); // 새로고침
    }
  }

  return (
    <dialog id="my_modal_3" className="modal bg-slate-400 bg-opacity-50" open>
      <div className="flex flex-row relative">
        <div className="rounded-[3rem] p-5 bg-white">
          <div className="w-[400px] h-[650px]  border-none">
            {/* 첫 번째 섹션: 날짜 및 시간 선택 */}
            {!showRoomSelection && (
              <>
                <button
                  type="button"
                  onClick={closeAddSchedule}
                  className="btn btn-sm btn-circle btn-ghost absolute top-6 right-6"
                >
                  ✕
                </button>
                <div className="dot flex mx-5 mt-10 space-x-2">
                  <div className="w-[30px] h-[12px] bg-[#121B5C] rounded-full"></div>
                  <div className="w-[12px] h-[12px] bg-[#D9D9D9] rounded-full"></div>
                </div>

                <div className="flex flex-col items-center  justify-center m">
                  <DayPicker mode="single" selected={date} onSelect={setDate} />
                </div>
                <div className="flex flex-col items-start text-left px-16 py-5">
                  <p className="text-lg font-semibold">When is your class?</p>
                  <p className="mt-3 text-md">
                    {date
                      ? `${date.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}`
                      : "Select a date"}
                  </p>
                </div>

                <div className="flex flex-col  items-start text-left space-y-2  px-16 py-5">
                  <p className="time text-lg font-semibold">
                    What time is your class?
                  </p>
                  <Input
                    id="time"
                    type="number"
                    placeholder="Enter time"
                    value={time}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);

                      if (value >= 0 && value <= 23) {
                        setTime(e.target.value);
                      } else if (e.target.value === "") {
                        setTime("");
                      }
                    }}
                    className="w-2/3 text-start"
                    min={0}
                    max={23}
                  />
                </div>

                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 mb-5 w-full flex justify-center">
                  <button
                    onClick={searchRooms}
                    className={` w-4/5 h-14 mt-6 rounded-xl text-white ${
                      date && time
                        ? "bg-[#121B5C]"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!date || !time}
                  >
                    Search Rooms
                  </button>
                </div>
              </>
            )}

            {/* 두 번째 섹션: 방 선택 및 수업 정보 입력 */}
            {showRoomSelection && (
              <>
                <button
                  onClick={goBackToDateTimeSelection}
                  className="absolute top-4 left-5  text-gray-400"
                >
                  <AiOutlineLeft className="text-semibold w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={closeAddSchedule}
                  className="btn btn-sm btn-circle btn-ghost absolute top-6 right-6"
                >
                  ✕
                </button>
                <div className="dot flex mx-5 mt-10 space-x-2">
                  <div className="w-[12px] h-[12px] bg-[#D9D9D9] rounded-full"></div>
                  <div className="w-[30px] h-[12px] bg-[#121B5C] rounded-full"></div>
                </div>
                <div className="flex flex-col ml-[1rem]">
                  <p className="mt-5 text-3xl font-semibold">
                    {date ? `${date.toLocaleDateString()}` : "Select a date"}
                  </p>

                  <div className="my-5 w-36 h-10 text-xl font-semibold rounded-[20px] text-white bg-[#c5d9ff] flex items-center justify-between pr-3">
                    <p className="my-5 w-20 h-10 text-xl font-semibold rounded-[20px] text-white bg-[#075AFF] flex items-center justify-center">
                      {time ? `${time}:00` : "time error"}
                    </p>
                    {duration}시간
                  </div>
                </div>

                <div className="flex flex-col justify-start mb-4  w-11/12 mx-auto">
                  {roomList.map((room_name, index) => (
                    <div
                      key={index}
                      onClick={() => selectRoom(room_name)}
                      className={`p-5 mb-2 rounded-[20px] w-full h-12 font-bold text-black  cursor-pointer border-[1px] border-[#075AFF] flex items-center justify-start
        ${
          selectedRoom === room_name
            ? "bg-[#075AFF] text-white" // 선택된 방일 경우 유지
            : "bg-white text-black hover:bg-[#075AFF] hover:text-white"
        } transition-all`}
                    >
                      {room_name}호
                    </div>
                  ))}
                </div>
                {room && (
                  <>
                    <div className="flex">
                      <div>
                        <Input
                          id="teacher-name"
                          placeholder="Teacher"
                          value={teacherName}
                          readOnly
                          onChange={(e) => setTeacherName(e.target.value)}
                          className=" ml-5 w-40 border-none focus:outline-none focus:ring-0  "
                        />
                        <div className="flex ml-5 w-40 border-[1px] border-[#075AFF]"></div>
                      </div>

                      <div className="relative ml-5 w-40">
                        {/* Input 필드 */}
                        <Input
                          id="student-name"
                          placeholder="Student"
                          value={studentName}
                          onChange={(e) => {
                            setStudentName(e.target.value);
                            setIsDropdownOpen(true); // 드롭다운 열기
                          }}
                          onFocus={() => setIsDropdownOpen(true)} // 포커스 시 드롭다운 열기
                          className="border-none focus:outline-none focus:ring-0"
                        />

                        {/* 드롭다운 버튼 */}
                        <div
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)} // 클릭 시 토글
                          className="absolute inset-y-0 right-0 flex items-center cursor-pointer px-2"
                        >
                          ▼
                        </div>
                        {/* 드롭다운 목록 */}
                        {isDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow">
                            {studentList.length > 0 ? (
                              studentList
                                .filter((name) =>
                                  name
                                    .toLowerCase()
                                    .includes(studentName.toLowerCase())
                                ) // 입력값과 일치하는 이름 필터링
                                .map((name) => (
                                  <div
                                    key={name} // 고유 값 사용
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
                        {/* 하단 테두리 */}
                        <div className="flex w-40 border-[1px] border-[#075AFF]"></div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-center">
                  {" "}
                  <button
                    onClick={saveClass}
                    className={` w-4/5 h-14 mt-6 rounded-xl text-white ${
                      teacherName && studentName && duration && room
                        ? "bg-[#121B5C]"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Add Class
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
