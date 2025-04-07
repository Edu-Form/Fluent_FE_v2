import React from "react";

interface ClassCardProps {
  date: string;
  time: number;
  studentName: string;
  roomName: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  date,
  time,
  studentName,
  roomName,
}) => {
  // 날짜 문자열을 Date 객체로 변환하는 함수
  const parseDate = (dateStr: string) => {
    return new Date(dateStr.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"));
  };

  const parsedDate = parseDate(date);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow overflow-hidden">
      <div className="flex p-4 border-b border-gray-100">
        <div className="w-14 h-14 bg-blue-500 text-white rounded-lg flex flex-col items-center justify-center mr-4 shadow-sm">
          <span className="text-xl font-bold">{parsedDate.getDate()}</span>
          <span className="text-xs">
            {parsedDate.toLocaleString("ko-KR", { month: "short" })}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-lg text-gray-800">{date}</h3>
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
              {time}:00
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex justify-between items-center bg-white">
        <div className="flex items-center">
          <div>
            <span className="text-sm text-gray-500">학생</span>
            <p className="font-medium text-gray-800">{studentName}</p>
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
            <span className="text-sm text-gray-500">강의실</span>
            <p className="font-medium text-gray-800">{roomName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
