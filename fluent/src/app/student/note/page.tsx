"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

// 클라이언트 컴포넌트에서 useSearchParams 사용
function NotesContent() {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");

  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setClassStats] = useState<{
    totalClassesCompleted: number;
    currentCredits: number;
    classesUsed: number;
  } | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/classnote/student/${encodeURIComponent(user)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch notes: ${res.status}`);
        }

        const data: ClassNote[] = await res.json();
        setNotes(data);
        if (data.length > 0) {
          setSelectedIndex(0); // default to latest (first item after sort)
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
        setError(
          error instanceof Error ? error.message : "수업 노트를 가져오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetch(`/api/classnote/count/${encodeURIComponent(user)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Only set stats if we got valid data
        if (data && typeof data === 'object') {
          setClassStats(data);
        }
      })
      .catch((error) => {
        console.log("클래스 통계를 불러오지 못 합니다", error);
        // Don't set classStats on error - page will work without it
      });
  }, [user]);

  const selectedNote = notes[selectedIndex];

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
    <div className="h-full pb-20">
      <h1 className="text-2xl font-bold mb-4 px-4">
        {user ? `${user}님의 수업 노트` : "수업 노트"}
      </h1>

      {/* {classStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mx-4 mb-4 shadow-sm border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">전체 수업 횟수</p>
              <p className="text-xl font-bold text-blue-600">{classStats.totalClassesCompleted}회</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">사용한 수업 횟수</p>
              <p className="text-xl font-bold text-indigo-600">{classStats.classesUsed}회</p>
            </div>
          </div>
        </div>
      )} */}
      {/* Selected Note Detail */}
      {selectedNote && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {selectedNote.date || selectedNote.class_date || "수업 노트"}
            </h2>
            {selectedNote.teacher_name && (
              <p className="text-sm text-gray-600">{selectedNote.teacher_name} 선생님</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">수업 내용</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3"
                dangerouslySetInnerHTML={{
                  __html: selectedNote.original_text,
                }}
              />
            </div>

            {selectedNote.homework && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">숙제</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-3 border border-amber-200"
                  dangerouslySetInnerHTML={{ __html: selectedNote.homework }}
                />
              </div>
            )}

            {selectedNote.nextClass && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">다음 수업</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 rounded-lg p-3 border border-blue-200">
                  {selectedNote.nextClass}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {notes.length > 0 ? (
        <div className="px-4 space-y-3">
          {/* Notes List - Mobile Friendly */}
          <div className="space-y-2">
            {notes.map((note, idx) => {
              const noteDate = note.date || note.class_date || "";
              const isSelected = idx === selectedIndex;
              
              return (
                <div
                  key={note._id ?? idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`border rounded-xl p-3 transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
                      {noteDate || "날짜 없음"}
                    </p>
                    {note.teacher_name && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {note.teacher_name} 선생님
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: note.original_text?.slice(0, 100) + (note.original_text?.length > 100 ? "..." : "") || "",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 mx-4 rounded-lg text-blue-700">
          <p>아직 수업 노트가 없습니다.</p>
        </div>
      )}
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

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 lg:px-8 pb-24">
      <Suspense fallback={<LoadingFallback />}>
        <div className="flex justify-center w-full">
          <div
            className="
              w-full
              max-w-[430px]
              md:max-w-[768px]
              lg:max-w-[1024px]
              xl:max-w-[1200px]
            "
          >
            <NotesContent />
          </div>
        </div>
      </Suspense>

      <Navigation defaultActiveIndex={5} />
    </div>
  );
}

