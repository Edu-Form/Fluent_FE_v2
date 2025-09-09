"use client";

import React, { useMemo, useState } from "react";

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

  /* ---- Part 1: Header inputs (fee, credits, generate) ---- */
  const [fee, setFee] = useState<number>(50000);            // ₩/class
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [rows, setRows] = useState<BillingRow[]>([]);       // generated/edited lines

  // Schedule dates in the selected month, normalized to dotted format with trailing "."
  const scheduleDatesThisMonth = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt)) // ensure trailing dot
      .sort((a, b) => a.localeCompare(b));
  }, [scheduledRows, monthAnchor]);

  const scheduleSetThisMonth = useMemo(
    () => new Set(scheduleDatesThisMonth),
    [scheduleDatesThisMonth]
  );

  // Build rows from quizletDates (class notes) for the month
  const generateDraft = () => {
    const base: BillingRow[] = [];
    const seen = new Set<string>();

    const candidates = (quizletDates || [])
      .map((d) => toDateYMD(d))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt)) // ensure trailing dot
      .sort((a, b) => a.localeCompare(b));

    for (const note of candidates) {
      if (seen.has(note)) continue;
      seen.add(note);

      const schedSame = scheduleSetThisMonth.has(note) ? note : "";
      base.push({
        id: `${note}-${Math.random().toString(36).slice(2, 8)}`,
        noteDate: note,       // normalized with trailing "."
        schedDate: schedSame, // if exists, prefill; else empty
      });
    }

    setRows(base);
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

  // Create a schedule for noteDate (if missing) OR simply link the schedDate if it already exists
  const matchOrCreateRow = async (row: BillingRow) => {
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

  /* ---- Totals (simple): each row counts as a class for billing ---- */
  const totalClasses = rows.length;
  const creditApplied = Math.min(remainingCredits, totalClasses);
  const billableClasses = Math.max(0, totalClasses - creditApplied);
  const amountDue = billableClasses * (Number.isFinite(fee) ? fee : 0);

  /* ---- Confirm/save (payload only; wire your API later) ---- */
  const handleConfirm = async () => {
    const payload = {
      student_name: studentName,
      teacher_name: teacherName ?? "",
      month: { year: monthAnchor.getFullYear(), month: monthAnchor.getMonth() + 1 },
      fee,
      remaining_credits: remainingCredits,
      lines: rows.map((r) => ({ note_date: r.noteDate, schedule_date: r.schedDate })),
      summary: {
        total_classes: totalClasses,
        credit_applied: creditApplied,
        billable_classes: billableClasses,
        amount_due: amountDue,
      },
    };

    // TODO: Replace with your billing save endpoint when ready, e.g.:
    // await fetch("/api/billing/save", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });

    console.log("[BillingPanel] Prepared billing payload:", payload);
    alert("Billing payload prepared. (Open the console to inspect.)\nWire your billing API in handleConfirm().");
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* ── Part 1: Header (Student, Fee, Credits, Month, Generate) ───────── */}
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

          <label className="text-sm">
            <div className="text-gray-600 mb-1">Fee (₩ / class)</div>
            <input
              type="number"
              className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value || 0))}
              placeholder="50000"
            />
          </label>

          <label className="text-sm">
            <div className="text-gray-600 mb-1">Remaining credits</div>
            <input
              type="number"
              className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
              value={remainingCredits}
              onChange={(e) => setRemainingCredits(Number(e.target.value || 0))}
              placeholder="0"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={generateDraft}
              className="w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700"
              title="Generate a billing draft from this month's class notes"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* ── Part 2: Table (Note dates vs Schedule dates) ───────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">This month’s classes</div>
          <div className="flex items-center gap-2">
            <button onClick={addRow} className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50">
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
                <th className="px-3 py-2 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    No rows. Click <b>Generate</b> to pull this month’s class notes.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  // Normalize the note date to dotted form for the “Match” visibility check
                  const normalizedNote = (() => {
                    const dt = toDateYMD(r.noteDate);
                    return dt ? ymdString(dt) : r.noteDate;
                  })();
                  const hasScheduleThatDay = scheduleSetThisMonth.has(normalizedNote);

                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>

                      {/* Note date (always normalize to dotted on blur) */}
                      <td className="px-3 py-2">
                        <input
                          className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                          value={r.noteDate}
                          onChange={(e) => updateRow(r.id, { noteDate: e.target.value })}
                          onBlur={(e) => {
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateRow(r.id, { noteDate: ymdString(dt) });
                          }}
                          placeholder="YYYY. MM. DD."
                        />
                      </td>

                      {/* Schedule date with datalist suggestions from this month */}
                      <td className="px-3 py-2">
                        <input
                          list={`sched-options-${i}`}
                          className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                          value={r.schedDate}
                          onChange={(e) => updateRow(r.id, { schedDate: e.target.value })}
                          onBlur={(e) => {
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateRow(r.id, { schedDate: ymdString(dt) });
                          }}
                          placeholder="YYYY. MM. DD."
                        />
                        <datalist id={`sched-options-${i}`}>
                          {scheduleDatesThisMonth.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </td>

                      {/* Actions: show Match ONLY if no schedule exists for that note date */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {!hasScheduleThatDay && (
                            <button
                              onClick={() => matchOrCreateRow(r)}
                              className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                              title="Create a schedule on this day and link it"
                            >
                              Match
                            </button>
                          )}
                          <button
                            onClick={() => removeRow(r.id)}
                            className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                            title="Remove row"
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

        {/* Quick totals */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border p-3">
            <div className="text-xs text-gray-500">Total classes</div>
            <div className="text-lg font-semibold">{totalClasses}</div>
          </div>
          <div className="rounded-xl bg-slate-50 border p-3">
            <div className="text-xs text-gray-500">Credits applied</div>
            <div className="text-lg font-semibold">{creditApplied}</div>
          </div>
          <div className="rounded-xl bg-slate-50 border p-3">
            <div className="text-xs text-gray-500">Billable classes</div>
            <div className="text-lg font-semibold">{billableClasses}</div>
          </div>
          <div className="rounded-xl bg-slate-50 border p-3">
            <div className="text-xs text-gray-500">Amount due (₩)</div>
            <div className="text-lg font-semibold">{amountDue.toLocaleString("ko-KR")}</div>
          </div>
        </div>
      </div>

      {/* ── Part 3: Confirm (save) ──────────────────────────────────────────── */}
      <div className="p-3 border-t bg-white">
        <button
          onClick={handleConfirm}
          className="w-full rounded-lg bg-emerald-600 text-white py-2 hover:bg-emerald-700"
          title="Save billing info (hook API here later)"
        >
          Confirm & Save
        </button>
      </div>
    </div>
  );
}
