"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import CurriculumLayout from "@/components/CurriculumnLayout"; // Import the CurriculumLayout component
import { ReactNode } from "react";

const CurriculumContent = () => {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");
  const [text, setText] = useState("");

  useEffect(() => {
    const fetchText = async () => {
      if (itemId) {
        const res = await fetch(`/api/curriculum/text/${itemId}`);
        const data = await res.json();
        setText(data[0].original_text);
      }
    };

    fetchText();
  }, [itemId]);

  return (
    <div className="max-h-[95vh] w-[85vw] overflow-auto">
      <h1>Class Note</h1>
      <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
};

// 메인 내보내기
export default function NotePageWrapper(): ReactNode {
  return (
    <Suspense fallback={<div>Loading Curriculum Page...</div>}>
      <ClassNotePage />
    </Suspense>
  );
}

function ClassNotePage(): ReactNode {
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";
  const id = searchParams.get("id") || "";
  const student_name = searchParams.get("student_name") || "";

  return (
    <CurriculumLayout user={user} id={id} student_name={student_name}>
      <CurriculumContent />
    </CurriculumLayout>
  );
}
