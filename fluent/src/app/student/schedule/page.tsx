"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";

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

  return (
    <div className="flex w-full h-full overflow-hidden p-2">
      <div className="flex-1 flex justify-center items-center max-w-full max-h-full overflow-auto">
        <div className="bg-white w-[95%] max-w-full m-5 p-5 rounded-xl shadow-lg">
          <StudentToastUI data={classes} />
        </div>
      </div>
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
