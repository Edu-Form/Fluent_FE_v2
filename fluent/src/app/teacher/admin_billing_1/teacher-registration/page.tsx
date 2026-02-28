"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type Teacher = {
  _id?: string;
  name: string;
  phoneNumber?: string;
  experience?: string;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Create teacher
  const handleCreateTeacher = async () => {
    if (!newName.trim()) {
      alert("Teacher name is required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          phoneNumber: newPhone.trim(),
          experience: newExperience.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err?.message || "Failed to create teacher");
        return;
      }

      // Reset
      setNewName("");
      setNewPhone("");
      setNewExperience("");
      setShowModal(false);

      // Refresh list
      fetchTeachers();
    } catch (err) {
      console.error(err);
      alert("Error creating teacher");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (name: string) => {
    if (!confirm(`Delete teacher "${name}"?`)) return;

    try {
      const res = await fetch(
        `/api/teacher/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err?.message || "Failed to delete teacher");
        return;
      }

      fetchTeachers();
    } catch (err) {
      console.error(err);
      alert("Error deleting teacher");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher 등록</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
        <Plus size={16} /> Add New Teacher
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left p-3">Teacher Name</th>
              <th className="text-left p-3">Phone Number</th>
              <th className="text-right p-3 w-28">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  No teachers found
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr
                  key={teacher._id || teacher.name}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{teacher.name}</td>
                  <td className="p-3">
                    {teacher.phoneNumber || "-"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() =>
                        handleDeleteTeacher(teacher.name)
                      }
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              Register Teacher
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Teacher Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border p-2 rounded-md"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border p-2 rounded-md"
              />

              <input
                type="text"
                placeholder="Experience"
                value={newExperience}
                onChange={(e) => setNewExperience(e.target.value)}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTeacher}
                disabled={submitting}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}