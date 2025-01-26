"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import WeekSelector from "@/components/WeekSelector";
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

  const openAddSchedule = () => setIsModalOpen(true);
  const closeAddSchedule = () => setIsModalOpen(false);

  const openVariousSchedule = () => setIsVariousRoomOpen(true);
  const closeVariousSchedule = () => setIsVariousRoomOpen(false);

  const URL = `http://13.54.77.128/api/schedules/${type}/${user}`;

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
      const formattedDate = selectedDate
        .toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\./g, ". ")
        .trim();

      const studentsForDate = classes.filter(
        (cls) => cls.date === formattedDate
      );
      setFilteredStudents(studentsForDate);
    }
  }, [selectedDate, classes]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex w-full h-full overflow-hidden p-1">
      {/* 왼쪽: WeekSelector와 학생 리스트 */}
      <div className="w-[20%] h-full bg-white shadow-md p-4 flex flex-col rounded-xl">
        {/* WeekSelector */}
        <div className="mb-4">
          <WeekSelector
            selected={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* 학생 리스트 */}
        <div className="flex flex-col h-full gap-3">
          <h3 className="text-lg font-semibold mb-2">학생 리스트</h3>
          {filteredStudents.length > 0 ? (
            <ul className="list-disc list-inside">
              {filteredStudents.map((student, index) => (
                <li key={index} className="text-sm">
                  {student.student_name} ({student.room_name}호)
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              선택된 날짜의 스케줄이 없습니다.
            </p>
          )}
        </div>

        <button
          onClick={openAddSchedule}
          className="mb-4 p-3 bg-blue-500 text-white rounded-lg shadow"
        >
          수업 추가
        </button>
        <button
          onClick={openVariousSchedule}
          className="p-3 bg-green-500 text-white rounded-lg shadow"
        >
          여러 수업 추가
        </button>
      </div>

      {/* 오른쪽: 캘린더 영역 */}
      <div className="flex-1 flex justify-center items-center">
        <div className="bg-white w-[95%] h-[100%] p-5 rounded-lg shadow-lg overflow-hidden">
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
