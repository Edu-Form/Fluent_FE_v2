"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef, Suspense } from "react";

function BillingContent() {
  const searchParams = useSearchParams();
  const studentName = searchParams.get("student_name") || "";

  const [editableData, setEditableData] = useState<any[]>([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!studentName) return;
    fetch(`/api/billing?student_name=${studentName}`)
      .then((res) => res.json())
      .then((data) => {
        const history = data?.history || [];
        const formatted = history.map((record: any) => ({
          price: 60000,
          class_note: record.class_note || "",
          quizlet: record.quizlet || "",
          diary: record.diary || "",
        }));
        setEditableData(formatted);
      });
  }, [studentName]);

  const handleEdit = (index: number, field: string, value: string | number) => {
    const newData = [...editableData];
    newData[index][field] = value;
    setEditableData(newData);
  };

  const total = editableData.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().from(containerRef.current).save(`${studentName}_Billing.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-screen" ref={containerRef}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{studentName} Billing</h1>
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download PDF
        </button>
      </div>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Price</th>
            <th className="px-4 py-2 text-left">Class Date</th>
            <th className="px-4 py-2 text-left">Quizlet</th>
            <th className="px-4 py-2 text-left">Diary</th>
          </tr>
        </thead>
        <tbody>
          {editableData.map((record, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={record.price}
                  onChange={(e) => handleEdit(index, "price", e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white text-black"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={record.class_note}
                  onChange={(e) => handleEdit(index, "class_note", e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white text-black"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={record.quizlet}
                  onChange={(e) => handleEdit(index, "quizlet", e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white text-black"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={record.diary}
                  onChange={(e) => handleEdit(index, "diary", e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white text-black"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4 text-lg font-semibold text-gray-800">
        Total: {total.toLocaleString()}원
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading billing data...</div>}>
      <BillingContent />
    </Suspense>
  );
}
