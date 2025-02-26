"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation"; // 네비게이션 컴포넌트 import

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

// 모바일 감지 hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 초기 검사
    checkMobile();

    // 윈도우 리사이즈 리스너 설정
    window.addEventListener("resize", checkMobile);

    // 클린업
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

const DiaryPageContent = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMobileDetection();
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
    <div
      className={`relative w-full ${
        isMobile ? "h-[75vh]" : "h-[80vh]"
      } hide-scrollbar overflow-y-scroll`}
    >
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
      {isMobile && <div className="h-16" />}{" "}
      {/* 모바일에서 하단 네비게이션 영역 확보 */}
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <DiaryPageContent />
      {/* 네비게이션 컴포넌트 */}
      <Navigation mobileOnly={true} defaultActiveIndex={3} />
    </Suspense>
  );
}
