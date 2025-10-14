"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------ Types ------------------------------ */
type ScheduledRow = {
  _id?: string;
  date: string;        // "YYYY. MM. DD" or "YYYY. MM. DD."
  time?: string;
  room_name?: string;
  duration?: string;
  teacher_name?: string;
  student_name?: string;
};

type BillingRow = {
  id: string;          // local row id
  noteDate: string;    // class-note date (editable)  -> "YYYY. MM. DD."
  schedDate: string;   // schedule date (editable)    -> "YYYY. MM. DD."
};

type NextBillingRow = { id: string; schedDate: string };

/* --------------------------- Date helpers -------------------------- */
function toDateYMD(str?: string | null) {
  if (!str) return null;
  const s = String(str).trim();
  const m =
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/) || // 2025. 9. 9 or 2025. 09. 09.
    s.match(/^(\d{4})[-\/]\s*(\d{1,2})[-\/]\s*(\d{1,2})\.?$/) || // 2025-9-9, 2025/09/09
    s.match(/^(\d{4})(\d{2})(\d{2})$/); // 20250909
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
function ymdString(d: Date) {
  // Always return with a TRAILING DOT
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}
function sameYearMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* ------------------------------ Component ------------------------------ */
export default function BillingPanel({
  studentName,
  teacherName,
  quizletDates,               // class-note dates (strings)
  scheduledRows,              // calendar schedules
  onRefreshCalendar,          // optional calendar refresh hook
  // Schedules API to create a class when matching a note without a schedule
  saveEndpointBase = "/api/schedules",
  // If true, “Match” will CREATE a schedule when missing
  autoCreateScheduleOnMatch = true,
  // Defaults for new schedule created by Match
  defaultsForNewSchedule = { room_name: "HF1", time: 18, duration: 1 },
}: {
  studentName: string;
  teacherName?: string;
  quizletDates: string[];
  scheduledRows: ScheduledRow[];
  onRefreshCalendar?: () => Promise<void> | void;
  saveEndpointBase?: string;
  autoCreateScheduleOnMatch?: boolean;
  defaultsForNewSchedule?: { room_name?: string; time?: number; duration?: number };
}) {
  /* ---- Part 0: Local month control (independent of ToastUI) ---- */
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = `${monthAnchor.getFullYear()}. ${String(monthAnchor.getMonth() + 1).padStart(2, "0")}`;
  const goPrevMonth = () => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const todayMonth = () => {
    const now = new Date();
    setMonthAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  /* ---- Part 1: Simplified state (no fee / no settlement / no text message) ---- */
  const [rows, setRows] = useState<BillingRow[]>([]);       // this month's actual classes (from notes)
  const [nextRows, setNextRows] = useState<NextBillingRow[]>([]); // next month's planned schedules
  const studentCacheRef = useRef<Map<string, any>>(new Map());
  const [studentMeta, setStudentMeta] = useState<Record<string, { quizlet_date?: string; diary_date?: string }> | null>(null);
  const [studentMetaLoading, setStudentMetaLoading] = useState(false);

  // LOCK state: when true, panel is read-only because billing data exists for selected month
  const [locked, setLocked] = useState<boolean>(false);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);

  useEffect(() => {
    if (!studentName) { setStudentMeta(null); return; }
    const cached = studentCacheRef.current.get(studentName);
    if (cached) {
      setStudentMeta(buildClassHistoryMap(cached.class_history || []));
      return;
    }
    setStudentMetaLoading(true);
    fetch(`/api/student/${encodeURIComponent(studentName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(doc => {
        if (doc) {
          studentCacheRef.current.set(studentName, doc);
          setStudentMeta(buildClassHistoryMap(doc.class_history || []));
        } else {
          setStudentMeta(null);
        }
      })
      .catch(() => setStudentMeta(null))
      .finally(() => setStudentMetaLoading(false));
  }, [studentName]);

  // turn [{ "2025. 09. 15.": {quizlet_date, diary_date}}, ...] into a map
  function buildClassHistoryMap(class_history: any[]): Record<string, { quizlet_date?: string; diary_date?: string }> {
    const map: Record<string, { quizlet_date?: string; diary_date?: string }> = {};
    (class_history || []).forEach((entry: any) => {
      const [k, v] = Object.entries(entry || {})[0] || [];
      if (k && v && typeof v === "object") map[String(k)] = v as any;
    });
    return map;
  }

  /* ---- Month data (this + next) ---- */
  const scheduleDatesThisMonth = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b));
  }, [scheduledRows, monthAnchor]);

  const scheduleSetThisMonth = useMemo(
    () => new Set(scheduleDatesThisMonth),
    [scheduleDatesThisMonth]
  );

  const nextMonthAnchor = useMemo(
    () => new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1),
    [monthAnchor]
  );

  const nextMonthScheduleDates = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, nextMonthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b));
  }, [scheduledRows, nextMonthAnchor]);

// Replace your existing useEffect that checks saved billing for the month with this one:
useEffect(() => {
  if (!studentName) return;
  const y = monthAnchor.getFullYear();
  const m = String(monthAnchor.getMonth() + 1).padStart(2, "0");
  const yyyymm = `${y}${m}`; // e.g. "202510"

  let cancelled = false;
  setLoadingCheck(true);

  (async () => {
    try {
      const res = await fetch(`/api/billing/check1/${encodeURIComponent(studentName)}/${yyyymm}`, { cache: "no-store" });

      // If non-200, mark unlocked and return (404 means no saved billing)
      if (!res.ok) {
        if (!cancelled) setLocked(false);
        // optional: log server text for debugging
        const txt = await res.text().catch(() => "");
        console.debug("billing/check1 GET not ok:", res.status, txt.slice ? txt.slice(0,300) : txt);
        return;
      }

      const json = await res.json().catch(() => null);
      if (!json) {
        if (!cancelled) setLocked(false);
        return;
      }

      // Support two possible shapes:
      // 1) { ok: true, found: true, data: { ...entry... } }
      // 2) directly { locked, this_month_lines, next_month_lines, ... }
      const entry = (json && (json.data ?? json)) as any;

      if (!entry) {
        if (!cancelled) setLocked(false);
        return;
      }

      // Determine presence of billing data
      const hasBilling =
        entry.locked === true ||
        (Array.isArray(entry.this_month_lines) && entry.this_month_lines.length > 0) ||
        (Array.isArray(entry.next_month_lines) && entry.next_month_lines.length > 0) ||
        (Array.isArray(entry.rows) && entry.rows.length > 0) || // older shape fallback
        (entry.this_month && Array.isArray(entry.this_month.lines) && entry.this_month.lines.length > 0);

      if (!hasBilling) {
        if (!cancelled) setLocked(false);
        return;
      }

      // map various possible server shapes into our UI rows
      const mappedRows: BillingRow[] = [];
      if (Array.isArray(entry.this_month_lines)) {
        entry.this_month_lines.forEach((r: any, idx: number) => {
          mappedRows.push({
            id: `${String(r.note_date ?? r.date ?? idx)}-${idx}`,
            noteDate: String(r.note_date ?? r.date ?? ""),
            schedDate: String(r.schedule_date ?? r.schedDate ?? r.schedule_date ?? ""),
          });
        });
      } else if (Array.isArray(entry.rows)) {
        entry.rows.forEach((r: any, idx: number) => {
          mappedRows.push({
            id: `${String(r.note_date ?? r.date ?? idx)}-${idx}`,
            noteDate: String(r.note_date ?? r.date ?? ""),
            schedDate: String(r.schedule_date ?? r.schedDate ?? ""),
          });
        });
      } else if (entry.this_month && Array.isArray(entry.this_month.lines)) {
        entry.this_month.lines.forEach((l: any, idx: number) => {
          mappedRows.push({
            id: `${String(l.note_date ?? l.noteDate ?? idx)}-${idx}`,
            noteDate: String(l.note_date ?? l.noteDate ?? ""),
            schedDate: String(l.schedule_date ?? l.scheduleDate ?? ""),
          });
        });
      }

      const mappedNext: NextBillingRow[] = [];
      if (Array.isArray(entry.next_month_lines)) {
        entry.next_month_lines.forEach((n: any, idx: number) => {
          mappedNext.push({
            id: `${String(n.schedule_date ?? idx)}-${idx}`,
            schedDate: String(n.schedule_date ?? n.schedDate ?? ""),
          });
        });
      } else if (Array.isArray(entry.next_rows)) {
        entry.next_rows.forEach((n: any, idx: number) => {
          mappedNext.push({
            id: `${String(n.schedule_date ?? idx)}-${idx}`,
            schedDate: String(n.schedule_date ?? n.schedDate ?? ""),
          });
        });
      } else if (entry.next_month && Array.isArray(entry.next_month.lines)) {
        entry.next_month.lines.forEach((n: any, idx: number) => {
          mappedNext.push({
            id: `${String(n.schedule_date ?? idx)}-${idx}`,
            schedDate: String(n.schedule_date ?? n.schedDate ?? ""),
          });
        });
      }

      if (!cancelled) {
        if (mappedRows.length > 0) setRows(mappedRows);
        if (mappedNext.length > 0) setNextRows(mappedNext);
        setLocked(Boolean(entry.locked));
      }
    } catch (err) {
      console.error("billing/check1 fetch error:", err);
      if (!cancelled) setLocked(false);
    } finally {
      if (!cancelled) setLoadingCheck(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [studentName, monthAnchor]);


  /* ---- Generate (fills both sections) ---- */
  const generateDraft = () => {
    if (locked) return; // disabled when read-only
    // This month (from class notes)
    const base: BillingRow[] = [];
    const seen = new Set<string>();

    const candidates = (quizletDates || [])
      .map((d) => toDateYMD(d))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b));

    for (const note of candidates) {
      if (seen.has(note)) continue;
      seen.add(note);

      const schedSame = scheduleSetThisMonth.has(note) ? note : "";
      base.push({
        id: `${note}-${Math.random().toString(36).slice(2, 8)}`,
        noteDate: note,
        schedDate: schedSame,
      });
    }
    setRows(base);

    // Next month (from schedules only)
    const uniqNext: string[] = [];
    const seenNext = new Set<string>();
    for (const d of nextMonthScheduleDates) {
      if (!seenNext.has(d)) {
        seenNext.add(d);
        uniqNext.push(d);
      }
    }
    setNextRows(
      uniqNext.map((d) => ({
        id: `${d}-${Math.random().toString(36).slice(2, 8)}`,
        schedDate: d,
      }))
    );
  };

  /* ---- Editing helpers ---- */
  const updateRow = (id: string, patch: Partial<BillingRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: `row-${Date.now().toString(36)}`, noteDate: ymdString(new Date()), schedDate: "" },
    ]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateNextRow = (id: string, schedDate: string) =>
    setNextRows((prev) => prev.map((r) => (r.id === id ? { ...r, schedDate } : r)));
  const removeNextRow = (id: string) =>
    setNextRows((prev) => prev.filter((r) => r.id !== id));

  // Create a schedule for noteDate (if missing) OR simply link the schedDate if it already exists
  const matchOrCreateRow = async (row: BillingRow) => {
    if (locked) return; // disabled in read-only mode
    const dt = toDateYMD(row.noteDate);
    if (!dt) return alert("Invalid date. Use YYYY. MM. DD.");

    const normalized = ymdString(dt); // with trailing dot

    // If a schedule for that day already exists, just fill it (UI hides Match in that case anyway)
    if (scheduleSetThisMonth.has(normalized)) {
      updateRow(row.id, { schedDate: normalized });
      return;
    }

    // Otherwise, optionally create a schedule on that day
    if (!autoCreateScheduleOnMatch) {
      updateRow(row.id, { schedDate: normalized });
      return;
    }

    try {
      const payload = {
        date: normalized,
        time: Number(defaultsForNewSchedule.time ?? 18),
        duration: Number(defaultsForNewSchedule.duration ?? 1),
        room_name: String(defaultsForNewSchedule.room_name ?? "HF1"),
        teacher_name: teacherName ?? "",
        student_name: studentName,
      };

      const res = await fetch(saveEndpointBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create schedule");

      updateRow(row.id, { schedDate: normalized });
      try { await onRefreshCalendar?.(); } catch {}
    } catch (e: any) {
      alert(e?.message || "Failed to create schedule");
    }
  };

  /* ---- Confirm/save (payload only; wire your API later) ---- */
  const handleConfirm = async () => {
    // if locked, allow confirm to simply re-send or no-op depending on backend rules
    const payload = {
      student_name: studentName,
      teacher_name: teacherName ?? "",
      month: { year: monthAnchor.getFullYear(), month: monthAnchor.getMonth() + 1 },

      // This-month lines (from UI)
      this_month_lines: rows.map((r) => ({ note_date: r.noteDate, schedule_date: r.schedDate })),

      // Next-month plan lines
      next_month_lines: nextRows.map((r) => ({ schedule_date: r.schedDate })),

      // client-side flag: whether this is a final save (you can use it server-side to lock the month)
      final_save: locked ? false : true,
    };

    try {
      const res = await fetch("/api/billing/check1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert("Save failed: " + text);
        return;
      }

      alert("Billing saved (server response OK).");
      // optionally lock UI if server indicates saved locking behaviour
      setLocked(true);
      try { await onRefreshCalendar?.(); } catch {}
    } catch (err) {
      console.error("handleConfirm error:", err);
      alert("Save failed (network).");
    }
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Billing</div>
          <div className="flex items-center gap-2">
            <button onClick={goPrevMonth} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">←</button>
            <div className="text-sm font-medium">{monthLabel}</div>
            <button onClick={goNextMonth} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">→</button>
            <button onClick={todayMonth} className="ml-1 px-2 py-1 border rounded-lg text-xs hover:bg-slate-50">This month</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-gray-600 mb-1">Student</div>
            <input
              className="w-full border rounded-lg px-2 py-1.5 bg-gray-50 text-black"
              value={studentName}
              readOnly
            />
          </label>

          <div className="flex items-end">
            <div className="w-full grid grid-cols-1 gap-2">
              <button
                onClick={generateDraft}
                className="w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700"
                title="Generate a billing draft from this month's class notes and next month's schedules"
                disabled={locked}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
        {loadingCheck && <div className="mt-2 text-xs text-gray-500">Checking saved billing for this month…</div>}
        {locked && !loadingCheck && <div className="mt-2 text-xs text-rose-600">선생님 확인 완료</div>}
      </div>

      {/* This month’s classes */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">This month’s classes</div>
          <div className="flex items-center gap-2">
            {studentMetaLoading && <span className="text-xs text-gray-500">Loading class details…</span>}
            <button
              onClick={addRow}
              className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
              disabled={locked}
            >
              Add row
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Class note date</th>
                <th className="px-3 py-2">Schedule date</th>
                <th className="px-3 py-2">Quizlet Date</th>
                <th className="px-3 py-2">Diary Date</th>
                <th className="px-3 py-2 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    No rows. Click <b>Generate</b> to pull this month’s class notes.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const normalizedNote = (() => {
                    const dt = toDateYMD(r.noteDate);
                    return dt ? ymdString(dt) : r.noteDate;
                  })();
                  const hasScheduleThatDay = scheduleSetThisMonth.has(normalizedNote);

                  const metaKey = (() => {
                    const dt = toDateYMD(r.schedDate || r.noteDate);
                    return dt ? ymdString(dt) : "";
                  })();
                  const meta = metaKey && studentMeta ? studentMeta[metaKey] : undefined;

                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>

                      <td className="px-3 py-2">
                        <input
                          className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                          value={r.noteDate}
                          onChange={(e) => updateRow(r.id, { noteDate: e.target.value })}
                          onBlur={(e) => {
                            if (locked) return;
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateRow(r.id, { noteDate: ymdString(dt) });
                          }}
                          placeholder="YYYY. MM. DD."
                          readOnly={locked}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          list={`sched-options-${i}`}
                          className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                          value={r.schedDate}
                          onChange={(e) => updateRow(r.id, { schedDate: e.target.value })}
                          onBlur={(e) => {
                            if (locked) return;
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateRow(r.id, { schedDate: ymdString(dt) });
                          }}
                          placeholder="YYYY. MM. DD."
                          readOnly={locked}
                        />
                        <datalist id={`sched-options-${i}`}>
                          {scheduleDatesThisMonth.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </td>

                      <td className="px-3 py-2">{meta?.quizlet_date ?? "—"}</td>
                      <td className="px-3 py-2">{meta?.diary_date ?? "—"}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {!hasScheduleThatDay && (
                            <button
                              onClick={() => matchOrCreateRow(r)}
                              className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                              title="Create a schedule on this day and link it"
                              disabled={locked}
                            >
                              Match
                            </button>
                          )}
                          <button
                            onClick={() => removeRow(r.id)}
                            className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                            title="Remove row"
                            disabled={locked}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Next month’s scheduled classes */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">
              Next month’s scheduled classes
              <span className="ml-2 text-xs text-gray-500">
                ({nextMonthAnchor.getFullYear()}. {String(nextMonthAnchor.getMonth() + 1).padStart(2, "0")})
              </span>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 w-10">#</th>
                  <th className="px-3 py-2">Schedule date</th>
                  <th className="px-3 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nextRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                      No rows. Click <b>Generate</b> above to populate next month’s schedules.
                    </td>
                  </tr>
                ) : (
                  nextRows.map((r, i) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          list="next-sched-options"
                          className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                          value={r.schedDate}
                          onChange={(e) => updateNextRow(r.id, e.target.value)}
                          onBlur={(e) => {
                            if (locked) return;
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateNextRow(r.id, ymdString(dt));
                          }}
                          placeholder="YYYY. MM. DD."
                          readOnly={locked}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeNextRow(r.id)}
                          className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                          disabled={locked}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Datalist to help pick from next month’s scheduled days */}
            <datalist id="next-sched-options">
              {nextMonthScheduleDates.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Confirm (save) */}
      <div className="p-3 border-t bg-white">
        <button
          onClick={handleConfirm}
          className="w-full rounded-lg bg-emerald-600 text-white py-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={locked ? "This month is locked — unable to save." : "Save billing info (hook API here later)"}
          disabled={loadingCheck || locked}
        >
          {locked ? "Teacher Confirmed" : "1차 Teacher Confirm (Can't Undo Save)"}
        </button>
      </div>
    </div>
  );
}
