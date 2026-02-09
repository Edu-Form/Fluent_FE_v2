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
  const [, setClassStats] = useState<{
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
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 lg:px-8 pb-24">
      <div className="flex justify-center w-full">
        <div
          className="
            w-full
            max-w-[430px]
            md:max-w-[768px]
            lg:max-w-[1024px]
            xl:max-w-[1200px]
          "
        >
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <StudentToastUI data={classes} />
          </div>
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
      <Navigation defaultActiveIndex={4} />
    </div>
  );
}
