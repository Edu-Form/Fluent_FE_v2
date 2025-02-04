"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import "react-day-picker/dist/style.css";

const StudentToastUI = dynamic(
  () => import("@/components/ToastUI/student_toastui"),
  {
    ssr: false,
  }
);
const TeacherToastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  {
    ssr: false,
  }
);

const SchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const router = useRouter();

  const [classes, setClasses] = useState<any[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, URL, classes.length]);

  return (
    <div className="flex w-full h-full overflow-hidden p-1">
      <div className="flex-1 flex justify-center items-center max-w-full max-h-full overflow-auto">
        <div className="bg-white w-[95%] h-[90%] max-w-full m-5 p-5 rounded-lg shadow-lg overflow-hidden">
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
