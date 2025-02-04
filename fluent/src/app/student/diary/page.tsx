"use client";

import Lottie from "lottie-react";
import timerAnimationData from "@/src/app/lotties/mainLoading.json";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import DiaryBg from "@/public/images/diarymain.svg";
import DiaryCard from "@/components/Diary/DiaryCard";

const DiaryPage = ({ student_list }: any) => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  const variants: { [key: string]: any } = {
    hidden: {
      opacity: 0.2,
      y: 15,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.7,
        repeat: Infinity,
        repeatType: "reverse",
      },
    }),
  };

  useEffect(() => {
    const fetchData = async () => {
      if (type == "student") {
        const URL = `/api/diary/${type}/${user}`;
        try {
          const res = await fetch(URL, { cache: "no-store" });
          const data = await res.json();
          setDiaryData(data);
        } catch (error) {
          console.log("Error");
        } finally {
          setLoading(false);
        }
      } else {
      }
    };
    fetchData();
  }, [user, type]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
        <div>Fluent</div>
        <div className="mt-4 w-32 h-32">
          <Lottie animationData={timerAnimationData} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* <div className="w-full h-full hide-scrollbar overflow-y-scroll  relative flex justify-center items-center">
        <Image src={DiaryBg} alt="diarymain" layout="fill" objectFit="cover" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 text-center">
          <span className="text-white text-3xl">{user}&apos;s Diary.</span>
          <span className="animate-blink text-white text-4xl">|</span>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-0">
          <motion.span
            initial="hidden"
            animate="visible"
            variants={variants}
            className="text-white text-[3rem]"
          >
            ↓
          </motion.span>
        </div>
      </div> */}

      <div className="relative w-full h-full  hide-scrollbar overflow-y-scroll">
        <DiaryCard
          diarydata={
            Array.isArray(diaryData)
              ? diaryData.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
              : []
          }
        />
      </div>
    </>
  );
};

const Diary = () => {
  return <DiaryPage />;
};

export default function Page() {
  return <Diary />;
}
