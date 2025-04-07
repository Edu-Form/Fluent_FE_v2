import React from "react";

interface CalendarProps {
  currentMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  dates: Date[] | undefined;
  handleDateClick: (day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentMonth,
  goToPreviousMonth,
  goToNextMonth,
  dates,
  handleDateClick,
}) => {
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

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

export default Calendar;
