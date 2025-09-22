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
function monthKo(d: Date) {
  return `${d.getMonth() + 1}월`;
}
function prevMonthAnchorOf(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
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

  /* ---- Part 1: Header inputs (fee, carry-in credit, generate) ---- */
  const [fee, setFee] = useState<number>(50000);            // ₩/class
  const [carryInCredit, setCarryInCredit] = useState<number>(0); // prepaid classes for THIS month (input)
  const [rows, setRows] = useState<BillingRow[]>([]);       // this month's actual classes (from notes)
  const [nextRows, setNextRows] = useState<NextBillingRow[]>([]); // next month's planned schedules
  const [paymentLink, setPaymentLink] = useState("");
  const [, setPaymentLinkLoading] = useState(false);

  // --- Student meta (quizlet_date, diary_date) via /api/student/:name ---
  const studentCacheRef = useRef<Map<string, any>>(new Map());
  const [studentMeta, setStudentMeta] = useState<Record<string, { quizlet_date?: string; diary_date?: string }> | null>(null);
  const [studentMetaLoading, setStudentMetaLoading] = useState(false);

  // turn [{ "2025. 09. 15.": {quizlet_date, diary_date}}, ...] into a map
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

  /* ---- Generate (fills both sections) ---- */
  const generateDraft = () => {
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

  /* ---- Settlement math (final per your rules) ---- */
  // INPUT: carryInCredit (prepaid for THIS month)
  const thisMonthActual = rows.length;                 // actual (class notes)
  const carryAfterSettlement = carryInCredit - thisMonthActual; // can be positive/negative

  // Next month
  const nextMonthPlanned = nextMonthScheduleDates.length;
  const totalCreditsAvailable = Math.max(0, carryAfterSettlement); // only leftover from THIS month applies
  const nextToPayClasses = nextMonthPlanned - carryAfterSettlement;
  const creditsAfterPayment = Math.max(0, totalCreditsAvailable - nextMonthPlanned);
  const amountDueNext = nextToPayClasses * (Number.isFinite(fee) ? fee : 0);

  /* ---- Payment link for NEXT month amount ---- */
  useEffect(() => {
    if (!studentName || amountDueNext <= 0) {
      setPaymentLink("");
      return;
    }

    const generateLink = async () => {
      setPaymentLinkLoading(true);
      setPaymentLink("");
      try {
        const response = await fetch("/api/payment/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName, amount: amountDueNext }),
        });

        if (!response.ok) {
          console.error("Failed to generate payment link.", await response.text());
          return;
        }

        const data = await response.json();
        if (data.paymentLink) {
          setPaymentLink(data.paymentLink);
        }
      } catch (error: any) {
        console.error("Error generating payment link:", error);
      } finally {
        setPaymentLinkLoading(false);
      }
    };

    generateLink();
  }, [amountDueNext, studentName]);

  /* -------------------- Text message (auto template) -------------------- */
  const currentMonthKo = monthKo(monthAnchor); // e.g., "9월"

  const { prevMonthKo, prevMonthDaysStr, prevMonthCount } = useMemo(() => {
    const pa = prevMonthAnchorOf(monthAnchor); // previous month of the selected month
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
      prevMonthCount: daysArr.length, // count matches the displayed unique days
    };
  }, [quizletDates, monthAnchor]);

  const displayName = useMemo(() => {
    if (!studentName) return "";
    return studentName.endsWith("님") ? studentName : `${studentName}님`;
  }, [studentName]);

  const dueDay = 7; // 고정: 매월 7일
  const feeStr = Number.isFinite(fee) ? fee.toLocaleString("ko-KR") : "0";
  const amountStr = amountDueNext.toLocaleString("ko-KR");

  const messageText = useMemo(() => {
    const nextMonthLabel = `${nextMonthAnchor.getFullYear()}. ${String(nextMonthAnchor.getMonth() + 1).padStart(2, "0")}`;

    return (
`${displayName}, 안녕하세요:)
${currentMonthKo} 정산 및 다음달 수업료 안내 드립니다.

[이번달 정산]
- 이번달 선결제(예정/스케줄): ${carryInCredit}회
- 이번달 실제 수업(노트 기준): ${thisMonthActual}회
= 정산 후 보유 수업(이번달 기준): ${carryAfterSettlement}회

[다음달 결제 안내]
- 다음달(${nextMonthLabel}) 예정 수업: ${nextMonthPlanned}회
- 차감 적용(이번달 정산분): ${totalCreditsAvailable}회
= 결제 대상 수업: ${nextToPayClasses}회
- 회당: ${feeStr}원
= 결제 금액: ${amountStr}원
+ ${currentMonthKo} ${dueDay}일까지 결제 부탁드립니다.

(결제 후 예상 보유 수업: ${creditsAfterPayment}회)

문의 사항이 있다면 여기 톡방으로 문의 주세요.

[결제 방법]
1. 카드 현장결제 : 결제 가능 날짜와 시간을 여기 톡방에 말씀해주시면 됩니다. 현장 결제를 하신분에 한해서 리뷰이벤트가 참여 가능합니다!

2. 계좌이체로 : KB국민은행 69760201254532 정현수 

3. 네이버 : https://smartstore.naver.com/davidsenglishconversation/category/ALL?cp=1 
* 결제 후 스크린 캡쳐를 여기 톡방으로 보내주시면 됩니다.${paymentLink ? `

4. Toss 간편결제 : ${paymentLink}` : ''}

[혜택 및 문의]
1. 장기 결제시 할인 혜택 : 결제한 달에 못다한 수업 횟수 만큼 다음달로 자동 이월됩니다.

2. 금액 또는 수업 일정에 대한 오류가 있으신 분들은 담당 선생님과 직접 논의하셔서 청구 문자를 재전송 받으시면 됩니다.

3. 현금 영수증을 원하시는 분들은 결제금액과 전화번호를 여기 톡방에 입력해 주시면 됩니다.

🎁리뷰 이벤트🎁
리뷰를 작성하시면 리뷰당 5,000원 수업 할인을 제공해 드리고 있습니다.
- 숨고: 숨고를 통해 학원에 등록을 하셨을 시 참여 가능합니다.
- 네이버 지도, 카카오 지도: 현장 결제 후 전자 영수증을 인증하여 리뷰를 작성하시면 됩니다.

같은 리뷰를 복사 붙여넣기 하셔도 되니 많이 참여 부탁드리겠습니다! 리뷰에 담당 선생님 이름이 들어가면 더 좋아요!

네이버, 카카오 지도 리뷰는 현장 담당자에게 인증 받으시고 숨고 리뷰 작성 후 스크린샷을 여기 톡방에 올려주시면 인증이 됩니다.`
    );
  }, [
    displayName,
    currentMonthKo,
    feeStr,
    amountStr,
    dueDay,
    carryInCredit,
    thisMonthActual,
    carryAfterSettlement,
    nextMonthPlanned,
    totalCreditsAvailable,
    nextToPayClasses,
    creditsAfterPayment,
    paymentLink,
    nextMonthAnchor,
  ]);

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  /* ---- Confirm/save (payload only; wire your API later) ---- */
  const handleConfirm = async () => {
    const payload = {
      student_name: studentName,
      teacher_name: teacherName ?? "",
      month: { year: monthAnchor.getFullYear(), month: monthAnchor.getMonth() + 1 },

      fee,

      // This-month summary (audit)
      this_month: {
        carry_in_credit: carryInCredit,               // prepaid this month (INPUT)
        actual_classes: thisMonthActual,              // from notes
        carry_after_settlement: carryAfterSettlement, // carryInCredit - actual
        lines: rows.map((r) => ({ note_date: r.noteDate, schedule_date: r.schedDate })),
      },

      // Next-month plan & charges
      next_month: {
        year: nextMonthAnchor.getFullYear(),
        month: nextMonthAnchor.getMonth() + 1,
        planned_schedules: nextMonthPlanned,
        credits_available_from_settlement: totalCreditsAvailable, // max(0, carryAfterSettlement)
        to_pay_classes: nextToPayClasses,
        credits_after_payment: creditsAfterPayment,
        lines: nextRows.map((r) => ({ schedule_date: r.schedDate })),
      },

      // Billing money
      amount_due: amountDueNext,

      // (optional) store the message text
      message_text: messageText,
    };

    console.log("[BillingPanel] Prepared billing payload:", payload);
    alert("Billing payload prepared. (Open the console to inspect.)\nWire your billing API in handleConfirm().");
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* ── Part 1: Header (Student, Fee, Carry-in, Generate) ───────── */}
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
            <div className="text-gray-600 mb-1">This Month's Credits (Scheduled)</div>
            <input
              type="number"
              className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
              value={carryInCredit}
              onChange={(e) => setCarryInCredit(Number(e.target.value || 0))}
              placeholder="e.g. 6"
            />
          </label>

          <div className="flex items-end">
            <div className="w-full grid grid-cols-1 gap-2">
              <button
                onClick={generateDraft}
                className="w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700"
                title="Generate a billing draft from this month's class notes and next month's schedules"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Part 2: This month’s classes (Actuals) ─────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto">
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

        {/* ── Part 2b: Next month’s scheduled classes (schedule date only) ───────── */}
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

            {/* Datalist to help pick from next month’s scheduled days */}
            <datalist id="next-sched-options">
              {nextMonthScheduleDates.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>

        {/* ── Settlement Summary (compact) ───────────────────────────────────── */}
        <div className="mt-6">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-gray-800">
              Settlement Summary
            </div>
            <table className="w-full text-sm">
              <tbody className="[&>tr>*]:px-4 [&>tr>*]:py-2">
                <tr className="border-b">
                  <td className="text-gray-500 w-1/2">Carry-in credit (THIS month prepaid)</td>
                  <td className="font-semibold text-right">{carryInCredit}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">This month – Actual (notes)</td>
                  <td className="font-semibold text-right">{thisMonthActual}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">Carry after settlement</td>
                  <td className="font-semibold text-right">{carryAfterSettlement}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">Next month – Planned (schedules)</td>
                  <td className="font-semibold text-right">{nextMonthPlanned}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">Credits applicable to next month</td>
                  <td className="font-semibold text-right">{totalCreditsAvailable}</td>
                </tr>
                <tr className="border-b">
                  <td className="text-gray-500">To pay (classes)</td>
                  <td className="font-semibold text-right">{nextToPayClasses}</td>
                </tr>
                <tr>
                  <td className="text-gray-500">Amount due (₩)</td>
                  <td className="font-semibold text-right">{amountDueNext.toLocaleString("ko-KR")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Part 2.5: Text message panel ─────────────────────────────── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">Text Message</div>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
              title="문자 내용 복사"
            >
              Copy
            </button>
            {copied && (
              <span className="absolute right-2 top-10 text-xs text-emerald-600">Copied!</span>
            )}
            <div
              className="
                w-full
                min-h-[24rem]
                h-[60vh] md:h-[65vh] lg:h-[70vh] xl:h-[75vh]
                border rounded-xl p-4
                bg-white
                text-base leading-7
                whitespace-pre-wrap
              "
            >
              {paymentLink ? (
                <>
                  {messageText.split(paymentLink)[0]}
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {paymentLink}
                  </a>
                  {messageText.split(paymentLink)[1]}
                </>
              ) : (
                messageText
              )}
            </div>

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
