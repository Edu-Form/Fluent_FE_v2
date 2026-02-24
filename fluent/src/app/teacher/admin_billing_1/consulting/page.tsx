"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">상담 페이지</h1>

        <button
          onClick={addStudent}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          <Plus size={16} />
          Add New Student
        </button>
      </div>

      {/* Table Container (NO overflow wrapper) */}
      <div className="bg-white border rounded-xl shadow-sm">

        <table className="min-w-[1500px] w-full text-sm">

          {/* Header */}
          <thead className="bg-gray-100">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3 w-[220px]">이름</th>
              <th className="px-4 py-3 w-[80px]">Paid</th>
              <th className="px-4 py-3 w-[140px]">첫 결제 횟수</th>
              <th className="px-4 py-3 w-[180px]">Status</th>
              <th className="px-4 py-3 w-[160px]">Teacher</th>
              <th className="px-4 py-3 w-[120px]">Level</th>
              <th className="px-4 py-3 w-[180px]">Curriculum</th>
              <th className="px-4 py-3 w-[220px]">Available Times</th>
              <th className="px-4 py-3 w-[250px]">Notes</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <>
                <tr
                  key={student.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(student.id)}
                        className="text-gray-500"
                      >
                        {expandedId === student.id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>

                      <input
                        value={student.name}
                        onChange={(e) =>
                          updateStudent(student.id, "name", e.target.value)
                        }
                        className="bg-transparent outline-none w-full"
                      />
                    </div>
                  </td>

                  {/* Paid */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={student.paid}
                      onChange={(e) =>
                        updateStudent(student.id, "paid", e.target.checked)
                      }
                    />
                  </td>

                  {/* First Payment Count */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={student.firstPaymentCount}
                      onChange={(e) =>
                        updateStudent(
                          student.id,
                          "firstPaymentCount",
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <select
                      value={student.status}
                      onChange={(e) =>
                        updateStudent(student.id, "status", e.target.value)
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    >
                      <option value="상담중">상담중</option>
                      <option value="결제완료-강사미배정">
                        결제완료-강사미배정
                      </option>
                      <option value="최종확정">최종확정</option>
                    </select>
                  </td>

                  {/* Teacher */}
                  <td className="px-4 py-3">
                    <input
                      value={student.teacher}
                      onChange={(e) =>
                        updateStudent(student.id, "teacher", e.target.value)
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    />
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3">
                    <input
                      value={student.level}
                      onChange={(e) =>
                        updateStudent(student.id, "level", e.target.value)
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    />
                  </td>

                  {/* Curriculum */}
                  <td className="px-4 py-3">
                    <input
                      value={student.curriculum}
                      onChange={(e) =>
                        updateStudent(student.id, "curriculum", e.target.value)
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    />
                  </td>

                  {/* Available Times */}
                  <td className="px-4 py-3">
                    <input
                      value={student.availableTimes}
                      onChange={(e) =>
                        updateStudent(
                          student.id,
                          "availableTimes",
                          e.target.value
                        )
                      }
                      className="w-full bg-gray-100 rounded px-2 py-1"
                    />
                  </td>

                  {/* Notes Preview */}
                  <td className="px-4 py-3 truncate text-gray-500">
                    {student.notes || "-"}
                  </td>
                </tr>

                {expandedId === student.id && (
                  <tr className="bg-gray-50 border-t">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">
                          상세 상담 노트
                        </div>

                        <textarea
                          value={student.notes}
                          onChange={(e) =>
                            updateStudent(
                              student.id,
                              "notes",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="상세 상담 내용을 입력하세요..."
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}