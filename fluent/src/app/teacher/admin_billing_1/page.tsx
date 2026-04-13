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
  diaries: (DiaryEntry | null)[];
  quizlets: (QuizletEntry | null)[];
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

// function monthDotLabelFromKey(key: string) {
//   const [year, month] = key.split("-");
//   return `${year}.${month}`;
// }


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

// async function toggleTeacherConfirm(studentName: string, monthKey: string, currentStatus: boolean) {
//   try {
//     const [year, mm] = monthKey.split("-");
//     const yyyymm = `${year}${mm}`;

//     const res = await fetch(
//       `/api/billing/check1/${encodeURIComponent(studentName)}/${yyyymm}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ locked: !currentStatus }),
//       }
//     );

//     if (!res.ok) throw new Error("Failed to toggle");
//     return !currentStatus;
//   } catch (err) {
//     console.error(err);
//     return currentStatus;
//   }
// }

async function fetchPaymentStatus(studentName: string, monthKey: string) {
  try {
    // Fetch recent payments for this student
    const res = await fetch(`/api/payment/history?studentName=${encodeURIComponent(studentName)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();

    // Check for payments in the selected month
    // Format of monthKey is YYYY-MM
    const payments = json.payments || [];
    const [year, month] = monthKey.split("-");

    // Find if there is a completed payment for this month (approximate check by date or yyyymm)
    const relevantPayment = payments.find((p: any) => {
      if (p.status !== "DONE" && p.status !== "COMPLETED") return false;
      if (p.yyyymm === `${year}${month}`) return true;

      // Or check date if yyyymm is missing
      const payDate = new Date(p.approvedAt || p.savedAt);
      return payDate.getFullYear() === Number(year) && (payDate.getMonth() + 1) === Number(month);
    });

    return relevantPayment || null;
  } catch {
    return null;
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

function inferPaymentDescription(unitPrice: number | null) {
  if (unitPrice == null || !Number.isFinite(unitPrice)) return "";

  const rounded = Math.round(unitPrice);

  if (rounded === 40000) return "4만원 수업";
  if (rounded === 50000) return "5만원 수업";
  if (rounded === 60000) return "6만원 수업";
  if (rounded === 70000) return "7만원 수업";
  if (rounded === 100000) return "10만원 수업";

  return `${Math.round(rounded / 10000)}만원 수업`;
}

function getCreditLedgerTypeLabel(item: any) {
  const delta = Number(item?.delta ?? 0);
  const isPaymentRow = item?.type === "payment";

  const quantity =
    typeof item?.quantity === "number"
      ? item.quantity
      : Number(item?.quantity ?? 0);

  const amount =
    typeof item?.amount === "number"
      ? item.amount
      : Number(item?.amount ?? 0);

  const deltaAbs = Math.abs(delta);

  const unitPrice =
    typeof item?.unitPrice === "number" && Number.isFinite(item.unitPrice)
      ? item.unitPrice
      : isPaymentRow && quantity > 0 && Number.isFinite(amount) && amount > 0
        ? amount / quantity
        : isPaymentRow && deltaAbs > 0 && Number.isFinite(amount) && amount > 0
          ? amount / deltaAbs
          : null;

  const rawDescription =
    typeof item?.description === "string" ? item.description.trim() : "";

  const inferredDescription =
    isPaymentRow ? inferPaymentDescription(unitPrice) : "";

  if (isPaymentRow) {
    const paymentName = rawDescription || inferredDescription || "Payment";
    return `${paymentName} (payment)`;
  }

  if (item?.type === "classnote") {
    return "Class Deduction";
  }

  return String(item?.type ?? "");
}

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
  const creditHistoryCacheRef = useRef<Record<string, any[]>>({});
  const [cacheTick, setCacheTick] = useState(0);
  // const [hoveredGroup, setHoveredGroup] = useState<string[] | null>(null);

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
  const [, setConfirmState] = useState<Record<string, boolean>>({});
  // Stores payment status per student
  const [, setPaymentState] = useState<Record<string, any>>({});
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);

  const [noteType, setNoteType] = useState<string>("");
  const [groupClassMap, setGroupClassMap] = useState<Record<string, any>>({});

  const [groupStudents, setGroupStudents] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  // const [billingLinkLoading, setBillingLinkLoading] = useState<
  //   Record<string, boolean>
  // >({});

  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState<{
    studentId: string;
    studentName: string;
    currentCredits: number;
  } | null>(null);


  useEffect(() => {
    setStudentConfigs({});
  }, [selectedTeacher]);

  useEffect(() => {
    const loadGroupClasses = async () => {
      try {
        const res = await fetch("/api/group-class", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        const map: Record<string, any> = {};

        data.forEach((group: any) => {
          (group.group_students || []).forEach((studentName: string) => {
            map[studentName] = group;
          });
        });

        setGroupClassMap(map);
      } catch (err) {
        console.error("Failed to load group classes", err);
      }
    };

    loadGroupClasses();
  }, []);

  const [creditAmount, setCreditAmount] = useState(0);
  const [creditChange, setCreditChange] = useState(0); // credits
  const [reasonType, setReasonType] = useState<string>("");
  const [reasonOther, setReasonOther] = useState("");

  // const handleBillingProcess = useCallback(
  //   async (student: StudentInfo, financial: StudentFinancialSnapshot) => {
  //     const studentId = student.id;
  //     setBillingLinkLoading((prev) => ({ ...prev, [studentId]: true }));

  //     try {
  //       if (!isAdmin) {
  //         alert("관리자만 결제 프로세스를 실행할 수 있습니다.");
  //         setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
  //         return;
  //       }

  //       const amount = Math.round(financial.amountDue);
  //       if (amount <= 0) {
  //         alert("결제할 금액이 없습니다.");
  //         setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
  //         return;
  //       }

  //       // Generate orderId for tracking
  //       const orderId = new Date().getTime().toString();

  //       // Create wrapper link that generates payment link on-demand
  //       // Pass student name, amount, and orderId as query parameters
  //       const wrapperLink = `/payment/link?studentName=${encodeURIComponent(student.name)}&amount=${amount}&orderId=${orderId}`;
  //       const fullWrapperLink = `${window.location.origin}${wrapperLink}`;

  //       // Try to copy wrapper link to clipboard
  //       try {
  //         await navigator.clipboard.writeText(fullWrapperLink);
  //         alert(`결제 링크가 클립보드에 복사되었습니다.\n\n래퍼 링크: ${fullWrapperLink}\n\n이 링크를 클릭하면 결제 페이지로 이동합니다.`);
  //       } catch {
  //         // Fallback: show link in prompt
  //         prompt("결제 링크를 복사하세요 (래퍼 링크):", fullWrapperLink);
  //       }

  //       // Optional: Send via Kakao if enabled (can be disabled)
  //       const sendKakao = window.confirm(
  //         "카카오톡으로 결제 링크를 전송하시겠습니까?"
  //       );
  //       if (sendKakao && student.phoneNumber) {
  //         try {
  //           // Note: This requires Kakao API to be configured
  //           // The API endpoint should handle the message sending
  //           const kakaoRes = await fetch("/api/kakao-message", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({
  //               userId: student.phoneNumber, // or student's Kakao user ID
  //               templateId: "payment_link_template", // Replace with actual template ID
  //               templateArgs: {
  //                 studentName: student.name,
  //                 amount: amount.toLocaleString("ko-KR"),
  //                 paymentLink: fullWrapperLink, // Send wrapper link instead
  //               },
  //             }),
  //           });

  //           if (kakaoRes.ok) {
  //             alert("카카오톡 메시지가 전송되었습니다.");
  //           } else {
  //             console.warn("Kakao message failed, but payment link was copied");
  //           }
  //         } catch (kakaoErr) {
  //           console.warn("Kakao message error:", kakaoErr);
  //           // Don't fail the whole process if Kakao fails
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Billing process error:", err);
  //       alert(
  //         `결제 링크 생성 실패: ${(err as Error)?.message || "Unknown error"}`
  //       );
  //     } finally {
  //       setBillingLinkLoading((prev) => ({ ...prev, [studentId]: false }));
  //     }
  //   },
  //   [isAdmin]
  // );

  // const handleCheckStudentSchedule = useCallback(
  //   (student: StudentInfo) => {
  //     const scheduleUrl = `/teacher/schedule?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(student.name)}&id=${encodeURIComponent(student.id)}`;
  //     window.open(scheduleUrl, "_blank");
  //   },
  //   [selectedTeacher]
  // );

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
          // Set default teacher: For admins (David, Phil), use their own name; otherwise David if available, then first teacher
          let defaultTeacher = "";
          if (isAdmin && currentUser && (currentUser === "David" || currentUser === "Phil")) {
            // For admins David/Phil, default to their own name
            defaultTeacher = filteredTeachers.includes(currentUser) ? currentUser : "";
          }
          if (!defaultTeacher && filteredTeachers.includes("David")) {
            defaultTeacher = "David";
          }
          if (!defaultTeacher && filteredTeachers.length > 0) {
            defaultTeacher = filteredTeachers[0];
          }
          setSelectedTeacher((prev) => {
            // If currentUser is David/Phil and isAdmin, always use their name (override prev)
            if (isAdmin && currentUser && (currentUser === "David" || currentUser === "Phil")) {
              if (filteredTeachers.includes(currentUser)) {
                return currentUser;
              }
            }
            // Otherwise, keep prev if it's valid, or use defaultTeacher
            return prev && prev.length > 0 && filteredTeachers.includes(prev)
              ? prev
              : defaultTeacher;
          });
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

  const ensureCreditHistory = useCallback(async (studentName: string) => {
  const key = studentName.trim();
  if (!key) return [];

  if (creditHistoryCacheRef.current[key]) {
    return creditHistoryCacheRef.current[key];
  }

  try {
    const res = await fetch(
      `/api/payment/history?studentName=${encodeURIComponent(key)}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("failed");

    const json = await res.json();
    const list = Array.isArray(json.creditTransactions)
      ? json.creditTransactions
      : [];

    creditHistoryCacheRef.current[key] = list;
    return list;
  } catch {
    creditHistoryCacheRef.current[key] = [];
    return [];
  }
  }, []);

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

        // Check which data actually needs to be loaded (not already cached)
        const profilesToLoad = names.filter(
          (name) => !studentProfileCacheRef.current[name]
        );
        const diariesToLoad = names.filter(
          (name) => !diaryCacheRef.current[name]
        );
        const quizletsToLoad = names.filter(
          (name) => !quizletCacheRef.current[name]
        );
        const classnoteCacheKey = `${selectedTeacher}__${selectedMonth}`;
        const needClassnotes = !classnoteCacheRef.current[classnoteCacheKey];

        // 1) Load only missing profiles in batch
        const loadProfiles = profilesToLoad.length > 0
          ? Promise.all(profilesToLoad.map((name) => ensureStudentProfile(name)))
          : Promise.resolve([]);

        // 2) Load classnotes only if not cached
        const loadNotes = needClassnotes
          ? ensureClassnotes(selectedTeacher, selectedMonth, students)
          : Promise.resolve([]);

        // 3) Load only missing diaries in batch
        const loadDiaries = diariesToLoad.length > 0
          ? Promise.all(diariesToLoad.map((name) => ensureDiary(name)))
          : Promise.resolve([]);

        // 4) Load only missing quizlets in batch
        const loadQuizlets = quizletsToLoad.length > 0
          ? Promise.all(quizletsToLoad.map((name) => ensureQuizlet(name)))
          : Promise.resolve([]);

        // Run batches in parallel, but only load what's needed
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

      // (Original filtered lists)
      const diaryRaw = (diaryCache[student.name] ?? []).filter((entry) =>
        matchesMonth(entry.class_date ?? entry.date, selectedMonth)
      );

      const quizletRaw = (quizletCache[student.name] ?? []).filter((entry) =>
        matchesMonth(entry.class_date ?? entry.date, selectedMonth)
      );

      // // ⭐ STEP 1 — Build unified date list from classnotes
      // const unifiedDates = classnotes
      //   .map((cn) => {
      //     const dt = parseDateString(cn.date);
      //     return dt ? formatDotDate(dt) : "";
      //   })
      //   .filter(Boolean)
      //   .sort((a, b) => (a < b ? -1 : 1));

      // Create lookup maps
      const diaryMap: Record<string, DiaryEntry> = {};
      diaryRaw.forEach((d) => {
        const dt = parseDateString(d.class_date ?? d.date);
        if (!dt) return;
        diaryMap[formatDotDate(dt)] = d;
      });

      const quizletMap: Record<string, QuizletEntry> = {};
      quizletRaw.forEach((q) => {
        const dt = parseDateString(q.class_date ?? q.date);
        if (!dt) return;
        quizletMap[formatDotDate(dt)] = q;
      });

      // ⭐ align to unifiedDates
      const classDates = classnotes
        .map((cn) => parseDateString(cn.date))
        .filter(Boolean) as Date[];

      // Pre-sort timestamps (should already be sorted)
      classDates.sort((a, b) => a.getTime() - b.getTime());

      // Prepare buckets
      const alignedDiaries: (DiaryEntry | null)[] = [];
      const alignedQuizlets: (QuizletEntry | null)[] = [];

      // Loop over class intervals
      for (let i = 0; i < classDates.length; i++) {
        const cur = classDates[i];
        const prev = classDates[i - 1] ?? null;
        const next = classDates[i + 1] ?? null;

        // DIARY range: prev → cur
        const diaryStart = prev ?? cur;     // if no prev, diary only on this date
        const diaryEnd = cur;               // inclusive

        const diaryItem =
          diaryRaw.find((d) => {
            const dt = parseDateString(d.class_date ?? d.date);
            if (!dt) return false;
            return dt.getTime() >= diaryStart.getTime() &&
              dt.getTime() <= diaryEnd.getTime();
          }) ?? null;
        alignedDiaries.push(diaryItem);

        // QUIZLET range: cur → next
        const quizletStart = cur;
        const quizletEnd = next ?? new Date(cur.getFullYear(), cur.getMonth() + 1, 1); // next month boundary

        const quizletItem =
          quizletRaw.find((q) => {
            const dt = parseDateString(q.class_date ?? q.date);
            if (!dt) return false;
            return dt.getTime() >= quizletStart.getTime() &&
              dt.getTime() < quizletEnd.getTime();
          }) ?? null;

        alignedQuizlets.push(quizletItem);
      }


      return {
        student,
        schedules,
        nextSchedules,
        classnotes,
        diaries: alignedDiaries,
        quizlets: alignedQuizlets,
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

    const loadPayments = async () => {
      const newState: Record<string, any> = {};
      await Promise.all(
        names.map(async (name) => {
          const pay = await fetchPaymentStatus(name, selectedMonth);
          newState[name] = pay;
        })
      );
      if (!cancelled) {
        setPaymentState(newState);
      }
    }

    const loadCredits = async () => {
      await Promise.all(
        studentRows.map((r) => ensureCreditHistory(r.student.name))
      );
      setCacheTick((t) => t + 1);
    };

    loadCredits();
    loadConfirms();
    loadPayments();
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

  // const creditLedgerRows = useMemo(() => {
  // const rows: any[] = [];

  // studentRows.forEach((row) => {
  //   const profile =
  //     studentProfileCacheRef.current[row.student.name];
  //   const history = profile?.Credit_Automation_History ?? [];

  //   history.forEach((item: any) => {
  //     rows.push({
  //       studentName: row.student.name,
  //       date:
  //         item.class_date ??
  //         formatDotDate(parseDateString(item.createdAt)!),
  //       type: item.type,
  //       delta: item.delta,
  //       before: item.before,
  //       after: item.after,
  //       teacher: item.teacher_name,
  //       createdAt: item.createdAt,
  //     });
  //   });
  // });

  // return rows.sort(
  //   (a, b) =>
  //     new Date(b.createdAt).getTime() -
  //     new Date(a.createdAt).getTime()
  // );
  // }, [studentRows, cacheTick]);


  const financialById = useMemo(() => {
    const map: Record<string, StudentFinancialSnapshot> = {};
    studentFinancials.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [studentFinancials]);

  const summary = useMemo(() => {
    let totalClasses = monthClassnotes.length;

    // 🔥 GROUP CLASS DEDUCTION (remove duplicated classnotes)
    const processedGroups = new Set<string>();

    Object.values(groupClassMap).forEach((group: any) => {
      const students = group?.group_students || [];
      if (students.length <= 1) return;

      // prevent double counting same group
      const groupKey = [...students].sort().join("_");
      if (processedGroups.has(groupKey)) return;
      processedGroups.add(groupKey);

      const groupSize = students.length;

      // pick one student as representative
      const representative = students[0];

      // count how many classnotes exist for that student this month
      const classCount = monthClassnotes.filter(
        (cn) => (cn.student_name || "").trim() === representative.trim()
      ).length;

      // 🔥 subtract duplicated counts
      totalClasses -= (groupSize - 1) * classCount;
    });

    // More reliable calculation: Use classnotes (actual completed classes) as source of truth
    // Match each classnote with its corresponding schedule to get accurate duration
    // IMPORTANT: Only count schedules that match the selectedTeacher
    let totalHours = 0;
    const selectedTeacherTrimmed = (selectedTeacher || "").trim();

    if (monthClassnotes.length > 0 && monthSchedules.length > 0) {
      // Create a map of schedules by date and student for quick lookup
      // ONLY include schedules that match the selectedTeacher
      const scheduleMap = new Map<string, ScheduleEntry[]>();
      monthSchedules.forEach((schedule) => {
        // Filter by teacher_name to ensure we only count this teacher's hours
        const entryTeacher = (schedule.teacher_name || "").trim();
        if (entryTeacher && entryTeacher !== selectedTeacherTrimmed) {
          return; // Skip schedules from other teachers
        }

        const key = `${schedule.date || ""}_${schedule.student_name || ""}`;
        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, []);
        }
        scheduleMap.get(key)!.push(schedule);
      });

      // For each completed classnote, find matching schedule and sum duration
      monthClassnotes.forEach((classnote) => {
        const classnoteDate = classnote.date || (classnote as any).class_date;
        const studentName = classnote.student_name;
        const classnoteTeacher = (classnote.teacher_name || "").trim();

        // Only count classnotes from the selected teacher
        if (classnoteTeacher && classnoteTeacher !== selectedTeacherTrimmed) {
          return; // Skip classnotes from other teachers
        }

        if (!classnoteDate || !studentName) return;

        // Try to find matching schedule(s) for this classnote
        const scheduleKey = `${classnoteDate}_${studentName}`;
        const matchingSchedules = scheduleMap.get(scheduleKey) || [];

        if (matchingSchedules.length > 0) {
          // Use the first matching schedule's duration (or sum if multiple)
          matchingSchedules.forEach((schedule) => {
            totalHours += normalizeDuration(schedule.duration);
          });
        } else {
          // If no matching schedule found, try to find by date only (within same day)
          const classnoteDateObj = parseDateString(classnoteDate);
          if (classnoteDateObj) {
            const sameDaySchedules = monthSchedules.filter((s) => {
              const sDate = parseDateString(s.date);
              if (!sDate) return false;
              const sTeacher = (s.teacher_name || "").trim();
              return (
                sDate.toDateString() === classnoteDateObj.toDateString() &&
                (s.student_name || "").trim() === studentName.trim() &&
                (sTeacher === selectedTeacherTrimmed || (!sTeacher && selectedTeacherTrimmed))
              );
            });
            sameDaySchedules.forEach((schedule) => {
              totalHours += normalizeDuration(schedule.duration);
            });
          }
        }
      });
    }

    // Fallback: If no classnotes or no matches found, use schedule-based calculation
    // but ensure we're filtering correctly by teacher (STRICT: only selectedTeacher)
    if (totalHours === 0) {
      totalHours = monthSchedules
        .filter((entry) => {
          // STRICT filtering: Only count schedules from selectedTeacher
          const entryTeacher = (entry.teacher_name || "").trim();
          // Only include if teacher_name matches exactly, or if teacher_name is empty AND we're matching by selectedTeacher
          return entryTeacher === selectedTeacherTrimmed;
        })
        .reduce((sum, entry) => sum + normalizeDuration(entry.duration), 0);
    }

    const totalAmountDue = studentFinancials.reduce(
      (sum, item) => sum + item.amountDue,
      0
    );
    const monthlyRevenue = studentFinancials.reduce((sum, item) => {
      const completedClasses = item.classesCompleted ?? 0;
      const rate = item.hourlyRate ?? 0;
      return sum + completedClasses * rate;
    }, 0);

    const teacherPay = studentFinancials.reduce((sum, item) => {
      const completed = item.classesCompleted ?? 0;
      const rate = item.hourlyRate ?? 0;

      // Rule 1: Student fee is 40,000
      if (rate === 40000) {
        return sum + completed * 17500;
      }

      // Rule 2: Special teachers
      const teacherLower = (currentUser || "").toLowerCase();
      if (teacherLower === "chris" || teacherLower === "jeff") {
        return sum + completed * 27500;
      }

      // Rule 3: Default
      return sum + completed * 25000;
    }, 0);


    const totalNextToPay = studentFinancials.reduce(
      (sum, item) => sum + item.nextToPayClasses,
      0
    );
    return {
      totalClasses,
      totalHours,
      monthlyRevenue,
      teacherPay,          // ✅ NEW
      totalAmountDue,
      totalNextToPay,
      studentCount: studentRows.filter(
        (row) => row.classnotes.length > 0
      ).length,
    };
  }, [
    monthSchedules,
    monthClassnotes,
    selectedTeacher,
    studentFinancials,
    teacherStudents,
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

  const submitCreditAdjustment = async () => {
    if (!creditTarget) return;

    try {
      await fetch(
        `/api/student/${encodeURIComponent(
          creditTarget.studentName
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creditDelta: creditChange,   // credit change only
            creditAmount: creditAmount,  // money amount
            creditReason: reasonType === "기타" ? reasonOther : reasonType,
            adminName: currentUser,
          }),
        }
      );

      // 🔁 Refresh student profile
      studentProfileCacheRef.current[creditTarget.studentName] = undefined;
      await ensureStudentProfile(creditTarget.studentName);

      setCacheTick((t) => t + 1);
      setCreditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("크레딧 변경 실패");
    }
  };



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
              key={`${item.student_name}_schedule_${idx}`}
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
              key={`${student.name}_classnote_${idx}`}
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

  const renderDiaryDetails = (
    rows: (DiaryEntry | null)[],
    student: StudentInfo
  ) => {
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
          // ⛔ When no diary exists for that class interval
          if (!item) {
            return (
              <span
                key={`empty_diary_${idx}`}
                className="text-xs opacity-0 select-none"
              >
                &nbsp;
              </span>
            );
          }

          // 🗓 Extract date
          const dateStr = item.class_date ?? item.date ?? "";
          const formattedDate = formatDateForLink(dateStr);

          // 🔗 Diary URL
          const diaryUrl = `/teacher/student/diary?user=${encodeURIComponent(
            selectedTeacher
          )}&type=teacher&student_name=${encodeURIComponent(
            student.name
          )}&id=${encodeURIComponent(student.id)}`;

          return (
            <a
              key={`${student.name}_diary_${idx}`}
              href={diaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-sky-700 hover:text-sky-900 hover:underline"
            >
              {formattedDate || "—"}
            </a>
          );
        })}
      </div>
    );
  };

  const renderQuizletDetails = (
    rows: (QuizletEntry | null)[],
    student: StudentInfo
  ) => {
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
          if (!item)
            return (
              <span
                key={`empty_quizlet_${idx}`}
                className="text-xs opacity-0 select-none"
              >
                &nbsp;
              </span>
            );

          const dateStr = item.class_date ?? item.date ?? "";
          const formattedDate = formatDateForLink(dateStr);
          const quizletUrl = `/teacher/student/quizlet?user=${encodeURIComponent(
            selectedTeacher
          )}&type=teacher&student_name=${encodeURIComponent(
            student.name
          )}&id=${encodeURIComponent(student.id)}`;

          return (
            <a
              key={`${student.name}_quizlet_${idx}`}
              href={quizletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              {formattedDate || "—"}
            </a>
          );
        })}
      </div>
    );
  };

  const renderCreditMiniPanel = (studentName: string) => {
    const profile = studentProfileCacheRef.current[studentName];
    const history = Array.isArray(profile?.Credit_Automation_History)
      ? [...profile.Credit_Automation_History]
      : [];

    if (history.length === 0) {
      return (
        <div className="text-xs text-gray-400">
          No credit ledger
        </div>
      );
    }

    // Newest first (Excel convention: latest on top)
    history.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white">
        <table className="min-w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
            <tr className="text-gray-500 font-medium">
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-right">Δ</th>
              <th className="px-2 py-1 text-right">Before</th>
              <th className="px-2 py-1 text-right">After</th>
              <th className="px-2 py-1 text-right">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {history.map((item, idx) => {
              const delta = Number(item.delta ?? 0);
              const isDebit = delta < 0;

              const createdAtDate = parseDateString(item.createdAt);
              const date =
                item.class_date ??
                (createdAtDate ? formatDotDate(createdAtDate) : "—");

              const amount =
                typeof item.amount === "number"
                  ? item.amount
                  : Number(item.amount ?? 0);

              const typeLabel = getCreditLedgerTypeLabel(item);

              return (
                <tr
                  key={`${studentName}_ledger_${idx}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-2 py-1 whitespace-nowrap">
                    {date}
                  </td>

                  <td className="px-2 py-1 max-w-[180px] truncate">
                    {typeLabel}
                  </td>

                  <td
                    className={`px-2 py-1 text-right font-medium ${
                      isDebit ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {delta}
                  </td>

                  <td className="px-2 py-1 text-right text-gray-700">
                    {item.before}
                  </td>

                  <td className="px-2 py-1 text-right font-medium text-gray-900">
                    {item.after}
                  </td>

                  <td className="px-2 py-1 text-right">
                    {Number.isFinite(amount) && amount > 0
                      ? `₩${amount.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              월별 매출 및 수업 현황
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
                  className={`rounded-t-lg border px-4 py-2 text-sm font-medium ${selectedMonth === key
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

              {/* <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  교사 수업 시간
                </div>
                <div className="mt-1 text-2xl font-semibold text-blue-600">
                  {summary.totalHours.toFixed(2)}시간
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {selectedTeacher} 선생님 {monthLabelFromKey(selectedMonth || "")} 총 수업 시간
                </div>
              </div> */}

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {isAdmin
                    ? `이번달 매출 (₩)`
                    : ''
                  }
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {isAdmin
                    ? CURRENCY_FORMATTER.format(Math.round(summary.monthlyRevenue))
                    : '잘하고 있어요 😊'
                  }
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isAdmin
                    ? `이번달 수업 매출 (${monthLabelFromKey(selectedMonth)})`
                    : ''
                  }
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  선생님 Pay (₩)
                </div>

                <div className="mt-1 text-2xl font-semibold text-emerald-700">
                  {CURRENCY_FORMATTER.format(Math.round(summary.teacherPay))}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  정산 금액
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
                      <th className="px-4 py-3">특이사항</th>
                      <th className="px-4 py-3">Class Notes</th>
                      <th className="px-4 py-3">Diary</th>
                      <th className="px-4 py-3">Quizlet</th>
                      <th className="px-2 py-3"></th>
                      <th className="px-4 py-3 w-[240px] text-center">Actions</th>
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
                          // const classesCompletedValue =
                          //   financial?.classesCompleted ?? row.classnotes.length;
                          // const nextMonthPlannedValue =
                          //   financial?.nextMonthPlanned ?? row.nextSchedules.length;
                          // const carryAfterValue =
                          //   financial?.carryAfterSettlement ??
                          //   initialCreditValue - classesCompletedValue;
                          // const totalCreditsAvailableValue =
                          //   financial?.totalCreditsAvailable ??
                          //   Math.max(0, carryAfterValue);
                          // const nextToPayClassesValue =
                          //   financial?.nextToPayClasses ??
                          //   Math.max(0, nextMonthPlannedValue - carryAfterValue);
                          // const amountDueValue =
                          //   financial?.amountDue ??
                          //   Math.max(0, nextToPayClassesValue * hourlyRateValue);
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
                                  <div className="flex flex-col gap-2">

                                    {/* 🔥 STATUS FIRST */}
                                    <div className="flex flex-wrap items-center gap-2 min-h-[20px]">
                                      {(() => {
                                        const profile = studentProfileCacheRef.current[row.student.name];
                                        const group = groupClassMap[row.student.name];

                                        const isGroup = !!group;
                                        const isTwo = profile?.["1account2students"];

                                        if (!isGroup && !isTwo) {
                                          return <span className="text-xs text-gray-300">—</span>;
                                        }

                                        return (
                                          <>
                                            {isGroup && (
                                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                Group
                                              </span>
                                            )}
                                            {isTwo && (
                                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                1 Account
                                              </span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* 🔥 SMALL ACTION */}
                                    {isAdmin && (
                                      <button
                                        onClick={() => {
                                          setNoteTarget({
                                            studentId: row.student.id,
                                            studentName: row.student.name,
                                          });
                                          setNoteType("Group Class");
                                          setGroupStudents([row.student.name]);
                                          setGroupName("");
                                          setNoteModalOpen(true);
                                        }}
                                        className="text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline text-left"
                                      >
                                        + 추가
                                      </button>
                                    )}
                                  </div>
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
                                            key={`${row.student.name}_classnote_${idx}`}
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
                                        if (!item)
                                          return (
                                            <span key={`empty_diary_${idx}`} className="text-xs opacity-0 select-none">
                                              &nbsp;
                                            </span>
                                          );
                                        const dateStr = item.class_date ?? item.date ?? "";
                                        const formattedDate = formatDateForLink(dateStr);
                                        const diaryUrl = `/teacher/student/diary?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(row.student.name)}`;
                                        return (
                                          <a
                                            key={`${row.student.name}_diary_${idx}`}
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
                                        if (!item)
                                          return (
                                            <span key={`empty_quizlet_${idx}`} className="text-xs opacity-0 select-none">
                                              &nbsp;
                                            </span>
                                          );
                                        const dateStr = item.class_date ?? item.date ?? "";
                                        const formattedDate = formatDateForLink(dateStr);
                                        const quizletUrl = `/teacher/student/quizlet?user=${encodeURIComponent(selectedTeacher)}&type=teacher&student_name=${encodeURIComponent(row.student.name)}`;
                                        return (
                                          <a
                                            key={`${row.student.name}_quizlet_${idx}`}
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

                                    {/* ✅ CREDITS (PRIMARY) */}
                                    <div
                                      onClick={() => {
                                        if (!isAdmin) return;

                                        setCreditTarget({
                                          studentId: row.student.id,
                                          studentName: row.student.name,
                                          currentCredits: initialCreditValue,
                                        });
                                        setCreditAmount(0);
                                        setCreditChange(0);
                                        setReasonType("");
                                        setReasonOther("");
                                        setCreditModalOpen(true);
                                      }}
                                      className={`rounded-lg border px-3 py-2 cursor-pointer transition
                                        ${isAdmin ? "hover:bg-indigo-50 border-indigo-200" : "border-slate-200 bg-slate-50"}
                                      `}
                                    >
                                      <div className="text-[10px] text-gray-400">CREDITS</div>
                                      <div className="text-lg font-semibold text-gray-900">
                                        {initialCreditValue}
                                      </div>
                                    </div>

                                    {/* ✅ HOURLY RATE (SECONDARY) */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>Rate</span>

                                      <input
                                        type="number"
                                        step="1000"
                                        className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
                                        value={hourlyRateValue}
                                        onChange={(e) => {
                                          const parsed = Number.parseFloat(e.target.value);
                                          handleConfigChange(row.student.id, {
                                            rate: Number.isFinite(parsed) ? parsed : 0,
                                          });
                                        }}
                                      />
                                    </div>

                                  </div>
                                </td>
                                {/* <td className="px-4 py-3">
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
                                </td> */}

                                <td className="px-4 py-3">
                                  {renderCreditMiniPanel(row.student.name)}
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

                {creditModalOpen && creditTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">

                      <h3 className="text-sm font-semibold text-gray-900">
                        크레딧 조정 — {creditTarget.studentName}
                      </h3>

                      <div className="mt-4 space-y-4">

                        <div className="text-xs text-gray-500">
                          현재 크레딧:
                          <span className="ml-1 font-medium text-gray-900">
                            {creditTarget.currentCredits}
                          </span>
                        </div>

                        {/* 금액 */}
                        <label className="flex flex-col text-xs text-gray-600">
                          금액 (₩)
                          <input
                            type="number"
                            className="mt-1 rounded-md border px-2 py-1"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(Number(e.target.value))}
                          />
                        </label>

                        {/* 크레딧 */}
                        <label className="flex flex-col text-xs text-gray-600">
                          크레딧 변경
                          <input
                            type="number"
                            className="mt-1 rounded-md border px-2 py-1"
                            value={creditChange}
                            onChange={(e) => setCreditChange(Number(e.target.value))}
                          />
                        </label>

                        {/* 사유 */}
                        <div>
                          <div className="text-xs text-gray-600 mb-2">사유</div>

                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "현장결제(카드결제)",
                              "계좌이체",
                              "네이버스토어",
                              "기타",
                            ].map((type) => (
                              <button
                                key={type}
                                onClick={() => setReasonType(type)}
                                className={`rounded-md border px-2 py-1 text-xs ${
                                  reasonType === type
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {reasonType === "기타" && (
                          <input
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            placeholder="기타 사유 입력"
                            value={reasonOther}
                            onChange={(e) => setReasonOther(e.target.value)}
                          />
                        )}

                      </div>

                      <div className="mt-5 flex justify-end gap-2">
                        <button
                          className="rounded-md border px-3 py-1 text-xs"
                          onClick={() => setCreditModalOpen(false)}
                        >
                          취소
                        </button>

                        <button
                          className="rounded-md bg-indigo-600 text-white px-3 py-1 text-xs"
                          onClick={submitCreditAdjustment}
                        >
                          저장
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {noteModalOpen && noteTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                      {/* Title */}
                      <h3 className="text-base font-semibold text-gray-900">
                        학생 특이사항 추가
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        학생의 수업 방식 또는 과금 구조를 설정하세요
                      </p>

                      {/* Options */}
                      <div className="mt-5 space-y-3">

                        {/* Group Class */}
                        <div
                          onClick={() => setNoteType("Group Class")}
                          className={`cursor-pointer rounded-xl border p-4 transition-all
                            ${
                              noteType === "Group Class"
                                ? "border-yellow-400 bg-yellow-50 shadow-sm ring-1 ring-yellow-200"
                                : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/40"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-yellow-800">
                              🟡 Group Class
                            </span>

                            {noteType === "Group Class" && (
                              <span className="text-yellow-500 text-sm">✓</span>
                            )}
                          </div>

                            {noteType === "Group Class" && (
                              <div className="mt-5 space-y-4">

                                {/* Group Name */}
                                {/* <div>
                                  <div className="text-xs text-gray-500 mb-1">Group Name (optional)</div>
                                  <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="ex. Tue 5PM Group"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200 outline-none"
                                  />
                                </div> */}

                                {/* Student Selection */}
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">그룹 학생 선택</div>

                                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
                                    {(teacherStudents[selectedTeacher] || []).map((s) => {
                                      const selected = groupStudents.includes(s.name);

                                      return (
                                        <div
                                          key={s.name}
                                          onClick={() => {
                                            setGroupStudents((prev) =>
                                              prev.includes(s.name)
                                                ? prev.filter((n) => n !== s.name)
                                                : [...prev, s.name]
                                            );
                                          }}
                                          className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition
                                            ${
                                              selected
                                                ? "bg-yellow-100 text-yellow-900"
                                                : "hover:bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                          <span>{s.name}</span>
                                          {selected && <span>✓</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Selected Pills */}
                                <div className="flex flex-wrap gap-2">
                                  {groupStudents.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>

                                {/* Description */}
                                <div className="text-xs text-yellow-900/80 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                  Group class students will be linked together.  
                                  Classes will be counted jointly and group pricing will apply.
                                </div>

                              </div>
                            )}
                        </div>

                        {/* 1 Account for 2 Students */}
                        <div
                          onClick={() => setNoteType("1 Account for 2 Students")}
                          className={`cursor-pointer rounded-xl border p-4 transition-all
                            ${
                              noteType === "1 Account for 2 Students"
                                ? "border-amber-700 bg-amber-50 shadow-sm ring-1 ring-amber-200"
                                : "border-gray-200 hover:border-amber-400 hover:bg-amber-50/40"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-amber-800">
                              🟤 1 Account for 2 Students
                            </span>

                            {noteType === "1 Account for 2 Students" && (
                              <span className="text-amber-700 text-sm">✓</span>
                            )}
                          </div>

                          {noteType === "1 Account for 2 Students" && (
                            <div className="mt-2 text-xs text-amber-900/80 leading-relaxed">
                              This is for accounts that include both students in a group class. <br />
                              Credits will be charged based on a 2-person pricing <br />
                              (ex. 40,000 × 2 people = 80,000 per credit).
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          onClick={() => setNoteModalOpen(false)}
                        >
                          취소
                        </button>

                        <button
                          disabled={!noteType}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                          onClick={async () => {
                            if (!noteTarget || !noteType) return;

                            try {
                              // ✅ GROUP CLASS → NEW API
                              if (noteType === "Group Class") {
                                if (groupStudents.length < 2) {
                                  alert("최소 2명 이상 선택해야 합니다");
                                  return;
                                }

                                await fetch("/api/group-class", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    group_name: groupName,
                                    group_students: groupStudents,
                                  }),
                                });

                                setGroupStudents([]);
                                setGroupName("");
                              }

                              // ✅ 1 ACCOUNT → keep existing logic (for now)
                              if (noteType === "1 Account for 2 Students") {
                                await fetch(
                                  `/api/student/${encodeURIComponent(noteTarget.studentName)}`,
                                  {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      "1account2students": true,
                                    }),
                                  }
                                );

                                const existing =
                                  studentProfileCacheRef.current[noteTarget.studentName] || {};

                                studentProfileCacheRef.current[noteTarget.studentName] = {
                                  ...existing,
                                  "1account2students": true,
                                };
                              }

                              // ✅ refresh UI
                              setCacheTick((t) => t + 1);
                              setNoteModalOpen(false);

                            } catch (err) {
                              console.error(err);
                              alert("저장 실패");
                            }
                          }}
                        >
                          저장
                        </button>
                      </div>

                    </div>
                  </div>
                )}

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

