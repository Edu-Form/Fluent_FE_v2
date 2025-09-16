// components/AddTeacherModal.tsx
"use client";

import React, { useState } from "react";

type Props = {
  onClose: () => void;
  onCreated?: () => void; // call to refresh teacher list
};

export default function AddTeacherModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);

    if (!name.trim()) {
      setErr("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          experience: experience.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to register teacher.");
      }

      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to register teacher.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Add Teacher</h2>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., David"
            className="w-full bg-white text-black border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <textarea
            id="phoneNumber"
            name="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 01012345678"
            className="w-full bg-white text-black border border-gray-300 rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
            Experience
          </label>
          <textarea
            id="experience"
            name="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Describe the teacher's experience..."
            className="w-full bg-white text-black border border-gray-300 rounded-lg px-3 py-2 h-[100px] outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
