"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

type StudentStatus =
  | "상담중"
  | "결제완료-강사미배정"
  | "최종확정";

type Student = {
  id: string;
  name: string;
  phoneNumber: string;
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedId);

  // Load students
  const loadStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const formatted = data.map((s: any) => ({
        id: s._id,
        name: s.name || "",
        phoneNumber: s.phoneNumber || "",
        paid: s.paid ?? false,
        firstPaymentCount: s.firstPaymentCount ?? 0,
        status: s.status || "상담중",
        teacher: s.teacher || "",
        level: s.level || "",
        curriculum: s.curriculum || "",
        availableTimes: s.availableTimes || "",
        notes: s.notes || "",
      }));

      setStudents(formatted);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Duplicate check
  const handleDuplicateCheck = async () => {
    if (!newName.trim()) return;

    const res = await fetch("/api/student/duplicate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    const data = await res.json();
    setIsDuplicate(data.isDuplicate);
    setDuplicateChecked(true);
  };

  // Save student
  const handleSave = async () => {
    if (!duplicateChecked || isDuplicate) return;

    await fetch("/api/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        phoneNumber: newPhone,
      }),
    });

    setIsModalOpen(false);
    setNewName("");
    setNewPhone("");
    setDuplicateChecked(false);
    setIsDuplicate(null);

    loadStudents();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* LEFT PANEL */}
      <div className="flex-1 min-w-0 overflow-auto bg-white border-r">
        <div className="min-w-max flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h1 className="text-xl font-semibold">상담 관리</h1>

            <button
              onClick={() => setIsModalOpen(true)}
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
                  <th className="px-4 py-3 w-[200px]">이름</th>
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
                    className={`border-t hover:bg-gray-50 ${
                      selectedId === student.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <td className="px-4 py-3 truncate">
                      <button
                        onClick={() =>
                          setSelectedId(
                            selectedId === student.id ? null : student.id
                          )
                        }
                        className="text-left hover:underline font-medium"
                      >
                        {student.name || "-"}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={student.paid} readOnly />
                    </td>

                    <td className="px-4 py-3">
                      {student.firstPaymentCount}
                    </td>

                    <td className="px-4 py-3">{student.status}</td>

                    <td className="px-4 py-3">
                      {student.teacher || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {student.level || "-"}
                    </td>

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
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Student Profile</h2>
            <button
              onClick={() => setSelectedId(null)}
              className="text-sm text-gray-500 hover:text-black"
            >
              닫기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <div className="mt-1 text-lg font-medium">
                  {selectedStudent.name || ""}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Phone Number</label>
                <div className="mt-1">
                  {selectedStudent.phoneNumber || ""}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Teacher</label>
                <div className="mt-1">
                  {selectedStudent.teacher || ""}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">상담 노트</label>
              <div className="mt-2 p-4 border rounded-lg min-h-[120px] bg-gray-50 whitespace-pre-wrap">
                {selectedStudent.notes || ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">학생 추가</h2>

            <div>
              <label className="text-sm text-gray-500">Student Name</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setDuplicateChecked(false);
                    setIsDuplicate(null);
                  }}
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleDuplicateCheck}
                  className="px-3 py-2 text-sm bg-gray-200 rounded-lg"
                >
                  동명이인 체크
                </button>
              </div>

              {duplicateChecked && (
                <p
                  className={`text-sm mt-1 ${
                    isDuplicate ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {isDuplicate
                    ? "이미 존재하는 이름입니다."
                    : "사용 가능한 이름입니다."}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Phone Number</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!duplicateChecked || isDuplicate === true}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}