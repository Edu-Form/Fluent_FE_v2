"use client";

import dynamic from "next/dynamic";
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
import timerAnimationData from "@/src/app/lotties/mainLoading.json";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DiaryCard from "@/components/Diary/DiaryCard";

const DiaryPage = () => {
  const [diaryData, setDiaryData] = useState<DiaryData[]>([]); //types에 명시된 타입을 가져오게 함
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const student_name = searchParams.get("student_name");

  useEffect(() => {
    // 비동기 데이터 로딩 함수
    const fetchData = async () => {
      const URL = `/api/diary/student/${student_name}`;
      try {
        const res = await fetch(URL, { cache: "no-store" });

        // 404 응답 처리 추가
        if (!res.ok) {
          setDiaryData([]); // 빈 배열로 설정
          setLoading(false);
          return;
        }
        const data = await res.json();
        console.log(data);
        setDiaryData(data); // 가져온 데이터를 상태에 설정
      } catch (error) {
        console.log("Error fetching data:", error);
        setDiaryData([]); // 빈 배열로 설정
      } finally {
        setLoading(false); // 로딩 완료
      }
    };
    fetchData();
  }, [student_name]);

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
      <div className="relative bg-white w-full h-full hide-scrollbar overflow-y-scroll">
        {!diaryData || diaryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 text-lg">
              이 학생은 아직 다이어리 작성을 하지 않았습니다
            </p>
          </div>
        ) : (
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
        )}
      </div>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default function Diary() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiaryPage />
    </Suspense>
  );
}
