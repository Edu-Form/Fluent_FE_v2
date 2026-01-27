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

export default function AdminPopupPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /** Fetch all popups */
  const fetchPopups = async () => {
    const res = await fetch("/api/popup", { cache: "no-store" });
    const data = await res.json();
    setPopups(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPopups();
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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Student Banner Admin</h1>

      {/* CREATE */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Create New Banner</h2>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Banner message"
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />

        <button
          onClick={createPopup}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          <Plus size={16} />
          Create
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {popups.map(popup => (
          <div
            key={popup._id}
            className={`border rounded-xl p-4 flex justify-between items-start ${
              popup.active ? "border-blue-500 bg-blue-50" : "bg-white"
            }`}
          >
            <div>
              {popup.title && (
                <div className="font-semibold text-sm">{popup.title}</div>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {popup.message}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {popup.active ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(popup)}
                className={`p-2 rounded-md ${
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
                className="p-2 rounded-md bg-red-100 text-red-600"
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
