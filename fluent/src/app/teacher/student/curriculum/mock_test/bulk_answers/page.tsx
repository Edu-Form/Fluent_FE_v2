// app/teacher/student/curriculum/thematic_questions/page.tsx

"use client";

import React from "react";
import CurriculumLayout from "@/components/CurriculumnLayout";

export default function ThematicQuestionsPage({ searchParams }: { searchParams: any }) {
  const user = searchParams.user || "";
  const id = searchParams.id || "";
  const student_name = searchParams.student_name || "";
  return (
    <CurriculumLayout user={user} id={id} student_name={student_name}>
      
    <div className="p-6 space-y-6 max-h-[95vh] overflow-auto">
      <h1 className="text-2xl font-bold mb-4">📘 긴 답변 (Bulk Answers)</h1>

      {/* 1️⃣ Family */}
      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">1️⃣ Family</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>Tell me about your family in detail. How many members are there? What do they do?</li>
          <li>Let&quot;s have a short conversation. Please ask me at least 5 questions about my family during the conversation.</li>
        </ul>
      </section>

      {/* 2️⃣ Neighborhood */}
      <section  className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">2️⃣ Neighborhood</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>What neighborhood do you live in? Tell me in detail. What do you like about your neighborhood? What are the characteristics?</li>
        </ul>
      </section>

      {/* 3️⃣ House & Room */}
      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">3️⃣ House & Room</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>Tell me about your house in detail.</li>
          <li>Tell me about your room.</li>
          <li>Let&quot;s have a short conversation. Please ask me at least 5 questions about my house and neighborhood.</li>
        </ul>
      </section>

      {/* 4️⃣ Family 질문 */}
      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">4️⃣ Family 질문</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>가족을 얼마나 자주 보나요?</li>
          <li>가족에 대해 말해주세요</li>
          <li>가족 인원이 몇명인가요?</li>
          <li>형재 자매가 몇명인가요?</li>
          <li>가족과 친한가요?</li>
          <li>부모님에 대해 말해주세요 어떤 일을 하시나요?</li>
          <li>남편은 어떤 회사에서 일하시나요?</li>
          <li>아드님은 미래에 뭘 하실 계획인가요?</li>
          <li>혼자 사세요? 아니면 부모님이랑 사시나요?</li>
          <li>가족 중 누구랑 가장 친한가요?</li>
          <li>형제자매랑 나이 차이가 어떻게 되나요?</li>
          <li>몇살 더 많아요?</li>
          <li>직업들이 어떻게 되시나요?</li>
        </ul>
      </section>

      {/* 5️⃣ House 질문 */}
      <section className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">5️⃣ House 질문</h2>
        <ul className="list-decimal list-inside space-y-1">
          <li>몇층에 사시나요?</li>
          <li>아파트 사세요 집에 사세요?</li>
          <li>저는 이 집에 3년동안 살았습니다</li>
          <li>경치가 좋아요</li>
          <li>집의 가장 마음에 드는 방이 어디에요?</li>
          <li>집의 가장 마음에 드는 가구가 뭐에요?</li>
          <li>어떤 동네에 사시나요?</li>
          <li>이 지역에 얼마나 오래 살았어요?</li>
          <li>그게 홈플러스 근처인가요?</li>
          <li>이사하고 싶어요?</li>
          <li>집에 만족하시나요?</li>
        </ul>
      </section>

      <h2 className="text-2xl font-bold">🕒 Timer: 40 minute mark</h2>
    </div>
    </CurriculumLayout>
  );
}