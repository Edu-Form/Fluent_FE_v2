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


export default function Page() {
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = dotYearMonth(monthAnchor);

  const [rows, setRows] = useState<StudentBillingRow[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [, setExpandedStage] = useState<Record<string, string | null>>({}); // per-row expanded stage

  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth() + 1;

  function firstNotDoneStage(r: StudentBillingRow): string | null {
    if (r.teacher_confirmed !== "done") return "teacher_confirmed";
    if (r.admin_confirmed !== "done") return "admin_confirmed";
    if (r.message_sent !== "done") return "message_sent";
    if (!r.payment_confirmed) return "payment_confirmed";
    return null;
  }

  useEffect(() => {
    const loadStudentsWithBillingStatus = async () => {
      try {
        // 1) Fetch student list
        const studentsRes = await fetch(`/api/studentList`);
        if (!studentsRes.ok) {
          setRows([]);
          setExpandedStage({});
          return;
        }
        const list: any[] = await studentsRes.json();
        if (!Array.isArray(list)) {
          setRows([]);
          setExpandedStage({});
          return;
        }

        // 2) Fetch billing status for this month
        const yyyymm = `${year}${String(month).padStart(2, "0")}`;
        const billingRes = await fetch(`/api/billing/status/${yyyymm}`);
        let billingDocs: any[] = [];
        if (billingRes.ok) {
          const billingData = await billingRes.json();
          billingDocs = billingData?.docs || [];
        }

        // 3) Build lookup maps for each step
        const teacherConfirmedStudents = new Set<string>();
        const adminConfirmedStudents = new Set<string>();
        const messageConfirmedStudents = new Set<string>();
        const paymentConfirmedStudents = new Set<string>();

        for (const doc of billingDocs) {
          const studentNames = doc.student_names || [];
          if (doc.step === "TeacherConfirm") {
            studentNames.forEach((name: string) => teacherConfirmedStudents.add(name));
          } else if (doc.step === "AdminConfirm") {
            studentNames.forEach((name: string) => adminConfirmedStudents.add(name));
          } else if (doc.step === "MessageConfirm") {
            studentNames.forEach((name: string) => messageConfirmedStudents.add(name));
          } else if (doc.step === "PaymentConfirm") {
            studentNames.forEach((name: string) => paymentConfirmedStudents.add(name));
          }
        }

        // 4) Map students with their billing status
        const teacherFallback = "Unknown";
        const mapped = list.map((s: any, i: number) => {
          const studentName = s?.student_name || s?.name || `학생-${i + 1}`;
          const teacherName = s.teacher || teacherFallback;
          const sid = s?.id ?? s?._id ?? s?.phone ?? `${i}`;

          const teacherConfirmed = teacherConfirmedStudents.has(studentName);
          const adminConfirmed = adminConfirmedStudents.has(studentName);

          // Determine which page to link to based on confirmation status
          let pageUrl: string;
          if (!teacherConfirmed) {
            // Not yet teacher confirmed → go to teacher schedule page
            pageUrl = `/teacher/schedule?user=${encodeURIComponent(teacherName)}&type=teacher&student_name=${encodeURIComponent(studentName)}&id=${encodeURIComponent(String(sid))}`;
          } else {
            // Teacher confirmed → go to admin confirm page
            pageUrl = `/teacher/schedule/admin-confirm?user=${encodeURIComponent(teacherName)}&type=teacher&student_name=${encodeURIComponent(studentName)}&id=${encodeURIComponent(String(sid))}`;
          }

          return {
            id: String(sid),
            student_name: studentName,
            teacher_name: teacherName,
            teacher_confirmed: teacherConfirmed ? "done" : "ready",
            admin_confirmed: adminConfirmed ? "done" : "ready",
            message_sent: messageConfirmedStudents.has(studentName) ? "done" : "ready",
            payment_confirmed: paymentConfirmedStudents.has(studentName),
            student_page_url: pageUrl,
            message_text: `${studentName}님, 안녕하세요:)\n${month}월 정산 및 다음달 안내 드립니다...`,
          } as StudentBillingRow;
        });

        // 5) Set initial expanded state
        const initialExpanded: Record<string, string | null> = {};
        for (const r of mapped) {
          initialExpanded[r.id] = firstNotDoneStage(r);
        }

        setRows(mapped);
        setExpandedStage(initialExpanded);
      } catch (err) {
        console.error("Error loading billing data:", err);
        setRows([]);
        setExpandedStage({});
      }
    };

    loadStudentsWithBillingStatus();
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

  function doneCountFor(r: StudentBillingRow) {
    return (
      (r.teacher_confirmed === "done" ? 1 : 0) +
      (r.admin_confirmed === "done" ? 1 : 0) +
      (r.message_sent === "done" ? 1 : 0) +
      (r.payment_confirmed ? 1 : 0)
    );
  }

  function statusColorClasses(doneCount: number) {
    if (doneCount <= 0) return "bg-[rgba(255,77,77,0.12)] border-[rgba(255,77,77,0.18)]";
    if (doneCount === 1) return "bg-[rgba(124,58,237,0.10)] border-[rgba(124,58,237,0.16)]";
    if (doneCount === 2) return "bg-[rgba(251,146,60,0.10)] border-[rgba(251,146,60,0.16)]";
    if (doneCount === 3) return "bg-[rgba(245,158,11,0.10)] border-[rgba(245,158,11,0.16)]";
    return "bg-[rgba(16,185,129,0.10)] border-[rgba(16,185,129,0.16)]";
  }

  function uniqueTeachers(rows: StudentBillingRow[]) {
    const set = new Set<string>();
    for (const r of rows) if (r.teacher_name) set.add(r.teacher_name);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "en"));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">관리자 - 학생 결제 관리</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthAnchor((d) => prevMonth(d))} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">←</button>
            <div className="text-sm font-medium w-[7.5rem] text-center bg-white border rounded-md px-2 py-1">{monthLabel}</div>
            <button onClick={() => setMonthAnchor((d) => nextMonth(d))} className="px-2 py-1 border rounded-lg text-sm hover:bg-slate-50">→</button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full md:max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or teacher"
            className="w-full border rounded-lg px-3 py-2 bg-white shadow-sm text-sm"
          />
          <button onClick={() => { setQuery(""); }} className="px-2 py-1 border rounded-lg text-sm">Clear</button>
        </div>
      </div>

      {/* Matrix (Teachers on X, Students on Y) */}
{filtered.length === 0 ? (
  <div className="rounded-2xl border bg-white p-4 text-center text-gray-500">
    No students for this month.
  </div>
) : (
  (() => {
    const teachers = uniqueTeachers(filtered);

    // Group students by teacher (safe for undefined teacher_name)
    const rowsByTeacher: Record<string, StudentBillingRow[]> = {};
    filtered.forEach((r) => {
      const teacherName = r.teacher_name ?? "Unknown";
      (rowsByTeacher[teacherName] ??= []).push(r);
    });

    return (
      <div className="relative rounded-xl border bg-white">
        {/* Only vertical scroll; keep header (X axis) & first column sticky */}
        <div className="max-h-[75vh] overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-white sticky top-0 z-20">
              <tr>
                {/* sticky first header cell (students label) */}
                <th
                  className="sticky left-0 z-30 bg-white border-b text-[11px] font-semibold text-gray-700 tracking-tight text-left px-2 py-1.5"
                  style={{ minWidth: 160, maxWidth: 220 }}
                >
                  학생
                </th>

                {teachers.map((t) => (
                  <th
                    key={t}
                    className="border-b text-[11px] font-semibold text-gray-700 tracking-tight px-2 py-1.5 text-center whitespace-nowrap"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Object.keys(rowsByTeacher).map((teacher) =>
                rowsByTeacher[teacher].map((r, idx) => {
                  const done = doneCountFor(r);
                  const rowStripe = idx % 2 === 1 ? "bg-gray-50/40" : "bg-white";
                  return (
                    <tr key={r.id} className={rowStripe}>
                      {/* sticky first column cell */}
                      <td
                        className={`sticky left-0 z-10 border-b px-2 py-1.5 ${rowStripe}`}
                        style={{ minWidth: 160, maxWidth: 220 }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0">
                            <input
                              type="checkbox"
                              checked={!!selected[r.id]}
                              onChange={(e) =>
                                setSelected((s) => ({ ...s, [r.id]: e.target.checked }))
                              }
                              className="h-3.5 w-3.5"
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-gray-900 truncate">
                              {r.student_name}
                            </div>
                            <div className="text-[10px] text-gray-500">Status {done}/4</div>
                          </div>
                        </div>
                      </td>

                      {teachers.map((t) => {
                        const isTheirTeacher = (r.teacher_name || "") === t;
                        if (!isTheirTeacher) {
                          return (
                            <td
                              key={t}
                              className="border-b px-2 py-1.5 text-center text-[11px] text-gray-300"
                            >
                              —
                            </td>
                          );
                        }

                        const color = statusColorClasses(done);
                        const chipTitle =
                          done === 4
                            ? "완료"
                            : done === 3
                            ? "거의 완료"
                            : done === 2
                            ? "진행 중"
                            : done === 1
                            ? "시작됨"
                            : "대기";

                        return (
                          <td key={t} className="border-b px-2 py-1.5">
                            <a
                              href={r.student_page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`${r.student_name} · ${t} · ${chipTitle}`}
                              className={classNames(
                                "block w-full select-none rounded-md border text-center",
                                "text-[11px] font-medium text-gray-800",
                                "px-2 py-2 hover:opacity-95 active:opacity-90",
                                color
                              )}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span
                                  className={classNames(
                                    "h-1.5 w-1.5 rounded-full",
                                    done >= 1 ? "bg-indigo-500" : "bg-gray-300"
                                  )}
                                />
                                <span
                                  className={classNames(
                                    "h-1.5 w-1.5 rounded-full",
                                    done >= 2 ? "bg-amber-500" : "bg-gray-300"
                                  )}
                                />
                                <span
                                  className={classNames(
                                    "h-1.5 w-1.5 rounded-full",
                                    done >= 3 ? "bg-yellow-500" : "bg-gray-300"
                                  )}
                                />
                                <span
                                  className={classNames(
                                    "h-1.5 w-1.5 rounded-full",
                                    done >= 4 ? "bg-emerald-500" : "bg-gray-300"
                                  )}
                                />
                                <span className="text-[10px] text-gray-600 ml-1">{done}/4</span>
                              </div>
                            </a>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  })()
)}

    </div>
  );
}
