"use client";

import EnterBtn from "@/components/EnterBtn/EnterBtn";
import { useSearchParams, useRouter } from "next/navigation";
import Announcement from "@/components/Announcement/StudentAnnouncement";

interface HomeContentProps {
  user: string | null;
  type: string | null;
  user_id: string | null;
}

const HomeContent = ({ user, type, user_id }: HomeContentProps) => {
  const router = useRouter();
  const url_data = `user=${user}&type=${type}&id=${user_id}`;

  const Quizlet = () => router.push(`/student/quizlet?${url_data}`);
  const Diary = () => router.push(`/student/diary?${url_data}`);
  const Schedule = () => router.push(`/student/schedule?${url_data}`);

  return (
    <div className="relative">
      <div className="relative z-10 flex justify-center gap-10">
        <div className="flex justify-center mt-20">
          <div className="flex flex-col relative w-[45rem] h-[40rem] rounded-[0.5rem] border-[0.1rem] bg-gradient-to-br from-[#e7cfb4] to-[#f0e9d4] cursor-pointer duration-300 ease-in-out transform hover:border-blue-600 hover:drop-shadow-xl">
            <div>
              <div className="flex justify-center">
                <Announcement />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-[40rem] justify-between items-center mt-20">
          <legend
            className="relative flex justify-center w-full h-[20rem] text-xl font-bold font-sans mb-8 bg-white rounded-[0.5rem] border-[0.1rem]"
            onClick={Schedule}
          >
            TO DO LIST
          </legend>

          <div className="flex gap-5">
            <div onClick={Quizlet}>
              <EnterBtn id="quizlet" image="/images/quizlet.svg" />
            </div>
            <div onClick={Diary}>
              <EnterBtn id="diary" image="/images/diary.svg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  return <HomeContent user={user} type={type} user_id={user_id} />;
};

export default function Home() {
  return <HomePage />;
}
