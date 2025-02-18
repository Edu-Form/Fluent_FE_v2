import React, { useState, useEffect } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

const TeacherNotice = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

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
        "다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은 담당자에게 문의해주세요다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은 담당자에게 문의해주세요다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은 담당자에게 문의해주세요다음 달부터 플랫폼 디자인이 변경될 예정입니다. 자세한 내용은 담당자에게 문의해주세요.",
      date: "2024.02.04",
      type: "notice",
    },
    {
      id: 3,
      title: "이현진 학생 가입",
      content: "이현진학생이 추가되었으니 공지사항을 잘 확인해주시기 바랍니다.",
      date: "2024.02.03",
      type: "alert",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!showFullContent) {
        setCurrentIndex((prevIndex) =>
          prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length, showFullContent]);

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

  const handleMoreClick = (content: string, title: string, type: string) => {
    setShowFullContent(true);
    setActiveContent(content);
    setActiveTitle(title);
    setActiveType(type);
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

  const getTypeName = (type: string) => {
    switch (type) {
      case "important":
        return "중요";
      case "alert":
        return "알림";
      default:
        return "공지";
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="bg-white rounded-2xl  h-full flex flex-col">
        <div className="flex-1 px-4 pt-4 relative overflow-hidden">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`absolute inset-0 p-3 transition-opacity duration-300
                ${
                  index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div
                  className={`inline-block px-2 py-0.5 rounded-lg text-[12px] font-medium
                    ${getTypeStyles(announcement.type)}`}
                >
                  {getTypeName(announcement.type)}
                </div>
                {announcement.content.length > 50 && (
                  <button
                    onClick={() =>
                      handleMoreClick(
                        announcement.content,
                        announcement.title,
                        announcement.type
                      )
                    }
                    className="flex bg-blue-100 p-1 rounded-sm text-[13px] text-blue-600 hover:text-white hover:bg-blue-600"
                  >
                    더보기
                  </button>
                )}
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                {announcement.title}
              </h3>
              <div className="relative">
                <p className="text-[13px] text-gray-600 leading-tight mb-2 line-clamp-2">
                  {announcement.content}
                </p>
              </div>
              <div className="text-[11px] text-gray-400">
                {announcement.date}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col px-4 pb-3 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-500">
              {currentIndex + 1} / {announcements.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={handlePrevious}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-50 active:bg-gray-100"
              >
                <IoChevronBackOutline className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-50 active:bg-gray-100"
              >
                <IoChevronForwardOutline className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-[5000ms] ease-linear"
              style={{
                width: `${((currentIndex + 1) / announcements.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 전체 내용 모달 */}
      {showFullContent && activeContent && activeTitle && activeType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md max-h-[80vh] w-full mx-4 bg-white rounded-lg shadow-xl overflow-auto">
            <div className="p-6">
              <div
                className={`inline-block px-2 py-0.5 rounded-lg text-[12px] font-medium mb-3
                  ${getTypeStyles(activeType)}`}
              >
                {getTypeName(activeType)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {activeTitle}
              </h3>
              <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                {activeContent}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFullContent(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherNotice;
