import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DiaryModal from "@/components/Diary/DiaryModal";
import { useSearchParams } from "next/navigation";

const content = {
  write: "일기 작성하기",
  title: "AI 다이어리 어시스턴트",
  emptyMessage: "아직 작성된 일기가 없습니다",
  proofreadTitle: "AI Diary Assistant",
};

export default function DiaryCard({ diarydata }: { diarydata: any }) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [selectedError, setSelectedError] = useState<any | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>("");

  const openIsModal = () => setIsModalOpen(true);
  const closeIsModal = () => setIsModalOpen(false);

  const sortedData = Array.isArray(diarydata)
    ? diarydata.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
    if (date) {
      const index = sortedData.findIndex(
        (diary) => new Date(diary.date).toDateString() === date.toDateString()
      );
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedData.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + sortedData.length) % sortedData.length
    );
  };

  useEffect(() => {
    if (sortedData.length > 0) {
      const diary = sortedData[currentIndex];

      // Extract errors from diary_correction if it exists and has errors
      let extractedErrors: any[] = [];
      if (
        diary.diary_correction &&
        typeof diary.diary_correction === "object" &&
        diary.diary_correction.errors &&
        Array.isArray(diary.diary_correction.errors)
      ) {
        extractedErrors = diary.diary_correction.errors;
      }
      setErrors(extractedErrors);
      setSelectedError(extractedErrors.length > 0 ? extractedErrors[0] : null);

      // Prepare the highlighted text with the original text
      const originalText =
        typeof diary.original_text === "string" ? diary.original_text : "";
      setHighlightedText(originalText);
    }
  }, [currentIndex, sortedData]);

  // 데이터가 없을 때 템플릿 UI를 표시
  if (!sortedData.length) {
    return (
      <div className="relative flex w-full h-full bg-gray-50 items-center justify-center p-4 sm:p-6">
        {/* 빈 카드 컨테이너 */}
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-md overflow-hidden">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-100 p-8">
            <h1 className="text-xl font-bold text-gray-900">
              {content.proofreadTitle}
            </h1>
          </div>

          <div className="p-12 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-lg mb-8">{content.emptyMessage}</p>
            {type === "student" && (
              <button
                onClick={openIsModal}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                {content.write}
              </button>
            )}
          </div>
        </div>

        {isModalOpen && (
          <DiaryModal
            closeIsModal={closeIsModal}
            next_class_date={new Date().toISOString().split("T")[0]}
          />
        )}
      </div>
    );
  }

  const diary = sortedData[currentIndex];
  const date = new Date(diary.date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const originalText =
    typeof diary.original_text === "string" ? diary.original_text : "";
  const diarySummary =
    typeof diary.diary_summary === "string" ? diary.diary_summary : "";
  const diaryExpressions =
    typeof diary.diary_expressions === "string" ? diary.diary_expressions : "";

  const renderHighlightedText = () => {
    if (!originalText || errors.length === 0) {
      return (
        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
          {originalText}
        </p>
      );
    }

    let positions: { pos: number; isStart: boolean; error: any }[] = [];
    errors.forEach((error) => {
      positions.push({ pos: error.errorStart, isStart: true, error });
      positions.push({ pos: error.errorEnd, isStart: false, error });
    });

    positions.sort((a, b) => {
      if (a.pos === b.pos) {
        return a.isStart ? -1 : 1;
      }
      return a.pos - b.pos;
    });

    let result = [];
    let lastPos = 0;
    let activeErrors = new Set();

    for (let i = 0; i < positions.length; i++) {
      const { pos, isStart, error } = positions[i];

      if (pos > lastPos) {
        result.push(
          <span key={`text-${lastPos}`} className="text-gray-700">
            {originalText.substring(lastPos, pos)}
          </span>
        );
      }

      if (isStart) {
        activeErrors.add(error.id || i);
      } else {
        activeErrors.delete(error.id || i);
      }

      let endPos = pos;
      if (i < positions.length - 1) {
        endPos = positions[i + 1].pos;
      } else {
        endPos = originalText.length;
      }

      if (endPos > pos) {
        const isSelected =
          selectedError &&
          error.errorStart === selectedError.errorStart &&
          error.errorEnd === selectedError.errorEnd;

        if (activeErrors.size > 0 && isStart) {
          const errorType = error.errorType.toLowerCase();
          let className = "underline ";

          if (isSelected) {
            className += "font-medium ";

            if (errorType === "verb") {
              className += "text-red-600 bg-red-50";
            } else if (errorType === "clarity") {
              className += "text-blue-600 bg-blue-50";
            } else if (errorType === "punctuation") {
              className += "text-yellow-600 bg-yellow-50";
            } else {
              className += "text-red-600 bg-red-50";
            }
          } else {
            if (errorType === "verb") {
              className += "text-red-600 border-b border-red-600";
            } else if (errorType === "clarity") {
              className += "text-blue-600 border-b border-blue-600";
            } else if (errorType === "punctuation") {
              className += "text-yellow-600 border-b border-yellow-600";
            } else {
              className += "text-red-600 border-b border-red-600";
            }
          }

          result.push(
            <span
              key={`error-${pos}`}
              className={className}
              onClick={() => setSelectedError(error)}
            >
              {originalText.substring(pos, endPos)}
            </span>
          );
        }
      }

      lastPos = pos;
    }

    // Add any remaining text
    if (lastPos < originalText.length) {
      result.push(
        <span key={`text-end`} className="text-gray-700">
          {originalText.substring(lastPos)}
        </span>
      );
    }

    return <p className="text-lg leading-relaxed">{result}</p>;
  };

  return (
    <>
      <div className="relative flex w-full h-full bg-gray-50 items-center justify-center">
        <button
          onClick={handlePrev}
          className="absolute left-6 z-10 p-4 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Previous diary"
        >
          <FiChevronLeft size={24} className="text-gray-700" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-6 z-10 p-4 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Next diary"
        >
          <FiChevronRight size={24} className="text-gray-700" />
        </button>

        {/* Main Container - Using flex flex-col with spacing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col w-full h-full max-w-7xl mx-10"
          >
            {/* Header - Now in its own container with rounded corners and shadow */}
            <div className="bg-white rounded-t-xl shadow-md py-5 px-10 flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {content.proofreadTitle}
              </h1>

              <div className="flex items-center gap-5">
                <div
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100"
                >
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {year}년 {month}월 {day}일
                  </span>
                </div>

                {type === "student" && (
                  <button
                    onClick={openIsModal}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    {content.write}
                  </button>
                )}
              </div>

              {/* DatePicker Popup */}
              {isDatePickerOpen && (
                <div className="absolute top-20 right-10 mt-2 z-50">
                  <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200">
                    <ReactDatePicker
                      selected={selectedDate || date}
                      onChange={handleDateChange}
                      dateFormat="yyyy/MM/dd"
                      includeDates={sortedData.map(
                        (diary) => new Date(diary.date)
                      )}
                      inline
                      onClickOutside={() => setIsDatePickerOpen(false)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Area - Now with separated panels */}
            <div className="flex flex-row h-[calc(100vh-12rem)] gap-6">
              {/* Left Panel */}
              <div className="w-full md:w-4/5 bg-white rounded-b-xl shadow-md overflow-hidden">
                <div className="h-full overflow-y-auto p-7">
                  {/* Original Text */}
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    원본 일기
                  </h2>
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    {renderHighlightedText()}
                  </div>

                  {/* Summary Section (Collapsed) */}
                  <details className="mb-6 border border-gray-200 rounded-lg">
                    <summary className="text-base font-bold text-gray-900 p-5 cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center">요약</div>
                    </summary>
                    <div className="p-6 bg-white">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {diarySummary}
                      </p>
                    </div>
                  </details>

                  {/* Key Expressions (Collapsed) */}
                  <details className="border border-gray-200 rounded-lg">
                    <summary className="text-base font-bold text-gray-900 p-5 cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center">주요 표현</div>
                    </summary>
                    <div className="p-6 bg-white">
                      <div className="space-y-3">
                        {diaryExpressions
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((expression, idx) => (
                            <div
                              key={idx}
                              className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start"
                            >
                              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-gray-700">{expression}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Right Panel */}
              <div className="w-full md:w-2/5 bg-white rounded-b-xl shadow-md overflow-hidden">
                <div className="h-full flex flex-col">
                  {/* Selected Error Panel */}
                  {selectedError && (
                    <div className="p-4 border-b border-gray-200">
                      <div className="mb-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {selectedError.errorType}
                          </span>
                        </div>

                        <div className="flex items-center mb-4">
                          <p className="text-lg font-medium text-red-600">
                            {selectedError.errorContent}
                          </p>

                          {selectedError.errorFix && (
                            <>
                              <span className="mx-4 text-gray-400">→</span>
                              <p className="text-lg font-medium text-blue-600">
                                {selectedError.errorFix}
                              </p>
                            </>
                          )}
                        </div>

                        <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                          {selectedError.errorExplain}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* All Errors List */}
                  <div className="flex-grow overflow-y-auto p-4">
                    <h2 className="text-base font-bold text-gray-900 mb-4">
                      모든 수정 사항
                    </h2>

                    <div className="space-y-4">
                      {errors.map((error, idx) => {
                        const isActive =
                          selectedError &&
                          error.errorStart === selectedError.errorStart &&
                          error.errorEnd === selectedError.errorEnd;

                        const errorType = error.errorType.toLowerCase();
                        let dotColor = "red";

                        if (errorType === "clarity") {
                          dotColor = "blue";
                        } else if (errorType === "punctuation") {
                          dotColor = "yellow";
                        }

                        return (
                          <div
                            key={idx}
                            className={`${
                              isActive
                                ? "border-blue-300 bg-blue-50"
                                : "border-gray-200 bg-gray-50"
                            } rounded-lg p-5 cursor-pointer hover:bg-gray-100 transition-colors border shadow-sm`}
                            onClick={() => setSelectedError(error)}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <span
                                  className={`w-3 h-3 rounded-full bg-${dotColor}-500 mr-3`}
                                ></span>
                                <span
                                  className={`${
                                    errorType === "verb"
                                      ? "text-red-600"
                                      : errorType === "clarity"
                                      ? "text-blue-600"
                                      : errorType === "punctuation"
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  } font-medium`}
                                >
                                  {error.errorContent}
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs px-2 py-1 bg-white rounded-full border border-gray-200">
                                {error.errorType}
                              </span>
                            </div>

                            {error.errorFix && (
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <span className="ml-6 text-gray-400">→</span>
                                <span className="ml-3 font-medium text-blue-600">
                                  {error.errorFix}
                                </span>
                              </div>
                            )}

                            <p className="text-gray-600 text-sm ml-6">
                              {error.errorExplain.substring(0, 100)}
                              {error.errorExplain.length > 100 ? "..." : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {isModalOpen && (
          <DiaryModal
            closeIsModal={closeIsModal}
            next_class_date={`${year}-${month.toString().padStart(2, "0")}-${day
              .toString()
              .padStart(2, "0")}`}
          />
        )}

        {/* Pagination Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
          {sortedData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full ${
                idx === currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
              aria-label={`Go to diary ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }

        details > summary {
          list-style: none;
        }

        details > summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </>
  );
}
