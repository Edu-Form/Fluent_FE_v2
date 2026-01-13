"use client";

import React, { useEffect, useMemo, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                                TYPE DEFINITIONS                            */
/* -------------------------------------------------------------------------- */

type ScheduledRow = {
  _id?: string;
  date: string; // "YYYY. MM. DD" or "YYYY. MM. DD."
  time?: string;
  room_name?: string;
  duration?: string;
  teacher_name?: string;
  student_name?: string;
};

type BillingRow = {
  id: string;
  noteDate: string; // class date (canonical)
  schedDate: string; // schedule date
};

type NextBillingRow = {
  id: string;
  schedDate: string;
};

/* -------------------------------------------------------------------------- */
/*                             DATE PARSING HELPERS                           */
/* -------------------------------------------------------------------------- */

function toDateYMD(str?: string | null): Date | null {
  if (!str) return null;
  const s = String(str).trim();

  const m =
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/) || // 2025. 09. 09.
    s.match(/^(\d{4})[-\/]\s*(\d{1,2})[-\/]\s*(\d{1,2})$/) || // 2025-09-09
    s.match(/^(\d{4})(\d{2})(\d{2})$/); // 20250909

  if (!m) return null;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function ymdString(d: Date): string {
  // Always return with a TRAILING DOT
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
    d.getDate()
  ).padStart(2, "0")}.`;
}

function sameYearMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* -------------------------------------------------------------------------- */
/*                                BILLING PANEL                               */
/* -------------------------------------------------------------------------- */

export default function BillingPanel({
  studentName,
  teacherName,
  scheduledRows,
  onRefreshCalendar,
  saveEndpointBase = "/api/schedules",
  autoCreateScheduleOnMatch = true,
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
  /* ------------------------------------------------------------------------ */
  /*                         MONTH CONTROL (HEADER)                           */
  /* ------------------------------------------------------------------------ */

  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthLabel = `${monthAnchor.getFullYear()}. ${String(
    monthAnchor.getMonth() + 1
  ).padStart(2, "0")}`;

  const goPrevMonth = () =>
    setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () =>
    setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const todayMonth = () => {
    const now = new Date();
    setMonthAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  /* ------------------------------------------------------------------------ */
  /*                             CORE BILLING STATE                           */
  /* ------------------------------------------------------------------------ */

  const [rows, setRows] = useState<BillingRow[]>([]);
  const [nextRows, setNextRows] = useState<NextBillingRow[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);

  /* ------------------------------------------------------------------------ */
  /*              FETCH TRUE QUIZLET / DIARY DATES (VIA CORRECT APIs)        */
  /* ------------------------------------------------------------------------ */

  const [quizletDatesAll, setQuizletDatesAll] = useState<string[]>([]);
  const [diaryDatesAll, setDiaryDatesAll] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);

  // Fetch quizlets from correct API
  useEffect(() => {
    if (!studentName) {
      setQuizletDatesAll([]);
      return;
    }

    let cancelled = false;

    const loadQuizlets = async () => {
      setLoadingMeta(true);
      try {
        const res = await fetch(
          `/api/quizlet/student/${encodeURIComponent(studentName)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setQuizletDatesAll([]);
          return;
        }
        const data = await res.json();
        const list: string[] = [];

        for (const q of Array.isArray(data) ? data : []) {
          const d = q?.class_date ?? q?.date;
          const dt = toDateYMD(d);
          if (dt) list.push(ymdString(dt));
        }

        if (!cancelled) {
          const uniqSorted = Array.from(new Set(list)).sort((a, b) =>
            a.localeCompare(b)
          );
          setQuizletDatesAll(uniqSorted);
        }
      } catch {
        if (!cancelled) setQuizletDatesAll([]);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };

    loadQuizlets();
    return () => {
      cancelled = true;
    };
  }, [studentName]);

  // Fetch diaries from correct API
  useEffect(() => {
    if (!studentName) {
      setDiaryDatesAll([]);
      return;
    }

    let cancelled = false;

    const loadDiaries = async () => {
      setLoadingMeta(true);
      try {
        const res = await fetch(
          `/api/diary/student/${encodeURIComponent(studentName)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setDiaryDatesAll([]);
          return;
        }
        const data = await res.json();
        const list: string[] = [];

        for (const dval of Array.isArray(data) ? data : []) {
          const d = dval?.class_date ?? dval?.date;
          const dt = toDateYMD(d);
          if (dt) list.push(ymdString(dt));
        }

        if (!cancelled) {
          const uniqSorted = Array.from(new Set(list)).sort((a, b) =>
            a.localeCompare(b)
          );
          setDiaryDatesAll(uniqSorted);
        }
      } catch {
        if (!cancelled) setDiaryDatesAll([]);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };

    loadDiaries();
    return () => {
      cancelled = true;
    };
  }, [studentName]);

  /* ------------------------------------------------------------------------ */
  /*          PER-MONTH QUIZLET / SCHEDULE DATES (ANCHOR FOR DIARIES)        */
  /* ------------------------------------------------------------------------ */

  const quizletDatesThisMonth = useMemo(() => {
    return quizletDatesAll
      .map((s) => toDateYMD(s))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b)); // old -> new
  }, [quizletDatesAll, monthAnchor]);

  const quizletSetThisMonth = useMemo(
    () => new Set(quizletDatesThisMonth),
    [quizletDatesThisMonth]
  );

  const scheduleDatesThisMonth = useMemo(() => {
    return (scheduledRows || [])
      .map((r) => toDateYMD(r?.date))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .map((dt) => ymdString(dt))
      .sort((a, b) => a.localeCompare(b)); // old -> new
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
      .sort((a, b) => a.localeCompare(b)); // old -> new
  }, [scheduledRows, nextMonthAnchor]);

  /* ------------------------------------------------------------------------ */
  /*     DIARY MAPPING: ASSIGN EACH DIARY DATE TO THE "NEXT" CLASS DATE      */
  /* ------------------------------------------------------------------------ */

  // Anchor class dates for diary mapping: union of quizlet & schedule dates in this month
  const anchorClassDatesForDiary = useMemo(() => {
    const set = new Set<string>();
    for (const d of quizletDatesThisMonth) set.add(d);
    for (const d of scheduleDatesThisMonth) set.add(d);
    return Array.from(set).sort((a, b) => a.localeCompare(b)); // old -> new
  }, [quizletDatesThisMonth, scheduleDatesThisMonth]);

  const diaryAssignmentMap = useMemo(() => {
    const result: Record<string, string> = {};
    if (anchorClassDatesForDiary.length === 0) return result;

    const classDtList: Date[] = anchorClassDatesForDiary
      .map((d) => toDateYMD(d))
      .filter((dt): dt is Date => !!dt);

    if (classDtList.length === 0) return result;

    const diariesThisMonth = diaryDatesAll
      .map((s) => toDateYMD(s))
      .filter((dt): dt is Date => !!dt && sameYearMonth(dt, monthAnchor))
      .sort((a, b) => a.getTime() - b.getTime()); // old -> new

    for (const diaryDt of diariesThisMonth) {
      let assignedIdx = -1;
      for (let i = 0; i < classDtList.length; i++) {
        if (classDtList[i].getTime() >= diaryDt.getTime()) {
          assignedIdx = i;
          break;
        }
      }

      if (assignedIdx === -1) {
        assignedIdx = classDtList.length - 1;
      }

      const classKey = ymdString(classDtList[assignedIdx]);
      const diaryKey = ymdString(diaryDt);

      if (!result[classKey]) {
        result[classKey] = diaryKey;
      }
    }

    return result;
  }, [anchorClassDatesForDiary, diaryDatesAll, monthAnchor]);

  /* ------------------------------------------------------------------------ */
  /*                 LOAD EXISTING BILLING DATA (billing/check1)              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!studentName) return;

    const y = monthAnchor.getFullYear();
    const m = String(monthAnchor.getMonth() + 1).padStart(2, "0");
    const yyyymm = `${y}${m}`;

    let cancelled = false;
    setLoadingCheck(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/billing/check1/${encodeURIComponent(studentName)}/${yyyymm}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          if (!cancelled) {
            setLocked(false);
            setRows([]);
            setNextRows([]);
          }
          return;
        }

        const json = await res.json().catch(() => null);
        if (!json) {
          if (!cancelled) {
            setLocked(false);
            setRows([]);
            setNextRows([]);
          }
          return;
        }

        const entry = (json && (json.data ?? json)) as any;

        const hasBilling =
          Boolean(entry?.locked) ||
          (Array.isArray(entry?.this_month_lines) &&
            entry.this_month_lines.length > 0) ||
          (Array.isArray(entry?.rows) && entry.rows.length > 0);

        if (!hasBilling) {
          if (!cancelled) {
            setLocked(false);
            setRows([]);
            setNextRows([]);
          }
          return;
        }

        const mappedRows: BillingRow[] = [];
        if (Array.isArray(entry.this_month_lines)) {
          entry.this_month_lines.forEach((r: any, idx: number) => {
            mappedRows.push({
              id: `${String(r.note_date ?? r.date ?? idx)}-${idx}`,
              noteDate: String(r.note_date ?? r.date ?? ""),
              schedDate: String(r.schedule_date ?? r.schedDate ?? ""),
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
        }

        const mappedNext: NextBillingRow[] = [];
        if (Array.isArray(entry.next_month_lines)) {
          entry.next_month_lines.forEach((n: any, idx: number) => {
            mappedNext.push({
              id: `${String(n.schedule_date ?? n.schedDate ?? idx)}-${idx}`,
              schedDate: String(n.schedule_date ?? n.schedDate ?? ""),
            });
          });
        } else if (Array.isArray(entry.next_rows)) {
          entry.next_rows.forEach((n: any, idx: number) => {
            mappedNext.push({
              id: `${String(n.schedule_date ?? n.schedDate ?? idx)}-${idx}`,
              schedDate: String(n.schedule_date ?? n.schedDate ?? ""),
            });
          });
        }

        if (!cancelled) {
          setRows(mappedRows);
          setNextRows(mappedNext);
          setLocked(Boolean(entry.locked));
        }
      } catch {
        if (!cancelled) {
          setLocked(false);
          setRows([]);
          setNextRows([]);
        }
      } finally {
        if (!cancelled) setLoadingCheck(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentName, monthAnchor]);

  /* ------------------------------------------------------------------------ */
  /*                           GENERATE DRAFT BILLING                         */
  /* ------------------------------------------------------------------------ */

  const generateDraft = () => {
    if (locked) return;

    // This month rows: from quizlet (class actually happened)
    const candidates = quizletDatesThisMonth; // already sorted old -> new

    const uniqNotes: string[] = [];
    const seen = new Set<string>();
    for (const d of candidates) {
      if (!seen.has(d)) {
        seen.add(d);
        uniqNotes.push(d);
      }
    }

    const base: BillingRow[] = uniqNotes.map((note) => ({
      id: `${note}-${Math.random().toString(36).slice(2, 8)}`,
      noteDate: note,
      schedDate: scheduleSetThisMonth.has(note) ? note : "",
    }));

    setRows(base);

    // Next month rows: from schedules
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

  // Auto-generate on load once data is ready and no existing billing is saved
  useEffect(() => {
    const metaReady = !loadingMeta;
    const scheduleReady = scheduledRows.length >= 0;

    if (
      metaReady &&
      scheduleReady &&
      !loadingCheck &&
      !locked &&
      rows.length === 0
    ) {
      generateDraft();
    }
  }, [
    loadingMeta,
    loadingCheck,
    locked,
    rows.length,
    quizletDatesAll,
    diaryDatesAll,
    scheduledRows,
    monthAnchor,
    generateDraft
  ]);

  /* ------------------------------------------------------------------------ */
  /*                             EDITING HELPERS                              */
  /* ------------------------------------------------------------------------ */

  const updateRow = (id: string, patch: Partial<BillingRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now().toString(36)}`,
        noteDate: ymdString(new Date()),
        schedDate: "",
      },
    ]);

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const updateNextRow = (id: string, schedDate: string) =>
    setNextRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, schedDate } : r))
    );

  const removeNextRow = (id: string) =>
    setNextRows((prev) => prev.filter((r) => r.id !== id));

  const matchOrCreateRow = async (row: BillingRow) => {
    if (locked) return;

    const dt = toDateYMD(row.noteDate);
    if (!dt) {
      alert("Invalid date. Use YYYY. MM. DD.");
      return;
    }

    const normalized = ymdString(dt);

    // If schedule already exists that day, just fill
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
      try {
        await onRefreshCalendar?.();
      } catch {
        // ignore
      }
    } catch (e: any) {
      alert(e?.message || "Failed to create schedule");
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                           FINAL CONFIRM SAVE                             */
  /* ------------------------------------------------------------------------ */

  const handleConfirm = async () => {
    const payload = {
      student_name: studentName,
      teacher_name: teacherName ?? "",
      month: {
        year: monthAnchor.getFullYear(),
        month: monthAnchor.getMonth() + 1,
      },
      this_month_lines: rows.map((r) => ({
        note_date: r.noteDate,
        schedule_date: r.schedDate,
      })),
      next_month_lines: nextRows.map((r) => ({
        schedule_date: r.schedDate,
      })),
      final_save: !locked, // same line, but meaning changes
    };

    try {
      const res = await fetch("/api/billing/check1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert("Save failed: " + txt);
        return;
      }

      alert(locked ? "Teacher confirmation undone." : "Teacher confirmed.");
      setLocked((prev) => !prev);
      try {
        await onRefreshCalendar?.();
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("handleConfirm error:", err);
      alert("Save failed (network).");
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Teacher Billing
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {monthLabel} – {studentName || "학생"}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrevMonth}
                className="px-2 py-1 border rounded-lg text-xs text-slate-700 hover:bg-slate-50"
              >
                ←
              </button>
              <div className="text-xs font-medium text-slate-800">{monthLabel}</div>
              <button
                onClick={goNextMonth}
                className="px-2 py-1 border rounded-lg text-xs text-slate-700 hover:bg-slate-50"
              >
                →
              </button>
            </div>
            <button
              onClick={todayMonth}
              className="px-2 py-1 border rounded-lg text-[11px] text-slate-600 hover:bg-slate-50"
            >
              This month
            </button>
          </div>
        </div>

        {/* 3-step wizard indicator */}
        <div className="mt-4 flex items-center gap-3 text-xs">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-semibold">
                1
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  이번 달 수업 확인
                </div>
              </div>
            </div>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div className="flex-1 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                2
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  다음 달 스케줄 확인
                </div>
              </div>
            </div>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div className="flex-1 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                3
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  최종 확인 & 저장
                </div>
              </div>
            </div>
          </div>
        </div>

        {loadingCheck && (
          <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border border-slate-200">
            이번 달 저장된 정산 정보를 확인하는 중입니다…
          </div>
        )}
        {locked && !loadingCheck && (
          <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 border border-emerald-200">
            🔒 이 달은 이미 <span className="font-semibold">선생님 확인 완료</span> 상태입니다.
            수정이 필요하면 관리자에게 문의해주세요.
          </div>
        )}
        {loadingMeta && (
          <div className="mt-1 text-[11px] text-slate-500">
            Quizlet / Diary 정보를 불러오는 중입니다…
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">

        {/* Step 1: This month */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                STEP 1
              </div>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">
                이번 달 수업(클래스 노트) 날짜 확인
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                아래 표에서 <span className="font-medium">클래스 노트 날짜</span>와{" "}
                <span className="font-medium">스케줄 날짜</span>가 맞는지만 확인해 주세요.
                <br />
                Quizlet / Diary 날짜는 자동으로 연결되며, 선생님이 직접 수정할 필요는 없습니다.
              </p>
            </div>
            <button
              onClick={addRow}
              className="text-[11px] px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              disabled={locked}
            >
              행 추가
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 w-10 text-xs">#</th>
                  <th className="px-3 py-2 text-xs">Class note date</th>
                  <th className="px-3 py-2 text-xs">Schedule date</th>
                  <th className="px-3 py-2 text-xs">Quizlet Date</th>
                  <th className="px-3 py-2 text-xs">Diary Date</th>
                  <th className="px-3 py-2 w-28 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-gray-500 text-xs"
                    >
                      이번 달에 작성된 Quizlet / 클래스 노트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const dt = toDateYMD(r.noteDate);
                    const normalizedNote = dt ? ymdString(dt) : r.noteDate;

                    const quizletForClass = quizletSetThisMonth.has(
                      normalizedNote
                    )
                      ? normalizedNote
                      : "—";
                    const diaryForClass =
                      diaryAssignmentMap[normalizedNote] ?? "—";

                    const hasScheduleThatDay =
                      scheduleSetThisMonth.has(normalizedNote);

                    const isNoteValid = !!toDateYMD(r.noteDate);
                    const isScheduleValid = !!r.schedDate
                      ? !!toDateYMD(r.schedDate)
                      : false;
                    const hasQuizlet = quizletForClass !== "—";
                    const hasDiary = diaryForClass !== "—";

                    const rowNeedsAttention =
                      !isNoteValid || !isScheduleValid || !hasQuizlet;

                    return (
                      <tr
                        key={r.id}
                        className="border-b last:border-b-0 align-middle"
                      >
                        <td className="px-3 py-2 text-gray-500 align-top">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{i + 1}</span>
                            {rowNeedsAttention ? (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                                확인 필요
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                                OK
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2 align-top">
                          <input
                            className="w-full border rounded-lg px-2 py-1.5 bg-white text-xs text-black placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-400"
                            value={r.noteDate}
                            onChange={(e) =>
                              updateRow(r.id, { noteDate: e.target.value })
                            }
                            onBlur={(e) => {
                              if (locked) return;
                              const dt2 = toDateYMD(e.target.value);
                              if (dt2)
                                updateRow(r.id, { noteDate: ymdString(dt2) });
                            }}
                            placeholder="YYYY. MM. DD."
                            readOnly={locked}
                          />
                        </td>

                        <td className="px-3 py-2 align-top">
                          <input
                            list={`sched-options-${i}`}
                            className="w-full border rounded-lg px-2 py-1.5 bg-white text-xs text-black placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-400"
                            value={r.schedDate}
                            onChange={(e) =>
                              updateRow(r.id, { schedDate: e.target.value })
                            }
                            onBlur={(e) => {
                              if (locked) return;
                              const dt2 = toDateYMD(e.target.value);
                              if (dt2)
                                updateRow(r.id, { schedDate: ymdString(dt2) });
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

                        <td className="px-3 py-2 text-xs text-slate-800 align-top">
                          {hasQuizlet ? (
                            quizletForClass
                          ) : (
                            <span className="text-amber-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-800 align-top">
                          {hasDiary ? (
                            diaryForClass
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            {!hasScheduleThatDay && (
                              <button
                                onClick={() => matchOrCreateRow(r)}
                                className="text-[10px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                title="이 날에 스케줄을 자동 생성하고 연결합니다"
                                disabled={locked}
                              >
                                Match
                              </button>
                            )}
                            <button
                              onClick={() => removeRow(r.id)}
                              className="text-[10px] px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              title="행 삭제"
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
        </section>

        {/* Step 2: Next month */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                STEP 2
              </div>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">
                다음 달 예정 스케줄 확인
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                아래 표는 <span className="font-medium">캘린더에 등록된 다음 달 스케줄</span>입니다.
                날짜만 맞는지 확인해 주세요. 수정이 필요하면 날짜를 직접 변경하셔도 됩니다.
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 w-10 text-xs">#</th>
                  <th className="px-3 py-2 text-xs">
                    Schedule date{" "}
                    <span className="text-[10px] text-slate-400">
                      ({nextMonthAnchor.getFullYear()}.{" "}
                      {String(nextMonthAnchor.getMonth() + 1).padStart(2, "0")})
                    </span>
                  </th>
                  <th className="px-3 py-2 w-28 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nextRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-gray-500 text-xs"
                    >
                      다음 달에 등록된 스케줄이 없습니다. 캘린더에서 먼저 수업을
                      등록해 주세요.
                    </td>
                  </tr>
                ) : (
                  nextRows.map((r, i) => {
                    const isValid = !!toDateYMD(r.schedDate);

                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2 text-gray-500 text-xs">
                          <div className="flex items-center gap-1">
                            <span>{i + 1}</span>
                            {isValid ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                                OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                                확인 필요
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <input
                            list="next-sched-options"
                            className="w-full border rounded-lg px-2 py-1.5 bg-white text-xs text-black placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-400"
                            value={r.schedDate}
                            onChange={(e) =>
                              updateNextRow(r.id, e.target.value)
                            }
                            onBlur={(e) => {
                              if (locked) return;
                              const dt = toDateYMD(e.target.value);
                              if (dt) updateNextRow(r.id, ymdString(dt));
                            }}
                            placeholder="YYYY. MM. DD."
                            readOnly={locked}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <button
                            onClick={() => removeNextRow(r.id)}
                            className="text-[10px] px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            disabled={locked}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <datalist id="next-sched-options">
              {nextMonthScheduleDates.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </section>
      </div>

      {/* Step 3: Footer Confirm */}
      <div className="p-3 border-t bg-white">
        {!locked && (
          <div className="mb-2 text-[11px] text-slate-600 leading-relaxed">
            <div className="font-semibold text-slate-900 mb-1">STEP 3. 최종 확인</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>위 표에서 이번 달 수업 날짜가 맞는지 확인하셨나요?</li>
              <li>다음 달 스케줄 날짜도 모두 확인하셨나요?</li>
              <li>모두 맞다면 아래 버튼을 눌러 정산을 확정해 주세요.</li>
            </ul>
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={loadingCheck}
          className={`group w-full rounded-lg py-2 text-sm font-semibold transition-colors
            ${locked
              ? "bg-emerald-600 text-white hover:bg-rose-600"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={
            locked
              ? "Click to cancel teacher confirmation"
              : "모든 내용을 확인 후 정산 정보를 저장합니다."
          }
        >
          {locked ? (
            <>
              <span className="block group-hover:hidden">
                Teacher Confirmed
              </span>
              <span className="hidden group-hover:block">
                Cancel Teacher Confirmation
              </span>
            </>
          ) : (
            "Teacher Confirm (저장 후 되돌릴 수 없습니다)"
          )}
        </button>
      </div>
    </div>
  );
}
