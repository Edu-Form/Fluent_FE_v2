'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Note {
  _id: string;
  student_name: string;
  class_date: string;
  date: string;
  original_text: string;
  homework?: string;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const user = searchParams.get('user');
  const type = searchParams.get('type');

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !type) return;
      try {
        const res = await fetch(`/api/quizlet/${type}/${user}`);
        const data: Note[] = await res.json();
        setNotes(data);
        if (data.length > 0) {
          setSelectedIndex(data.length - 1); // default to latest
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    };

    fetchNotes();
  }, [user, type]);

  const selectedNote = notes[selectedIndex];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{user}님 Notes</h1>

      {notes.length > 0 ? (
        <>
          <select
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
            className="border rounded px-3 py-2 mb-6"
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
                  className="prose whitespace-pre-wrap border p-4 rounded"
                  dangerouslySetInnerHTML={{ __html: selectedNote.original_text }}
                />
              </div>

              {selectedNote.homework && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Homework</h2>
                  <div
                    className="prose whitespace-pre-wrap border p-4 rounded"
                    dangerouslySetInnerHTML={{ __html: selectedNote.homework }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p>No notes found for this user and type.</p>
      )}
    </div>
  );
}
