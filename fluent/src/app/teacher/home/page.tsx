"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";

// 동적 컴포넌트 로딩
const Announcement = dynamic(
  () => import("@/components/Announcement/TeacherAnnouncement"),
  { ssr: false }
);

const TeacherNotice = dynamic(() => import("@/components/TeacherNotice"), {
  ssr: false,
});

const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });

const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  { ssr: false }
);

// 로딩 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-full"></div>
);

const HomePageContent = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate] = useState<Date>(new Date()); // 현재 날짜로 초기화

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
    }
  }, [selectedDate, classes]);

  return (
    <div className="flex w-full h-screen p-4 gap-4">
      {/* 왼쪽 영역 */}
      <div className="flex flex-col w-[40%] gap-4">
        {/* 시간 표시 - Alert 컴포넌트로 대체 */}
        <div className="rounded-lg h-[70px] overflow-hidden">
          <Suspense fallback={<SkeletonLoader />}>
            <Alert />
          </Suspense>
        </div>

        {/* 공지사항 */}
        <div className="bg-white rounded-lg p-4 shadow-lg h-[20%]">
          <div className="h-full">
            <Suspense fallback={<SkeletonLoader />}>
              <TeacherNotice />
            </Suspense>
          </div>
        </div>

        {/* 오늘의 학생 리스트 (확장됨) */}
        <div className="bg-white rounded-lg p-4 shadow-lg flex-1">
          <Suspense fallback={<SkeletonLoader />}>
            <Announcement />
          </Suspense>
        </div>
      </div>

      {/* 오른쪽 스케줄 영역 */}
      <div className="w-[60%] bg-white rounded-lg p-4 shadow-lg">
        <div className="w-full h-full">
          <Suspense fallback={<SkeletonLoader />}>
            <Teacher_toastUI data={classes} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
