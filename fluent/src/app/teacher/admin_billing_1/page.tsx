"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";

type StudentInfo = {
  id: string;
  name: string;
  phoneNumber?: string;
};

type ScheduleEntry = {
  _id?: string;
  date?: string;
  time?: string | number;
  duration?: string | number;
  room_name?: string;
  teacher_name?: string;
  student_name?: string;
};

type ClassnoteEntry = {
  _id?: string;
  student_name?: string;
  teacher_name?: string;
  date?: string;
  started_at?: string;
  ended_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DiaryEntry = {
  _id?: string;
  student_name?: string;
  class_date?: string;
  date?: string;
  diary_summary?: string;
  original_text?: string;
  [key: string]: any;
};

type QuizletEntry = {
  _id?: string;
  student_name?: string;
  class_date?: string;
  date?: string;
  homework?: string;
  nextClass?: string;
  original_text?: string;
  eng_quizlet?: string[];
  kor_quizlet?: string[];
  [key: string]: any;
};

type StudentRow = {
  student: StudentInfo;
  schedules: ScheduleEntry[];
  nextSchedules: ScheduleEntry[];
  classnotes: ClassnoteEntry[];
  diaries: DiaryEntry[];
  quizlets: QuizletEntry[];
  totalHours: number;
};

type StudentFinancialSnapshot = {
  id: string;
  student: StudentInfo;
  initialCredit: number;
  hourlyRate: number;
  classesCompleted: number;
  nextMonthPlanned: number;
  carryAfterSettlement: number;
  totalCreditsAvailable: number;
  nextToPayClasses: number;
  amountDue: number;
};

type DetailSection = "schedule" | "classnote" | "diary" | "quizlet";

const DEFAULT_RATE = 50000;
const CURRENCY_FORMATTER = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-");
  return `${year}. ${month}`;
}

function formatDotDate(date: Date) {
  return `${date.getFullYear()}. ${pad2(date.getMonth() + 1)}. ${pad2(
    date.getDate()
  )}.`;
}

function fallbackMonths(count = 4) {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(monthKeyFromDate(dt));
  }
  return list;
}

function parseDateString(
  value: string | number | Date | null | undefined
): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? new Date(value.getTime()) : null;
  }
  if (typeof value === "number") {
    const dt = new Date(value);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\.$/, "").replace(/\s+/g, " ");

  const dotMatch = cleaned.match(
    /^(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/
  );
  if (dotMatch) {
    const year = Number(dotMatch[1]);
    const month = Number(dotMatch[2]);
    const day = Number(dotMatch[3]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      const dt = new Date(year, month - 1, day);
      return Number.isFinite(dt.getTime()) ? dt : null;
    }
  }

  const parsed = Date.parse(cleaned);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  return null;
}

async function fetchTeacherConfirm(studentName: string, monthKey: string) {
  try {
    const [year, mm] = monthKey.split("-");
    const yyyymm = `${year}${mm}`;

    const res = await fetch(
      `/api/billing/check1/${encodeURIComponent(studentName)}/${yyyymm}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { confirmed: false };

    const json = await res.json().catch(() => null);
    if (!json?.data) return { confirmed: false };

    return { confirmed: Boolean(json.data.locked) };
  } catch {
    return { confirmed: false };
  }
}


function monthRangeFromKey(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    const now = new Date();
    return {
      start: formatDotDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: formatDotDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: formatDotDate(start), end: formatDotDate(end) };
}

function normalizeDuration(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const num = Number.parseFloat(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

function formatTime(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const num =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number.parseFloat(String(value));
  if (!Number.isFinite(num)) return String(value ?? "");
  const minutes = Math.round(num * 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad2(hours)}:${pad2(mins)}`;
}

function getMonthOptions(
  schedules: ScheduleEntry[],
  includeCurrent = true
): string[] {
  const set = new Set<string>();
  schedules.forEach((item) => {
    const dt = parseDateString(item.date);
    if (dt) {
      set.add(monthKeyFromDate(dt));
    }
  });

  if (includeCurrent) {
    set.add(monthKeyFromDate(new Date()));
  }

  if (set.size === 0) {
    return fallbackMonths();
  }

  return Array.from(set).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

function matchesMonth(dateValue: string | number | null | undefined, key: string) {
  const dt = parseDateString(dateValue);
  if (!dt) return false;
  return monthKeyFromDate(dt) === key;
}


function firstNumberFromString(input?: string | null) {
  if (!input) return null;
  const match = String(input).replace(/,/g, "").match(/(\d+)(?:\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(
    String(value).replace(/[^\d.-]/g, "").replace(/--+/g, "-")
  );
  return Number.isFinite(parsed) ? parsed : null;
}

const ALLOWED_ADMINS = ["David", "Phil", "김나연"];

function AdminBillingExcelPageInner() {
  const searchParams = useSearchParams();
  const currentUser = (searchParams.get("user") || "").trim();
  const isAdmin = ALLOWED_ADMINS.some(
    (admin) => admin.trim().toLowerCase() === currentUser.toLowerCase()
  );
  
  // Debug: Log admin status (remove in production if needed)
  useEffect(() => {
    if (currentUser) {
      console.log("[Admin Billing] Current user:", currentUser, "isAdmin:", isAdmin);
    }
  }, [currentUser, isAdmin]);

  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<
    Record<string, StudentInfo[]>
  >({});
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const schedulesByTeacher = useRef<Record<string, ScheduleEntry[]>>({});

  const diaryCacheRef = useRef<Record<string, DiaryEntry[]>>({});
  const quizletCacheRef = useRef<Record<string, QuizletEntry[]>>({});
  const classnoteCacheRef = useRef<Record<string, ClassnoteEntry[]>>({});
  const studentProfileCacheRef = useRef<Record<string, any>>({});
  const [cacheTick, setCacheTick] = useState(0);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<{
    student: string;
    section: DetailSection;
  } | null>(null);

  const [studentConfigs, setStudentConfigs] = useState<
    Record<string, { rate?: number; initialCredit?: number }>
  >({});

  // Stores teacher-confirmed boolean per student
  const [confirmState, setConfirmState] = useState<Record<string, boolean>>({});


  const [billingLinkLoading, setBillingLinkLoading] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setStudentConfigs({});
  }, [selectedTeacher]);

  const handleBillingProcess = useCallback(
    async (student: StudentInfo, financial: StudentFinancialSnapshot) => {
      const studentId = student.id;
      setBillingLinkLoading((prev) => ({ ...prev, [studentId]: true }));

      try {
        if (!isAdmin) {
          alert("관리자만 결제 프로세스를 실행할 수 있습니다.");
          setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
          return;
        }

        const amount = Math.round(financial.amountDue);
        if (amount <= 0) {
          alert("결제할 금액이 없습니다.");
          setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
          return;
        }

        const res = await fetch("/api/payment/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: student.name,
            amount,
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || "Failed to create payment link");
        }

        const data = await res.json();
        const paymentLink = data.paymentLink;

        // Try to copy to clipboard
        try {
          await navigator.clipboard.writeText(paymentLink);
          alert(`결제 링크가 클립보드에 복사되었습니다.\n${paymentLink}`);
        } catch {
          // Fallback: show link in prompt
          prompt("결제 링크를 복사하세요:", paymentLink);
        }

        // Optional: Send via Kakao if enabled (can be disabled)
        const sendKakao = window.confirm(
          "카카오톡으로 결제 링크를 전송하시겠습니까?"
        );
        if (sendKakao && student.phoneNumber) {
          try {
            // Note: This requires Kakao API to be configured
            // The API endpoint should handle the message sending
            const kakaoRes = await fetch("/api/kakao-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: student.phoneNumber, // or student's Kakao user ID
                templateId: "payment_link_template", // Replace with actual template ID
                templateArgs: {
                  studentName: student.name,
                  amount: amount.toLocaleString("ko-KR"),
                  paymentLink: paymentLink,
                },
              }),
            });

            if (kakaoRes.ok) {
              alert("카카오톡 메시지가 전송되었습니다.");
            } else {
              console.warn("Kakao message failed, but payment link was copied");
            }
          } catch (kakaoErr) {
            console.warn("Kakao message error:", kakaoErr);
            // Don't fail the whole process if Kakao fails
          }
        }
      } catch (err) {
        console.error("Billing process error:", err);
        alert(
          `결제 링크 생성 실패: ${(err as Error)?.message || "Unknown error"}`
        );
      } finally {
        setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
      }
    },
    [isAdmin]
  );

  const handleCheckStudentSchedule = useCallback(
    (student: StudentInfo) => {
      const scheduleUrl = `/teacher/schedule?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(student.name)}&id=${encodeURIComponent(student.id)}`;
      window.open(scheduleUrl, "_blank");
    },
    [selectedTeacher]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setInitialLoading(true);
      setInitialError(null);
      try {
        const [teacherRes, studentRes] = await Promise.all([
          fetch("/api/teacher", { cache: "no-store" }).catch(() => null),
          fetch("/api/studentList", { cache: "no-store" }).catch(() => null),
        ]);

        const teacherListRaw: string[] = [];
        if (teacherRes && teacherRes.ok) {
          const teacherJson = await teacherRes.json();
          if (Array.isArray(teacherJson)) {
            teacherJson.forEach((item) => {
              const name = item?.name ? String(item.name).trim() : "";
              if (name) teacherListRaw.push(name);
            });
          }
        }

        const studentMap: Record<string, StudentInfo[]> = {};
        if (studentRes && studentRes.ok) {
          const studentJson = await studentRes.json();
          if (Array.isArray(studentJson)) {
            studentJson.forEach((item, index) => {
              const teacher = (
                item?.teacher ??
                item?.teacher_name ??
                item?.teacherName ??
                item?.assigned_teacher ??
                ""
              ).trim();

              const studentName =
                item?.student_name ??
                item?.name ??
                item?.full_name ??
                `학생-${index + 1}`;
              const entry: StudentInfo = {
                id: String(item?._id ?? item?.id ?? `${index}`),
                name: String(studentName),
                phoneNumber: item?.phoneNumber ? String(item.phoneNumber) : "",
              };
              if (!studentMap[teacher]) studentMap[teacher] = [];
              studentMap[teacher].push(entry);
            });
          }
        }

        const combinedTeachers = Array.from(
          new Set([
            ...teacherListRaw,
            ...Object.keys(studentMap).filter((name) => name && name.trim()),
          ])
        ).sort((a, b) => a.localeCompare(b, "en"));

        combinedTeachers.forEach((teacher) => {
          if (!studentMap[teacher]) {
            studentMap[teacher] = [];
          } else {
            studentMap[teacher].sort((a, b) =>
              a.name.localeCompare(b.name, "en")
            );
          }
        });

        if (!cancelled) {
          // Apply user restrictions
          let filteredTeachers = combinedTeachers;
          if (!isAdmin && currentUser) {
            // Non-admin users can only see themselves
            filteredTeachers = combinedTeachers.filter(
              (t) => t === currentUser
            );
          }

          setTeacherNames(filteredTeachers);
          setTeacherStudents(studentMap);
          setSelectedTeacher((prev) =>
            prev && prev.length > 0 && filteredTeachers.includes(prev)
              ? prev
              : filteredTeachers.length > 0
              ? filteredTeachers[0]
              : ""
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load teacher/student data:", err);
          setInitialError("Failed to load teachers or students.");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser, isAdmin]);

  const ensureDiary = useCallback(
    async (studentName: string) => {
      const key = String(studentName || "").trim();
      if (!key) return [];
      if (diaryCacheRef.current[key]) return diaryCacheRef.current[key];

      try {
        const res = await fetch(
          `/api/diary/student/${encodeURIComponent(key)}`,
          { cache: "no-store" }
        );
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        diaryCacheRef.current[key] = list;
        setCacheTick((tick) => tick + 1);
        return list;
      } catch (err) {
        console.warn("Failed to fetch diary data for", key, err);
        diaryCacheRef.current[key] = [];
        setCacheTick((tick) => tick + 1);
        return [];
      }
    },
    []
  );

  const ensureQuizlet = useCallback(
    async (studentName: string) => {
      const key = String(studentName || "").trim();
      if (!key) return [];
      if (quizletCacheRef.current[key]) return quizletCacheRef.current[key];

      try {
        const res = await fetch(
          `/api/quizlet/student/${encodeURIComponent(key)}`,
          { cache: "no-store" }
        );
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        quizletCacheRef.current[key] = list;
        setCacheTick((tick) => tick + 1);
        return list;
      } catch (err) {
        console.warn("Failed to fetch quizlet data for", key, err);
        quizletCacheRef.current[key] = [];
        setCacheTick((tick) => tick + 1);
        return [];
      }
    },
    []
  );

  const ensureStudentProfile = useCallback(async (studentName: string) => {
    const key = String(studentName || "").trim();
    if (!key) return null;
    if (studentProfileCacheRef.current[key]) {
      return studentProfileCacheRef.current[key];
    }
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        studentProfileCacheRef.current[key] = null;
        setCacheTick((tick) => tick + 1);
        return null;
      }
      const data = await res.json();
      studentProfileCacheRef.current[key] = data;
      setCacheTick((tick) => tick + 1);
      return data;
    } catch (err) {
      console.warn("Failed to fetch student profile for", key, err);
      studentProfileCacheRef.current[key] = null;
      setCacheTick((tick) => tick + 1);
      return null;
    }
  }, []);

  const ensureClassnotes = useCallback(
    async (teacherName: string, monthKey: string, students: StudentInfo[]) => {
      const cacheKey = `${teacherName}__${monthKey}`;
      if (classnoteCacheRef.current[cacheKey]) {
        return classnoteCacheRef.current[cacheKey];
      }

      if (!students.length) {
        classnoteCacheRef.current[cacheKey] = [];
        setCacheTick((tick) => tick + 1);
        return [];
      }

      const params = new URLSearchParams();
      const { start, end } = monthRangeFromKey(monthKey);
      params.set("from", start);
      params.set("to", end);
      students.forEach((student) => {
        if (student.name) params.append("student_name", student.name);
      });

      try {
        const res = await fetch(
          `/api/classnote/search?${params.toString()}`,
          { cache: "no-store" }
        );
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              date: item?.date ?? item?.class_date,
            }))
          : [];
        classnoteCacheRef.current[cacheKey] = list;
        setCacheTick((tick) => tick + 1);
        return list;
      } catch (err) {
        console.warn("Failed to fetch classnotes for", cacheKey, err);
        classnoteCacheRef.current[cacheKey] = [];
        setCacheTick((tick) => tick + 1);
        return [];
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedTeacher) return;
    if (schedulesByTeacher.current[selectedTeacher]) return;

    let cancelled = false;
    const loadSchedules = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const res = await fetch(
          `/api/schedules/teacher/${encodeURIComponent(selectedTeacher)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load schedules (${res.status})`);
        }
        const data = await res.json();
        const list: ScheduleEntry[] = Array.isArray(data)
          ? data.map((item: any) => ({
              _id: item?._id,
              date: item?.date,
              time: item?.time,
              duration: item?.duration,
              room_name: item?.room_name,
              teacher_name: item?.teacher_name,
              student_name: item?.student_name,
            }))
          : [];
        if (!cancelled) {
          schedulesByTeacher.current[selectedTeacher] = list;
          setCacheTick((tick) => tick + 1); // force refresh for memo deps
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load schedules:", err);
          setScheduleError("Failed to load schedule data.");
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    };

    loadSchedules();
    return () => {
      cancelled = true;
    };
  }, [selectedTeacher]);

  const monthOptions = useMemo(() => {
    const scheduleList =
      schedulesByTeacher.current[selectedTeacher] ?? [];
    return getMonthOptions(scheduleList);
  }, [selectedTeacher, cacheTick]);

  useEffect(() => {
    if (!selectedTeacher) return;
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      if (monthOptions.length > 0) {
        setSelectedMonth(monthOptions[0]);
      }
    }
  }, [selectedTeacher, monthOptions, selectedMonth]);

  useEffect(() => {
    if (!selectedTeacher || !selectedMonth) return;
    const students = teacherStudents[selectedTeacher] ?? [];
    if (students.length === 0) {
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

  let cancelled = false;
  const loadDetails = async () => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      // Extract names once
      const names = students.map((s) => s.name);

      // 1) Load ALL profiles in one batch
      const loadProfiles = Promise.all(
        names.map((name) => ensureStudentProfile(name))
      );

      // 2) Load classnotes for the entire teacher+month (already batched)
      const loadNotes = ensureClassnotes(selectedTeacher, selectedMonth, students);

      // 3) Load ALL diaries in one batch
      const loadDiaries = Promise.all(
        names.map((name) => ensureDiary(name))
      );

      // 4) Load ALL quizlets in one batch
      const loadQuizlets = Promise.all(
        names.map((name) => ensureQuizlet(name))
      );

      // Run 4 BIG batches in parallel instead of hundreds of micro-batches
      await Promise.all([
        loadProfiles,
        loadNotes,
        loadDiaries,
        loadQuizlets,
      ]);

      if (!cancelled) setDetailLoading(false);
    } catch (err) {
      if (!cancelled) {
        console.error("Failed to load detail data:", err);
        setDetailError("Failed to load detail data for this month.");
        setDetailLoading(false);
      }
    }
  };


    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [
    selectedTeacher,
    selectedMonth,
    teacherStudents,
    ensureClassnotes,
    ensureStudentProfile,
    ensureDiary,
    ensureQuizlet,
  ]);

  const monthSchedules = useMemo(() => {
    const all = schedulesByTeacher.current[selectedTeacher] ?? [];
    if (!selectedMonth) return [];
    return all.filter((entry) => matchesMonth(entry.date, selectedMonth));
  }, [selectedTeacher, selectedMonth, cacheTick]);

  const nextMonthKey = useMemo(() => {
    if (!selectedMonth) return "";
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return "";
    const base = new Date(year, month - 1, 1);
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    return monthKeyFromDate(next);
  }, [selectedMonth]);

  const nextMonthSchedules = useMemo(() => {
    if (!nextMonthKey) return [];
    const all = schedulesByTeacher.current[selectedTeacher] ?? [];
    return all.filter((entry) => matchesMonth(entry.date, nextMonthKey));
  }, [selectedTeacher, nextMonthKey, cacheTick]);

  const monthClassnotesKey = `${selectedTeacher}__${selectedMonth}`;
  const monthClassnotes =
    classnoteCacheRef.current[monthClassnotesKey] ?? [];

  const studentRows: StudentRow[] = useMemo(() => {
    if (!selectedTeacher || !selectedMonth) return [];
    const students = teacherStudents[selectedTeacher] ?? [];
    const diaryCache = diaryCacheRef.current;
    const quizletCache = quizletCacheRef.current;

    const rows = students.map((student) => {
      const schedules = monthSchedules.filter(
        (entry) =>
          String(entry.student_name || "").trim() === student.name.trim()
      );
      const nextSchedules = nextMonthSchedules.filter(
        (entry) =>
          String(entry.student_name || "").trim() === student.name.trim()
      );
      const totalHours = schedules.reduce(
        (sum, entry) => sum + normalizeDuration(entry.duration),
        0
      );

      const classnotes = monthClassnotes.filter(
        (entry) =>
          String(entry.student_name || "").trim() === student.name.trim()
      );

      const diaries = (diaryCache[student.name] ?? []).filter((entry) =>
        matchesMonth(entry.class_date ?? entry.date, selectedMonth)
      );
      const quizlets = (quizletCache[student.name] ?? []).filter((entry) =>
        matchesMonth(entry.class_date ?? entry.date, selectedMonth)
      );

      return {
        student,
        schedules,
        nextSchedules,
        classnotes,
        diaries,
        quizlets,
        totalHours,
      };
    });

    return rows.map((row) => ({
      ...row,
    }));


  }, [
    selectedTeacher,
    selectedMonth,
    teacherStudents,
    monthSchedules,
    nextMonthSchedules,
    monthClassnotes,
    cacheTick,
  ]);

// -------------------- LOAD TEACHER CONFIRM STATE --------------------
useEffect(() => {
  if (!selectedMonth || studentRows.length === 0) return;

  const names = studentRows.map((r) => r.student.name); // stable array

  let cancelled = false;

  const loadConfirms = async () => {
    const newState: Record<string, boolean> = {};

    await Promise.all(
      names.map(async (name) => {
        const res = await fetchTeacherConfirm(name, selectedMonth);
        newState[name] = res.confirmed;
      })
    );

    if (!cancelled) {
      setConfirmState(newState);
    }
  };

  loadConfirms();
  return () => {
    cancelled = true;
  };
}, [selectedMonth, studentRows.length]);   // ONLY depend on month + count




  const studentFinancials = useMemo<StudentFinancialSnapshot[]>(() => {
    return studentRows.map((row) => {
      const profile =
        studentProfileCacheRef.current[row.student.name] ?? ({} as any);
      const profileCredit = toNumber(profile?.credits);
      const profileRateCandidates = [
        toNumber(profile?.feePerClass),
        toNumber(profile?.fee_per_class),
        toNumber(profile?.classFee),
        toNumber(profile?.class_fee),
        toNumber(profile?.tuition),
        toNumber(profile?.tuitionPerClass),
        toNumber(profile?.hourlyRate),
        toNumber(profile?.hagwonRate),
        toNumber(profile?.hagwon_rate),
        firstNumberFromString(profile?.paymentNotes),
      ].filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value) && value > 0
      );
      const defaultRate =
        profileRateCandidates.length > 0
          ? profileRateCandidates[0]
          : DEFAULT_RATE;
      const defaultCredit = Number.isFinite(profileCredit || null)
        ? Number(profileCredit)
        : 0;

      const config = studentConfigs[row.student.id] ?? {};
      const configRate =
        typeof config.rate === "number" && Number.isFinite(config.rate)
          ? config.rate
          : null;
      const configCredit =
        typeof config.initialCredit === "number" &&
        Number.isFinite(config.initialCredit)
          ? config.initialCredit
          : null;

      const hourlyRate = configRate ?? defaultRate;
      const initialCredit = configCredit ?? defaultCredit;
      const classesCompleted = row.classnotes.length;
      const nextMonthPlanned = row.nextSchedules.length;
      const carryAfterSettlement = initialCredit - classesCompleted;
      const totalCreditsAvailable = Math.max(0, carryAfterSettlement);
      const nextToPayClasses =
        classesCompleted + nextMonthPlanned - initialCredit;

      const amountDue = Math.max(0, nextToPayClasses) * hourlyRate;


      return {
        id: row.student.id,
        student: row.student,
        initialCredit,
        hourlyRate,
        classesCompleted,
        nextMonthPlanned,
        carryAfterSettlement,
        totalCreditsAvailable,
        nextToPayClasses,
        amountDue,
      };
    });
  }, [studentRows, studentConfigs, cacheTick]);

  const financialById = useMemo(() => {
    const map: Record<string, StudentFinancialSnapshot> = {};
    studentFinancials.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [studentFinancials]);

  const summary = useMemo(() => {
    const totalClasses = monthSchedules.length;
    const totalHours = monthSchedules.reduce(
      (sum, entry) => sum + normalizeDuration(entry.duration),
      0
    );
    const totalAmountDue = studentFinancials.reduce(
      (sum, item) => sum + item.amountDue,
      0
    );
    const totalNextToPay = studentFinancials.reduce(
      (sum, item) => sum + item.nextToPayClasses,
      0
    );
    return {
      totalClasses,
      totalHours,
      totalAmountDue,
      totalNextToPay,
      studentCount: (teacherStudents[selectedTeacher] ?? []).length,
    };
  }, [
    monthSchedules,
    studentFinancials,
    teacherStudents,
    selectedTeacher,
  ]);


const handleConfigChange = useCallback(
  async (
    studentId: string,
    patch: { rate?: number | null; initialCredit?: number | null }
  ) => {
    // 1) Update local state (never store null)
    setStudentConfigs((prev) => {
      const existing = prev[studentId] ?? {};

      const updated = {
        ...existing,
        ...(patch.rate !== undefined
          ? { rate: patch.rate ?? undefined } // convert null → undefined
          : {}),
        ...(patch.initialCredit !== undefined
          ? { initialCredit: patch.initialCredit ?? undefined } // convert null → undefined
          : {}),
      };

      return { ...prev, [studentId]: updated };
    });

    // 2) Find the student info
    const row = studentRows.find((r) => r.student.id === studentId);
    if (!row) return;

    const studentName = row.student.name;

    // 3) Build POST payload (again: no null)
    const payload: any = {};
    if (patch.initialCredit !== undefined) {
      payload.credits = patch.initialCredit ?? undefined;
    }
    if (patch.rate !== undefined) {
      payload.hourlyRate = patch.rate ?? undefined;
    }

    // If payload is empty, no need to send API
    if (Object.keys(payload).length === 0) return;

    // 4) Send POST update
    try {
      await fetch(`/api/student/${encodeURIComponent(studentName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 🔥 Refresh cache after saving
      studentProfileCacheRef.current[studentName] = undefined;
      await ensureStudentProfile(studentName);

      // Force recalculation
      setCacheTick((t) => t + 1);

    } catch (err) {
      console.error("Failed to update student:", err);
    }
  },
  [studentRows]
);


  const renderScheduleDetails = (rows: ScheduleEntry[]) => {
    if (!rows.length) {
      return (
        <div className="text-sm text-gray-500">
          No schedules for this student in the selected month.
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {rows.map((item, idx) => {
          const dateLabel =
            parseDateString(item.date)?.toLocaleDateString("ko-KR") ??
            String(item.date ?? "");
          return (
            <div
              key={item._id ?? `${item.student_name}_${idx}`}
              className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="font-medium text-gray-800">{dateLabel}</div>
              <div className="text-sm text-gray-600">
                시간: {formatTime(item.time)}
              </div>
              <div className="text-sm text-gray-600">
                수업길이: {normalizeDuration(item.duration)}h
              </div>
              {item.room_name && (
                <div className="text-sm text-gray-600">
                  강의실: {item.room_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

const formatDateForLink = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const dt = parseDateString(dateStr);
  if (!dt) return String(dateStr ?? "");
  return formatDotDate(dt);
};

  const renderClassnoteDetails = (rows: ClassnoteEntry[], student: StudentInfo) => {
    if (!rows.length) {
      return (
        <div className="text-sm text-gray-500">
          No class notes saved for this student in the selected month.
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        {rows.map((item, idx) => {
          const dateStr = item.date ?? "";
          const formattedDate = formatDateForLink(dateStr);
          const classNoteUrl = `/teacher/student/class_record?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(student.name)}&id=${encodeURIComponent(student.id)}${item._id ? `&class_note_id=${encodeURIComponent(item._id)}` : ""}`;
          
          return (
            <div
              key={item._id ?? `${item.student_name}_classnote_${idx}`}
              className="flex items-center gap-2"
            >
              <a
                href={classNoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline"
              >
                {formattedDate || "—"}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDiaryDetails = (rows: DiaryEntry[], student: StudentInfo) => {
    if (!rows.length) {
      return (
        <div className="text-sm text-gray-500">
          No diary submissions for this month.
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        {rows.map((item, idx) => {
          const dateStr = item.class_date ?? item.date ?? "";
          const formattedDate = formatDateForLink(dateStr);
          const diaryUrl = `/teacher/student/diary?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(student.name)}&id=${encodeURIComponent(student.id)}`;
          
          return (
            <div
              key={item._id ?? `${item.student_name}_diary_${idx}`}
              className="flex items-center gap-2"
            >
              <a
                href={diaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
              >
                {formattedDate || "—"}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuizletDetails = (rows: QuizletEntry[], student: StudentInfo) => {
    if (!rows.length) {
      return (
        <div className="text-sm text-gray-500">
          No quizlet sets prepared for this month.
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        {rows.map((item, idx) => {
          const dateStr = item.class_date ?? item.date ?? "";
          const formattedDate = formatDateForLink(dateStr);
          const quizletUrl = `/teacher/student/quizlet?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(student.name)}&id=${encodeURIComponent(student.id)}`;
          
          return (
            <div
              key={item._id ?? `${item.student_name}_quizlet_${idx}`}
              className="flex items-center gap-2"
            >
              <a
                href={quizletUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                {formattedDate || "—"}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExpandedContent = (row: StudentRow) => {
    if (!expanded) return null;
    if (expanded.student !== row.student.name) return null;

    switch (expanded.section) {
      case "schedule":
        return renderScheduleDetails(row.schedules);
      case "classnote":
        return renderClassnoteDetails(row.classnotes, row.student);
      case "diary":
        return renderDiaryDetails(row.diaries, row.student);
      case "quizlet":
        return renderQuizletDetails(row.quizlets, row.student);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              관리자 - 교사 정산 보드 (실험용)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              교사별로 월간 수업 현황, 메모, 다이어리, Quizlet 진행 상황을
              확인하세요.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {isAdmin && (
              <label className="text-sm text-gray-700">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Teacher
                </span>
                <select
                  className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={selectedTeacher}
                  onChange={(e) => {
                    setSelectedTeacher(e.target.value);
                    setExpanded(null);
                  }}
                >
                  {teacherNames.length === 0 && (
                    <option value="">교사를 찾을 수 없습니다</option>
                  )}
                  {teacherNames.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher || "Unassigned"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!isAdmin && (
              <div className="text-sm text-gray-700">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Teacher
                </span>
                <div className="w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  {selectedTeacher || currentUser || "—"}
                </div>
              </div>
            )}
          </div>
        </header>

        {initialLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-gray-500">
            데이터를 불러오는 중입니다…
          </div>
        ) : initialError ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700">
            {initialError}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {monthOptions.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedMonth(key);
                    setExpanded(null);
                  }}
                  className={`rounded-t-lg border px-4 py-2 text-sm font-medium ${
                    selectedMonth === key
                      ? "border-indigo-500 bg-white text-indigo-600 shadow"
                      : "border-slate-200 bg-slate-100 text-gray-600 hover:bg-white"
                  }`}
                >
                  {monthLabelFromKey(key)}
                </button>
              ))}
            </div>

            {scheduleLoading && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-gray-500">
                교사 일정 데이터를 불러오는 중입니다…
              </div>
            )}
            {scheduleError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {scheduleError}
              </div>
            )}

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total Classes
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {summary.totalClasses}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  수업 건수 ({monthLabelFromKey(selectedMonth || "")})
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total Hours
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {summary.totalHours.toFixed(2)}h
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  일정 duration 합계
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  결제 금액 (₩)
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {CURRENCY_FORMATTER.format(Math.round(summary.totalAmountDue))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  결제 대상 수업 {summary.totalNextToPay.toFixed(2)}개
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Active Students
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {summary.studentCount}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  해당 교사에게 배정된 학생 수
                </div>
              </div>
            </section>

            {detailError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {detailError}
              </div>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">학생</th>
                      <th className="px-4 py-3">수업</th>
                      <th className="px-4 py-3">Class Notes</th>
                      <th className="px-4 py-3">Diary</th>
                      <th className="px-4 py-3">Quizlet</th>
                  <th className="px-4 py-3">Hagwon Pay</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-gray-700">
                    {studentRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          선택한 교사에게 할당된 학생이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      studentRows
                        .filter((row) => row.classnotes.length > 0)
                        .map((row) => {
                        const financial = financialById[row.student.id];
                        const hourlyRateValue =
                          financial?.hourlyRate ?? DEFAULT_RATE;
                        const initialCreditValue =
                          financial?.initialCredit ?? 0;
                        const classesCompletedValue =
                          financial?.classesCompleted ?? row.classnotes.length;
                        const nextMonthPlannedValue =
                          financial?.nextMonthPlanned ?? row.nextSchedules.length;
                        const carryAfterValue =
                          financial?.carryAfterSettlement ??
                          initialCreditValue - classesCompletedValue;
                        const totalCreditsAvailableValue =
                          financial?.totalCreditsAvailable ??
                          Math.max(0, carryAfterValue);
                        const nextToPayClassesValue =
                          financial?.nextToPayClasses ??
                          Math.max(0, nextMonthPlannedValue - carryAfterValue);
                        const amountDueValue =
                          financial?.amountDue ??
                          Math.max(0, nextToPayClassesValue * hourlyRateValue);
                        return (
                          <React.Fragment key={row.student.id}>
                            <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {row.student.name}
                              </div>
                              {row.student.phoneNumber && (
                                <div className="text-xs text-gray-500">
                                  {row.student.phoneNumber}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {confirmState[row.student.name] ? (
                                <span
                                  className="inline-flex items-center rounded-full bg-emerald-50 
                                            text-emerald-700 text-xs px-3 py-1 border border-emerald-200"
                                >
                                  ✅ Teacher Confirmed
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center rounded-full bg-red-50 
                                            text-red-700 text-xs px-3 py-1 border border-red-200"
                                >
                                  ❌ Not Confirmed
                                </span>
                              )}
                            </td>


                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {row.classnotes.length === 0 ? (
                                  <span className="text-xs text-gray-400">—</span>
                                ) : (
                                  row.classnotes.map((item, idx) => {
                                    const dateStr = item.date ?? "";
                                    const formattedDate = formatDateForLink(dateStr);
                                    const classNoteUrl = `/teacher/student/class_record?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(row.student.name)}&id=${encodeURIComponent(row.student.id)}${item._id ? `&class_note_id=${encodeURIComponent(item._id)}` : ""}`;
                                    return (
                                      <a
                                        key={item._id ?? `${row.student.name}_classnote_${idx}`}
                                        href={classNoteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline"
                                      >
                                        {formattedDate || "—"}
                                      </a>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {row.diaries.length === 0 ? (
                                  <span className="text-xs text-gray-400">—</span>
                                ) : (
                                  row.diaries.map((item, idx) => {
                                    const dateStr = item.class_date ?? item.date ?? "";
                                    const formattedDate = formatDateForLink(dateStr);
                                    const diaryUrl = `/teacher/student/diary?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(row.student.name)}`;
                                    return (
                                      <a
                                        key={item._id ?? `${row.student.name}_diary_${idx}`}
                                        href={diaryUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-sky-700 hover:text-sky-900 hover:underline"
                                      >
                                        {formattedDate || "—"}
                                      </a>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {row.quizlets.length === 0 ? (
                                  <span className="text-xs text-gray-400">—</span>
                                ) : (
                                  row.quizlets.map((item, idx) => {
                                    const dateStr = item.class_date ?? item.date ?? "";
                                    const formattedDate = formatDateForLink(dateStr);
                                    const quizletUrl = `/teacher/student/quizlet?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(row.student.name)}`;
                                    return (
                                      <a
                                        key={item._id ?? `${row.student.name}_quizlet_${idx}`}
                                        href={quizletUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                      >
                                        {formattedDate || "—"}
                                      </a>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2">
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <label className="flex flex-col text-xs text-gray-500">
                                      <span className="mb-1">Initial credit</span>
                                      <input
                                        type="number"
                                        step="1"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                                        value={initialCreditValue}
                                        onChange={(e) => {
                                          const parsed = Number.parseFloat(
                                            e.target.value
                                          );
                                          handleConfigChange(row.student.id, {
                                            initialCredit: Number.isFinite(
                                              parsed
                                            )
                                              ? parsed
                                              : 0,
                                          });
                                        }}
                                      />
                                    </label>
                                    <label className="flex flex-col text-xs text-gray-500">
                                      <span className="mb-1">Hourly rate (₩)</span>
                                      <input
                                        type="number"
                                        step="1000"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                                        value={hourlyRateValue}
                                        onChange={(e) => {
                                          const parsed = Number.parseFloat(
                                            e.target.value
                                          );
                                          handleConfigChange(row.student.id, {
                                            rate: Number.isFinite(parsed)
                                              ? parsed
                                              : 0,
                                          });
                                        }}
                                      />
                                    </label>
                                  </div>
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-gray-600">
                                    <div className="flex items-center justify-between">
                                      <span>이번달 선결제(예정/스케줄)</span>
                                      <span className="font-medium text-gray-900">
                                        {initialCreditValue.toFixed(0)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <span>이번달 실제 수업 (노트 기준)</span>
                                      <span className="font-medium text-gray-900">
                                        {classesCompletedValue.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <span>다음달 예정 수업 (스케줄)</span>
                                      <span className="font-medium text-gray-900">
                                        {nextMonthPlannedValue.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <span>다음달 차감 가능 수업</span>
                                      <span className="font-medium text-gray-900">
                                        {totalCreditsAvailableValue.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <span>결제 대상 수업</span>
                                      <span className="font-medium text-gray-900">
                                        {nextToPayClassesValue.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-gray-700">
                                      <span>결제 금액 (₩)</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {CURRENCY_FORMATTER.format(
                                          Math.round(amountDueValue)
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const loading = !!billingLinkLoading[row.student.id];
                                const canProcess =
                                  isAdmin && amountDueValue > 0 && !loading;
                                const disabledReason = !isAdmin
                                  ? "관리자만 사용할 수 있습니다"
                                  : amountDueValue <= 0
                                  ? "결제할 금액이 없습니다"
                                  : loading
                                  ? "처리 중..."
                                  : "";
                                return (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() =>
                                        handleBillingProcess(row.student, financial)
                                      }
                                      disabled={!canProcess}
                                      className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={canProcess ? "결제 링크 생성" : disabledReason}
                                    >
                                      {loading ? "처리 중..." : "Billing Process"}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleCheckStudentSchedule(row.student)
                                      }
                                      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                    >
                                      Check Student Schedule
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                          {expanded &&
                            expanded.student === row.student.name && (
                              <tr className="bg-slate-50">
                                <td colSpan={7} className="px-4 py-4">
                                  {detailLoading ? (
                                    <div className="text-sm text-gray-500">
                                      상세 데이터를 불러오는 중입니다…
                                    </div>
                                  ) : (
                                    renderExpandedContent(row)
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminBillingExcelPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AdminBillingExcelPageInner />
    </Suspense>
  );
}

