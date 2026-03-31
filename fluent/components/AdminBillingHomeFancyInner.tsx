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
  const teachers = useMemo(
    () => Array.from(new Set(students.map((s) => s.teacher))),
    [students]
  );

const [selectedTeacher, setSelectedTeacher] = useState("");

  const [roiMode,] = useState<"1m" | "3m" | "6m">("3m");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [studentRes, noteRes] = await Promise.all([
        fetch("/api/studentList"),
        fetch("/api/classnote/all"),
      ]);

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

  useEffect(() => {
    if (teachers.length && !selectedTeacher) {
      setSelectedTeacher(teachers[0]);
    }
  }, [teachers, selectedTeacher]);

  /* ---------------- ACTIVE STUDENTS ---------------- */

  const activeStudents = useMemo(() => {
    const now = new Date();
    const set = new Set<string>();

    classnotes.forEach((cn) => {
      const d = toDate(cn.date || cn.class_date);
      if (!d) return;

      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        if (cn.student_name) set.add(cn.student_name);
      }
    });

    return set.size;
  }, [classnotes]);

  /* ---------------- LOW CREDIT ---------------- */

  const lowCredit = useMemo(() => {
    return students.filter((s) => s.credits < 0);
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

      map[key] = (map[key] || 0) + 40000;
    });

    return Object.entries(map).sort().slice(-6);
  }, [classnotes]);

  const maxRevenue = Math.max(...monthlyRevenue.map(([, v]) => v), 1);

  /* ---------------- ROI ---------------- */

  // const roiByTeacher = useMemo(() => {
  //   const studentMap = new Map<string, ClassnoteEntry[]>();

  //   classnotes.forEach((cn) => {
  //     const name = cn.student_name || "";
  //     if (!studentMap.has(name)) studentMap.set(name, []);
  //     studentMap.get(name)!.push(cn);
  //   });

  //   const stats: any = {};

  //   students.forEach((s) => {
  //     const notes = studentMap.get(s.name) || [];
  //     if (!notes.length) return;

  //     const dates = notes
  //       .map((n) => toDate(n.date || n.class_date))
  //       .filter(Boolean) as Date[];

  //     if (!dates.length) return;

  //     dates.sort((a, b) => a.getTime() - b.getTime());

  //     const duration =
  //       (dates[dates.length - 1].getTime() - dates[0].getTime()) /
  //       (1000 * 60 * 60 * 24);

  //     const t = s.teacher;

  //     if (!stats[t]) {
  //       stats[t] = { total: 0, quit1m: 0, quit3m: 0, quit6m: 0 };
  //     }

  //     stats[t].total++;

  //     if (duration <= 30) stats[t].quit1m++;
  //     if (duration <= 90) stats[t].quit3m++;
  //     if (duration <= 180) stats[t].quit6m++;
  //   });

  //   return Object.entries(stats).map(([teacher, s]: any) => ({
  //     teacher,
  //     value:
  //       roiMode === "1m"
  //         ? (s.quit1m / s.total) * 100
  //         : roiMode === "3m"
  //         ? (s.quit3m / s.total) * 100
  //         : (s.quit6m / s.total) * 100,
  //   }));
  // }, [students, classnotes, roiMode]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* TOP KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card>
          <div className="text-sm text-gray-500">이번 달 활성 학생</div>
          <div className="text-3xl font-bold mt-2">{activeStudents}</div>
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
          <div className="text-2xl font-semibold mt-2">—</div>
        </Card>
      </div>

      {/* MONTHLY REVENUE GRAPH */}
      <Card>
        <CardHeader title="월별 매출" />

        <div className="mt-6 h-[220px] flex items-end gap-4">
          {monthlyRevenue.map(([month, value]) => {
            const height = (value / maxRevenue) * 180; // actual px height

            return (
              <div key={month} className="flex-1 flex flex-col items-center justify-end">
                
                {/* VALUE */}
                <div className="text-xs mb-1">
                  ₩{value.toLocaleString()}
                </div>

                {/* BAR (FIXED HEIGHT SYSTEM) */}
                <div
                  className="w-full bg-blue-500 rounded-md"
                  style={{
                    height: `${Math.max(height, 8)}px`, // <-- 핵심
                  }}
                />

                {/* MONTH */}
                <div className="text-xs mt-2 text-gray-600">
                  {month.slice(5)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ROI */}
{/* ROI */}
<Card>
  <CardHeader title="Teacher Performance vs Average" />

  <div className="mt-4 space-y-6">

    {/* SELECT + AVG DURATION */}
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

      <div className="text-sm text-gray-500">
        평균 유지:{" "}
        <span className="font-semibold text-black">
          {(() => {
            const studentMap = new Map<string, ClassnoteEntry[]>();

            classnotes.forEach((cn) => {
              const name = cn.student_name || "";
              if (!studentMap.has(name)) studentMap.set(name, []);
              studentMap.get(name)!.push(cn);
            });

            const durations: number[] = [];

            students.forEach((s) => {
              if (s.teacher !== selectedTeacher) return;

              const notes = studentMap.get(s.name) || [];
              if (!notes.length) return;

              const dates = notes
                .map((n) => toDate(n.date || n.class_date))
                .filter(Boolean) as Date[];

              if (!dates.length) return;

              dates.sort((a, b) => a.getTime() - b.getTime());

              const duration =
                (dates[dates.length - 1].getTime() - dates[0].getTime()) /
                (1000 * 60 * 60 * 24);

              durations.push(duration);
            });

            if (!durations.length) return 0;

            return Math.round(
              durations.reduce((a, b) => a + b, 0) / durations.length
            );
          })()}일
        </span>
      </div>
    </div>

    {/* BAR GRAPH */}
    <div className="h-[180px] flex items-end gap-4 relative">
      {(() => {
        /* ---------------- SELECTED TEACHER DATA ---------------- */
        const monthlyMap: Record<string, Set<string>> = {};

        classnotes.forEach((cn) => {
          if (cn.teacher_name !== selectedTeacher) return;

          const d = toDate(cn.date || cn.class_date);
          if (!d) return;

          const key = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!monthlyMap[key]) monthlyMap[key] = new Set();
          if (cn.student_name) {
            monthlyMap[key].add(cn.student_name);
          }
        });

        const monthly = Object.entries(monthlyMap)
          .map(([month, set]) => ({
            month,
            count: set.size,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);

        const max = Math.max(...monthly.map((m) => m.count), 1);

        /* ---------------- GLOBAL AVERAGE ---------------- */
        const globalMonthlyMap: Record<string, Set<string>> = {};

        classnotes.forEach((cn) => {
          const d = toDate(cn.date || cn.class_date);
          if (!d) return;

          const key = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!globalMonthlyMap[key]) globalMonthlyMap[key] = new Set();
          if (cn.student_name) {
            globalMonthlyMap[key].add(cn.student_name);
          }
        });

        const globalMonthly = Object.entries(globalMonthlyMap)
          .map(([month, set]) => ({
            month,
            count: set.size,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);

        const globalAverage =
          globalMonthly.reduce((sum, m) => sum + m.count, 0) /
          (globalMonthly.length || 1);

        const avgHeight = (globalAverage / max) * 140;

        return (
          <>
            {/* 🔴 GLOBAL AVERAGE LINE */}
            <div
              className="absolute left-0 right-0 border-t border-red-400 border-dashed"
              style={{
                bottom: `${avgHeight}px`,
              }}
            >
              <div className="text-[10px] text-red-500 absolute -top-4 right-0">
                Avg {globalAverage.toFixed(1)}
              </div>
            </div>

            {/* BARS */}
            {monthly.map((m) => {
              const height = (m.count / max) * 140;

              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div className="text-xs mb-1">{m.count}</div>

                  <div
                    className={`w-full rounded-md ${
                      m.count >= globalAverage
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                    style={{
                      height: `${Math.max(height, 6)}px`,
                    }}
                  />

                  <div className="text-xs mt-2 text-gray-600">
                    {m.month.slice(5)}
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}
    </div>
  </div>
</Card>
    </div>
  );
}

/* ---------------- UI ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return <div className="font-semibold text-gray-900">{title}</div>;
}