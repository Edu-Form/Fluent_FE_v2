"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import Announcement from "@/components/Announcement/TeacherAnnouncement";
import TeacherNotice from "@/components/TeacherNotice";
import dynamic from "next/dynamic";

// Toast UI Calendar를 동적으로 불러옵니다
const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  {
    ssr: false,
  }
);

const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariousRoomOpen, setIsVariousRoomOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 현재 날짜로 초기화
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    <div className="flex w-full h-screen p-4 gap-4">
      {/* 왼쪽 영역 */}
      <div className="flex flex-col w-[40%] gap-4">
        {/* 시간 표시 */}
        <div className="bg-blue-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">20:21</div>
          <div className="text-sm">2025. 02. 12 wednesday</div>
        </div>

        {/* 공지사항 */}
        <div className="flex-1 bg-white rounded-lg p-4 shadow-lg">
          <div className="h-full overflow-auto">
            <TeacherNotice />
          </div>
        </div>

        {/* 오늘의 학생 리스트 */}
        <div className="flex-1 h-[300px] bg-white rounded-lg p-4 shadow-lg">
          <Announcement />
        </div>
      </div>

      {/* 오른쪽 스케줄 영역 */}
      <div className="w-[60%] bg-white rounded-lg p-4 shadow-lg">
        <div className="w-full h-full">
          <Teacher_toastUI data={classes} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
