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

type TeacherRevenue = {
  teacher: string;
  revenue: number; // 완료수업 기반 매출
  classes: number;
  students: number;
};

type MonthRevenue = {
  monthKey: string; // YYYY-MM
  label: string; // "2026. 01"
  revenue: number;
  classes: number;
};

/* -------------------------------- UTILS -------------------------------- */

const DEFAULT_RATE = 50000;

const CURRENCY = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function monthKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}. ${m}`;
}

function monthRangeFromKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  // Admin billing page의 검색 API가 "YYYY. MM. DD." 형태를 쓰는 것 같아서 동일하게 맞춤
  const dot = (d: Date) => `${d.getFullYear()}. ${pad2(d.getMonth() + 1)}. ${pad2(d.getDate())}.`;
  return { from: dot(start), to: dot(end) };
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractRate(s: StudentInfo): number {
  const candidates = [
    toNumber(s.hourlyRate),
    toNumber(s.feePerClass),
    toNumber(s.fee_per_class),
    toNumber(s.classFee),
    toNumber(s.class_fee),
    toNumber(s.tuition),
    toNumber(s.tuitionPerClass),
  ].filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);

  return candidates[0] ?? DEFAULT_RATE;
}

function extractCredits(s: StudentInfo): number {
  const c = toNumber(s.credits);
  return c && c > 0 ? c : 0;
}

function studentId(s: StudentInfo, fallbackIndex: number) {
  return String(s._id ?? s.id ?? fallbackIndex);
}

function studentName(s: StudentInfo, fallbackIndex: number) {
  return String(s.student_name ?? s.name ?? `학생-${fallbackIndex + 1}`);
}

function teacherName(s: StudentInfo) {
  return String(s.teacher ?? s.teacher_name ?? "—").trim() || "—";
}

function getLastNMonths(n = 6) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKeyFromDate(dt));
  }
  return keys;
}

/* -------------------------------- PAGE -------------------------------- */

export default function AdminBillingHomeFancy() {
  const searchParams = useSearchParams();
  const currentUser = (searchParams.get("user") || "").trim();
  const type = searchParams.get("type") || "teacher";
  const id = searchParams.get("id") || "";

  const baseQuery = `?user=${encodeURIComponent(currentUser)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentFinancial[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [monthKeys] = useState<string[]>(() => getLastNMonths(6));

  // monthKey -> classnotes[]
  const [classnotesByMonth, setClassnotesByMonth] = useState<Record<string, ClassnoteEntry[]>>({});
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // -------------------- load base data --------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [teacherRes, studentRes] = await Promise.all([
          fetch("/api/teacher", { cache: "no-store" }).catch(() => null),
          fetch("/api/studentList", { cache: "no-store" }).catch(() => null),
        ]);

        // teachers
        let teacherList: string[] = [];
        if (teacherRes?.ok) {
          const t = await teacherRes.json().catch(() => []);
          if (Array.isArray(t)) teacherList = t.map((x: any) => String(x?.name || "").trim()).filter(Boolean);
        }

        // students -> financial minimal snapshot
        let sRaw: StudentInfo[] = [];
        if (studentRes?.ok) {
          const s = await studentRes.json().catch(() => []);
          if (Array.isArray(s)) sRaw = s;
        }

        const mapped: StudentFinancial[] = sRaw.map((s, idx) => ({
          id: studentId(s, idx),
          name: studentName(s, idx),
          teacher: teacherName(s),
          credits: extractCredits(s),
          hourlyRate: extractRate(s),
        }));

        // union teacher names (student side included)
        const teacherSet = new Set<string>(teacherList);
        mapped.forEach((m) => teacherSet.add(m.teacher));
        const mergedTeachers = Array.from(teacherSet).filter(Boolean).sort((a, b) => a.localeCompare(b, "en"));

        setTeachers(mergedTeachers);
        setStudents(mapped);
      } catch (e) {
        console.error(e);
        setTeachers([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -------------------- load classnotes for last N months --------------------
  useEffect(() => {
    if (loading) return;
    if (teachers.length === 0) return;

    const loadMonthly = async () => {
      setMonthlyLoading(true);
      try {
        const results: Record<string, ClassnoteEntry[]> = {};

        // month별로 한번씩 classnote/search 호출
        await Promise.all(
          monthKeys.map(async (mk) => {
            const { from, to } = monthRangeFromKey(mk);
            const params = new URLSearchParams();
            params.set("from", from);
            params.set("to", to);

            // 학생 전체를 넣기보다는 "teacher별 classnote"를 검색하는게 이상적이지만,
            // 지금 네 API는 student_name append를 지원하니까 학생 목록을 다 넣어서 정확히 가져옴.
            // (학생 수가 많아지면 여기 최적화 필요: month별 학생 chunking / server aggregation API 추천)
            students.forEach((s) => {
              if (s.name) params.append("student_name", s.name);
            });

            const res = await fetch(`/api/classnote/search?${params.toString()}`, { cache: "no-store" }).catch(() => null);
            if (!res?.ok) {
              results[mk] = [];
              return;
            }
            const data = await res.json().catch(() => []);
            results[mk] = Array.isArray(data)
              ? data.map((x: any) => ({
                  ...x,
                  date: x?.date ?? x?.class_date,
                  teacher_name: x?.teacher_name,
                  student_name: x?.student_name,
                }))
              : [];
          })
        );

        setClassnotesByMonth(results);
      } catch (e) {
        console.error(e);
        setClassnotesByMonth({});
      } finally {
        setMonthlyLoading(false);
      }
    };

    loadMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, teachers.length, students.length]); // monthKeys는 고정

  // -------------------- derived: teacher revenue (latest month) --------------------
  const latestMonthKey = monthKeys[0] || monthKeyFromDate(new Date());

  const teacherRevenueLatest = useMemo<TeacherRevenue[]>(() => {
    const notes = classnotesByMonth[latestMonthKey] ?? [];
    const studentMap = new Map<string, StudentFinancial>();
    students.forEach((s) => studentMap.set(s.name.trim(), s));

    const agg: Record<string, TeacherRevenue> = {};
    notes.forEach((cn) => {
      const sName = String(cn.student_name || "").trim();
      if (!sName) return;
      const st = studentMap.get(sName);
      if (!st) return;

      const t = st.teacher || String(cn.teacher_name || "—").trim() || "—";
      if (!agg[t]) agg[t] = { teacher: t, revenue: 0, classes: 0, students: 0 };

      agg[t].classes += 1;
      agg[t].revenue += st.hourlyRate;
    });

    // student count per teacher (전체 배정 수)
    const teacherStudentCount: Record<string, number> = {};
    students.forEach((s) => {
      teacherStudentCount[s.teacher] = (teacherStudentCount[s.teacher] || 0) + 1;
    });

    const arr = Object.values(agg).map((x) => ({
      ...x,
      students: teacherStudentCount[x.teacher] ?? 0,
    }));

    // teacher가 아예 이번달 classnote 0이면 리스트에 안 뜨니까, 0도 포함시키고 싶으면 여기 확장 가능
    return arr.sort((a, b) => b.revenue - a.revenue);
  }, [classnotesByMonth, latestMonthKey, students]);

  // -------------------- derived: monthly academy revenue --------------------
  const monthlyAcademyRevenue = useMemo<MonthRevenue[]>(() => {
    const studentMap = new Map<string, StudentFinancial>();
    students.forEach((s) => studentMap.set(s.name.trim(), s));

    return monthKeys
      .map((mk) => {
        const notes = classnotesByMonth[mk] ?? [];
        let revenue = 0;
        let classes = 0;

        notes.forEach((cn) => {
          const sName = String(cn.student_name || "").trim();
          if (!sName) return;
          const st = studentMap.get(sName);
          if (!st) return;

          classes += 1;
          revenue += st.hourlyRate;
        });

        return {
          monthKey: mk,
          label: monthLabel(mk),
          revenue,
          classes,
        };
      })
      .sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1)); // old -> new for chart
  }, [classnotesByMonth, monthKeys, students]);

  const latestMonthRevenue = monthlyAcademyRevenue[monthlyAcademyRevenue.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = monthlyAcademyRevenue[monthlyAcademyRevenue.length - 2]?.revenue ?? 0;
  const momDelta = latestMonthRevenue - prevMonthRevenue;
  const momPct = prevMonthRevenue > 0 ? (momDelta / prevMonthRevenue) * 100 : null;

  // -------------------- low credit list --------------------
  const lowCredit = useMemo(() => {
    return students
      .filter((s) => s.credits <= 2)
      .sort((a, b) => a.credits - b.credits)
      .slice(0, 8);
  }, [students]);

  // -------------------- UI --------------------
  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">학원 Admin Dashboard</h1>
              <p className="mt-2 text-sm text-gray-500">
                전체 현황 요약 · 월별 매출 비교 · 리스크 학생 · 교사 성과
              </p>
            </div>

          </div>

          {/* BIG KPIs */}
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <BigKpi
              className="lg:col-span-4"
              title="이번달 학원 총매출"
              value={CURRENCY.format(Math.round(latestMonthRevenue))}
              sub={
                momPct === null
                  ? "이전달 데이터 없음"
                  : `전월 대비 ${momDelta >= 0 ? "+" : ""}${CURRENCY.format(Math.round(momDelta))} (${momDelta >= 0 ? "+" : ""}${momPct.toFixed(1)}%)`
              }
              badge="MONTHLY"
            />
            <BigKpi
              className="lg:col-span-4"
              title="전체 학생 수"
              value={`${students.length}명`}
              sub="studentList 기반"
              badge="STUDENTS"
            />
            <BigKpi
              className="lg:col-span-4"
              title="⚠️ 크레딧 부족 학생"
              value={`${lowCredit.length}명`}
              sub="2회 이하 기준"
              badge="RISK"
              danger
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* MONTHLY CHART */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader
              title="학원 전체 매출 (월별 비교)"
              subtitle={monthlyLoading ? "월별 데이터 계산 중…" : "완료수업(classnote) × 학생 요금(hourlyRate) 합산"}
            />
            <div className="mt-6">
              <RevenueBars data={monthlyAcademyRevenue} />
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {monthlyAcademyRevenue.slice(-4).map((m) => (
                  <MiniStat
                    key={m.monthKey}
                    label={m.label}
                    value={CURRENCY.format(Math.round(m.revenue))}
                    sub={`${m.classes} classes`}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader title="⚠️ 크레딧 부족 TOP" subtitle="2회 이하 (우선 연락 필요)" />
            <div className="mt-5 space-y-3">
              {lowCredit.length === 0 ? (
                <EmptyFancy text="모든 학생이 안전한 상태입니다 👍" />
              ) : (
                lowCredit.map((s) => (
                  <RiskRow
                    key={s.id}
                    name={s.name}
                    teacher={s.teacher}
                    right={`${s.credits}회`}
                    href={`/teacher/admin_billing_1/detail${baseQuery}`} // 필요하면 student detail 링크로 바꿔도 됨
                  />
                ))
              )}
            </div>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader title={`🏆 교사 성과 (이번달: ${monthLabel(latestMonthKey)})`} subtitle="완료 수업 기반 매출" />
            <div className="mt-6 space-y-3">
              {teacherRevenueLatest.length === 0 ? (
                <EmptyFancy text="이번달 완료수업 데이터가 없습니다." />
              ) : (
                teacherRevenueLatest.slice(0, 8).map((t, idx) => (
                  <TeacherRow
                    key={t.teacher}
                    rank={idx + 1}
                    teacher={t.teacher}
                    revenue={t.revenue}
                    classes={t.classes}
                    students={t.students}
                    maxRevenue={teacherRevenueLatest[0]?.revenue || 1}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* TEACHER PERFORMANCE */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">


          <Card className="lg:col-span-5">
            <CardHeader title="Quick Actions" subtitle="운영자가 자주 쓰는 메뉴" />
            
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ UI PARTS ------------------------------ */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xl font-semibold text-gray-900">{title}</div>
      {subtitle ? <div className="text-sm text-gray-500">{subtitle}</div> : null}
    </div>
  );
}

function BigKpi({
  title,
  value,
  sub,
  badge,
  danger,
  className = "",
}: {
  title: string;
  value: string;
  sub?: string;
  badge: string;
  danger?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm ${
        danger ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
          danger ? "bg-rose-200 text-rose-800" : "bg-slate-100 text-slate-700"
        }`}>
          {badge}
        </span>
      </div>
      <div className={`mt-3 text-3xl font-semibold ${danger ? "text-rose-700" : "text-gray-900"}`}>
        {value}
      </div>
      {sub ? <div className="mt-2 text-sm text-gray-600">{sub}</div> : null}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

function EmptyFancy({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-gray-600">
      {text}
    </div>
  );
}

function RiskRow({
  name,
  teacher,
  right,
  href,
}: {
  name: string;
  teacher: string;
  right: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border border-rose-200 bg-white px-4 py-3 hover:bg-rose-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-rose-700">{name}</div>
          <div className="text-xs text-gray-500">{teacher}</div>
        </div>
        <div className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
          {right}
        </div>
      </div>
    </Link>
  );
}

function TeacherRow({
  rank,
  teacher,
  revenue,
  classes,
  students,
  maxRevenue,
}: {
  rank: number;
  teacher: string;
  revenue: number;
  classes: number;
  students: number;
  maxRevenue: number;
}) {
  const pct = maxRevenue > 0 ? Math.min(100, (revenue / maxRevenue) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
            #{rank}
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900">{teacher}</div>
            <div className="text-xs text-gray-500">
              {students}명 · {classes} classes
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{CURRENCY.format(Math.round(revenue))}</div>
          <div className="text-xs text-gray-500">이번달 완료수업 기반</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * 아주 간단한 “바 차트 느낌” 컴포넌트 (외부 라이브러리 없이)
 * - data: old -> new 순으로 렌더
 */
function RevenueBars({ data }: { data: { label: string; revenue: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const w = Math.round((d.revenue / max) * 100);
        return (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs font-semibold text-gray-600">{d.label}</div>
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-indigo-500" style={{ width: `${w}%` }} />
              </div>
            </div>
            <div className="w-36 shrink-0 text-right text-sm font-semibold text-gray-900">
              {CURRENCY.format(Math.round(d.revenue))}
            </div>
          </div>
        );
      })}
    </div>
  );
}