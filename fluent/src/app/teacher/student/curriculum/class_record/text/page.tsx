"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import CurriculumLayout from "@/components/CurriculumnLayout"; // Import the CurriculumLayout component
import { ReactNode } from "react";

const CurriculumContent = () => {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");
  const [text, setText] = useState("");

  useEffect(() => {
    const fetchText = async () => {
      if (itemId) {
        const res = await fetch(`/api/quizlet/text/${itemId}`);
        const data = await res.json();
        setText(data[0].original_text);
      }
    };

    fetchText();
  }, [itemId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value); // Update the state when the text is edited
  };

  const saveText = async () => {
    if (itemId) {
      try {
        const response = await fetch(`/api/quizlet/text/${itemId}`, {
          method: "PUT", // Use PUT or POST depending on your API
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ original_text: text }),
        });

        if (!response.ok) {
          throw new Error("Failed to save the text.");
        }

        alert("Text saved successfully!");
      } catch (error) {
        console.error("Error saving text:", error);
        alert("Failed to save the text.");
      }
    }
  };

  return (
    <div className="max-h-[95vh] w-[85vw] overflow-auto">
      <h1>Class Note</h1>
      <textarea
        className="w-full h-[80vh] bg-gray-100 p-4 rounded text-sm leading-relaxed"
        value={text}
        onChange={handleTextChange} // Handle text changes
      />
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={saveText} // Save the edited text
        >
          Save
        </button>
      </div>
    </div>
  );
};

// 메인 내보내기
export default function NotePageWrapper(): ReactNode {
  return (
    <Suspense fallback={<div>Loading Curriculum Page...</div>}>
      <ClassNotePage />
    </Suspense>
  );
}

function ClassNotePage(): ReactNode {
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";
  const id = searchParams.get("id") || "";
  const student_name = searchParams.get("student_name") || "";

  return (
    <CurriculumLayout user={user} id={id} student_name={student_name}>
      <CurriculumContent />
    </CurriculumLayout>
  );
}
