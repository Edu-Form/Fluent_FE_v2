"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";
import { Suspense } from "react";
import StudentNotice from "@/components/StudentNotice";

const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const url_data = `user=${user}&type=${type}&id=${user_id}`;

  const router = useRouter();

  function Quizlet() {
    router.push(`/student/quizlet?${url_data}`);
  }
  function Diary() {
    router.push(`/student/diary?${url_data}`);
  }
  function Schedule() {
    router.push(`/student/schedule?${url_data}`);
  }

  return (
    <div className="flex w-full min-h-full justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col w-full max-w-[2580px] justify-center h-full gap-4">
        {/* 상단 영역 */}
        <div className="flex  gap-6">
          {/* 투데이  */}
          <div className="min-w-[60vw]">
            <div className="w-full h-full">
              <Announcement />
            </div>
          </div>

          {/* 공지사항 */}
          <div className="flex-1 min-w-0">
            <div className="w-full h-full">
              <StudentNotice />
            </div>
          </div>
        </div>
        {/* 하단 영역 */}

        <div className="flex gap-10 justify-between py-4">
          <div className="flex-1 max-w-[480px]" onClick={Schedule}>
            <EnterBtn id="schedule" image="/images/ScheduleCardMain.svg" />
          </div>
          <div className="flex-1 max-w-[480px]" onClick={Quizlet}>
            <EnterBtn id="quizlet" image="/images/QuizletCardMain.svg" />
          </div>
          <div className="flex-1 max-w-[480px]" onClick={Diary}>
            <EnterBtn id="diary" image="/images/DiaryCardMain.svg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
