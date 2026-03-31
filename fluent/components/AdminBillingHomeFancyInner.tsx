"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* -------------------------------- TYPES -------------------------------- */

type StudentInfo = {
  _id?: string;
  id?: string;
  student_name?: string;
  name?: string;
  teacher?: string;
  teacher_name?: string;
  credits?: number | string;
  hourlyRate?: number | string;
  feePerClass?: number | string;
  fee_per_class?: number | string;
  classFee?: number | string;
  class_fee?: number | string;
  tuition?: number | string;
  tuitionPerClass?: number | string;
};

type ClassnoteEntry = {
  _id?: string;
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
  hourlyRate: number;
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

function diffDays(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCredits(s: StudentInfo): number {
  return toNumber(s.credits) ?? 0;
}

function studentName(s: StudentInfo, i: number) {
  return s.student_name || s.name || `학생-${i}`;
}

function teacherName(s: StudentInfo) {
  return s.teacher || s.teacher_name || "—";
}

/* -------------------------------- PAGE -------------------------------- */

export default function AdminDashboard() {
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<StudentFinancial[]>([]);
  const [classnotes, setClassnotes] = useState<ClassnoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
        : Array.isArray(sJson?.data)
        ? sJson.data
        : [];

      const cRaw: ClassnoteEntry[] = Array.isArray(cJson?.data)
        ? cJson.data
        : [];

      const mapped = sRaw.map((s: StudentInfo, i: number) => ({
        id: String(s._id || s.id || i),
        name: studentName(s, i),
        teacher: teacherName(s),
        credits: extractCredits(s),
        hourlyRate: 0,
      }));

      setStudents(mapped);
      setClassnotes(cRaw);
      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- LOW CREDIT ---------------- */

  const lowCredit = useMemo(() => {
    return students.filter((s) => s.credits < 0);
  }, [students]);

  /* ---------------- ROI ---------------- */

  const roiByTeacher = useMemo(() => {
    const studentMap = new Map<string, ClassnoteEntry[]>();

    classnotes.forEach((cn) => {
      const name = cn.student_name || "";
      if (!studentMap.has(name)) studentMap.set(name, []);
      studentMap.get(name)!.push(cn);
    });

    const teacherStats: any = {};

    students.forEach((s) => {
      const notes = studentMap.get(s.name) || [];
      if (notes.length === 0) return;

      const dates = notes
        .map((n) => toDate(n.date || n.class_date))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime());

      if (!dates.length) return;

      const duration = diffDays(dates[0], dates[dates.length - 1]);

      const t = s.teacher;

      if (!teacherStats[t]) {
        teacherStats[t] = {
          total: 0,
          quit1m: 0,
          quit3m: 0,
          quit6m: 0,
          durations: [],
        };
      }

      teacherStats[t].total += 1;
      teacherStats[t].durations.push(duration);

      if (duration <= 30) teacherStats[t].quit1m += 1;
      if (duration <= 90) teacherStats[t].quit3m += 1;
      if (duration <= 180) teacherStats[t].quit6m += 1;
    });

    return Object.entries(teacherStats).map(([teacher, stat]: any) => ({
      teacher,
      total: stat.total,
      quit1m: ((stat.quit1m / stat.total) * 100).toFixed(1),
      quit3m: ((stat.quit3m / stat.total) * 100).toFixed(1),
      quit6m: ((stat.quit6m / stat.total) * 100).toFixed(1),
      avgDays: Math.round(
        stat.durations.reduce((a: number, b: number) => a + b, 0) /
          stat.durations.length
      ),
    }));
  }, [students, classnotes]);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

      {/* LOW CREDIT */}
      <Card>
        <CardHeader title="⚠️ 크레딧 음수 학생" />
        <div className="mt-4 space-y-2">
          {lowCredit.length === 0 ? (
            <div className="text-sm text-gray-500">없음 👍</div>
          ) : (
            lowCredit.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span>{s.name} ({s.teacher})</span>
                <span className="text-rose-600 font-semibold">{s.credits}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ROI */}
      <Card>
        <CardHeader title="📊 Teacher ROI (Retention)" subtitle="이탈률 및 유지기간" />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roiByTeacher.map((r) => (
            <div key={r.teacher} className="border rounded-2xl p-4 bg-white">
              <div className="font-semibold">{r.teacher}</div>
              <div className="text-xs text-gray-500">{r.total} students</div>

              <div className="mt-3 text-sm space-y-1">
                <div>1개월 이탈: {r.quit1m}%</div>
                <div>3개월 이탈: {r.quit3m}%</div>
                <div>6개월 이탈: {r.quit6m}%</div>
              </div>

              <div className="mt-3 text-sm font-medium">
                평균 유지: {r.avgDays}일
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- UI ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-gray-900">{title}</div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  );
}