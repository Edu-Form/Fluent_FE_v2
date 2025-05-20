"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation";

const DiaryCard = dynamic(() => import("@/components/Diary/DiaryCard"), {
  ssr: false,
});

// 모바일 감지 hook
// const useMobileDetection = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     // 초기 검사
//     checkMobile();

//     // 윈도우 리사이즈 리스너 설정
//     window.addEventListener("resize", checkMobile);

//     // 클린업
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   return isMobile;
// };

const DiaryPageContent = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]);
  const [, setLoading] = useState(true);
  // const isMobile = useMobileDetection();
  const searchParams = useSearchParams();
  // const router = useRouter();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  // const user_id = searchParams.get("id");
  // const url_data = `user=${user}&type=${type}&id=${user_id}`;
  // const quizlet_url_data = `user=${user}&type=${type}&id=${user_id}&func=quizlet`;
  // const diary_url_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;

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

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto hide-scrollbar">
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
      <Navigation mobileOnly={true} defaultActiveIndex={2} />
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <DiaryPageContent />
    </Suspense>
  );
}
