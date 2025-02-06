import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiBook,
  FiList,
  FiMessageCircle,
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
  const [activeSection, setActiveSection] = useState<"diary" | "summary">(
    "diary"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const letterVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 25,
      },
    },
  };

  const typingVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.009,
        delayChildren: 0.2,
      },
    },
  };

  const splitText = (text: string) => {
    return text.split("").map((char, index) => (
      <motion.span key={index} variants={letterVariants}>
        {char}
      </motion.span>
    ));
  };

  if (!sortedData.length) return null;

  const diary = sortedData[currentIndex];
  const date = new Date(diary.date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <>
      <div className="relative flex w-full h-full bg-slate-100 items-center justify-center p-4 sm:p-10">
        <button
          onClick={handlePrev}
          className="absolute left-2 z-10 p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous diary"
        >
          <FiChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 z-10 p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Next diary"
        >
          <FiChevronRight size={24} />
        </button>

        {/* Card Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Date Header */}
            <div className="relative bg-gradient-to-r from-[#3f4166] to-[#2a2b44] text-white p-2 sm:p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg sm:text-2xl font-bold">
                  {year}년 {month}월 {day}일 {weekday}
                </h1>
                {/* Date Picker Button */}
                <div
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-all"
                >
                  <FiCalendar className="w-4 h-4" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    날짜 선택
                  </span>
                  <div className="px-1.5 py-0.5 bg-white/20 rounded-md text-xs animate-pulse">
                    Click!
                  </div>
                </div>
              </div>

              {type === "student" && (
                <button
                  onClick={openIsModal}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors animate-pulse"
                >
                  {content.write}
                </button>
              )}

              {/* DatePicker Popup */}
              {isDatePickerOpen && (
                <div className="absolute top-full left-1/3 -translate-x-1/2 mt-2 z-50">
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

            {/* Content Container */}
            <div className="flex flex-col">
              {/* Section Navigation */}
              <div className="flex border-b border-gray-200">
                {[
                  {
                    name: "diary",
                    label: "Diary",
                    icon: <FiBook className="mr-2" />,
                  },
                  {
                    name: "summary",
                    label: "Summary",
                    icon: <FiList className="mr-2" />,
                  },
                ].map((section) => (
                  <button
                    key={section.name}
                    onClick={() => setActiveSection(section.name as any)}
                    className={`flex-1 py-3 flex items-center justify-center text-sm sm:text-base font-medium transition-all duration-300 ${
                      activeSection === section.name
                        ? "bg-[#3f4166] text-white"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {section.icon}
                    <span className="hidden sm:inline">{section.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="p-4 sm:p-6">
                <div className="overflow-y-auto max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] bg-gray-50 rounded-xl p-4 shadow-inner">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {activeSection === "diary" && (
                        <div className="space-y-6">
                          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                            <h2 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 text-[#3f4166] flex items-center">
                              <FiBook className="mr-2" /> Original Diary
                            </h2>
                            <div className="max-h-[40vh] overflow-y-auto pr-2">
                              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {diary.original_text}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-[#e6f2ff] to-[#f3e6ff] rounded-xl p-4 sm:p-6 shadow-sm">
                            <h2 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-[#bbb5ff] via-[#ff00ae] to-[#ff00a6] text-transparent bg-clip-text flex items-center">
                              <span className="mr-2">✨</span> Corrected Diary
                            </h2>
                            <div className="max-h-[40vh] overflow-y-auto pr-2">
                              <motion.div
                                variants={typingVariants}
                                className="text-sm sm:text-base text-gray-700 leading-relaxed"
                              >
                                {splitText(diary.diary_correction)}
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSection === "summary" && (
                        <div className="space-y-6">
                          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                            <h2 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 text-[#3f4166] flex items-center">
                              <FiList className="mr-2" /> Summary
                            </h2>
                            <div className="max-h-[40vh] overflow-y-auto pr-2">
                              <motion.div
                                variants={typingVariants}
                                className="text-sm sm:text-base text-gray-700 leading-relaxed"
                              >
                                {splitText(diary.diary_summary)}
                              </motion.div>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                            <h2 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 text-[#3f4166] flex items-center">
                              <FiMessageCircle className="mr-2" /> Key
                              Expressions
                            </h2>
                            <div className="max-h-[40vh] overflow-y-auto pr-2">
                              <motion.div
                                variants={typingVariants}
                                className="text-sm sm:text-base text-gray-700 leading-relaxed"
                              >
                                {splitText(diary.diary_expressions)}
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
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
                idx === currentIndex ? "bg-[#3f4166]" : "bg-gray-300"
              }`}
              aria-label={`Go to diary ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(63, 65, 102, 0.3) transparent;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(63, 65, 102, 0.3);
          border-radius: 20px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(63, 65, 102, 0.5);
        }
      `}</style>
    </>
  );
}
