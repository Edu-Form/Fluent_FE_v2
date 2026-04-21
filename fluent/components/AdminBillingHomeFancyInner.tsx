"use client";

import React, { useEffect, useMemo, useState } from "react";

/* -------------------------------- TYPES -------------------------------- */

type StudentInfo = {
  _id?: string;
  id?: string;
  student_name?: string;
  name?: string;
  teacher?: string;
  teacher_name?: string;
  credits?: number | string;
};

type ClassnoteEntry = {
  student_name?: string;
  teacher_name?: string;
  date?: string;
  class_date?: string;
};

type StudentFinancial = {
  id: string;
  name: string;
  teacher: string;
  credits: number;
};

/* -------------------------------- UTILS -------------------------------- */

function toDate(str?: string) {
  if (!str) return null;
  try {
    const clean = str.replace(/\.$/, "");
    const [y, m, d] = clean.split(". ");
    return new Date(Number(y), Number(m) - 1, Number(d));
  } catch {
    return null;
  }
}

function toNumber(value: any): number {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function studentName(s: StudentInfo, i: number) {
  return s.student_name || s.name || `학생-${i}`;
}

function teacherName(s: StudentInfo) {
  return s.teacher || s.teacher_name || "—";
}

/* -------------------------------- PAGE -------------------------------- */

export default function AdminDashboard() {
  const [students, setStudents] = useState<StudentFinancial[]>([]);
  const [classnotes, setClassnotes] = useState<ClassnoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const [rawTableData, setRawTableData] = useState<any[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const handleSearch = async () => {
    setTableLoading(true);

    try {
      const params = new URLSearchParams();

      if (selectedYear) params.set("year", selectedYear);
      if (selectedMonth) params.set("month", selectedMonth);

      const url = params.toString()
        ? `/api/teacher-performance?${params.toString()}`
        : "/api/teacher-performance";

      const res = await fetch(url);
      const json = await res.json();

      setFilteredTableData(json);
    } catch (e) {
      console.error("search fetch error", e);
      setFilteredTableData([]);
    }

    setTableLoading(false);
  };

const teacherRepayment = useMemo(() => {
  const map: Record<string, { once: number; repeat: number }> = {};

  students.forEach((s: any) => {
    const teacher = s.teacher || "—";
    const history = s.Credit_Automation_History || [];

    // ✅ ANY positive delta = payment
    const paymentCount = history.filter((h: any) => (h.delta || 0) > 0).length;

    if (paymentCount === 0) return; // ❗ exclude never-paid students

    if (!map[teacher]) {
      map[teacher] = { once: 0, repeat: 0 };
    }

    map[teacher].once += 1;

    if (paymentCount >= 2) {
      map[teacher].repeat += 1;
    }
  });

  const result: Record<string, number> = {};

  Object.keys(map).forEach((teacher) => {
    const { once, repeat } = map[teacher];

    result[teacher] = once
      ? Number(((repeat / once) * 100).toFixed(1))
      : 0;
  });

  return result;
}, [students]);

  const teacherRetention = useMemo(() => {
    const firstMap: Record<string, Date> = {};
    const lastMap: Record<string, Date> = {};
    const teacherMap: Record<string, string> = {};

    const now = new Date();
    const THREE_WEEKS = 21 * 86400000;

    // build maps
    classnotes.forEach((cn) => {
      const d = toDate(cn.date || cn.class_date);
      if (!d || !cn.student_name) return;

      const name = cn.student_name;
      const teacher = cn.teacher_name || "—";

      teacherMap[name] = teacher;

      if (!firstMap[name] || firstMap[name] > d) {
        firstMap[name] = d;
      }

      if (!lastMap[name] || lastMap[name] < d) {
        lastMap[name] = d;
      }
    });

    const result: Record<
      string,
      { eligible1: number; eligible3: number; eligible6: number; active1: number; active3: number; active6: number }
    > = {};

    Object.keys(firstMap).forEach((name) => {
      const first = firstMap[name];
      const last = lastMap[name];
      const teacher = teacherMap[name] || "—";

      if (!first || !last) return;

      const student = students.find((s) => s.name === name);
      const credits = student?.credits ?? 0;

      const isInactive =
        now.getTime() - last.getTime() > THREE_WEEKS &&
        credits <= 0;

      const lifetime =
        (now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (!result[teacher]) {
        result[teacher] = {
          eligible1: 0,
          eligible3: 0,
          eligible6: 0,
          active1: 0,
          active3: 0,
          active6: 0,
        };
      }

      // --- 1M ---
      if (lifetime >= 1) {
        result[teacher].eligible1 += 1;
        if (!isInactive) result[teacher].active1 += 1;
      }

      // --- 3M ---
      if (lifetime >= 3) {
        result[teacher].eligible3 += 1;
        if (!isInactive) result[teacher].active3 += 1;
      }

      // --- 6M ---
      if (lifetime >= 6) {
        result[teacher].eligible6 += 1;
        if (!isInactive) result[teacher].active6 += 1;
      }
    });

    const final: Record<
      string,
      {
        r1: number;
        r3: number;
        r6: number;
        c1: [number, number]; // [active, eligible]
        c3: [number, number];
        c6: [number, number];
      }
    > = {};

    Object.keys(result).forEach((teacher) => {
      const r = result[teacher];

      final[teacher] = {
        r1: r.eligible1 ? 100 : 0,
        r3: r.eligible3
          ? Number(((r.active3 / r.eligible3) * 100).toFixed(1))
          : 0,
        r6: r.eligible6
          ? Number(((r.active6 / r.eligible6) * 100).toFixed(1))
          : 0,

        // ✅ ADD COUNTS
        c1: [r.active1, r.eligible1],
        c3: [r.active3, r.eligible3],
        c6: [r.active6, r.eligible6],
      };
    });

    return final;
  }, [classnotes, students]);

  const teacherDeactivation = useMemo(() => {
    const lastMap: Record<string, Date> = {};
    const teacherMap: Record<string, string> = {};

    const now = new Date();
    const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;

    // 1. get last class per student
    classnotes.forEach((cn) => {
      const d = toDate(cn.date || cn.class_date);
      if (!d || !cn.student_name) return;

      const name = cn.student_name;
      const teacher = cn.teacher_name || "—";

      teacherMap[name] = teacher;

      if (!lastMap[name] || lastMap[name] < d) {
        lastMap[name] = d;
      }
    });

    // 2. check deactivation condition
    const total: Record<string, number> = {};
    const monthly: Record<string, Record<string, number>> = {};

    Object.keys(lastMap).forEach((name) => {
      const last = lastMap[name];
      const teacher = teacherMap[name] || "—";

      const student = students.find((s) => s.name === name);
      const credits = student?.credits ?? 0;

      const isInactive =
        now.getTime() - last.getTime() > THREE_WEEKS &&
        credits <= 0;

      if (!isInactive) return;

      // ✅ total
      total[teacher] = (total[teacher] || 0) + 1;

      // ✅ monthly (based on LAST CLASS DATE)
      const key = `${last.getFullYear()}-${String(
        last.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthly[teacher]) monthly[teacher] = {};
      monthly[teacher][key] = (monthly[teacher][key] || 0) + 1;
    });

    return { total, monthly };
  }, [classnotes, students]);

  const teacherMonthlyHours = useMemo(() => {
  const map: Record<string, Record<string, number>> = {};

  classnotes.forEach((cn) => {
    const teacher = cn.teacher_name || "—";
    const d = toDate(cn.date || cn.class_date);
    if (!d) return;

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!map[teacher]) map[teacher] = {};
    map[teacher][key] = (map[teacher][key] || 0) + 1; // 1 class = 1 hour
  });

  return map;
  }, [classnotes]);

  const teacherMonthlyStats = useMemo(() => {
  if (!selectedYear || !selectedMonth) return {};

  const target = `${selectedYear}-${selectedMonth}`;

  const activeSet: Record<string, Set<string>> = {};
  const firstMap: Record<string, Date> = {};
  const teacherMap: Record<string, string> = {};
  const paidCancels: Record<string, number> = {};

  // --- CLASSNOTES LOOP ---
  classnotes.forEach((cn: any) => {
    const d = toDate(cn.date || cn.class_date);
    if (!d || !cn.student_name) return;

    const teacher = cn.teacher_name || "—";
    const name = cn.student_name;

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

    // track teacher
    teacherMap[name] = teacher;

    // ACTIVE (monthly unique students)
    if (key === target) {
      if (!activeSet[teacher]) activeSet[teacher] = new Set();
      activeSet[teacher].add(name);
    }

    // FIRST CLASS (for new students)
    if (!firstMap[name] || firstMap[name] > d) {
      firstMap[name] = d;
    }

    // PAID CANCELS
    if (
      key === target &&
      (cn.reason || "").toLowerCase().includes("paid")
    ) {
      paidCancels[teacher] = (paidCancels[teacher] || 0) + 1;
    }
  });

  // --- NEW STUDENTS ---
  const newStudents: Record<string, number> = {};

  Object.entries(firstMap).forEach(([name, firstDate]) => {
    const key = `${firstDate.getFullYear()}-${String(
      firstDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (key === target) {
      const teacher = teacherMap[name] || "—";
      newStudents[teacher] = (newStudents[teacher] || 0) + 1;
    }
  });

  return {
    active: Object.fromEntries(
      Object.entries(activeSet).map(([t, set]) => [t, set.size])
    ),
    newStudents,
    paidCancels,
  };
}, [classnotes, selectedYear, selectedMonth]);

  const teachers = useMemo(
    () => Array.from(new Set(students.map((s) => s.teacher))),
    [students]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [studentRes, noteRes, consultRes] = await Promise.all([
        fetch("/api/studentList"),
        fetch("/api/classnote/all"),
        fetch("/api/consultations"), 
      ]);

      const consultJson = await consultRes.json().catch(() => []);
      const consultRaw = consultJson?.data || [];

      setConsultations(consultRaw);

      const sJson = await studentRes.json().catch(() => []);
      const cJson = await noteRes.json().catch(() => []);

      const sRaw: StudentInfo[] = Array.isArray(sJson)
        ? sJson
        : sJson?.data || [];

      const cRaw: ClassnoteEntry[] = cJson?.data || [];

      const mapped = sRaw.map((s, i) => ({
        id: String(s._id || s.id || i),
        name: studentName(s, i),
        teacher: teacherName(s),
        credits: toNumber(s.credits),
      }));

      setStudents(mapped);
      setClassnotes(cRaw);
      setLoading(false);
    };

    load();
  }, []);

  const [consultations, setConsultations] = useState<any[]>([]);

  const consultationMonthly = useMemo(() => {
    const map: Record<string, number> = {};

    consultations.forEach((c) => {
      if (c.teacher_name !== selectedTeacher) return;

      const d = toDate(c.date);
      if (!d) return;

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [consultations, selectedTeacher]);

  useEffect(() => {
    if (viewMode !== "table") return;

    const loadTable = async () => {
      setTableLoading(true);

      try {
        const res = await fetch("/api/teacher-performance");
        const json = await res.json();

        setRawTableData(json);
        setFilteredTableData(json); // initial full data
      } catch (e) {
        console.error("table fetch error", e);
        setRawTableData([]);
        setFilteredTableData([]);
      }

      setTableLoading(false);
    };

    loadTable();
  }, [viewMode]);

  useEffect(() => {
    if (teachers.length && !selectedTeacher) {
      setSelectedTeacher(teachers[0]);
    }
  }, [teachers, selectedTeacher]);

  /* ---------------- ACTIVE STUDENTS ---------------- */

  /* ---------------- LOW CREDIT ---------------- */

  const lowCredit = useMemo(() => {
    return students.filter((s) => s.credits < 0);
  }, [students]);

    /* ---------------- REFUND RESERVE ---------------- */

  const refundReserve = useMemo(() => {
    const CREDIT_UNIT_PRICE = 60000;

    const totalOutstandingCredits = students.reduce((sum, s) => {
      const credits = Number(s.credits) || 0;
      return credits > 0 ? sum + credits : sum;
    }, 0);

    const estimatedRefundAmount = totalOutstandingCredits * CREDIT_UNIT_PRICE;

    return {
      totalOutstandingCredits,
      estimatedRefundAmount,
    };
  }, [students]);

  /* ---------------- MONTHLY REVENUE ---------------- */

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};

    classnotes.forEach((cn) => {
      const d = toDate(cn.date || cn.class_date);
      if (!d) return;

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      map[key] = (map[key] || 0) + 70000;
    });

    return Object.entries(map).sort().slice(-6);
  }, [classnotes]);

  const maxRevenue = Math.max(...monthlyRevenue.map(([, v]) => v), 1);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-gray-500">이번 달 활성 학생</div>
          <div className="text-3xl font-bold mt-2">{Object.values(teacherMonthlyStats.active || {}).reduce((a, b) => a + b, 0)}</div>
        </Card>

        <Card>
          <CardHeader title="0 Credit 미만 학생" />
          <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
            {lowCredit.map((s) => (
              <div key={s.id}>
                <div className="text-xs text-gray-500">{s.teacher}</div>
                <div className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-rose-500 font-semibold">
                    {s.credits}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-500">추가 KPI</div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-semibold text-gray-900">
              Extra Credits: {refundReserve.totalOutstandingCredits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              ₩{refundReserve.estimatedRefundAmount.toLocaleString()}
            </div>
          </div>
        </Card>
      </div>

      {/* MONTHLY REVENUE */}
      <Card>
        <CardHeader title="월별 매출" />
        <div className="mt-6 h-[220px] flex items-end gap-4">
          {monthlyRevenue.map(([month, value]) => {
            const height = (value / maxRevenue) * 180;

            return (
              <div key={month} className="flex-1 flex flex-col items-center justify-end">
                <div className="text-xs mb-1">₩{value.toLocaleString()}</div>
                <div className="w-full bg-blue-500 rounded-md" style={{ height: `${Math.max(height, 8)}px` }} />
                <div className="text-xs mt-2 text-gray-600">{month.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* GLOBAL TAB */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("graph")}
          className={`px-3 py-1 text-sm rounded-lg border ${
            viewMode === "graph"
              ? "bg-black text-white"
              : "bg-white text-gray-600"
          }`}
        >
          Graph
        </button>

        <button
          onClick={() => setViewMode("table")}
          className={`px-3 py-1 text-sm rounded-lg border ${
            viewMode === "table"
              ? "bg-black text-white"
              : "bg-white text-gray-600"
          }`}
        >
          Table
        </button>
      </div>

      {/* ROI CARD */}
      <Card>
        

      {viewMode === "graph" && (
        <div className="mt-4 space-y-6">

          {/* ---------------- CARD 1: TEACHER GRAPH ---------------- */}
          <Card>
            <div className="space-y-6">
              <CardHeader title="Teacher Performance vs Monthly Average" />

              {/* SELECT */}
              <div className="flex justify-between items-center">
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm"
                >
                  {teachers.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* GRAPH */}
              <div className="h-[180px] relative">
                {(() => {
                  const teacherMonthlyMap: Record<string, Set<string>> = {};

                  classnotes.forEach((cn) => {
                    if (cn.teacher_name !== selectedTeacher) return;

                    const d = toDate(cn.date || cn.class_date);
                    if (!d) return;

                    const key = `${d.getFullYear()}-${String(
                      d.getMonth() + 1
                    ).padStart(2, "0")}`;

                    if (!teacherMonthlyMap[key]) teacherMonthlyMap[key] = new Set();
                    if (cn.student_name) {
                      teacherMonthlyMap[key].add(cn.student_name);
                    }
                  });

                  const teacherMonthly = Object.entries(teacherMonthlyMap)
                    .map(([month, set]) => ({
                      month,
                      count: set.size,
                    }))
                    .sort((a, b) => a.month.localeCompare(b.month))
                    .slice(-6);

                  const globalMap: Record<string, Record<string, Set<string>>> = {};

                  classnotes.forEach((cn) => {
                    const teacher = cn.teacher_name || "—";
                    const d = toDate(cn.date || cn.class_date);
                    if (!d) return;

                    const month = `${d.getFullYear()}-${String(
                      d.getMonth() + 1
                    ).padStart(2, "0")}`;

                    if (!globalMap[month]) globalMap[month] = {};
                    if (!globalMap[month][teacher])
                      globalMap[month][teacher] = new Set();

                    if (cn.student_name) {
                      globalMap[month][teacher].add(cn.student_name);
                    }
                  });

                  const globalMonthlyAvg = Object.entries(globalMap)
                    .map(([month, teacherMap]) => {
                      const teacherCounts = Object.values(teacherMap).map(
                        (set) => set.size
                      );

                      const avg =
                        teacherCounts.reduce((a, b) => a + b, 0) /
                        (teacherCounts.length || 1);

                      return { month, avg };
                    })
                    .sort((a, b) => a.month.localeCompare(b.month))
                    .slice(-6);

                  const allValues = [
                    ...teacherMonthly.map((m) => m.count),
                    ...globalMonthlyAvg.map((m) => m.avg),
                  ];

                  const max = Math.max(...allValues, 1);

                  return (
                    <div className="flex items-end gap-4 h-full relative">

                      {/* LINE */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="red"
                          strokeWidth="1.5"
                          points={globalMonthlyAvg
                            .map((m, i) => {
                              const total = globalMonthlyAvg.length;
                              const x = (i / (total - 1 || 1)) * 100;
                              const y = 100 - (m.avg / max) * 100;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                        />
                      </svg>

                      {/* BARS */}
                      {teacherMonthly.map((m) => {
                        const height = (m.count / max) * 160;

                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center justify-end">
                            <div className="text-xs mb-1">{m.count}</div>
                            <div className="w-full bg-indigo-500 rounded-md" style={{ height: `${Math.max(height, 6)}px` }} />
                            <div className="text-xs mt-2 text-gray-600">
                              {m.month.slice(5)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* ---------------- CARD 2: STUDENT FLOW (TEACHER BASED) ---------------- */}
          <Card>
            <div className="space-y-6">
              <CardHeader title="Student Flow (Join vs Quit)" />

              {/* SELECT */}
              <div className="flex justify-between items-center relative z-10">
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm"
                >
                  {teachers.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* GRAPH */}
              <div className="mt-6 h-[220px] flex items-end gap-4 relative z-0">
                {(() => {
                  const firstMap: Record<string, Date> = {};
                  const lastMap: Record<string, Date> = {};
                  const studentTeacherMap: Record<string, string> = {};

                  const now = new Date();
                  const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;

                  classnotes.forEach((cn) => {
                    const d = toDate(cn.date || cn.class_date);
                    if (!d || !cn.student_name) return;

                    const name = cn.student_name;
                    const teacher = cn.teacher_name || "—";

                    studentTeacherMap[name] = teacher;

                    if (!firstMap[name] || firstMap[name] > d) {
                      firstMap[name] = d;
                    }

                    if (!lastMap[name] || lastMap[name] < d) {
                      lastMap[name] = d;
                    }
                  });

                  const joinMap: Record<string, number> = {};
                  const quitMap: Record<string, number> = {};

                  Object.keys(firstMap).forEach((name) => {
                    if (studentTeacherMap[name] !== selectedTeacher) return;

                    const first = firstMap[name];
                    const last = lastMap[name];

                    if (!first || !last) return;

                    const joinKey = `${first.getFullYear()}-${String(
                      first.getMonth() + 1
                    ).padStart(2, "0")}`;

                    joinMap[joinKey] = (joinMap[joinKey] || 0) + 1;

                    const isInactive =
                      now.getTime() - last.getTime() > THREE_WEEKS;

                    if (isInactive) {
                      const quitKey = `${last.getFullYear()}-${String(
                        last.getMonth() + 1
                      ).padStart(2, "0")}`;

                      quitMap[quitKey] = (quitMap[quitKey] || 0) + 1;
                    }
                  });

                  const allMonths = Array.from(
                    new Set([...Object.keys(joinMap), ...Object.keys(quitMap)])
                  )
                    .sort()
                    .slice(-6);

                  const max = Math.max(
                    ...allMonths.map(
                      (m) => Math.max(joinMap[m] || 0, quitMap[m] || 0)
                    ),
                    1
                  );

                  return allMonths.map((month) => {
                    const join = joinMap[month] || 0;
                    const quit = quitMap[month] || 0;

                    const joinHeight = (join / max) * 180;
                    const quitHeight = (quit / max) * 180;

                    return (
                      <div
                        key={month}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <div className="text-[10px] text-green-600">{join}</div>
                        <div
                          className="w-full bg-green-500 rounded-md"
                          style={{ height: `${Math.max(joinHeight, 4)}px` }}
                        />

                        <div className="text-[10px] text-rose-500">{quit}</div>
                        <div
                          className="w-full bg-rose-500 rounded-md"
                          style={{ height: `${Math.max(quitHeight, 4)}px` }}
                        />

                        <div className="text-xs mt-2 text-gray-600">
                          {month.slice(5)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* LEGEND */}
              <div className="flex gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm" />
                  Joined
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                  Quit
                </div>
              </div>
            </div>
          </Card>

          {/* ---------------- CARD 3: CONSULTATIONS (MONTHLY) ---------------- */}
          <Card>
            <div className="space-y-6">
              <CardHeader title="Consultations (Monthly)" />

              {/* SELECT (same pattern as other charts) */}
              <div className="flex justify-between items-center">
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm"
                >
                  {teachers.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* GRAPH */}
              <div className="h-[180px] flex items-end gap-4">
                {(() => {
                  const max = Math.max(
                    ...consultationMonthly.map((m) => m.count),
                    1
                  );

                  return consultationMonthly.map((m) => {
                    const height = (m.count / max) * 160;

                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center justify-end"
                      >
                        <div className="text-xs mb-1">{m.count}</div>

                        <div
                          className="w-full bg-purple-500 rounded-md"
                          style={{ height: `${Math.max(height, 6)}px` }}
                        />

                        <div className="text-xs mt-2 text-gray-600">
                          {m.month.slice(5)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </Card>


        </div>
      )}

      {viewMode === "table" && (
      <div className="space-y-3">

        {/* 🔥 FILTER BAR (ADD THIS) */}
        <div className="flex gap-2 items-center">

          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            <option value="">Year</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {/* MONTH */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>

          {/* 🔍 SEARCH BUTTON */}
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-black text-white text-sm rounded-lg"
          >
            검색
          </button>

          {/* RESET (optional but VERY useful) */}
          <button
            onClick={() => {
              setSelectedYear("");
              setSelectedMonth("");
              setFilteredTableData(rawTableData);
            }}
            className="px-3 py-1.5 border text-sm rounded-lg"
          >
            초기화
          </button>

        </div>
        

        {/* 🧾 TABLE */}
        <div className="border rounded-xl overflow-x-auto overflow-y-visible bg-white">

          {tableLoading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading table...
            </div>
          ) : (
            <table className="min-w-[1200px] w-full text-xs">

              {/* HEADER */}
              <thead className="bg-gray-100 text-gray-600 sticky top-0 z-0">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <TooltipHeader
                      label="Teacher"
                      description="The teacher currently assigned to the student."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Start Date"
                      description="The approximate first registration date of students under this teacher."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Monthly Active Students"
                      description="Students who are currently active. A student is considered inactive if they have not attended a class for 3 weeks and have 0 or negative credits."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Total Hours"
                      description="Total teaching hours calculated from all classnotes using duration (in hours)."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Monthly Hours"
                      description="Total teaching hours for the selected month based on classnote count (1 class = 1 hour)."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Total Deactivated"
                      description="Number of students who have not attended a class for over 3 weeks AND have 0 or negative credits."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Monthly Deactivated"
                      description="Number of students who became inactive in the selected month based on their last class date (inactive = no class for 3 weeks + credits ≤ 0)."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Monthly New Students"
                      description="Students who registered for the first time during the current month (based on createdAt)."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Level Tests"
                      description="Currently not tracked. Placeholder for future metric."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Monthly Paid Cancels"
                      description="Number of classes marked as paid cancellations based on classnote reason or type."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Retention (1M)"
                      description="Percentage of students who stayed longer than 1 month after enrollment."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Retention (3M)"
                      description="Percentage of students who stayed longer than 3 months."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Retention (6M)"
                      description="Percentage of students who stayed longer than 6 months."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Repayment Rate"
                      description="Percentage of students who paid again after the initial payment"
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Avg Student Lifetime"
                      description="Average duration students stayed (months), excluding top/bottom 10%."
                    />
                  </th>

                  <th className="px-3 py-2">
                    <TooltipHeader
                      label="Teacher Tenure"
                      description="Total duration the teacher has been active (months)."
                    />
                  </th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {filteredTableData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-2 font-medium">
                      {row.teacher}
                    </td>

                    <td className="px-3 py-2">
                      {row.startDate}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {teacherMonthlyStats.active?.[row.teacher] || 0}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.totalHours}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {(() => {
                        if (!selectedYear || !selectedMonth) return "-";

                        const key = `${selectedYear}-${selectedMonth}`;
                        return teacherMonthlyHours[row.teacher]?.[key] || 0;
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center text-rose-500 font-semibold">
                      {teacherDeactivation.total[row.teacher] || 0}
                    </td>

                    <td className="px-3 py-2 text-center text-rose-400">
                      {(() => {
                        if (!selectedYear || !selectedMonth) return "-";

                        const key = `${selectedYear}-${selectedMonth}`;
                        return (
                          teacherDeactivation.monthly[row.teacher]?.[key] || 0
                        );
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center text-green-600 font-semibold">
                      {teacherMonthlyStats.newStudents?.[row.teacher] || 0}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.levelTests}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {teacherMonthlyStats.paidCancels?.[row.teacher] || 0}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const r = teacherRetention[row.teacher];
                        return (
                          <div className="flex flex-col items-center">
                            <span>{r.r1}%</span>
                            <span className="text-[10px] text-gray-400">
                              ({r.c1[0]}/{r.c1[1]})
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const r = teacherRetention[row.teacher];
                        if (!r) return "-";

                        return (
                          <div className="flex flex-col items-center leading-tight">
                            <span>{r.r3}%</span>
                            <span className="text-[10px] text-gray-400">
                              ({r.c3[0]}/{r.c3[1]})
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const r = teacherRetention[row.teacher];
                        return (
                          <div className="flex flex-col items-center">
                            <span>{r.r6}%</span>
                            <span className="text-[10px] text-gray-400">
                              ({r.c6[0]}/{r.c6[1]})
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center text-blue-600 font-semibold">
                      {teacherRepayment[row.teacher] ?? "-"}%
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.avgStudentLifetime ?? "-"} mo
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.teacherTenure ?? "-"} mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      )}
      </Card>
    </div>
  );
}

/* ---------------- UI ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border">{children}</div>;
}

function CardHeader({ title }: { title: string }) {
  return <div className="font-semibold text-gray-900">{title}</div>;
}

function TooltipHeader({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="relative group flex items-center justify-center gap-1 cursor-default">
      <span>{label}</span>

      {/* small info dot */}
      <span className="text-[10px] text-gray-400 border rounded-full px-[4px]">
        i
      </span>

      {/* tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 p-2 text-[11px] text-left bg-black text-white rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none z-[9999] shadow-lg">
        {description}
      </div>
    </div>
  );
}