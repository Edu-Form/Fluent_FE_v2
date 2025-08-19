"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatSchedulerPanel from "@/components/ChatSchedulerPanel";

// ── Labels ────────────────────────────────────────────────────────────────────
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// ── Types ─────────────────────────────────────────────────────────────────────
type ScheduledRow = {
  _id?: string;
  date: string;         // "YYYY. MM. DD" (no trailing dot in calendar keys)
  time?: string;
  room_name?: string;
  duration?: string;
  teacher_name?: string;
  student_name?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeDotDate = (raw: string | null | undefined) => {
  if (!raw) return "";
  // Trim, remove trailing ".", collapse spaces => "YYYY. MM. DD"
  return raw.trim().replace(/\.$/, "").replace(/\s+/g, " ");
};

const formatCellKey = (d: Date) =>
  `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
    d.getDate()
  ).padStart(2, "0")}`;

// ── Inner client component (uses useSearchParams) ─────────────────────────────
function StudentCalendarWithChatInner() {
  const searchParams = useSearchParams();
  const studentName = searchParams.get("student_name") ?? "";
  const teacherName = searchParams.get("user") ?? ""; // from URL

  const [currentDate, setCurrentDate] = useState(new Date());

  // Schedules (teacher planned)
  const [scheduleDates, setScheduleDates] = useState<string[]>([]);
  const [scheduledRows, setScheduledRows] = useState<ScheduledRow[]>([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);

  // Quizlets/class-notes (actually happened)
  const [quizletDates, setQuizletDates] = useState<string[]>([]);
  const [quizletsLoaded, setQuizletsLoaded] = useState(false);

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

  // ── Sets & comparisons ──────────────────────────────────────────────────────
  const scheduleSet = useMemo(() => new Set(scheduleDates), [scheduleDates]);
  const quizletSet = useMemo(() => new Set(quizletDates), [quizletDates]);

  // ── Calendar building ───────────────────────────────────────────────────────
  const getMonthDays = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const cell = new Date(startDate);
      cell.setDate(startDate.getDate() + i);
      days.push(cell);
    }
    return days;
  };

  const days = getMonthDays(currentDate);

  const goPrev = () => {
    const nd = new Date(currentDate);
    nd.setMonth(nd.getMonth() - 1);
    setCurrentDate(nd);
  };

  const goNext = () => {
    const nd = new Date(currentDate);
    nd.setMonth(nd.getMonth() + 1);
    setCurrentDate(nd);
  };

  const goToday = () => setCurrentDate(new Date());

  // ✅ refresh only the calendar (schedules) after chat create/update/delete
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left: Calendar (2/3) */}
      <div className="w-2/3 p-6 bg-white shadow-md flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={goPrev} className="px-3 py-1 rounded bg-gray-200">←</button>
          <h2 className="text-xl font-bold flex-1 text-center">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <button onClick={goNext} className="px-3 py-1 rounded bg-gray-200">→</button>
          <button onClick={goToday} className="ml-2 px-3 py-1 rounded bg-blue-500 text-white">오늘</button>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 text-center font-semibold border-b pb-2 mb-2">
          {weekdays.map((d, i) => (
            <div key={i} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}>
              {d}
            </div>
          ))}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = new Date().toDateString() === day.toDateString();

            const key = formatCellKey(day); // "YYYY. MM. DD" (no trailing dot)
            const scheduled = scheduleSet.has(key);
            const happened = quizletSet.has(key);

            // Colors:
            //  - scheduled & happened => green
            //  - happened only => red
            //  - scheduled only => purple
            let cellClass = isCurrentMonth ? "bg-white" : "bg-gray-100 text-gray-400";
            if (scheduled && happened) cellClass = "bg-green-200 font-bold text-green-900";
            else if (!scheduled && happened) cellClass = "bg-red-200 font-bold text-red-900";
            else if (scheduled && !happened) cellClass = "bg-purple-200 font-bold text-purple-900";

            return (
              <div
                key={i}
                className={[
                  "p-2 text-sm rounded-lg text-center cursor-default select-none",
                  cellClass,
                  isToday ? "border border-blue-500" : "",
                ].join(" ")}
                title={`${key}${scheduled ? " • scheduled" : ""}${happened ? " • happened" : ""}`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Chat UI (1/3) */}
      <ChatSchedulerPanel
        studentName={studentName ?? ""}
        teacherName={teacherName || undefined}
        unscheduledDates={useMemo(() => quizletDates.filter((d) => !scheduleSet.has(d)), [quizletDates, scheduleSet])}
        scheduled={scheduledRows}
        ready={schedulesLoaded && quizletsLoaded}
        onApply={(items) => {
          // optimistic add to calendar (dates only)
          setScheduleDates((prev) => {
            const add = items.map((i) => normalizeDotDate(i.date));
            return Array.from(new Set([...prev, ...add]));
          });
        }}
        onRefreshCalendar={refetchSchedules}
      />
    </div>
  );
}

// ── Page export wrapped in Suspense (required for useSearchParams) ────────────
export default function StudentCalendarWithChat() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <StudentCalendarWithChatInner />
    </Suspense>
  );
}
