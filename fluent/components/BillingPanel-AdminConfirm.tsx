"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------ Types ------------------------------ */
type ScheduledRow = {
  _id?: string;
  date: string;
  time?: string;
  room_name?: string;
  duration?: string;
  teacher_name?: string;
  student_name?: string;
};

type BillingRow = {
  id: string;
  noteDate: string;
  schedDate: string;
};

type NextBillingRow = { id: string; schedDate: string };

/* --------------------------- Date helpers -------------------------- */
function toDateYMD(str?: string | null) {
  if (!str) return null;
  const s = String(str).trim();
  const m =
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/) ||
    s.match(/^(\d{4})[-\/]\s*(\d{1,2})[-\/]\s*(\d{1,2})\.?$/) ||
    s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
function ymdString(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}
function sameYearMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function monthKo(d: Date) {
  return `${d.getMonth() + 1}월`;
}
function prevMonthAnchorOf(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

/* ------------------------------ Component ------------------------------ */
/**
 * NOTE: Added optional prop `studentId` so we can build the admin-confirm link with an `id=...` query param.
 */
export default function BillingPanel({
  studentName,
  teacherName,
  quizletDates,
  scheduledRows,
  onRefreshCalendar,
  saveEndpointBase = "/api/schedules",
  autoCreateScheduleOnMatch = true,
  defaultsForNewSchedule = { room_name: "HF1", time: 18, duration: 1 },
}: {
  studentName: string;
  studentId?: string;
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

  /* ---- Part 1: Header inputs (fee, carry-in credit, generate) ---- */
  const [fee, setFee] = useState<number>(50000);
  const [carryInCredit, setCarryInCredit] = useState<number>(0);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [nextRows, setNextRows] = useState<NextBillingRow[]>([]);
  const [, setPaymentLink] = useState("");

  const studentCacheRef = useRef<Map<string, any>>(new Map());
  const [studentMeta, setStudentMeta] = useState<Record<string, { quizlet_date?: string; diary_date?: string }> | null>(null);
  const [studentMetaLoading, setStudentMetaLoading] = useState(false);

  function buildClassHistoryMap(class_history: any[]): Record<string, { quizlet_date?: string; diary_date?: string }> {
    const map: Record<string, { quizlet_date?: string; diary_date?: string }> = {};
    (class_history || []).forEach((entry: any) => {
      const [k, v] = Object.entries(entry || {})[0] || [];
      if (k && v && typeof v === "object") map[String(k)] = v as any;
    });
    return map;
  }

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

  /* ---- Month data (this + next) ---- */
  const scheduleDatesThisMonth = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b));
  }, [scheduledRows, monthAnchor]);

  const scheduleSetThisMonth = useMemo(() => new Set(scheduleDatesThisMonth), [scheduleDatesThisMonth]);

  const nextMonthAnchor = useMemo(() => new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1), [monthAnchor]);

  const nextMonthScheduleDates = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, nextMonthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b));
  }, [scheduledRows, nextMonthAnchor]);

  /* ---- Generate (fills both sections) ---- */
  const generateDraft = () => {
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

    const uniqNext: string[] = [];
    const seenNext = new Set<string>();
    for (const d of nextMonthScheduleDates) {
      if (!seenNext.has(d)) {
        seenNext.add(d);
        uniqNext.push(d);
      }
    }
    setNextRows(uniqNext.map((d) => ({ id: `${d}-${Math.random().toString(36).slice(2, 8)}`, schedDate: d })));
  };

  /* ---- Editing helpers ---- */
  const updateRow = (id: string, patch: Partial<BillingRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { id: `row-${Date.now().toString(36)}`, noteDate: ymdString(new Date()), schedDate: "" }]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateNextRow = (id: string, schedDate: string) => setNextRows((prev) => prev.map((r) => (r.id === id ? { ...r, schedDate } : r)));
  const removeNextRow = (id: string) => setNextRows((prev) => prev.filter((r) => r.id !== id));

  const matchOrCreateRow = async (row: BillingRow) => {
    const dt = toDateYMD(row.noteDate);
    if (!dt) return alert("Invalid date. Use YYYY. MM. DD.");
    const normalized = ymdString(dt);

    if (scheduleSetThisMonth.has(normalized)) {
      updateRow(row.id, { schedDate: normalized });
      return;
    }

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

  /* ---- Settlement math (final per your rules) ---- */
  const thisMonthActual = rows.length;
  const carryAfterSettlement = carryInCredit - thisMonthActual;
  const nextMonthPlanned = nextMonthScheduleDates.length;
  const totalCreditsAvailable = Math.max(0, carryAfterSettlement);
  const nextToPayClasses = nextMonthPlanned - carryAfterSettlement;
  const amountDueNext = nextToPayClasses * (Number.isFinite(fee) ? fee : 0);

  /* ---- Payment link for NEXT month amount ---- */
  useEffect(() => {
    if (!studentName || amountDueNext <= 0) {
      setPaymentLink("");
      return;
    }

    // const generateLink = async () => {
    //   setPaymentLinkLoading(true);
    //   setPaymentLink("");
    //   try {
    //     const response = await fetch("/api/payment/link", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ studentName, amount: amountDueNext }),
    //     });

    //     if (!response.ok) {
    //       console.error("Failed to generate payment link.", await response.text());
    //       return;
    //     }

    //     const data = await response.json();
    //     if (data.paymentLink) {
    //       setPaymentLink(data.paymentLink);
    //     }
    //   } catch (error: any) {
    //     console.error("Error generating payment link:", error);
    //   } finally {
    //     setPaymentLinkLoading(false);
    //   }
    // };

    // generateLink();
  }, [amountDueNext, studentName]);

  const {} = useMemo(() => {
    const pa = prevMonthAnchorOf(monthAnchor);
    const uniqDays = new Set<number>();

    (quizletDates || []).forEach((d) => {
      const dt = toDateYMD(d);
      if (dt && sameYearMonth(dt, pa)) {
        uniqDays.add(dt.getDate());
      }
    });

    const daysArr = Array.from(uniqDays).sort((a, b) => a - b);
    return {
      prevMonthKo: monthKo(pa),
      prevMonthDaysStr: daysArr.length ? " " + daysArr.map((n) => `(${n})`).join("") : "",
      prevMonthCount: daysArr.length,
    };
  }, [quizletDates, monthAnchor]);

  /* ---- New: POST to /api/billing/check2 (admin confirm) ---- */
  const [saving, setSaving] = useState(false);
  const handleConfirm = async () => {
    if (saving) return;
    const payload = {
      student_name: studentName,
      teacher_name: teacherName ?? "",
      month: { year: monthAnchor.getFullYear(), month: monthAnchor.getMonth() + 1 },

      // Lines
      this_month_lines: rows.map((r) => ({ note_date: r.noteDate, schedule_date: r.schedDate })),
      next_month_lines: nextRows.map((r) => ({ schedule_date: r.schedDate })),

      // Summary fields (정산 요약)
      carry_in_credit: carryInCredit,          // 이번달 선결제(예정/스케줄)
      this_month_actual: thisMonthActual,      // 이번달 실제 수업 (노트 기준)
      next_month_planned: nextMonthPlanned,    // 다음달 예정 수업 (스케줄)
      total_credits_available: totalCreditsAvailable,  // 다음달 차감 가능 수업
      next_to_pay_classes: nextToPayClasses,   // 결제 대상 수업
      fee_per_class: fee,                      // 회당 금액
      amount_due_next: amountDueNext,          // 결제 금액 (₩)

      final_save: true,
      meta: { via: "admin-check2-ui" },
      savedBy: "admin-ui",
    };


    try {
      setSaving(true);
      const res = await fetch("/api/billing/check2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert("Save failed: " + text);
        return;
      }

      const json = await res.json().catch(() => null);
      console.log("check2 response:", json);
      alert("2차 관리자 확인 저장 완료.");
      try { await onRefreshCalendar?.(); } catch {}
    } catch (err) {
      console.error("handleConfirm(check2) error:", err);
      alert("Save failed (network).");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* ── Part 1: Header (Student, Generate) ───────── */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">관리자 2차 확인</div>
          <div className="flex items-center gap-2">
            <button onClick={goPrevMonth} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">←</button>
            <div className="text-sm font-medium">{monthLabel}</div>
            <button onClick={goNextMonth} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">→</button>
            <button onClick={todayMonth} className="ml-1 px-2 py-1 border rounded-lg text-xs hover:bg-slate-50">This month</button>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {/* Student field (full width) */}
          <label className="text-sm block">
            <div className="text-gray-600 mb-1">Student</div>
            <input
              className="w-full border rounded-lg px-2 py-1.5 bg-gray-50 text-black"
              value={studentName}
              readOnly
            />
          </label>

          {/* Row: Credits + Fee + Generate */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-3">
            {/* Credits */}
            <div className="flex-1">
              <label className="text-sm block">
                <div className="text-gray-600 mb-1">선결제 Credit</div>
                <input
                  type="number"
                  className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                  value={carryInCredit}
                  onChange={(e) => setCarryInCredit(Number(e.target.value || 0))}
                  placeholder="e.g. 6"
                />
              </label>
            </div>

            {/* Fee */}
            <div className="flex-1">
              <label className="text-sm block">
                <div className="text-gray-600 mb-1">Fee (₩ / class)</div>
                <input
                  type="number"
                  className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value || 0))}
                  placeholder="50000"
                />
              </label>
            </div>

            {/* Generate button */}
            <div className="mt-3 sm:mt-0 sm:w-auto">
              <button
                onClick={generateDraft}
                className="w-full sm:w-32 rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700"
                title="Generate a billing draft from this month's class notes and next month's schedules"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── SCROLL AREA: Settlement Summary first, then This month's classes, then Next month's scheduled classes ── */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* ── Settlement Summary (Korean labels) ───────────────────────────────────── */}
        <div className="mb-6">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-gray-800">
              정산 요약
            </div>
            <table className="w-full text-sm">
              <tbody className="[&>tr>*]:px-4 [&>tr>*]:py-2">
                <tr className="border-b">
                  <td className="text-gray-500 w-1/2">이번달 선결제(예정/스케줄)</td>
                  <td className="font-semibold text-right">{carryInCredit}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">이번달 실제 수업 (노트 기준)</td>
                  <td className="font-semibold text-right">{thisMonthActual}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">다음달 예정 수업 (스케줄)</td>
                  <td className="font-semibold text-right">{nextMonthPlanned}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">다음달 차감 가능 수업</td>
                  <td className="font-semibold text-right">{totalCreditsAvailable}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">결제 대상 수업</td>
                  <td className="font-semibold text-right">{nextToPayClasses}</td>
                </tr>
                <tr>
                  <td className="text-gray-500">결제 금액 (₩)</td>
                  <td className="font-semibold text-right">{amountDueNext.toLocaleString("ko-KR")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Part 2: This month’s classes (Actuals) ─────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">This month’s classes</div>
            <div className="flex items-center gap-2">
              {studentMetaLoading && <span className="text-xs text-gray-500">Loading class details…</span>}
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
                              const dt = toDateYMD(e.target.value);
                              if (dt) updateRow(r.id, { noteDate: ymdString(dt) });
                            }}
                            placeholder="YYYY. MM. DD."
                          />
                        </td>

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

                        <td className="px-3 py-2">{meta?.quizlet_date ?? "—"}</td>
                        <td className="px-3 py-2">{meta?.diary_date ?? "—"}</td>

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
        </div>

        {/* ── Part 2b: Next month’s scheduled classes (schedule date only) ───────── */}
        <div>
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
                            const dt = toDateYMD(e.target.value);
                            if (dt) updateNextRow(r.id, ymdString(dt));
                          }}
                          placeholder="YYYY. MM. DD."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeNextRow(r.id)}
                          className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <datalist id="next-sched-options">
              {nextMonthScheduleDates.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* ── Part 3: Confirm (save) ──────────────────────────────────────────── */}
      <div className="p-3 border-t bg-white">
        <button
          onClick={handleConfirm}
          className="w-full rounded-lg bg-emerald-600 text-white py-2 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          title="2차 관리자 확인 및 저장"
          disabled={saving}
        >
          {saving ? "저장 중…" : "2차 관리자 확인 & Save"}
        </button>
      </div>
    </div>
  );
}
