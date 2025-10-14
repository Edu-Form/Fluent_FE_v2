"use client";

import React, { useEffect, useMemo, useState } from "react";

export type Status = "ready" | "done";

export type StudentBillingRow = {
  id: string;
  student_name: string;
  teacher_name?: string;
  teacher_confirmed: Status;
  admin_confirmed: Status;
  message_sent: Status;
  payment_confirmed: boolean;
  student_page_url: string;
  message_text?: string;
};

// small helper
function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function dotYearMonth(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function prevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function nextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function StatusChip({ kind, label }: { kind: "ready" | "done" | "payment"; label: string }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const tone =
    kind === "done"
      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
      : kind === "payment"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";
  return <span className={classNames(base, tone)}>{label}</span>;
}

export default function Page() {
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = dotYearMonth(monthAnchor);

  const [rows, setRows] = useState<StudentBillingRow[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [expandedStage, setExpandedStage] = useState<Record<string, string | null>>({}); // per-row expanded stage

  // store status docs for the month
  const [statusDocs, setStatusDocs] = useState<any[]>([]);

  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth() + 1;

  const stageKeys = ["teacher_confirmed", "admin_confirmed", "message_sent", "payment_confirmed"];
  // changed Teacher label to Korean as requested
  const stageLabels: Record<string, string> = {
    teacher_confirmed: "선생님 일정 확인",
    admin_confirmed: "관리자 2차 확인",
    message_sent: "Message",
    payment_confirmed: "Payment",
  };

  // helper: returns first not-done stage key or null
  function firstNotDoneStage(r: StudentBillingRow): string | null {
    if (r.teacher_confirmed !== "done") return "teacher_confirmed";
    if (r.admin_confirmed !== "done") return "admin_confirmed";
    if (r.message_sent !== "done") return "message_sent";
    if (!r.payment_confirmed) return "payment_confirmed";
    return null;
  }

  // load student list for this admin panel (unchanged logic, but now triggers status application after)
  useEffect(() => {
    fetch(`/api/studentList`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list: any[] | null) => {
        if (!Array.isArray(list)) {
          setRows([]);
          setExpandedStage({});
          return;
        }

        const teacherFallback = "Unknown";

        const mapped = list.map((s: any, i: number) => {
          const studentName = s?.student_name || s?.name || `학생-${i + 1}`;
          const teacherName = s.teacher || teacherFallback;
          const sid = s?.id ?? s?._id ?? s?.phone ?? `${i}`;

          return {
            id: String(sid),
            student_name: studentName,
            teacher_name: teacherName,
            teacher_confirmed: "ready" as Status,
            admin_confirmed: "ready" as Status,
            message_sent: "ready" as Status,
            payment_confirmed: false,
            // keep student_page_url; we also construct a teacher schedule link in the UI
            student_page_url: `/teacher/schedule?user=${encodeURIComponent(teacherName)}&type=teacher&student_name=${encodeURIComponent(studentName)}&id=${encodeURIComponent(String(sid))}`,
            message_text: `${studentName}님, 안녕하세요:)\n${month}월 정산 및 다음달 안내 드립니다...`,
          } as StudentBillingRow;
        });

        // initial expanded: first not-done
        const initialExpanded: Record<string, string | null> = {};
        for (const r of mapped) {
          initialExpanded[r.id] = firstNotDoneStage(r);
        }

        setRows(mapped);
        setExpandedStage(initialExpanded);
      })
      .catch(() => {
        setRows([]);
        setExpandedStage({});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]); // re-run when monthAnchor changes

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        (r.teacher_name || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  // compute doneCount for a row
  function doneCountFor(r: StudentBillingRow) {
    return (
      (r.teacher_confirmed === "done" ? 1 : 0) +
      (r.admin_confirmed === "done" ? 1 : 0) +
      (r.message_sent === "done" ? 1 : 0) +
      (r.payment_confirmed ? 1 : 0)
    );
  }

  // Determines visual "active" status for each box index given doneCount.
  function isBoxActive(index: number, doneCount: number) {
    // index 0 = student-name box
    // index 1..4 = stage boxes 1..4
    if (doneCount === 0) {
      return index === 0; // only left student box red
    }
    if (doneCount === 1) {
      return index <= 1; // left + first stage purple
    }
    if (doneCount === 2) {
      return index <= 2; // left + first two stages orange
    }
    if (doneCount === 3) {
      return index <= 3; // left + first three stages yellow
    }
    // doneCount === 4
    return true; // all green
  }

  // Replace the existing boxStyleFor(...) with this implementation
  function boxStyleFor(index: number, doneCount: number): { style: React.CSSProperties; textWhite: boolean } {
    const active = isBoxActive(index, doneCount);

    // Flat, slightly transparent palettes (alpha tuned for subtlety)
    const palettes = {
      red: { fill: "rgba(255,77,77,0.12)", border: "rgba(255,77,77,0.18)" },
      purple: { fill: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.16)" },
      orange: { fill: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.16)" },
      yellow: { fill: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.16)" },
      green: { fill: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.16)" },
      muted: { fill: "transparent", border: "rgba(0,0,0,0.04)" },
    };

    // choose palette by doneCount
    let chosen = palettes.muted;
    if (active) {
      if (doneCount === 0) chosen = palettes.red;
      else if (doneCount === 1) chosen = palettes.purple;
      else if (doneCount === 2) chosen = palettes.orange;
      else if (doneCount === 3) chosen = palettes.yellow;
      else chosen = palettes.green; // doneCount === 4
    }

    const style: React.CSSProperties = {
      backgroundColor: chosen.fill,
      borderLeft: "1px solid " + chosen.border, // subtle separators between boxes
      borderRight: "1px solid " + chosen.border,
      // keep container shadow subtle or remove; removing glossy inner shadow entirely:
      boxShadow: undefined,
      // keep visual smoothing
      transition: "background-color 180ms ease, border-color 180ms ease",
      // ensure text stays readable over translucent background
      WebkitFontSmoothing: "antialiased",
    };

    // With flat translucent fills we use dark text for better legibility / modern look
    const textWhite = false;

    return { style, textWhite };
  }

  // helper to display stage description
  function stageText(r: StudentBillingRow, stage: string) {
    switch (stage) {
      case "teacher_confirmed":
        return r.teacher_confirmed === "done" ? "Teacher confirmed" : "Teacher not confirmed";
      case "admin_confirmed":
        return r.admin_confirmed === "done" ? "Admin confirmed" : "Admin not confirmed";
      case "message_sent":
        return r.message_sent === "done" ? r.message_text || "Message has been sent" : r.message_text || "Message not sent";
      case "payment_confirmed":
        return r.payment_confirmed ? "Payment has been confirmed" : "Payment not confirmed";
      default:
        return "";
    }
  }

  async function toggleField(id: string, field: "teacher_confirmed" | "admin_confirmed" | "message_sent" | "payment_confirmed") {
    setLoadingIds((s) => ({ ...s, [id]: true }));

    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const newValue =
          field === "payment_confirmed"
            ? !r.payment_confirmed
            : r[field] === "done"
            ? "ready"
            : "done";
        return {
          ...r,
          [field]: newValue,
        };
      });

      const updated = next.find((rr) => rr.id === id)!;
      const nextStage = firstNotDoneStage(updated);
      setExpandedStage((s) => ({ ...s, [id]: nextStage }));

      return next;
    });

    try {
      await fetch(`/api/billing/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field }),
      });
    } catch (e) {
      // Keep local optimistic UI (do not clobber with a global /studentList refetch).
      // Log the error so we can investigate; optionally show a toast in the future.
      console.error("Failed update for", id, field, e);
    } finally {
      setLoadingIds((s) => ({ ...s, [id]: false }));
    }
  }

  async function bulkConfirmPayment() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, payment_confirmed: true } : r)));
    try {
      await fetch(`/api/billing/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "confirm_payment" }),
      });
      setSelected({});
    } catch (e) {
      console.error(e);
    }
  }

  /* -------------------------
     NEW: fetch month status docs
     ------------------------- */

  // build yyyymm string for API
  const yyyymm = `${monthAnchor.getFullYear()}${String(monthAnchor.getMonth() + 1).padStart(2, "0")}`;

  // fetch status docs for the selected month and store them
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/billing/status/${yyyymm}`, { cache: "no-store" });
        if (!res.ok) {
          // treat as no status docs
          setStatusDocs([]);
          return;
        }
        const json = await res.json();

        // Accept many shapes: array, { found, data }, single doc
        let docs: any[] = [];
        if (Array.isArray(json)) docs = json;
        else if (json && Array.isArray(json.data)) docs = json.data;
        else if (json && json.found && json.data) docs = [json.data];
        else if (json && json.data) docs = Array.isArray(json.data) ? json.data : [json.data];
        else if (json && json.ok && json.docs) docs = Array.isArray(json.docs) ? json.docs : [];
        else if (json && typeof json === "object" && json.step) docs = [json];
        else docs = []; // fallback

        if (!cancelled) setStatusDocs(docs);
      } catch (e) {
        console.error("Failed to fetch billing status docs:", e);
        if (!cancelled) setStatusDocs([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [yyyymm]);

// REPLACE your existing effect block with this:
  useEffect(() => {
    // only run when we actually have status docs AND when rows are loaded
    if (!statusDocs || statusDocs.length === 0) return;
    if (!rows || rows.length === 0) return;

    // normalize helper
    const normalizeName = (s: any) =>
      String(s ?? "")
        .trim()
        .replace(/님$/, "")
        .toLowerCase();

    const STEP_NORMAL_MAP: Record<string, string> = {
      teacherconfirm: "TeacherConfirm",
      teacherconfirmed: "TeacherConfirm",
      teacher_confirm: "TeacherConfirm",
      teacher_confirmed: "TeacherConfirm",
      adminconfirm: "AdminConfirm",
      admin_confirm: "AdminConfirm",
      admin_confirmed: "AdminConfirm",
      adminconfirmed: "AdminConfirm",
      messageconfirm: "MessageConfirm",
      message_confirm: "MessageConfirm",
      message_confirmed: "MessageConfirm",
      messageconfirmed: "MessageConfirm",
      paymentconfirm: "PaymentConfirm",
      payment_confirm: "PaymentConfirm",
      payment_confirmed: "PaymentConfirm",
      paymentconfirmed: "PaymentConfirm",
      check1_status: "TeacherConfirm",
    };

    // Build map: normalized studentName -> set of canonical steps
    const studentToSteps = new Map<string, Set<string>>();
    for (const doc of statusDocs) {
      const rawStep = String(doc.step ?? doc.type ?? doc.typeName ?? "").trim();
      const stepKey = rawStep.replace(/\s+/g, "").toLowerCase();
      const canonical = STEP_NORMAL_MAP[stepKey] ?? rawStep;

      const students: string[] = Array.isArray(doc.student_names) ? doc.student_names : [];
      for (const s of students) {
        const n = normalizeName(s);
        if (!studentToSteps.has(n)) studentToSteps.set(n, new Set());
        studentToSteps.get(n)!.add(canonical);
      }
    }

    // Apply to the currently loaded rows (use the current rows array)
    setRows((prevRows) => {
      const nextRows = prevRows.map((r) => {
        const rn = normalizeName(r.student_name);
        const steps = studentToSteps.get(rn) ?? new Set<string>();

        const newRow = { ...r };

        if (steps.has("TeacherConfirm") || steps.has("teacherconfirm") || steps.has("TeacherConfirmed")) {
          newRow.teacher_confirmed = "done";
        }
        if (steps.has("AdminConfirm") || steps.has("adminconfirm")) {
          newRow.admin_confirmed = "done";
        }
        if (steps.has("MessageConfirm") || steps.has("messageconfirm")) {
          newRow.message_sent = "done";
        }
        if (steps.has("PaymentConfirm") || steps.has("paymentconfirm")) {
          newRow.payment_confirmed = true;
        }

        return newRow;
      });

      // update expandedStage once, based on newRows
      const nextExpanded: Record<string, string | null> = {};
      for (const nr of nextRows) {
        nextExpanded[nr.id] = firstNotDoneStage(nr);
      }
      setExpandedStage(nextExpanded);

      return nextRows;
    });
  // only re-run when statusDocs changes or when the number of rows changes (prevents infinite loop)
  }, [statusDocs, rows.length]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin – Monthly Billing</h1>
          <p className="text-sm text-gray-500">Track billing flow and confirmations for all students</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthAnchor((d) => prevMonth(d))} className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50">←</button>
            <div className="text-sm font-medium w-[8.5rem] text-center bg-white border rounded-md px-3 py-2">{monthLabel}</div>
            <button onClick={() => setMonthAnchor((d) => nextMonth(d))} className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50">→</button>
          </div>

          {/* removed duplicate <input type="month"> to keep single month control */}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 w-full md:max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or teacher"
            className="w-full border rounded-lg px-4 py-2 bg-white shadow-sm"
          />
          <button onClick={() => { setQuery(""); }} className="px-3 py-2 border rounded-lg text-sm">Clear</button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={bulkConfirmPayment}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            disabled={Object.values(selected).every((v) => !v)}
          >
            Bulk confirm payment
          </button>

          <div className="hidden md:flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500" /> Pending</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> In progress</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Complete</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">No students for this month.</div>
        ) : (
          filtered.map((r) => {
            const doneCount = doneCountFor(r);

            // precompute styles for each box (index 0..4 where 0 is left name box)
            const leftBox = boxStyleFor(0, doneCount);
            const midBoxes = [1, 2, 3, 4].map((i) => boxStyleFor(i, doneCount));

            // left text classes: white when leftBox active, otherwise dark
            const leftTextClass = leftBox.textWhite ? "text-white" : "text-gray-900";

            return (
              <div key={r.id} className="relative rounded-2xl border shadow-sm overflow-hidden">
                {/* absolute background boxes: left student box + 4 stage boxes + right Open area */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="flex h-full">
                    {/* left student box (index 0) */}
                    <div style={{ width: 320, ...leftBox.style }} />

                    {/* four stage boxes indexes 1..4 */}
                    <div className="flex-1 flex">
                      {midBoxes.map((b, idx) => (
                        <div key={idx} style={{ ...b.style }} className="flex-1 transition-colors duration-200" />
                      ))}
                    </div>

                    {/* right: area for Open button */}
                    <div style={{ width: 96 }} className="bg-white" />
                  </div>
                </div>

                {/* Foreground content */}
                <div className="relative z-10 flex items-center px-4 py-4 md:px-6">
                  {/* left: checkbox + names (names always visible) */}
                  <div className="flex items-start gap-3" style={{ minWidth: 320 }}>
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={classNames("text-sm font-semibold truncate", leftTextClass)}>{r.student_name}</div>
                        <div className={classNames("text-xs", leftTextClass === "text-white" ? "text-white/80" : "text-gray-400")}>·</div>
                        <div className={classNames("text-xs truncate", leftTextClass)}>{r.teacher_name || "—"}</div>
                      </div>
                      <div className={classNames("text-[11px] mt-1", leftTextClass === "text-white" ? "text-white/90" : "text-gray-500")}>Status: {doneCount}/4</div>
                    </div>
                  </div>

                  {/* middle: 4 accordion columns (one per stage) */}
                  <div className="flex-1 flex gap-0">
                    {stageKeys.map((key, idx) => {
                      const boxMeta = midBoxes[idx];
                      const isExpanded = expandedStage[r.id] === key;
                      const label = stageLabels[key];
                      const chipKind =
                        key === "payment_confirmed"
                          ? (r.payment_confirmed ? "payment" : "ready")
                          : (r as any)[key] === "done"
                          ? "done"
                          : "ready";

                      const stageTextColor = boxMeta.textWhite ? "text-white" : "text-gray-900";
                      const indicatorColor = boxMeta.textWhite ? "text-white/90" : "text-gray-600";

                      return (
                        <div key={key} className="flex-1 flex flex-col border-l border-white/40">
                          {/* click disabled here: removed role/onClick and cursor-pointer */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={classNames("text-sm font-medium", stageTextColor)}>{label}</div>
                                <StatusChip
                                  kind={chipKind as any}
                                  label={
                                    key === "payment_confirmed"
                                      ? r.payment_confirmed ? "Paid" : "Not paid"
                                      : (r as any)[key] === "done" ? "Done" : "Ready"
                                  }
                                />
                              </div>

                              <div className={classNames("text-xs", indicatorColor)}>{isExpanded ? "▴" : "▾"}</div>
                            </div>

                            {isExpanded && (
                              <div className={classNames("mt-3 text-sm", boxMeta.textWhite ? "text-white/95" : "text-gray-700")}>
                                {key === "teacher_confirmed" ? (
                                  <div>
                                    <a
                                      href={`/teacher/schedule?user=${encodeURIComponent(r.teacher_name || "")}&type=teacher&student_name=${encodeURIComponent(r.student_name)}`}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className={classNames("text-sm font-medium underline", boxMeta.textWhite ? "text-white/95" : "text-indigo-600")}
                                    >
                                      {`${r.student_name} 학생 1차 확인 링크`}
                                    </a>
                                    <div className={classNames("text-xs mt-2", boxMeta.textWhite ? "text-white/80" : "text-gray-500")}>
                                      선생님이 확인 버튼을 눌러야지 다음 단계로 이동 가능합니다.
                                    </div>
                                  </div>
                                ) : key === "admin_confirmed" ? (
                                  <div>
                                    <a
                                      href={`/teacher/schedule/admin-confirm?user=${encodeURIComponent(r.teacher_name || "")}&type=teacher&student_name=${encodeURIComponent(r.student_name)}&id=${encodeURIComponent(r.id)}`}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className={classNames("text-sm font-medium underline", boxMeta.textWhite ? "text-white/95" : "text-indigo-600")}
                                    >
                                      {`${r.student_name} 학생 2차 확인 링크`}
                                    </a>
                                    <div className={classNames("text-xs mt-2", boxMeta.textWhite ? "text-white/80" : "text-gray-500")}>
                                      관리자가 2차로 확인하는 단계입니다. 
                                    </div>
                                  </div>
                                ) : (
                                  stageText(r, key)
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* right: Open button + action buttons */}
                  <div className="ml-4 flex-shrink-0" style={{ width: 96 }}>
                    <a
                      href={r.student_page_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block w-full text-center text-sm px-3 py-2 border rounded-md text-gray-700 bg-white hover:bg-slate-50"
                    >
                      Open
                    </a>

                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleField(r.id, "teacher_confirmed")}
                          disabled={!!loadingIds[r.id]}
                          className="px-2 py-1 text-xs rounded-md border hover:bg-slate-50 w-full"
                        >
                          {r.teacher_confirmed === "done" ? "Undo" : "Mark"}
                        </button>
                        <button
                          onClick={() => toggleField(r.id, "admin_confirmed")}
                          disabled={!!loadingIds[r.id]}
                          className="px-2 py-1 text-xs rounded-md border hover:bg-slate-50 w-full"
                        >
                          {r.admin_confirmed === "done" ? "Undo" : "Mark"}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleField(r.id, "message_sent")}
                          disabled={!!loadingIds[r.id]}
                          className="px-2 py-1 text-xs rounded-md border hover:bg-slate-50 w-full"
                        >
                          {r.message_sent === "done" ? "Undo" : "Send"}
                        </button>
                        <button
                          onClick={() => toggleField(r.id, "payment_confirmed")}
                          disabled={!!loadingIds[r.id]}
                          className={classNames("px-2 py-1 text-xs rounded-md border w-full", r.payment_confirmed ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50")}
                        >
                          {r.payment_confirmed ? "Paid" : "Confirm"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
