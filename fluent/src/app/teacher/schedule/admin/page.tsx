// app/teacher/schedules/admin/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import TeacherToastUI from "@/components/ToastUI/teacher_toastui";
import AddTeacherModal from "@/components/RegisterTeacherModal";

type ScheduledRow = {
  _id?: string;
  date: string; // "YYYY. MM. DD"
  time?: string | number;
  room_name?: string;
  duration?: string | number;
  teacher_name?: string;
  student_name?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeDotDate = (raw: string | null | undefined) =>
  raw ? raw.trim().replace(/\.$/, "").replace(/\s+/g, " ") : "";

function AdminCalendarInner() {
  const [rows, setRows] = useState<ScheduledRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Register Teacher modal
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  // Teachers from API (plural route)
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  // ⬇️ The *currently visible* teachers (synced to sidebar). If empty, show nothing.
  const [visibleTeachers, setVisibleTeachers] = useState<string[]>([]);

  const fetchTeacherNames = useCallback(async () => {
    try {
      // Plural route to match backend: /api/teachers
      const res = await fetch("/api/teacher", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      const data = await res.json();
      const names = Array.isArray(data)
        ? data
            .map((t: any) => (t?.name ? String(t.name).trim() : ""))
            .filter((n: string) => n.length > 0)
            .sort((a: string, b: string) => a.localeCompare(b, "en"))
        : [];
      setTeacherNames(names);
      // By default, sidebar shows all → we mirror that in visibleTeachers
      setVisibleTeachers(names);
    } catch (e) {
      console.error(e);
      setTeacherNames([]);
      setVisibleTeachers([]); // with no teachers, show nothing
    }
  }, []);

  // Pull each teacher concurrently; tolerate partial failures
  const fetchAllTeachers = useCallback(
    async (names: string[]) => {
      setLoading(true);
      if (!names || names.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.allSettled(
          names.map(async (t) => {
            const res = await fetch(`/api/schedules/teacher/${encodeURIComponent(t)}`, {
              cache: "no-store",
            });
            if (!res.ok) throw new Error(`Fetch failed for ${t}`);
            const data = await res.json();

            const mapped: ScheduledRow[] = (Array.isArray(data) ? data : []).map((s: any) => ({
              _id: s?._id,
              date: normalizeDotDate(s?.date),
              time: s?.time ?? "",
              room_name: s?.room_name ?? "",
              duration: s?.duration ?? "",
              teacher_name: s?.teacher_name ?? t, // fallback to teacher queried
              student_name: s?.student_name ?? "",
            }));
            return mapped;
          })
        );

        // Merge + dedupe by _id (or by a composite key if _id missing)
        const seen = new Set<string>();
        const merged: ScheduledRow[] = [];
        for (const r of results) {
          if (r.status !== "fulfilled") {
            console.warn(r.reason);
            continue;
          }
          for (const item of r.value) {
            const key =
              item._id ||
              `${item.teacher_name}__${item.student_name}__${item.date}__${item.time}__${item.room_name}__${item.duration}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(item);
          }
        }
        setRows(merged);
      } catch (e) {
        console.error("Failed to fetch teacher schedules:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 1) load teacher names, then 2) fetch schedules for those names
  useEffect(() => {
    fetchTeacherNames();
  }, [fetchTeacherNames]);

  useEffect(() => {
    if (teacherNames.length > 0) {
      fetchAllTeachers(teacherNames);
    } else {
      // if there are no teachers yet (empty DB), stop loading
      setLoading(false);
      setRows([]);
    }
  }, [teacherNames, fetchAllTeachers]);

  // Re-fetch schedules after a save (your existing event)
  useEffect(() => {
    const handler = () => {
      if (teacherNames.length > 0) fetchAllTeachers(teacherNames);
    };
    window.addEventListener("calendar:saved", handler as EventListener);
    return () => window.removeEventListener("calendar:saved", handler as EventListener);
  }, [fetchAllTeachers, teacherNames]);

  // When a teacher is registered elsewhere and dispatches this event
  useEffect(() => {
    const onTeacherCreated = () => {
      fetchTeacherNames();
    };
    window.addEventListener("teacher:created", onTeacherCreated as EventListener);
    return () => window.removeEventListener("teacher:created", onTeacherCreated as EventListener);
  }, [fetchTeacherNames]);

  // 🔗 Keep: Listen for sidebar filter changes from TeacherToastUI
  useEffect(() => {
    const onChange = (e: Event) => {
      // Expect: new CustomEvent("teacherSidebar:change", { detail: { selected: string[] }});
      const ce = e as CustomEvent<{ selected?: string[] }>;
      if (ce?.detail?.selected && Array.isArray(ce.detail.selected)) {
        setVisibleTeachers(ce.detail.selected);
      }
    };
    const onClear = () => setVisibleTeachers([]); // Clear = show nothing
    window.addEventListener("teacherSidebar:change", onChange as EventListener);
    window.addEventListener("teacherSidebar:clear", onClear as EventListener);
    return () => {
      window.removeEventListener("teacherSidebar:change", onChange as EventListener);
      window.removeEventListener("teacherSidebar:clear", onClear as EventListener);
    };
  }, []);

  const deleteTeacher = useCallback(
    async (name: string) => {
      const trimmed = String(name || "").trim();
      if (!trimmed) return;

      if (!window.confirm(`Delete teacher "${trimmed}"? This cannot be undone.`)) return;

      try {
        const res = await fetch(`/api/teacher/${encodeURIComponent(trimmed)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `Failed to delete ${trimmed}`);
        }

        await fetchTeacherNames(); // refresh list
        window.dispatchEvent(new CustomEvent("teacher:deleted", { detail: { name: trimmed } }));
      } catch (err) {
        console.error(err);
        alert((err as Error)?.message ?? "Failed to delete teacher");
      }
    },
    [fetchTeacherNames]
  );


  // ✅ NEW: handle delete requests coming from the left filter UI
  useEffect(() => {
    const onDelete = (e: Event) => {
      // Expect: new CustomEvent("teacherSidebar:delete", { detail: { name: string }});
      const ce = e as CustomEvent<{ name?: string }>;
      const name = ce?.detail?.name;
      if (name) deleteTeacher(name);
    };
    window.addEventListener("teacherSidebar:delete", onDelete as EventListener);
    return () => window.removeEventListener("teacherSidebar:delete", onDelete as EventListener);
  }, [deleteTeacher]);

  // Options for the “Add Class” student dropdown (optional)
  const studentOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.student_name) s.add(r.student_name);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "en"));
  }, [rows]);

  // Full dataset for ToastUI
  const toastData = useMemo(
    () =>
      rows.map((s) => ({
        _id: s._id,
        calendarId: "1",
        room_name: s.room_name || "101",
        date: s.date,
        time: Number(s.time ?? 18),
        duration: Number(s.duration ?? 1),
        teacher_name: s.teacher_name || "",
        student_name: s.student_name || "",
      })),
    [rows]
  );

  // ✅ Data-level filter so that "Clear" truly hides all schedules
  const filteredToastData = useMemo(() => {
    if (visibleTeachers.length === 0) return [];
    const allowed = new Set(visibleTeachers);
    return toastData.filter((ev) => ev.teacher_name && allowed.has(ev.teacher_name));
  }, [toastData, visibleTeachers]);

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="h-full w-full bg-white shadow-md rounded-none sm:rounded-xl p-3 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">Loading…</div>
        ) : (
            <TeacherToastUI
              data={filteredToastData}
              variant="full"
              enableTeacherSidebar
              allowedTeachers={teacherNames}
              studentOptions={studentOptions}
              defaults={{ room_name: "HF1", time: 18, duration: 1 }}
            />
        )}

        {/* Register Teacher button anchored to the bottom-left of the sidebar area (tidy) */}
        <div className="pointer-events-none">
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
            <button
              onClick={() => setIsAddTeacherOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
            >
              Register Teacher
            </button>
          </div>
        </div>
      </div>

      {/* Modal overlay + your existing modal component */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <AddTeacherModal
            onClose={() => setIsAddTeacherOpen(false)}
            onCreated={() => {
              setIsAddTeacherOpen(false);
              // Refresh left panel teacher list immediately
              fetchTeacherNames();
              // Optional: notify other parts of the app
              window.dispatchEvent(new Event("teacher:created"));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminCalendarPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AdminCalendarInner />
    </Suspense>
  );
}
