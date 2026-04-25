"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  link?: string;
};

type Teacher = {
  _id?: string;
  name: string;
};

function ConsultPageContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedId);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");

  useEffect(() => {
    if (selectedStudent) {
      setNotesDraft(selectedStudent.notes || "");
      setPhoneDraft(selectedStudent.phoneNumber || "");
      setLinkDraft(selectedStudent.link || ""); // ✅ add this
    }
  }, [selectedStudent]);
  const [notesDraft, setNotesDraft] = useState("");
  const handleSaveAll = async () => {
    if (!selectedStudent) return;

    try {
      await fetch(`/api/student/${encodeURIComponent(selectedStudent.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneDraft,
          notes: notesDraft,
          link: linkDraft,
        }),
      });

      // update UI once
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                phoneNumber: phoneDraft,
                notes: notesDraft,
                link: linkDraft,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Failed to save student:", err);
    }
  };
  const searchParams = useSearchParams();
  const queryStudentName = searchParams.get("student_name");

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
        link: s.link || "",
      }));

      setStudents(formatted);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  // Load teachers
  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/teacher", { cache: "no-store" });
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    }
  };

  useEffect(() => {
    loadStudents();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!queryStudentName || students.length === 0) return;

    const found = students.find(
      (s) => s.name?.trim() === queryStudentName.trim()
    );

    if (found) {
      setSelectedId(found.id);
    }
  }, [queryStudentName, students]);

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
        teacher: newTeacher,
      }),
    });

    setIsModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewTeacher("");
    setDuplicateChecked(false);
    setIsDuplicate(null);

    loadStudents();
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await fetch(`/api/student/${encodeURIComponent(selectedStudent.name)}`, {
        method: "DELETE",
      });

      // remove from UI
      setStudents((prev) =>
        prev.filter((s) => s.id !== selectedStudent.id)
      );

      setSelectedId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleTeacherChange = async (studentName: string, teacher: string) => {
    try {
      await fetch(`/api/student/${encodeURIComponent(studentName)}`, {
        method: "POST", // your API uses POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher }),
      });

      // instant UI update (no reload)
      setStudents((prev) =>
        prev.map((s) =>
          s.name === studentName ? { ...s, teacher } : s
        )
      );
    } catch (err) {
      console.error("Failed to update teacher:", err);
    }
  };

  const handlePaidToggle = async (student: Student) => {
  const newPaid = !student.paid;

    try {
      await fetch(`/api/student/${encodeURIComponent(student.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: newPaid }),
      });

      // instant UI update
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, paid: newPaid } : s
        )
      );
    } catch (err) {
      console.error("Failed to update paid:", err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* LEFT PANEL */}
      <div className="flex-1 min-w-0 overflow-auto bg-white border-r">
        <div className="min-w-max flex flex-col">

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h1 className="text-xl font-semibold">상담 관리 & Student Registration</h1>

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
                      <input
                        type="checkbox"
                        checked={student.paid}
                        onChange={() => handlePaidToggle(student)}
                        className="w-4 h-4 cursor-pointer accent-green-500"
                      />
                    </td>

                    <td className="px-4 py-3">
                      {student.firstPaymentCount}
                    </td>

                    <td className="px-4 py-3">{student.status}</td>

                    <td className="px-4 py-3">
                      <select
                        value={student.teacher || ""}
                        onChange={(e) =>
                          handleTeacherChange(student.name, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm bg-white"
                      >
                        <option value="">선택</option>
                        {teachers.map((t) => (
                          <option key={t._id || t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
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

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                닫기
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <div className="mt-1 text-lg font-medium">
                {selectedStudent.name}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Phone</label>

              <div className="mt-2 space-y-2">
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Teacher</label>
              <div className="mt-1">{selectedStudent.teacher}</div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Link</label>
              <div className="mt-2 space-y-2">
                <input
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 border rounded-lg text-sm"
                />

                <div className="flex justify-between items-center">
                  {/* open link */}
                  {linkDraft && (
                    <a
                      href={linkDraft}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      열기
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">노트</label>
              <div className="mt-2 space-y-2">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full p-3 border rounded-lg min-h-[120px] text-sm bg-white text-black"
                />
              </div>
            </div>

            <div className="border-t bg-white p-4 sticky bottom-0">
              <div className="flex justify-end">

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    삭제
                  </button>

                  <button
                    onClick={handleSaveAll}
                    className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:opacity-80 transition"
                  >
                    저장
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-xl p-6 space-y-4">

            <h2 className="text-lg font-semibold text-red-600">
              Delete Student
            </h2>

            <p className="text-sm text-gray-700">
              You will permanently delete{" "}
              <span className="font-medium">{selectedStudent.name}</span>{" "}
              and all of his/her data.
            </p>

            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}
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
                  중복 체크
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Phone Number</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Teacher</label>
              <select
                value={newTeacher}
                onChange={(e) => setNewTeacher(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="">선택</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id || teacher.name} value={teacher.name}>
                    {teacher.name}
                  </option>
                ))}
              </select>
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



export default function ConsultPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ConsultPageContent />
    </Suspense>
  );
}