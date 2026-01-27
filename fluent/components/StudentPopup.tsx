"use client";

import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";

interface PopupData {
  _id: string;
  title?: string;
  message: string;
  active: boolean;
}

export default function StudentPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/popup?mode=active", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data && data.active) {
          setPopup(data);
        }
      })
      .catch(() => {});
  }, []);

  // body scroll lock (optional but recommended)
  useEffect(() => {
    if (popup && open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [popup, open]);

  if (!popup || !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <Info size={18} />
            {popup.title || "안내"}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 text-sm text-gray-800 leading-relaxed">
          {popup.message}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-blue-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
