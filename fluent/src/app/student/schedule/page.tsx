"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/navigation";

import "react-day-picker/dist/style.css";

const StudentToastUI = dynamic(
  () => import("@/components/ToastUI/student_toastui"),
  {
    ssr: false,
  }
);
interface ClassData {
  _id: string;
  id: string;
  calendarId: string;
  room_name: string;
  date: string | undefined;
  time: number;
  duration: number;
  teacher_name: string;
  student_name: string;
}
const SchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [classStats, setClassStats] = useState<{
    totalClassesCompleted: number;
    currentCredits: number;
    classesUsed: number;
  } | null>(null);

  const URL = `/api/schedules/${type}/${user}`;

  useEffect(() => {
    if (!user || classes.length > 0) return;

    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        console.log(URL);
        console.log("data 은? ", data);
        setClasses(data);
      })
      .catch((error) => console.log("값을 불러오지 못 합니다", error));
  }, [user, URL, classes.length]);

  useEffect(() => {
    if (!user) return;

    fetch(`/api/classnote/count/${encodeURIComponent(user)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Only set stats if we got valid data
        if (data && typeof data === 'object') {
          setClassStats(data);
        }
      })
      .catch((error) => {
        console.log("클래스 통계를 불러오지 못 합니다", error);
        // Don't set classStats on error - page will work without it
      });
  }, [user]);

  return (
    <div className="flex w-full h-full overflow-hidden p-2 pb-20">
      <div className="flex-1 flex flex-col max-w-full max-h-full overflow-auto">
        {classStats && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 m-5 mb-2 shadow-sm border border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">전체 수업 횟수</p>
                <p className="text-xl font-bold text-blue-600">{classStats.totalClassesCompleted}회</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">사용한 수업 횟수</p>
                <p className="text-xl font-bold text-indigo-600">{classStats.classesUsed}회</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white w-[95%] max-w-full m-5 p-5 rounded-xl shadow-lg">
          <StudentToastUI data={classes} />
        </div>
      </div>
    </div>
  );
};

export default function Schedule() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SchedulePage />
      </Suspense>
      <Navigation mobileOnly={true} defaultActiveIndex={4} />
    </div>
  );
}
