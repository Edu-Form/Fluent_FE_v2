import React from "react";

interface RoomSearchModalProps {
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  searchLoading: boolean;
  roomList: string[];
  room: string;
  setRoom: (room: string) => void;
  date: Date;
  time: number | "";
  formatDate: (date: Date) => string;
  formatTime: (time: number | "") => string;
}

const RoomSearchModal: React.FC<RoomSearchModalProps> = ({
  isSearching,
  setIsSearching,
  searchLoading,
  roomList,
  room,
  setRoom,
  date,
  time,
  formatDate,
  formatTime,
}) => {
  if (!isSearching) return null;

  return (
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
              <div className="text-sm text-gray-500">선택된 날짜 및 시간</div>
              <div className="font-medium">
                {formatDate(date)}, {formatTime(time)}
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
                {roomList.map((roomName, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      room === roomName
                        ? "bg-blue-50 border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50 border border-gray-100"
                    }`}
                    onClick={() => setRoom(roomName)}
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
                          room === roomName ? "text-blue-700" : "text-gray-800"
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
                        room === roomName ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                ))}
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
              <p className="text-sm mt-1">다른 시간대를 선택해보세요</p>
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
  );
};

export default RoomSearchModal;
