import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiBook,
  FiList,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DiaryModal from "@/components/Diary/DiaryModal";
import { useSearchParams } from "next/navigation";

const content = {
  write: "Write Diary",
};

export default function DiaryCard({ diarydata }: { diarydata: any }) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
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

      // Prepare the highlighted text with the original text
      const originalText =
        typeof diary.original_text === "string" ? diary.original_text : "";
      setHighlightedText(originalText);
    }
  }, [currentIndex, sortedData]);

  // Helper function to get error type color
  const getErrorTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "spelling":
        return "red";
      case "grammar":
        return "blue";
      case "punctuation":
        return "yellow";
      case "verb":
        return "red";
      case "clarity":
        return "blue";
      default:
        return "gray";
    }
  };

  // 데이터가 없을 때 템플릿 UI를 표시
  if (!sortedData.length) {
    return (
      <div className="relative flex w-full h-full bg-gray-50 items-center justify-center p-4 sm:p-10">
        {/* 빈 카드 컨테이너 */}
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-md overflow-hidden">
          {/* 헤더 */}
          <div className="bg-[#f5f7fb] border-b border-gray-200 p-4">
            <h1 className="text-2xl font-bold text-gray-800">
              AI Diary Assistant
            </h1>
          </div>

          <div className="p-8 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-lg mb-6">
              아직 작성된 일기가 없습니다
            </p>
            {type === "student" && (
              <button
                onClick={openIsModal}
                className="px-6 py-3 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                일기 작성하기
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
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

  // Ensure safe text display by converting any potential objects to strings or empty strings
  const originalText =
    typeof diary.original_text === "string" ? diary.original_text : "";
  const diarySummary =
    typeof diary.diary_summary === "string" ? diary.diary_summary : "";
  const diaryCorrection =
    typeof diary.diary_correction === "string"
      ? diary.diary_correction
      : diary.diary_correction && typeof diary.diary_correction === "object"
      ? JSON.stringify(diary.diary_correction)
      : "";
  const diaryExpressions =
    typeof diary.diary_expressions === "string" ? diary.diary_expressions : "";

  // Function to create highlighted text with error spans
  const renderHighlightedText = () => {
    if (!originalText || errors.length === 0) {
      return (
        <p className="text-gray-700 whitespace-pre-wrap">{originalText}</p>
      );
    }

    // Sort errors by start position (descending) to avoid index shifting when creating spans
    const sortedErrors = [...errors].sort(
      (a, b) => b.errorStart - a.errorStart
    );

    let textWithHighlights = originalText;

    // Replace each error instance with a highlighted span
    sortedErrors.forEach((error) => {
      const beforeError = textWithHighlights.substring(0, error.errorStart);
      const errorText = textWithHighlights.substring(
        error.errorStart,
        error.errorEnd
      );
      const afterError = textWithHighlights.substring(error.errorEnd);

      textWithHighlights = `${beforeError}<span class="text-red-500 underline font-medium">${errorText}</span>${afterError}`;
    });

    return (
      <p
        className="text-gray-700 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: textWithHighlights }}
      />
    );
  };

  return (
    <>
      <div className="relative flex w-full h-full bg-gray-50 items-center justify-center p-4 sm:p-10">
        <button
          onClick={handlePrev}
          className="absolute left-2 z-10 p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Previous diary"
        >
          <FiChevronLeft size={20} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 z-10 p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Next diary"
        >
          <FiChevronRight size={20} />
        </button>

        {/* Main Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header with date and controls */}
            <div className="bg-[#f5f7fb] border-b border-gray-200 p-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                AI Diary Assistant
              </h1>

              <div className="flex items-center gap-3">
                <div
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 cursor-pointer hover:bg-gray-50"
                >
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {year}년 {month}월 {day}일
                  </span>
                </div>

                {type === "student" && (
                  <button
                    onClick={openIsModal}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {content.write}
                  </button>
                )}
              </div>

              {/* DatePicker Popup */}
              {isDatePickerOpen && (
                <div className="absolute top-16 right-4 mt-2 z-50">
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
              )}
            </div>

            {/* Content Area - Split into exact two halves */}
            <div className="flex h-[calc(100vh-8rem)] md:flex-row">
              {/* Left Panel (1/2) - Original Text, Summary, and Key Expressions (Scrollable) */}
              <div className="w-1/2 h-full overflow-y-auto border-r border-gray-200 p-5">
                {/* Original Text Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <FiBook className="mr-2 text-blue-600" />
                    Original Diary
                  </h2>

                  <div className="bg-yellow-50 border border-gray-200 rounded p-4 mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {originalText}
                    </p>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <FiList className="mr-2 text-amber-600" />
                    Summary
                  </h2>

                  <div className="bg-white border border-gray-200 rounded p-4 mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {diarySummary}
                    </p>
                  </div>
                </div>

                {/* Key Expressions Section */}
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    Key Expressions
                  </h2>

                  <div className="space-y-2">
                    {diaryExpressions
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((expression, idx) => (
                        <div
                          key={idx}
                          className="bg-green-50 border border-green-100 rounded p-3 flex items-start"
                        >
                          <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-gray-700">{expression}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Right Panel (1/2) - Corrections and Suggestions */}
              <div className="w-1/2 h-full overflow-y-auto bg-[#f9fafc] p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <FiCheck className="mr-2 text-red-500" />
                  Correction Assistant
                </h2>

                {/* Suggestions Cards */}
                <div className="space-y-3">
                  {errors &&
                    errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded p-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span
                              className={`text-${getErrorTypeColor(
                                error.errorType
                              )}-500 font-semibold underline`}
                            >
                              {error.errorContent}
                            </span>
                            {error.errorFix && (
                              <>
                                <FiArrowRight className="inline mx-2 text-gray-400" />
                                <span className="font-semibold">
                                  {error.errorFix}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-gray-500 text-sm">
                            {error.errorType}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {error.errorExplain}
                        </p>
                      </div>
                    ))}
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {sortedData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full ${
                idx === currentIndex ? "bg-blue-600" : "bg-gray-300"
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
      `}</style>
    </>
  );
}
