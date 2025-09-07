// app/teacher/schedules/admin/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import TeacherToastUI from "@/components/ToastUI/teacher_toastui";

type ScheduledRow = {
  _id?: string;
  date: string;         // "YYYY. MM. DD"
  time?: string | number;
  room_name?: string;
  duration?: string | number;
  teacher_name?: string;
  student_name?: string;
};

type Teacher = { name: string; phone?: string; experience?: string };

// ── Your teacher list ─────────────────────────────────────────────────────────
const TEACHERS: Teacher[] = [
  { name: "Phil",     phone: "01082413315" },
  { name: "David",    phone: "01027137397", experience: "Fluent CEO" },
  { name: "Dooho",    phone: "01028422794" },
  { name: "Joonseok", phone: "01051148514", experience: "Manager" },
  { name: "Chris",    phone: "01058559571" },
  { name: "Konnie",   phone: "01034321107" },
  { name: "Jeff",     phone: "01050836116" },
  { name: "Seojung",  phone: "01029504425" },
  { name: "Serah",    phone: "01083226548" },
  { name: "Eric",     phone: "01087673346" },
  { name: "Danny",    phone: "01026637925" }, // sanitized weird LTR mark
  { name: "Juno",     phone: "01065627324" },
  { name: "Jack",     phone: "01096799001" },
  { name: "Mudasar",  phone: "01051052211" },
  { name: "Nayeon" },
];

const TEACHER_NAMES = TEACHERS.map(t => t.name);

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeDotDate = (raw: string | null | undefined) =>
  raw ? raw.trim().replace(/\.$/, "").replace(/\s+/g, " ") : "";

function AdminCalendarInner() {
  const [rows, setRows] = useState<ScheduledRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Pull each teacher concurrently; tolerate partial failures
  const fetchAllTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        TEACHER_NAMES.map(async (t) => {
          const res = await fetch(`/api/schedules/teacher/${encodeURIComponent(t)}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`Fetch failed for ${t}`);
          const data = await res.json();

          const mapped: ScheduledRow[] = (Array.isArray(data) ? data : []).map((s: any) => ({
            _id: s?._id,
            date: normalizeDotDate(s?.date),
            time: s?.time ?? "",
            room_name: s?.room_name ?? "",
            duration: s?.duration ?? "",
            teacher_name: s?.teacher_name ?? t,  // fallback to teacher queried
            student_name: s?.student_name ?? "",
          }));
          return mapped;
        })
      );

      // Merge + dedupe by _id (or by a composite key if _id missing)
      const seen = new Set<string>();
      const merged: ScheduledRow[] = [];
      for (const r of results) {
        if (r.status !== "fulfilled") { console.warn(r.reason); continue; }
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
  }, []);

  useEffect(() => { fetchAllTeachers(); }, [fetchAllTeachers]);
  useEffect(() => {
    const handler = () => fetchAllTeachers();
    window.addEventListener("calendar:saved", handler);
    return () => window.removeEventListener("calendar:saved", handler);
  }, [fetchAllTeachers]);

  // Options for the “Add Class” student dropdown (optional)
  const studentOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r.student_name) s.add(r.student_name); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "en"));
  }, [rows]);

  // Shape for ToastUI
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

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="h-full w-full bg-white shadow-md rounded-none sm:rounded-xl p-3">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">Loading…</div>
        ) : (
          <TeacherToastUI
            data={toastData}
            variant="full"
            enableTeacherSidebar
            allowedTeachers={TEACHER_NAMES}   // left filter shows everyone in this order
            studentOptions={studentOptions}
            // leave teacher_name blank (multiple teachers)
            defaults={{ room_name: "HF1", time: 18, duration: 1 }}
          />
        )}
      </div>
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
