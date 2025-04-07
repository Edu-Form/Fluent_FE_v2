import React from "react";

interface SelectedRoomDisplayProps {
  room: string;
  setRoom: (room: string) => void;
}

const SelectedRoomDisplay: React.FC<SelectedRoomDisplayProps> = ({
  room,
  setRoom,
}) => {
  if (!room) return null;

  return (
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
        <p className="text-sm text-green-600">선택된 강의실</p>
        <p className="font-semibold">{room}</p>
      </div>
      <button
        onClick={() => setRoom("")}
        className="text-green-600 hover:text-green-800 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default SelectedRoomDisplay;
