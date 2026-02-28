"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type StudentStatus =
  | "상담중"
  | "결제완료-강사미배정"
  | "최종확정";

type Student = {
  id: string;
  name: string;
  paid: boolean;
  firstPaymentCount: number;
  status: StudentStatus;
  teacher: string;
  level: string;
  curriculum: string;
  availableTimes: string;
  notes: string;
};

export default function ConsultPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedId);

  const addStudent = () => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: "신규 학생",
      paid: false,
      firstPaymentCount: 0,
      status: "상담중",
      teacher: "",
      level: "",
      curriculum: "",
      availableTimes: "",
      notes: "",
    };

    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = (id: string, field: keyof Student, value: any) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
  };

return (
  <div className="flex h-screen overflow-hidden bg-gray-50">

    {/* LEFT PANEL */}
    <div className="flex-1 min-w-0 overflow-auto bg-white border-r">

      <div className="min-w-max flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h1 className="text-xl font-semibold">상담 페이지</h1>

          <button
            onClick={addStudent}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
          >
            <Plus size={16} />
            Add New Student
          </button>
        </div>

        {/* Table */}
        <div className="p-6">
          <table className="w-[1400px] text-sm table-fixed border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3 w-[180px]">이름</th>
              <th className="px-4 py-3 w-[80px] text-center">Paid</th>
              <th className="px-4 py-3 w-[120px]">첫 결제 횟수</th>
              <th className="px-4 py-3 w-[180px]">Status</th>
              <th className="px-4 py-3 w-[180px]">Teacher</th>
              <th className="px-4 py-3 w-[150px]">Level</th>
              <th className="px-4 py-3 w-[200px]">Curriculum</th>
              <th className="px-4 py-3 w-[300px]">Available Times</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                onClick={() =>
                  setSelectedId((prev) =>
                    prev === student.id ? null : student.id
                  )
                }
                className={`border-t hover:bg-gray-50 cursor-pointer ${
                  selectedId === student.id ? "bg-gray-100" : ""
                }`}
              >
                <td className="px-4 py-3 truncate">{student.name}</td>

                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={student.paid}
                    onChange={(e) =>
                      updateStudent(student.id, "paid", e.target.checked)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>

                <td className="px-4 py-3">
                  {student.firstPaymentCount}
                </td>

                <td className="px-4 py-3">{student.status}</td>
                <td className="px-4 py-3">{student.teacher || "-"}</td>
                <td className="px-4 py-3">{student.level || "-"}</td>
                <td className="px-4 py-3 truncate">
                  {student.curriculum || "-"}
                </td>
                <td className="px-4 py-3 truncate">
                  {student.availableTimes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* RIGHT PANEL */}
    {selectedStudent && (
      <div className="w-[600px] h-full flex flex-col bg-white border-l flex-shrink-0">

        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">
            {selectedStudent.name} 상세 정보
          </h2>

          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-gray-500 hover:text-black"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-sm text-gray-500">Teacher</label>
            <input
              value={selectedStudent.teacher}
              onChange={(e) =>
                updateStudent(selectedStudent.id, "teacher", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Level</label>
            <input
              value={selectedStudent.level}
              onChange={(e) =>
                updateStudent(selectedStudent.id, "level", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Curriculum</label>
            <input
              value={selectedStudent.curriculum}
              onChange={(e) =>
                updateStudent(selectedStudent.id, "curriculum", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">상세 상담 노트</label>
            <textarea
              value={selectedStudent.notes}
              onChange={(e) =>
                updateStudent(selectedStudent.id, "notes", e.target.value)
              }
              rows={6}
              className="w-full border rounded-lg p-3 resize-none focus:ring-2 focus:ring-black mt-1"
            />
          </div>
        </div>
      </div>
    )}
  </div>
);
}