"use client";
import React, { useState, useEffect } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

const TeacherNotice = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = [
    {
      id: 1,
      title: "3월 학사일정 안내",
      content: "2월 20일부터 3월 학생스케줄을 짜주세요.",
      date: "2024.02.05",
      type: "important",
    },
    {
      id: 2,
      title: "교재 변경 안내",
      content:
        "다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은 담당자에게 문의해주세요.",
      date: "2024.02.04",
      type: "notice",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "important":
        return "bg-blue-50 text-blue-600";
      case "alert":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
      <div className="flex-1">
        <div className="h-full flex flex-col">
          <div className="flex-1 px-4 md:px-6 pt-4 md:pt-6 relative overflow-hidden">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className={`absolute inset-0 p-4 md:p-5 transition-opacity duration-300 
                 ${
                   index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                 }`}
              >
                <div
                  className={`inline-block px-2 py-1 md:px-2.5 md:py-1 rounded-lg text-[12px] md:text-[13px] font-medium mb-2 md:mb-3 
                   ${getTypeStyles(announcement.type)}`}
                >
                  {announcement.type === "important"
                    ? "중요"
                    : announcement.type === "alert"
                    ? "알림"
                    : "공지"}
                </div>
                <h3 className="text-[16px] md:text-[17px] font-semibold text-gray-900 mb-1 md:mb-2">
                  {announcement.title}
                </h3>
                <p className="text-[14px] md:text-[15px] text-gray-600 leading-relaxed mb-2 md:mb-3">
                  {announcement.content}
                </p>
                <div className="text-[12px] md:text-[13px] text-gray-400">
                  {announcement.date}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col px-4 md:px-6 pb-4 md:pb-5 pt-2 md:pt-3">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-[12px] md:text-[13px] text-gray-500">
                {currentIndex + 1} / {announcements.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                >
                  <IoChevronBackOutline className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                >
                  <IoChevronForwardOutline className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-[5000ms] ease-linear"
                style={{
                  width: `${
                    ((currentIndex + 1) / announcements.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherNotice;
