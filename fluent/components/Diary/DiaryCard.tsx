import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DiaryModal from "@/components/Diary/DiaryModal";
import { useSearchParams } from "next/navigation";

// 에러 객체 타입 정의
interface ErrorItem {
  errorType?: string;
  errorContent?: string;
  errorFix?: string;
  errorExplain?: string;
  errorStart?: number;
  errorEnd?: number;
  // 다른 필드가 있다면 추가할 수 있습니다
}

const content = {
  write: "일기 작성하기",
  title: "AI 다이어리 어시스턴트",
  emptyMessage: "아직 작성된 일기가 없습니다",
  proofreadTitle: "AI Diary Assistant",
};

export default function DiaryCard({ diarydata }: { diarydata: any }) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const student_name = searchParams.get("student_name");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null);
  const [, setHighlightedText] = useState<string>("");

  const openIsModal = () => setIsModalOpen(true);
  const closeIsModal = () => setIsModalOpen(false);

  const sortedData = useMemo(() => {
    return Array.isArray(diarydata)
      ? diarydata.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : [];
  }, [diarydata]);
  
  useEffect(() => {
    if (sortedData.length > 0) {
      // 유효한 날짜만 필터링하여 includeDates에 사용
      const validDates = sortedData
        .map((diary) => {
          try {
            const dateObj = new Date(diary.class_date);
            return !isNaN(dateObj.getTime()) ? dateObj : null;
          } catch (e) {
            console.error("날짜 변환 오류:", diary.class_date, e);
            return null;
          }
        })
        .filter(Boolean);

      console.log("유효한 날짜 목록:", validDates);
    }
  }, [sortedData]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
    if (date) {
      const index = sortedData.findIndex(
        (diary) =>
          new Date(diary.class_date).toDateString() === date.toDateString()
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

      // 디버깅 메시지 추가
      console.log("현재 일기 데이터:", diary);
      console.log("student_name:", student_name);
      console.log("type:", type);

      // Extract errors from diary_correction if it exists and has errors
      let extractedErrors: ErrorItem[] = [];
      if (
        diary.diary_correction &&
        typeof diary.diary_correction === "object" &&
        diary.diary_correction.errors &&
        Array.isArray(diary.diary_correction.errors)
      ) {
        extractedErrors = diary.diary_correction.errors;
        // 에러 데이터 구조 확인
        console.log("추출된 에러 데이터 (첫 번째):", extractedErrors[0]);
      } else {
        console.log("에러 데이터가 없거나 올바른 형식이 아닙니다.");
      }

      setErrors(extractedErrors);
      setSelectedError(extractedErrors.length > 0 ? extractedErrors[0] : null);

      // Prepare the highlighted text with the original text
      const originalText =
        typeof diary.original_text === "string" ? diary.original_text : "";
      setHighlightedText(originalText);
    }
  }, [currentIndex, sortedData, student_name, type]);

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
    // 디버깅 로그 추가
    console.log("renderHighlightedText 호출됨");
    console.log("원본 텍스트:", originalText);
    console.log("에러 개수:", errors.length);

    if (!originalText || errors.length === 0) {
      console.log("에러가 없거나 원본 텍스트가 없어 일반 텍스트로 표시");
      return (
        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
          {originalText}
        </p>
      );
    }

    const result = [];
    let lastPos = 0;

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      // 모든 에러가 필수 필드를 갖고 있지 않을 수 있어 안전하게 체크
      const content = error.errorContent || "";
      if (!content) {
        console.log(`에러 ${i}에 errorContent가 없습니다:`, error);
        continue;
      }

      console.log(`에러 ${i} 검색 중: '${content}'`);

      try {
        // 대소문자 구분 없이 찾기 위해 정규식 사용
        const escapedContent = content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedContent, "i");
        const match = originalText.slice(lastPos).match(regex);

        if (match && match.index !== undefined) {
          const startIdx = lastPos + match.index;
          console.log(`에러 ${i} 문장 찾음: 위치 ${startIdx}`);

          if (startIdx > lastPos) {
            result.push(
              <span key={`text-${lastPos}`} className="text-gray-700">
                {originalText.substring(lastPos, startIdx)}
              </span>
            );
          }

          const blinkStyle = {
            animation: 'fade-animation 2s ease-in-out infinite', // Adjust the duration to your preference
          };
          
          const spanStyle = selectedError ? blinkStyle : {};

          // Highlight the error sentence
          const matchedText = match[0]; // 실제 매치된 텍스트 사용
          const endIdx = startIdx + matchedText.length;

          // 안전하게 비교
          const isSelected =
            selectedError &&
            selectedError.errorStart !== undefined &&
            error.errorStart !== undefined &&
            selectedError.errorEnd !== undefined &&
            error.errorEnd !== undefined &&
            error.errorStart === selectedError.errorStart &&
            error.errorEnd === selectedError.errorEnd;

          let className = "underline ";

          if (isSelected) {
            className += "font-medium text-red-600 bg-yellow-100";
          } else {
            className += "text-red-600";
          }

          result.push(
            <span
              key={`error-${startIdx}`}
              className={className}
              onClick={() => setSelectedError(error)}
              style={spanStyle}
            >
              {matchedText}
            </span>
          );

          lastPos = endIdx;
        } else {
          console.log(`에러 ${i} 문장을 찾을 수 없습니다: '${content}'`);
        }
      } catch (e) {
        console.error(`에러 ${i} 처리 중 오류 발생:`, e);
      }
    }

    // 중요: 이 부분이 for 루프 바깥에 있어야 함
    if (lastPos < originalText.length) {
      result.push(
        <span key={`text-end`} className="text-gray-700">
          {originalText.substring(lastPos)}
        </span>
      );
    }

    console.log("하이라이트 결과 요소 수:", result.length);
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
            {/* Header*/}
            <div className="bg-white rounded-t-xl shadow-md py-5 px-10 flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {content.proofreadTitle}
              </h1>

              {/* DatePicker 버튼과 팝업을 감싸는 상대적 위치 컨테이너 */}
              <div className="relative">
                <div
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100"
                >
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {year}년 {month}월 {day}일
                  </span>
                </div>

                {/* DatePicker Popup */}
                {isDatePickerOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200">
                      <ReactDatePicker
                        selected={selectedDate || date}
                        onChange={handleDateChange}
                        dateFormat="yyyy/MM/dd"
                        includeDates={
                          sortedData
                            .map((diary) => {
                              try {
                                const dateObj = new Date(diary.class_date);
                                // 유효한 날짜만 포함
                                return !isNaN(dateObj.getTime())
                                  ? dateObj
                                  : null;
                              } catch (e) {
                                console.error(
                                  "날짜 변환 오류:",
                                  diary.class_date,
                                  e
                                );
                                return null;
                              }
                            })
                            .filter(Boolean) as Date[]
                        }
                        inline
                        onClickOutside={() => setIsDatePickerOpen(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area - Now with separated panels */}
            <div className="flex flex-row h-[calc(100vh-12rem)] gap-6">
              {/* Left Panel */}
              <div className="w-full md:w-4/5 bg-white rounded-b-xl shadow-md overflow-hidden">
                <div className="h-full overflow-y-auto p-7">
                  {/* Original Text */}
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    원본 일기
                    {student_name && (
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {student_name}
                      </span>
                    )}
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
                  <details className="mb-6 border border-gray-200 rounded-lg">
                    <summary className="text-base font-bold text-gray-900 p-5 cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center">주요 표현</div>
                    </summary>
                    <div className="p-6 bg-white">
                      <div className="space-y-3">
                        {diaryExpressions
                          .split("\n")
                          .filter((line: any) => line.trim())
                          .map((expression: any, idx: any) => (
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

                  {/* Summary Section (Collapsed) */}
                  <details className="mb-6 border border-gray-200 rounded-lg">
                    <summary className="text-base font-bold text-gray-900 p-5 cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center">수정된 일기</div>
                    </summary>
                    <div className="p-6 bg-white">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {diary.corrected_diary || ""}
                      </p>
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
                            {selectedError.errorType || "오류"}
                          </span>
                        </div>

                        <div className="flex items-center mb-4">
                          <p className="text-lg font-medium text-red-600">
                            {selectedError.errorContent || ""}
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
                          {selectedError.errorExplain || ""}
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
                          selectedError.errorStart !== undefined &&
                          error.errorStart !== undefined &&
                          selectedError.errorEnd !== undefined &&
                          error.errorEnd !== undefined &&
                          error.errorStart === selectedError.errorStart &&
                          error.errorEnd === selectedError.errorEnd;

                        const errorType = (error.errorType || "").toLowerCase();
                        let colorClass = "";

                        // 직접 클래스 이름 지정
                        if (errorType === "clarity") {
                          colorClass = "bg-blue-500";
                        } else if (errorType === "punctuation") {
                          colorClass = "bg-yellow-500";
                        } else {
                          colorClass = "bg-red-500";
                        }

                        let textClass = "text-red-600";
                        if (errorType === "clarity") {
                          textClass = "text-blue-600";
                        } else if (errorType === "punctuation") {
                          textClass = "text-yellow-600";
                        } else if (errorType === "verb") {
                          textClass = "text-red-600";
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
                                  className={`w-3 h-3 rounded-full ${colorClass} mr-3`}
                                ></span>
                                <span className={`${textClass} font-medium`}>
                                  {error.errorContent || ""}
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs px-2 py-1 bg-white rounded-full border border-gray-200">
                                {error.errorType || "오류"}
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
                              {error.errorExplain &&
                                error.errorExplain.substring(0, 100)}
                              {error.errorExplain &&
                              error.errorExplain.length > 100
                                ? "..."
                                : ""}
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
