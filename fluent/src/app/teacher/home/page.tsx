"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import Announcement from "@/components/Announcement/TeacherAnnouncement";

const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const url_data = `user=${user}&type=${type}&id=${user_id}`;
  const diary_url_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;
  const quizlet_url_data = `user=${user}&type=${type}&id=${user_id}&func=quizlet`;
  const router = useRouter();

  function Quizlet() {
    router.push(`/teacher/student?${quizlet_url_data}`);
  }

  function Diary() {
    router.push(`/teacher/student?${diary_url_data}`);
  }

  function Schedule() {
    router.push(`/teacher/schedule?${url_data}`);
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 상단 영역 */}
      <div className="flex flex-1 ">
        {/* Announcement 컴포넌트 */}
        <div className="flex flex-col w-[70vw] min-w-[1000px] mx-auto h-[40vh] rounded-xl bg-white cursor-pointer drop-shadow-lg">
          <div className="flex p-5 px-8 w-full h-full overflow-auto">
            <Announcement />
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div className="flex flex-1 justify-center items-center">
        <div className="flex w-[70vw] min-w-[1000px] justify-between">
          <div onClick={Schedule}>
            <EnterBtn id="schedule" image="/images/ScheduleCard.svg" />
          </div>
          <div onClick={Quizlet}>
            <EnterBtn id="quizlet" image="/images/QuizletCard.svg" />
          </div>
          <div onClick={Diary}>
            <EnterBtn id="diary" image="/images/DiaryCard.svg" />
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
