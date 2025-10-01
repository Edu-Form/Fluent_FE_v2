"use client";

import React, { useEffect, useMemo, useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
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

// Helpers
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

function StatusPill({ kind, label }: { kind: "red" | "blue"; label: string }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const tone = kind === "red"
    ? "bg-rose-100 text-rose-700 border border-rose-200"
    : "bg-indigo-100 text-indigo-700 border border-indigo-200";
  return <span className={classNames(base, tone)}>{label}</span>;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[min(720px,92vw)] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-xl border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">{title || "Message"}</div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PAGE
// ──────────────────────────────────────────────────────────────────────────────
export default function Page() {
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = dotYearMonth(monthAnchor);

  const [rows, setRows] = useState<StudentBillingRow[]>([]);
  const [query, setQuery] = useState("");
  const [openMessageFor, setOpenMessageFor] = useState<string | null>(null);

  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth() + 1;

  useEffect(() => {
    fetch(`/api/studentList`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list: any[] | null) => {
        if (!Array.isArray(list)) return setRows([]);
        const teacherFallback = "Unknown";
        setRows(
          list.map((s, i) => {
            const studentName = s?.student_name || s?.name || `학생-${i + 1}`;
            const teacherName = s?.teacherName || s?.teacher_name || teacherFallback;
            const sid = s?.id || s?._id || s?.phone || `${i}`;
            return {
              id: String(sid),
              student_name: studentName,
              teacher_name: teacherName,
              teacher_confirmed: "ready",
              admin_confirmed: "ready",
              message_sent: "ready",
              payment_confirmed: false,
              student_page_url: `http://localhost:3000/teacher/schedule?user=${encodeURIComponent(teacherName)}&type=teacher&student_name=${encodeURIComponent(studentName)}&id=${encodeURIComponent(String(sid))}`,
              message_text: `${studentName}님, 안녕하세요:)\n${month}월 정산 및 다음달 안내 드립니다...`,
            };
          })
        );
      })
      .catch(() => setRows([]));
  }, [year, month]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        (r.teacher_name || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Admin – Monthly Billing Dashboard</div>
          <div className="text-sm text-gray-500">Monthly overview of billing status by student</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthAnchor((d) => prevMonth(d))}
            className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <div className="text-sm font-medium w-[7.5rem] text-center">{monthLabel}</div>
          <button
            onClick={() => setMonthAnchor((d) => nextMonth(d))}
            className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50"
          >
            →
          </button>

          <input
            type="month"
            className="ml-3 border rounded-lg px-2 py-1 text-sm bg-white"
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m] = e.target.value.split("-").map(Number);
              setMonthAnchor(new Date(y, (m || 1) - 1, 1));
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or teacher"
            className="w-[22rem] max-w-full border rounded-lg px-3 py-2 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> Ready
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" /> Done / Confirmed
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-8">
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b sticky top-0">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3 min-w-[16rem]">Student / Teacher</th>
                <th className="px-4 py-3 min-w-[11rem]">Teacher confirmed</th>
                <th className="px-4 py-3 min-w-[11rem]">Admin confirmed</th>
                <th className="px-4 py-3 min-w-[11rem]">Message sent</th>
                <th className="px-4 py-3 min-w-[11rem]">Payment confirmed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No students for this month.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const tKind = r.teacher_confirmed === "done" ? "blue" : "red";
                  const aKind = r.admin_confirmed === "done" ? "blue" : "red";
                  const mKind = r.message_sent === "done" ? "blue" : "red";
                  const pKind = r.payment_confirmed ? "blue" : "red";

                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.student_name}</div>
                        <div className="text-xs text-gray-500">{r.teacher_name || "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill kind={tKind as any} label={r.teacher_confirmed === "done" ? "Done" : "Ready"} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <StatusPill kind={aKind as any} label={r.admin_confirmed === "done" ? "Done" : "Ready"} />
                          <a
                            href={r.student_page_url}
                            className="mt-1 text-[11px] text-blue-600 hover:underline w-fit"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Click here
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <StatusPill kind={mKind as any} label={r.message_sent === "done" ? "Done" : "Ready"} />
                          <a
                            href={`http://localhost:3000/teacher/payment?user=${encodeURIComponent(r.teacher_name || "Phil")}&type=teacher&id=${encodeURIComponent(r.id)}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 text-[11px] text-blue-600 hover:underline w-fit"
                          >
                            View Message
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill kind={pKind as any} label={r.payment_confirmed ? "Confirmed" : "Not confirmed"} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={openMessageFor !== null} onClose={() => setOpenMessageFor(null)} title="Message Preview">
        <div className="text-sm whitespace-pre-wrap">
          {rows.find((r) => r.id === openMessageFor)?.message_text || "No message available."}
        </div>
      </Modal>
    </div>
  );
}