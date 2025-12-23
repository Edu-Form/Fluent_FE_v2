"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";

interface ClassNote {
  _id: string;
  student_name: string;
  teacher_name?: string;
  class_date?: string;
  date: string;
  original_text: string;
  homework?: string;
  nextClass?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Student {
  name: string;
  teacher?: string;
  teacher_name?: string;
}

function NotesContent() {
  const searchParams = useSearchParams();
  const teacher = searchParams.get("user");

  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudent, setFilterStudent] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!teacher) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all students for this teacher
        const studentsRes = await fetch("/api/studentList", { cache: "no-store" });
        if (!studentsRes.ok) {
          throw new Error(`Failed to fetch students: ${studentsRes.status}`);
        }

        const allStudents: Student[] = await studentsRes.json();
        const teacherStudents = allStudents.filter(
          (s) =>
            (s.teacher || s.teacher_name || "").trim().toLowerCase() ===
            teacher.trim().toLowerCase()
        );
        setStudents(teacherStudents);

        if (teacherStudents.length === 0) {
          setNotes([]);
          setIsLoading(false);
          return;
        }

        // Fetch class notes for all students
        const studentNames = teacherStudents.map((s) => s.name);
        const allNotes: ClassNote[] = [];

        // Fetch notes for each student
        await Promise.all(
          studentNames.map(async (studentName) => {
            try {
              const notesRes = await fetch(
                `/api/classnote/student/${encodeURIComponent(studentName)}`,
                { cache: "no-store" }
              );
              if (notesRes.ok) {
                const studentNotes: ClassNote[] = await notesRes.json();
                // Filter to only include notes from this teacher
                const teacherNotes = studentNotes.filter(
                  (note) =>
                    (note.teacher_name || "").trim().toLowerCase() ===
                    teacher.trim().toLowerCase()
                );
                allNotes.push(...teacherNotes);
              }
            } catch (err) {
              console.error(`Failed to fetch notes for ${studentName}:`, err);
            }
          })
        );

        // Sort by date descending (newest first)
        allNotes.sort((a, b) => {
          const dateA = a.date || a.class_date || "";
          const dateB = b.date || b.class_date || "";
          return dateB.localeCompare(dateA);
        });

        setNotes(allNotes);
        if (allNotes.length > 0) {
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
        setError(
          error instanceof Error
            ? error.message
            : "수업 노트를 가져오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teacher]);

  const filteredNotes =
    filterStudent === "all"
      ? notes
      : notes.filter((note) => note.student_name === filterStudent);

  const selectedNote = filteredNotes[selectedIndex];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        <p className="font-medium">에러 발생</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {teacher ? `${teacher} 선생님의 수업 노트` : "수업 노트"}
        </h1>

        {/* Student Filter */}
        {students.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생 필터
            </label>
            <select
              value={filterStudent}
              onChange={(e) => {
                setFilterStudent(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full md:w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">전체 학생</option>
              {students.map((student) => (
                <option key={student.name} value={student.name}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 shadow-sm border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">전체 수업 횟수</p>
              <p className="text-xl font-bold text-blue-600">
                {filteredNotes.length}회
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">학생 수</p>
              <p className="text-xl font-bold text-indigo-600">
                {students.length}명
              </p>
            </div>
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                노트 목록
              </h2>
              {filteredNotes.map((note, idx) => {
                const noteDate = note.date || note.class_date || "";
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={note._id ?? idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`border rounded-xl p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`text-sm font-semibold ${
                          isSelected ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {noteDate || "날짜 없음"}
                      </p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {note.student_name}
                      </span>
                    </div>
                    <div
                      className="text-xs text-gray-600 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html:
                          note.original_text?.slice(0, 100) +
                            (note.original_text?.length > 100 ? "..." : "") ||
                          "",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Selected Note Detail */}
            {selectedNote && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {selectedNote.date || selectedNote.class_date || "수업 노트"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">
                      학생: {selectedNote.student_name}
                    </span>
                    {selectedNote.teacher_name && (
                      <span className="text-sm text-gray-600">
                        선생님: {selectedNote.teacher_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      수업 내용
                    </h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{
                        __html: selectedNote.original_text,
                      }}
                    />
                  </div>

                  {selectedNote.homework && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        숙제
                      </h3>
                      <div
                        className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-3 border border-amber-200"
                        dangerouslySetInnerHTML={{ __html: selectedNote.homework }}
                      />
                    </div>
                  )}

                  {selectedNote.nextClass && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        다음 수업
                      </h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 rounded-lg p-3 border border-blue-200">
                        {selectedNote.nextClass}
                      </div>
                    </div>
                  )}

                  {/* Link to edit note */}
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href={`/teacher/student/class_record?user=${encodeURIComponent(teacher || "")}&type=teacher&student_name=${encodeURIComponent(selectedNote.student_name)}${selectedNote._id ? `&class_note_id=${encodeURIComponent(selectedNote._id)}` : ""}`}
                      className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      노트 수정하기
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg text-blue-700">
            <p>
              {filterStudent === "all"
                ? "아직 수업 노트가 없습니다."
                : `${filterStudent} 학생의 수업 노트가 없습니다.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 상태 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">페이지 로딩 중...</p>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function TeacherNotesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Suspense fallback={<LoadingFallback />}>
        <NotesContent />
      </Suspense>
      <Navigation mobileOnly={true} defaultActiveIndex={5} />
    </div>
  );
}

