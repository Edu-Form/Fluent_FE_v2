import React from "react";

interface TimeSelectorProps {
  time: number | "";
  setTime: (time: number | "") => void;
  onTimeChange?: (time: number | "") => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  time,
  setTime,
  onTimeChange,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        수업 시간
      </label>
      <div className="flex items-center">
        <button
          onClick={() => {
            const newTime =
              typeof time === "number" ? (time - 1 + 24) % 24 : 23;
            setTime(newTime);
            if (onTimeChange) onTimeChange(newTime);
          }}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-l-lg hover:bg-gray-200 transition-colors"
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
              if (onTimeChange) onTimeChange("");
            } else {
              const num = parseInt(val, 10);
              if (!isNaN(num) && num >= 0 && num < 24) {
                setTime(num);
                if (onTimeChange) onTimeChange(num);
              }
            }
          }}
          className="w-16 h-10 text-center text-base outline-none border border-gray-300"
          placeholder="00"
        />
        <button
          onClick={() => {
            const newTime = typeof time === "number" ? (time + 1) % 24 : 1;
            setTime(newTime);
            if (onTimeChange) onTimeChange(newTime);
          }}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-r-lg hover:bg-gray-200 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TimeSelector;
