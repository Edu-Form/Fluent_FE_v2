"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import timerAnimationData from "@/src/app/lotties/mainLoading.json";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const DiaryCard = dynamic(() => import("@/components/Diary/DiaryCard"), {
  ssr: false,
});

const DiaryPageContent = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  useEffect(() => {
    const fetchData = async () => {
      if (type == "student") {
        const URL = `/api/diary/${type}/${user}`;
        try {
          const res = await fetch(URL, { cache: "no-store" });
          const data = await res.json();
          setDiaryData(data);
        } catch {
          console.log("Error");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
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
    <div className="relative w-full h-full hide-scrollbar overflow-y-scroll">
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

const DiaryPage = () => {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
          <div>Fluent</div>
          <div className="mt-4">Loading...</div>
        </div>
      }
    >
      <DiaryPageContent />
    </Suspense>
  );
};

export default function Page() {
  return <DiaryPage />;
}
