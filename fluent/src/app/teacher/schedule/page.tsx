"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import "react-day-picker/dist/style.css";

import AddRoom from "@/components/addroom";
import VariousRoom from "@/components/VariousRoom";

const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  {
    ssr: false,
  }
);

const SchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariousRoomOpen, setIsVariousRoomOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 현재 날짜로 초기화
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const openAddSchedule = () => setIsModalOpen(true);
  const closeAddSchedule = () => setIsModalOpen(false);

  const openVariousSchedule = () => setIsVariousRoomOpen(true);
  const closeVariousSchedule = () => setIsVariousRoomOpen(false);

  const URL = `/api/schedules/${type}/${user}`;

  useEffect(() => {
    if (!user || classes.length > 0) return;

    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setClasses(data);
      })
      .catch((error) => console.log("Error fetching data:", error));
  }, [user, URL, classes.length]);

  useEffect(() => {
    if (selectedDate) {
      // 날짜 형식 표준화 (여러 방식으로 시도)
      const originalFormattedDate = selectedDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const formattedDates = [
        originalFormattedDate, // 방식 4
      ];

      // 여러 형식으로 날짜 매칭 시도
      const studentsForDate = classes.filter((cls) => {
        const isMatch = formattedDates.some((formattedDate) => {
          const classDateParts = cls.date.trim().split(". ");
          const selectedDateParts = formattedDate.trim().split(/\.\s*/);

          const yearMatch = classDateParts[0] === selectedDateParts[0];
          const monthMatch = classDateParts[1] === selectedDateParts[1];
          const dayMatch = classDateParts[2] === selectedDateParts[2];

          const fullMatch = cls.date.trim() === formattedDate.trim();

          return fullMatch || (yearMatch && monthMatch && dayMatch);
        });

        return isMatch;
      });

      // 시간과 강의실 정보를 포함한 상세 리스트로 변경
      const formattedStudents = studentsForDate.map((student) => ({
        ...student,
        displayText: `${student.time.toString().padStart(2, "0")}:00 ${
          student.room_name
        } - ${student.student_name} 학생`,
      }));

      console.log("Formatted Students:", formattedStudents);

      setFilteredStudents(formattedStudents);
    }
  }, [selectedDate, classes]);
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex w-full h-full  p-1">
      {/* 왼쪽: WeekSelector와 학생 리스트 */}
      <div className="w-[20%] h-full bg-white shadow-md p-4 flex flex-col rounded-xl">
        {/* 날짜 선택 섹션 */}
        <div className="relative mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </h3>
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <CalendarIcon className="w-6 h-6 text-gray-600" />
          </button>
          {/* 달력 팝업 */}
          {isCalendarOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 shadow-lg rounded-lg bg-white">
              <DayPicker
                mode="single"
                locale={ko}
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    handleDateSelect(date);
                    setIsCalendarOpen(false);
                  }
                }}
                className="custom-day-picker"
              />
            </div>
          )}
        </div>

        {/* 학생 리스트 */}
        <div className="flex flex-col flex-grow overflow-hidden">
          <h3 className="text-lg font-semibold mb-2">학생 리스트</h3>
          {filteredStudents.length > 0 ? (
            <div className="flex flex-col space-y-4 overflow-y-auto pr-2 flex-grow">
              {filteredStudents.map((student, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                      {student.room_name}호
                    </div>
                    <span className="text-sm text-gray-500">
                      {student.time.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {student.student_name} 학생
                    </h4>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      담당 선생님: {student.teacher_name}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              선택된 날짜의 스케줄이 없습니다.
            </p>
          )}
        </div>

        {/* 버튼 섹션 */}
        <div className="mt-4 space-y-3">
          <button
            onClick={openAddSchedule}
            className="w-full p-3 bg-blue-500 text-white rounded-lg shadow"
          >
            수업 추가
          </button>
          <button
            onClick={openVariousSchedule}
            className="w-full p-3 bg-green-500 text-white rounded-lg shadow"
          >
            여러 수업 추가
          </button>
        </div>
      </div>

      {/* 오른쪽: 캘린더 영역 */}
      <div className="flex-1 flex justify-center items-center">
        <div className="bg-white w-[95%]  p-5 rounded-lg shadow-lg ">
          <Teacher_toastUI data={classes} />
        </div>
      </div>

      {/* AddRoom 모달 */}
      {type !== "student" && isModalOpen && (
        <AddRoom closeAddSchedule={closeAddSchedule} />
      )}
      {/* VariousRoom 모달 */}
      {type !== "student" && isVariousRoomOpen && (
        <VariousRoom closeVariousSchedule={closeVariousSchedule} />
      )}
    </div>
  );
};

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulePage />
    </Suspense>
  );
}
