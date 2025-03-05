"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Dynamic imports
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const DiaryCard = dynamic(() => import("@/components/Diary/DiaryCard"), {
  ssr: false,
});

// Lottie animation을 동적으로 import
const LottieAnimation = dynamic(
  async () => {
    const timerAnimationData = await import(
      "@/src/app/lotties/mainLoading.json"
    );
    return function Animation() {
      return <Lottie animationData={timerAnimationData.default} />;
    };
  },
  { ssr: false }
);

const DiaryPageContent = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const student_name = searchParams.get("student_name");

  useEffect(() => {
    const fetchData = async () => {
      const URL = `/api/diary/student/${student_name}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });
        if (!res.ok) {
          setDiaryData([]);
          return;
        }
        const data = await res.json();
        setDiaryData(data);
      } catch (error) {
        console.log("Error fetching data:", error);
        setDiaryData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student_name]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
        <div>Fluent</div>
        <div className="mt-4 w-32 h-32">
          <LottieAnimation />
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white w-full h-[80vh] hide-scrollbar overflow-y-scroll">
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
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full">
          <div>Loading...</div>
        </div>
      }
    >
      <DiaryPageContent />
    </Suspense>
  );
}
