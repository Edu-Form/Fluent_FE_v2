"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TeacherToastUI from "@/components/ToastUI/teacher_toastui";
import BillingPanel from "@/components/BillingPanel"; // 👈 NEW
import Navigation from "@/components/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
type ScheduledRow = {
  _id?: string;
  date: string;         // "YYYY. MM. DD"
  time?: string;
  room_name?: string;
  duration?: string;
  teacher_name?: string;
  student_name?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeDotDate = (raw: string | null | undefined) => {
  if (!raw) return "";
  return raw.trim().replace(/\.$/, "").replace(/\s+/g, " ");
};

// ── Inner client component (uses useSearchParams) ─────────────────────────────
function StudentCalendarWithChatInner() {
  const searchParams = useSearchParams();
  const studentName = searchParams.get("student_name") ?? "";
  const teacherName = searchParams.get("user") ?? ""; // from URL

  // Schedules (teacher planned)
  const [, setScheduleDates] = useState<string[]>([]);
  const [scheduledRows, setScheduledRows] = useState<ScheduledRow[]>([]);
  const [, setSchedulesLoaded] = useState(false);

  // Class notes (quizlets: actually happened)
  const [quizletDates, setQuizletDates] = useState<string[]>([]);
  const [, setQuizletsLoaded] = useState(false);

  // ── Fetch schedules for the student ─────────────────────────────────────────
  useEffect(() => {
    if (!studentName) return;
    const fetchSchedules = async () => {
      try {
        const res = await fetch(
          `/api/schedules/student/${encodeURIComponent(studentName)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          console.error("Failed to fetch schedules");
          setSchedulesLoaded(true);
          return;
        }
        const data = await res.json();

        const normalizedDates = (Array.isArray(data) ? data : [])
          .map((s: any) => normalizeDotDate(s?.date))
          .filter(Boolean);
        setScheduleDates(normalizedDates);

        const rows: ScheduledRow[] = (Array.isArray(data) ? data : []).map((s: any) => ({
          _id: s?._id,
          date: normalizeDotDate(s?.date),
          time: s?.time != null ? String(s.time) : "",
          room_name: s?.room_name ?? "",
          duration: s?.duration != null ? String(s.duration) : "",
          teacher_name: s?.teacher_name ?? "",
          student_name: s?.student_name ?? studentName,
        }));
        setScheduledRows(rows);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setSchedulesLoaded(true);
      }
    };
    fetchSchedules();
  }, [studentName]);

  // ── Fetch quizlet (class actually happened) dates ───────────────────────────
  useEffect(() => {
    if (!studentName) return;
    const fetchQuizlets = async () => {
      try {
        const res = await fetch(
          `/api/quizlet/student/${encodeURIComponent(studentName)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          console.error("Failed to fetch quizlets");
          setQuizletsLoaded(true);
          return;
        }
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : [])
          .map((q: any) => normalizeDotDate(q?.class_date || q?.date))
          .filter(Boolean);
        setQuizletDates(normalized);
      } catch (err) {
        console.error("Error fetching quizlets:", err);
      } finally {
        setQuizletsLoaded(true);
      }
    };
    fetchQuizlets();
  }, [studentName]);

  // Refresh calendar after ToastUI save/update/delete (kept intact)
  const refetchSchedules = async () => {
    if (!studentName) return;
    try {
      const res = await fetch(
        `/api/schedules/student/${encodeURIComponent(studentName)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();

      const normalizedDates = (Array.isArray(data) ? data : [])
        .map((s: any) =>
          String(s?.date ?? "").trim().replace(/\.$/, "").replace(/\s+/g, " ")
        )
        .filter(Boolean);
      setScheduleDates(normalizedDates);

      const rows: ScheduledRow[] = (Array.isArray(data) ? data : []).map((s: any) => ({
        _id: s?._id,
        date: normalizeDotDate(s?.date),
        time: s?.time != null ? String(s.time) : "",
        room_name: s?.room_name ?? "",
        duration: s?.duration != null ? String(s.duration) : "",
        teacher_name: s?.teacher_name ?? "",
        student_name: s?.student_name ?? studentName,
      }));
      setScheduledRows(rows);
    } catch (e) {
      console.error("refetchSchedules error:", e);
    }
  };

  useEffect(() => {
    const handler = () => { refetchSchedules(); };
    window.addEventListener("calendar:saved", handler);
    return () => window.removeEventListener("calendar:saved", handler);
  }, [studentName]);

  // const ready = schedulesLoaded && quizletsLoaded;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left: Calendar (2/3) – unchanged */}
      <div className="w-2/3 p-6 bg-white shadow-md flex flex-col">
        <TeacherToastUI
          data={scheduledRows.map((s) => ({
            _id: s._id,
            calendarId: "1",
            room_name: s.room_name || "101",
            date: s.date,
            time: s.time ? Number(s.time) : 18,
            duration: s.duration ? Number(s.duration) : 1,
            teacher_name: s.teacher_name || teacherName || "",
            student_name: s.student_name || studentName || "",
          }))}
          variant="full"
          forceView="month"
          studentOptions={[studentName]}
          defaults={{ teacher_name: teacherName, student_name: studentName, room_name: "HF1", time: 18, duration: 1 }}
          quizletDates={quizletDates} 
        />
      </div>

      {/* Right: Billing (1/3) – replaces Chat UI */}
      <BillingPanel
        studentName={studentName ?? ""}
        teacherName={teacherName || undefined}
        quizletDates={quizletDates}
        scheduledRows={scheduledRows}
        onRefreshCalendar={refetchSchedules}
      />
    </div>
  );
}

// ── Page export wrapped in Suspense (required for useSearchParams) ────────────
export default function StudentCalendarWithChat() {
  return (
    <div className="pb-20">
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        <StudentCalendarWithChatInner />
      </Suspense>
      <Navigation mobileOnly={true} defaultActiveIndex={4} />
    </div>
  );
}
