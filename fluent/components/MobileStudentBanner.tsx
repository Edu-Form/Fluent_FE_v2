"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Banner {
  _id: string;
  imageUrl: string;
  message: string;
  active: boolean;
}

export default function MobileBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      const res = await fetch("/api/banner", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setBanner(data);
    };
    fetchBanner();
  }, []);

  if (!banner) return null;

  return (
    <>
      {/* ✅ Clickable Banner */}
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition"
      >

        <div className="p-4">
          <div className="flex items-center mb-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
            <h2 className="text-base font-bold text-gray-900">
              Fluent 최신 소식
            </h2>
          </div>

            {banner.imageUrl && (
            <img
                src={banner.imageUrl}
                alt="공지 배너"
                className="w-full h-100 object-cover"
            />
            )}

          <p className="text-sm text-gray-700 line-clamp-2">
            {banner.message}
          </p>
        </div>
      </div>

      {/* ✅ Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {banner.imageUrl && (
                <img
                src={banner.imageUrl}
                className="w-full h-auto rounded-xl"
                />
            )}

            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">공지 안내</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {banner.message}
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
