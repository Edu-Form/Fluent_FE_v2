"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/navigation";

interface Note {
  _id: string;
  student_name: string;
  class_date: string;
  date: string;
  original_text: string;
  homework?: string;
}

// 클라이언트 컴포넌트에서 useSearchParams 사용
function NotesContent() {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !type) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/quizlet/${type}/${user}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch notes: ${res.status}`);
        }

        const data: Note[] = await res.json();
        setNotes(data);
        if (data.length > 0) {
          setSelectedIndex(data.length - 1); // default to latest
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
        setError(
          error instanceof Error ? error.message : "노트를 가져오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [user, type]);

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
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-4">
        {user ? `${user}님 Notes` : "Notes"}
      </h1>

      {notes.length > 0 ? (
        <>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="border bg-white rounded px-3 py-2 mb-6 w-full md:w-auto"
          >
            {notes.map((note, idx) => (
              <option key={note._id ?? idx} value={idx}>
                {note.date} (Note {idx + 1})
              </option>
            ))}
          </select>

          {selectedNote && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Class Notes</h2>
                <div
                  className="prose whitespace-pre-wrap border p-4 rounded bg-white"
                  dangerouslySetInnerHTML={{
                    __html: selectedNote.original_text,
                  }}
                />
              </div>

              {selectedNote.homework && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Homework</h2>
                  <div
                    className="prose whitespace-pre-wrap border p-4 rounded bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedNote.homework }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg text-blue-700">
          <p>이 사용자에 대한 노트가 없습니다.</p>
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

// 메인 페이지 컴포넌트
export default function NotesPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50">
      {/* Suspense 경계 내에서 useSearchParams를 사용하는 컴포넌트 래핑 */}
      <Suspense fallback={<LoadingFallback />}>
        <NotesContent />
      </Suspense>

      <Navigation mobileOnly={true} defaultActiveIndex={4} />
    </div>
  );
}
