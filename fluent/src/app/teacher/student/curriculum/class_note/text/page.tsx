"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ClassNotePage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");
  const [text, setText] = useState("");

  useEffect(() => {
    const fetchText = async () => {
      const res = await fetch(`/api/quizlet/text/${itemId}`);
      const data = await res.json();
      console.log(data[0].original_text);
      setText(data[0].original_text);
    };

    if (itemId) fetchText();
  }, [itemId]);

  return (
    <div className="max-h-[95vh] overflow-auto">
      <h1>Class Note</h1>
      <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
