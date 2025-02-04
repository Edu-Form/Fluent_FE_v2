"use client";

import { SidebarLayout } from "@/components/SideBar";
import dynamic from "next/dynamic";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 다이어리와 퀴즐렛 페이지를 동적으로 임포트
const DiaryPage = dynamic(
  () => import("@/src/app/teacher/student/diary/page"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const QuizletPage = dynamic(
  () => import("@/src/app/teacher/student/quizlet/page"),
  {
    loading: () => <div>Loading...</div>,
  }
);

export default function Page() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuspenseContent
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
      />
    </Suspense>
  );
}

const SuspenseContent = ({
  selectedStudent,
  setSelectedStudent,
}: {
  selectedStudent: string | null;
  setSelectedStudent: (student: string | null) => void;
}) => {
  const searchParams = useSearchParams();
  const func = searchParams.get("func");

  const renderContent = () => {
    if (!selectedStudent) {
      return (
        <div className="flex justify-center items-center h-full text-gray-500">
          학생을 선택해주세요.
        </div>
      );
    }

    switch (func) {
      case "diary":
        return <DiaryPage />;
      case "quizlet":
        return <QuizletPage />;
      default:
        return (
          <div className="flex justify-center items-center h-full text-gray-500">
            잘못된 기능이 선택되었습니다.
          </div>
        );
    }
  };

  return (
    <div className="w-full h-[80vh] flex">
      <SidebarLayout onStudentSelect={setSelectedStudent} />
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
};
