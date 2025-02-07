"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Lottie와 animationData를 클라이언트 사이드에서만 로드
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const LottieAnimation = dynamic(
  async () => {
    const timerAnimationData = await import(
      "@/src/app/lotties/mainLoading.json"
    );
    return function LottieWrapper() {
      return <Lottie animationData={timerAnimationData} />;
    };
  },
  { ssr: false }
);

const DiaryCard = dynamic(() => import("@/components/Diary/DiaryCard"), {
  ssr: false,
});

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Fluent" }: LoadingScreenProps) => (
  <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
    <div>{message}</div>
    <div className="mt-4 w-32 h-32">
      <LottieAnimation />
    </div>
  </div>
);

const DiaryPageContent = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  useEffect(() => {
    const fetchData = async () => {
      if (type === "student") {
        try {
          const URL = `/api/diary/${type}/${user}`;
          const res = await fetch(URL, { cache: "no-store" });
          const data = await res.json();
          setDiaryData(data);
        } catch (error) {
          console.error("Error fetching diary data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user, type]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-[80vh]  hide-scrollbar overflow-y-scroll">
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
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <DiaryPageContent />
    </Suspense>
  );
}
