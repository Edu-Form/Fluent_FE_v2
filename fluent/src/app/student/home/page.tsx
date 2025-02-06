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
    <div className="flex w-full h-full  justify-center items-center p-4">
      <div className="flex flex-col w-[82vw] justify-center h-full max-h-[900px] gap-4">
        {/* 상단 영역 */}
        <div className="flex h-[100%] gap-4">
          {/* 공지사항 */}
          <div className="flex flex-col w-[65%] min-w-[700px] rounded-xl bg-white cursor-pointer drop-shadow-lg">
            <div className="flex p-5 px-8 w-full h-full overflow-auto">
              <Announcement />
            </div>
          </div>

          {/* 오늘의 학생 */}
          <div className="flex w-[35%] min-w-[300px] cursor-pointer drop-shadow-lg">
            <StudentNotice />
          </div>
        </div>

        {/* 하단 영역 */}

        <div className="flex w-full gap-1 justify-between py-4">
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
