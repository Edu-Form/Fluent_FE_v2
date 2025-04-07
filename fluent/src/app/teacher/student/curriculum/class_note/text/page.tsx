"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

export default function ClassNotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassNoteContent />
    </Suspense>
  );
}

const ClassNoteContent = async () => {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");

  const fetchText = async () => {
    const res = await fetch(`/api/quizlet/text/${itemId}`);
    const data = await res.json();
    return data[0].original_text;
  };

  const text = itemId ? await fetchText() : "";

  return (
    <div className="max-h-[95vh] overflow-auto">
      <h1>Class Note</h1>
      <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
};


