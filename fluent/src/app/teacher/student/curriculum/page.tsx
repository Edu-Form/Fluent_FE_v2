"use client";

import CurriculumLayout from "@/components/CurriculumnLayout";

export default function ClassNotePage({ searchParams }: { searchParams: any }) {
  const user = searchParams.user || "";
  const id = searchParams.id || "";
  const student_name = searchParams.student_name || "";

  return (
    <CurriculumLayout user={user} id={id} student_name={student_name}>
      <div>
      &quot;&quot;
      </div>
    </CurriculumLayout>
  );
}