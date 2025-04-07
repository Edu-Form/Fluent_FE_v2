import React from "react";
import TimeSelector from "./TimeSelector";
import RoomSearchButton from "./RoomSearchButton";
import RoomSearchModal from "./RoomSearchModal";
import SelectedRoomDisplay from "./SelectedRoomDisplay";

interface DateScheduleCardProps {
  date: Date;
  removeDate: (date: Date) => void;
  time: number | "";
  setTime: (time: number | "") => void;
  room: string;
  setRoom: (room: string) => void;
  setRoomList: (roomList: string[]) => void;
  formatDate: (date: Date) => string;
  formatTime: (time: number | "") => string;
  teacherName: string;
  studentName: string;
  registerStatus: string;
  setRegisterStatus: (status: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  searchLoading: boolean;
  setSearchLoading: (isLoading: boolean) => void;
  roomList: string[];
}

const DateScheduleCard: React.FC<DateScheduleCardProps> = ({
  date,
  removeDate,
  time,
  setTime,
  room,
  setRoom,
  setRoomList,
  formatDate,
  formatTime,
  isSearching,
  setIsSearching,
  searchLoading,
  setSearchLoading,
  roomList,
}) => {
  // 강의실 검색 핸들러
  const handleRoomSearch = async () => {
    if (time === "") {
      alert("수업 시간을 먼저 설정해주세요");
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    try {
      const all_rooms = await fetch(
        `/api/schedules/search_rooms/${formatDate(date)}/${time}/`
      );
      const json_all_rooms = await all_rooms.json();
      setRoomList(json_all_rooms);
      setSearchLoading(false);
    } catch (error) {
      console.error("방 검색 오류:", error);
      alert("방 검색 중 오류가 발생했습니다.");
      setIsSearching(false);
    }
  };

  // 시간 변경 핸들러
  const handleTimeChange = () => {
    // 시간이 변경되면 기존 방 선택 초기화
    setRoom("");
    setRoomList([]);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
      {/* 날짜 헤더 부분 */}
      <div className="bg-blue-50 p-3 flex justify-between items-center rounded-t-lg border-b border-gray-200">
        <div className="flex items-center">
          <span className="font-medium text-gray-800">{formatDate(date)}</span>
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
        <TimeSelector
          time={time}
          setTime={setTime}
          onTimeChange={handleTimeChange}
        />

        {/* 강의실 검색 및 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            강의실
          </label>

          <RoomSearchButton onClick={handleRoomSearch} />

          <RoomSearchModal
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            searchLoading={searchLoading}
            roomList={roomList}
            room={room}
            setRoom={setRoom}
            date={date}
            time={time}
            formatDate={formatDate}
            formatTime={formatTime}
          />

          <SelectedRoomDisplay room={room} setRoom={setRoom} />

          {/* <RegisterButton
            room={room}
            time={time}
            registerStatus={registerStatus}
            onClick={handleRegister}
          /> */}
        </div>
      </div>
    </div>
  );
};

export default DateScheduleCard;
