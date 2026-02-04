"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Power } from "lucide-react";

interface Popup {
  _id: string;
  title?: string;
  message: string;
  active: boolean;
  createdAt?: string;
}

interface Banner {
  _id: string;
  imageUrl: string;
  message: string;
  active: boolean;
  createdAt?: string;
 }

export default function AdminPopupPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState("");


  /** Fetch all popups */
  const fetchPopups = async () => {
      const res = await fetch("/api/popup", { cache: "no-store" });
      const data = await res.json();
      setPopups(Array.isArray(data) ? data : []);
    };

    const fetchBanners = async () => {
    const res = await fetch("/api/banner?admin=true", { cache: "no-store" });
    const data = await res.json();
    setBanners(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPopups();
    fetchBanners();
  }, []);

  /** Create popup */
  const createPopup = async () => {
    if (!message.trim()) return alert("message is required");

    setLoading(true);
    await fetch("/api/popup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        active: false,
      }),
    });

    setTitle("");
    setMessage("");
    setLoading(false);
    fetchPopups();
  };

    const toggleActive = async (popup: Popup) => {
    await fetch("/api/popup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        id: popup._id,
        active: !popup.active, // ⭐ 핵심
        }),
    });

    fetchPopups();
    };

  const deletePopup = async (id: string) => {
    await fetch("/api/popup", {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    });

    fetchPopups();
  };

  const handleBannerImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createBanner = async () => {
    if (!bannerImage || !bannerMessage.trim()) {
      alert("Image and message are required");
      return;
    }

    await fetch("/api/banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: bannerImage,
        message: bannerMessage,
      }),
    });

    setBannerImage(null);
    setBannerMessage("");
    fetchBanners();
  };

  const toggleBannerActive = async (banner: Banner) => {
    await fetch("/api/banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: banner._id,
        active: !banner.active,
      }),
    });

    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    await fetch("/api/banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchBanners();
  };



return (
  <div className="max-w-3xl mx-auto p-6 space-y-10">
    <h1 className="text-2xl font-bold text-gray-900">공지 / 배너 관리</h1>

    {/* ================= POPUP CREATE ================= */}
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
      <h2 className="font-semibold text-gray-900">Create Popup</h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Popup message"
        rows={4}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />

      <button
        onClick={createPopup}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
      >
        <Plus size={16} />
        Create Popup
      </button>
    </div>

    {/* ================= POPUP LIST ================= */}
    <div className="space-y-4">
      {popups.map((popup) => (
        <div
          key={popup._id}
          className={`border border-gray-200 rounded-xl p-4 flex justify-between items-start shadow-sm ${
            popup.active ? "border-blue-500 bg-blue-50" : "bg-white"
          }`}
        >
          <div className="space-y-1">
            {popup.title && (
              <div className="font-semibold text-sm text-gray-900">
                {popup.title}
              </div>
            )}
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {popup.message}
            </div>
            <div className="text-xs font-medium">
              {popup.active ? (
                <span className="text-blue-600">ACTIVE</span>
              ) : (
                <span className="text-gray-400">INACTIVE</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => toggleActive(popup)}
              className={`p-2 rounded-md transition ${
                popup.active
                  ? "bg-gray-200 text-gray-600"
                  : "bg-green-100 text-green-700"
              }`}
              title="Toggle active"
            >
              <Power size={16} />
            </button>

            <button
              onClick={() => deletePopup(popup._id)}
              className="p-2 rounded-md bg-red-100 text-red-600 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* ================= BANNER CREATE ================= */}
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
      <h2 className="font-semibold text-gray-900">Create Banner</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          e.target.files && handleBannerImageUpload(e.target.files[0])
        }
        className="text-sm"
      />

      {bannerImage && (
        <img
          src={bannerImage}
          className="w-full h-40 object-cover rounded-md border border-gray-200"
        />
      )}

      <textarea
        value={bannerMessage}
        onChange={(e) => setBannerMessage(e.target.value)}
        placeholder="Banner message"
        rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />

      <button
        onClick={createBanner}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
      >
        <Plus size={16} />
        Create Banner
      </button>
    </div>

    {/* ================= BANNER LIST ================= */}
    <div className="space-y-4">
      {banners.map((banner) => (
        <div
          key={banner._id}
          className={`border border-gray-200 rounded-xl p-4 flex gap-4 items-start shadow-sm ${
            banner.active ? "border-blue-500 bg-blue-50" : "bg-white"
          }`}
        >
          <img
            src={banner.imageUrl}
            className="w-32 h-20 object-cover rounded-md border border-gray-200"
          />

          <div className="flex-1 space-y-1">
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {banner.message}
            </p>
            <p className="text-xs font-medium">
              {banner.active ? (
                <span className="text-blue-600">ACTIVE</span>
              ) : (
                <span className="text-gray-400">INACTIVE</span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => toggleBannerActive(banner)}
              className={`p-2 rounded-md transition ${
                banner.active
                  ? "bg-gray-200 text-gray-600"
                  : "bg-green-100 text-green-700"
              }`}
              title="Toggle active"
            >
              <Power size={16} />
            </button>

            <button
              onClick={() => deleteBanner(banner._id)}
              className="p-2 rounded-md bg-red-100 text-red-600 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

}
