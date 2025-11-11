"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

// Lightweight types because we lazy-load Calendar to avoid SSR issues
type EventObject = any;
type CalendarCtor = any;

type Variant = "compact" | "full";

interface ToastEventInput {
  _id?: string;
  id?: string;
  calendarId?: string;
  room_name: string;
  date: string | undefined; // "YYYY. MM. DD"
  time: number;             // hour 0-23, supports .5
  duration: number;         // hours, supports .5
  teacher_name: string;
  student_name: string;
}

interface Props {
  data: ToastEventInput[];
  quizletDates?: string[] | Record<string, string[]>;
  height?: string | number;
  fitViewportOffset?: number;

  // visuals
  variant?: Variant;
  forceView?: "month" | "week";

  // API base for save/update/delete
  saveEndpointBase?: string;

  // defaults for "Add Class"
  defaults?: {
    teacher_name?: string;
    student_name?: string;
    room_name?: string;
    time?: number;       // 0-23 (can be .5)
    duration?: number;   // hours (can be .5)
  };
  studentOptions?: string[];

  /** Enable the left sidebar (admin page) */
  enableTeacherSidebar?: boolean;
  /** Optional allow-list / order for teacher filters; otherwise derived from data */
  allowedTeachers?: string[];
  /** Optional explicit per-teacher color map (background). e.g., { "Amy": "#FBCFE8" } */
  teacherColors?: Record<string, string>;
}

/* ---------------------------- Date helpers (KST-like local) ---------------------------- */
function dateKeyFromDate(d: Date) { // "YYYY. MM. DD."
  return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,"0")}. ${String(d.getDate()).padStart(2,"0")}.`;
}
function kstTodayOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
/** tolerance minutes for "time match" (e.g., 15) */
const MATCH_TOL_MIN = 15;

function minutesDiff(a: Date, b: Date) {
  return Math.abs((a.getTime() - b.getTime()) / 60000);
}

function toDateYMD(str?: string | null) {
  if (!str) return null;
  const s = String(str).trim();
  const m =
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/) || // 2025. 9. 9 / 2025. 09. 09.
    s.match(/^(\d{4})[-\/]\s*(\d{1,2})[-\/]\s*(\d{1,2})\.?$/) || // 2025-9-9, 2025/09/09
    s.match(/^(\d{4})(\d{2})(\d{2})$/); // 20250909
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
function ymdString(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}
function toLocalDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
// AFTER — rounds to nearest 30 min, min 30 min
function getDurationHours(start: Date, end: Date) {
  const mins = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));
  return Math.round(mins / 30) / 2; // 0.5, 1.0, 1.5, ...
}

// Replace previous link builders
function buildQuizletUrl(student: string) {
  return `/teacher/student/quizlet?student_name=${encodeURIComponent(student)}`;
}

function buildDiaryUrl(student: string) {
  return `/teacher/student/diary?student_name=${encodeURIComponent(student)}`;
}





/* ----------------------------- Color utilities ----------------------------- */
const PASTEL_PALETTE = [
  "#FBCFE8", "#FECDD3", "#F5D0FE", "#E9D5FF", "#DDD6FE",
  "#C7D2FE", "#BFDBFE", "#BAE6FD", "#A5F3FC", "#99F6E4",
  "#A7F3D0", "#BBF7D0", "#D9F99D", "#FEF08A", "#FDE68A",
  "#FED7AA", "#FECACA", "#E7E5E4", "#E5E7EB", "#E2E8F0",
];

function hashIdx(name: string, mod: number) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(1, mod);
}
function shade(hex: string, p: number) {
  const n = Math.max(-100, Math.min(100, p));
  const amt = (n / 100) * 255;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  let r = parseInt(m[1], 16) + amt;
  let g = parseInt(m[2], 16) + amt;
  let b = parseInt(m[3], 16) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function TeacherToastUI({
  data,

  variant = "compact",
  saveEndpointBase = "/api/schedules",
  forceView,
  defaults,
  studentOptions = [],
  enableTeacherSidebar = false,
  allowedTeachers,
  teacherColors,
}: Props) {

  // --- per-student cache for class_history (for popover meta)
  const studentCacheRef = useRef<Map<string, any>>(new Map());
  const [studentMeta, setStudentMeta] = useState<Record<string, { quizlet_date?: string; diary_date?: string }> | null>(null);
  const [, setStudentMetaLoading] = useState(false);
  // teacher list for Add form
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);

  // class notes fetched for visible range; key: `${student_name}::${dateDot}`
  const [classnoteMap, setClassnoteMap] = useState<Map<string, any[]>>(new Map());

  // helpers
  function buildClassHistoryMap(class_history: any[]): Record<string, { quizlet_date?: string; diary_date?: string }> {
    const map: Record<string, { quizlet_date?: string; diary_date?: string }> = {};
    (class_history || []).forEach((entry: any) => {
      const [k, v] = Object.entries(entry || {})[0] || [];
      if (k && v && typeof v === "object") map[String(k)] = v as any;
    });
    return map;
  }

  // calendar refs
  const containerRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<InstanceType<CalendarCtor> | null>(null);

  // remember where the user is (prevents snap-back)
  const viewDateRef = useRef<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  function rememberAndSetDate(d: Date) {
    viewDateRef.current = d;
    setCurrentDate(d);
  }

  const [viewName, setViewName] = useState<"week" | "month">(forceView ?? "week");

  // popovers
  const popRef = useRef<HTMLDivElement | null>(null);
  const [detail, setDetail] = useState<{ event: EventObject | null; x: number; y: number } | null>(null);

  const addRef = useRef<HTMLDivElement | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addAnchor, setAddAnchor] = useState<null | { x: number; y: number }>(null);
  const [addForm, setAddForm] = useState({
    date: ymdString(new Date()),
    room_name: defaults?.room_name ?? "101",
    time: String(defaults?.time ?? 18),
    duration: String(defaults?.duration ?? 1),
    student_name: defaults?.student_name ?? "",
    teacher_name: defaults?.teacher_name ?? "",
  });
  const updateAdd = (patch: Partial<typeof addForm>) => setAddForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (addOpen && !addForm.student_name && studentOptions.length > 0) {
      setAddForm((p) => ({ ...p, student_name: studentOptions[0] }));
    }
  }, [addOpen, studentOptions, addForm.student_name]);

  /* ------------------------------ Teacher filters --------------------------- */
  const uniqueTeachers = useMemo(() => {
    if (allowedTeachers && allowedTeachers.length) return [...allowedTeachers];
    const s = new Set<string>();
    (data || []).forEach(d => { const t = d.teacher_name?.trim(); if (t) s.add(t); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "en"));
  }, [data, allowedTeachers?.join("|")]);

  const teacherColorMap = useMemo(() => {
    const map = new Map<string, { bg: string; border: string }>();
    uniqueTeachers.forEach((t) => {
      const base =
        (teacherColors && teacherColors[t]) ||
        PASTEL_PALETTE[hashIdx(t, PASTEL_PALETTE.length)];
      map.set(t, { bg: base, border: shade(base, -14) });
    });
    return map;
  }, [uniqueTeachers.join("|"), teacherColors ? JSON.stringify(teacherColors) : ""]);

  const [teacherFilter, setTeacherFilter] = useState<Set<string>>(new Set());
  const initialized = useRef(false);
  useEffect(() => {
    setTeacherFilter((prev) => {
      if (!initialized.current) {
        initialized.current = true;
        return new Set(uniqueTeachers);
      }
      const next = new Set<string>();
      uniqueTeachers.forEach((t) => { if (prev.has(t)) next.add(t); });
      return next;
    });
  }, [uniqueTeachers.join("|")]);

  useEffect(() => {
    if (!initialized.current) return;
    const selected = Array.from(teacherFilter);
    try {
      window.dispatchEvent(new CustomEvent("teacherSidebar:change", { detail: { selected } }));
    } catch {}
  }, [teacherFilter]);

  const toggleTeacher = (t: string) =>
    setTeacherFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  const selectAllTeachers = () => setTeacherFilter(new Set(uniqueTeachers));
  const clearTeachers = () => {
    setTeacherFilter(new Set());
    try { window.dispatchEvent(new Event("teacherSidebar:clear")); } catch {}
  };

  // fetch teachers for Add form
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teacher", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch teachers");
        const payload = await res.json();
        const list =
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.teachers)
            ? payload.teachers
            : payload && typeof payload === "object"
            ? [payload]
            : [];
        const names = list.map((t: any) => t?.name).filter(Boolean);
        setTeacherOptions(names);
        setAddForm((p) => (!p.teacher_name && names.length ? { ...p, teacher_name: names[0] } : p));
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTeacherOptions([]);
      }
    };
    fetchTeachers();
  }, []);

  // --- fetch meta for clicked student (quizlet/diary)
  useEffect(() => {
    if (!detail?.event) { setStudentMeta(null); return; }

    const student = detail.event.raw?.student_name?.trim();
    if (!student) { setStudentMeta(null); return; }

    const cached = studentCacheRef.current.get(student);
    if (cached) {
      setStudentMeta(buildClassHistoryMap(cached.class_history || []));
      return;
    }

    setStudentMetaLoading(true);
    fetch(`/api/student/${encodeURIComponent(student)}`)
      .then(res => res.ok ? res.json() : null)
      .then(doc => {
        if (doc) {
          studentCacheRef.current.set(student, doc);
          setStudentMeta(buildClassHistoryMap(doc.class_history || []));
        } else {
          setStudentMeta(null);
        }
      })
      .catch(() => setStudentMeta(null))
      .finally(() => setStudentMetaLoading(false));
  }, [detail?.event?.id]);

  // Build schedules index for past/today
  type SchedRow = { start: Date; end: Date; room_name?: string; teacher_name?: string; raw: any };
  const pastSchedulesIndex = useMemo(() => {
    const idx = new Map<string, SchedRow[]>();
    const today = kstTodayOnly();
    for (const r of data || []) {
      if (!r?.date || Number.isNaN(r.time) || Number.isNaN(r.duration)) continue;
      const base = toDateYMD(r.date);
      if (!base) continue;
      const dateOnly = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      if (dateOnly.getTime() > today.getTime()) continue; // keep only past or today
      const h = Math.floor(r.time);
      const m = Math.round((r.time - h) * 60);
      const s = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0);
      const e = new Date(s.getTime() + r.duration * 3600000);
      const key = `${r.student_name}::${ymdString(base)}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key)!.push({ start: s, end: e, room_name: r.room_name, teacher_name: r.teacher_name, raw: r });
    }
    return idx;
  }, [data]);

  /* ----------------------- Normalize incoming -> events ---------------------- */
  const eventsFromProps = useMemo(() => {
    const events: EventObject[] = [];

    // 1) Normal schedules (render today + future)
    for (const e of data || []) {
      if (!e.date || Number.isNaN(e.time) || Number.isNaN(e.duration)) continue;
      const base = toDateYMD(e.date);
      if (!base) continue;

      const today = kstTodayOnly();
      const dateOnly = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      if (dateOnly.getTime() < today.getTime()) continue; // skip only *before today*

      const startHour = Math.floor(e.time);
      const startMin = Math.round((e.time - startHour) * 60);
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), startHour, startMin, 0);
      const end = new Date(start.getTime() + e.duration * 3600000);

      const tName = e.teacher_name?.trim() ?? "";
      const color = teacherColorMap.get(tName);

      events.push({
        id: e._id || e.id || `${Date.now()}-${Math.random()}`,
        calendarId: e.calendarId ?? "1",
        title: `${e.room_name ?? ""} ${e.student_name ?? ""}`,
        category: "time",
        start,
        end,
        backgroundColor: color?.bg ?? "#EEF2FF",
        borderColor: color?.border ?? "#C7D2FE",
        dragBackgroundColor: color?.bg ?? "#E0E7FF",
        color: "#111827",
        raw: {
          ...e,
          schedule_id: e._id || e.id, // ✅ always keep the real DB ID here
        },
      });

    }

    // === Recolor past & today schedules when a classnote exists ===
    const today = kstTodayOnly();

    // Build index of schedule events by (student,date)
    const byStudentDate = new Map<string, EventObject[]>();
    for (const ev of events) {
      const student = ev?.raw?.student_name || "";
      const dateKey = ymdString(toLocalDateOnly(new Date(ev.start)));
      const k = `${student}::${dateKey}`;
      if (!byStudentDate.has(k)) byStudentDate.set(k, []);
      byStudentDate.get(k)!.push(ev);
    }

    for (const [k, evList] of byStudentDate.entries()) {
      const [, dateDot] = k.split("::");
      const dt = toDateYMD(dateDot);
      if (!dt) continue;
      const dateOnly = toLocalDateOnly(dt);
      if (dateOnly.getTime() > today.getTime()) continue;

      const notes = classnoteMap.get(k) || [];

      // 🆕 Fallback: if no classnote exists at all for this date → mark red and skip further processing
      if (notes.length === 0) {
        for (const ev of evList) {
          ev.backgroundColor = "#FECACA";
          ev.borderColor = "#DC2626";
          ev.color = "#7F1D1D";
        }
        continue; // no notes, skip rest
      }

      const note = notes
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        )[0];

        // ✅ Protector: if this note explicitly marked as "class time changed", force green
        if (
          typeof note?.reason === "string" &&
          note.reason.toLowerCase().trim().includes("class time changed")
        ) {
          for (const ev of evList) {
            ev.backgroundColor = "#D1FAE5"; // light green
            ev.borderColor = "#10B981";     // green
            ev.color = "#064E3B";           // dark green
          }
          continue; // ✅ skip rest of loop for this student/date
        }



      const started = note?.started_at ? new Date(note.started_at) : null;
      const ended = note?.ended_at ? new Date(note.ended_at) : null;

      for (const ev of evList) {
        if (!started || !ended) {
          ev.backgroundColor = "#FECACA";
          ev.borderColor = "#DC2626";
          ev.color = "#7F1D1D";
          continue;
        }

        const schStart = new Date(ev.start);
        const schEnd = new Date(ev.end);
        const startOK = minutesDiff(schStart, started) <= MATCH_TOL_MIN;
        const endOK = minutesDiff(schEnd, ended) <= MATCH_TOL_MIN;

        if (startOK && endOK) {
          ev.backgroundColor = "#D1FAE5";
          ev.borderColor = "#10B981";
          ev.color = "#064E3B";
        } else {
          ev.backgroundColor = "#FEF3C7"; // light yellow
          ev.borderColor = "#F59E0B";     // amber border
          ev.color = "#78350F";           // dark amber text
        }
      }
    }



    // 3) Add classnote-driven events for past/today ONLY (no duplicate if schedule already present)
    for (const [k, notes] of classnoteMap.entries()) {
      const [student, dateDot] = k.split("::");
      const dt = toDateYMD(dateDot);
      if (!dt) continue;

      const todayOnly = kstTodayOnly();
      const dateOnly = toLocalDateOnly(dt);
      if (dateOnly.getTime() > todayOnly.getTime()) continue; // only past/today

      // if a schedule already exists for (student, date), don't add note event (the schedule above was recolored)
      if (byStudentDate.has(k)) continue;

      const note = notes.slice().sort((a,b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      )[0];

      // ✅ protector for note-only events too
      if (
        typeof note?.reason === "string" &&
        note.reason.toLowerCase().trim().includes("class time changed")
      ) {
        const s = note?.started_at ? new Date(note.started_at) : new Date(dt);
        const e = note?.ended_at ? new Date(note.ended_at) : new Date(s.getTime() + 30 * 60 * 1000);

        events.push({
          id: `note-${student}-${dateDot}-${Math.random().toString(36).slice(2)}`,
          calendarId: "classnote",
          title: `🟢 ${student} (Time Changed)`,
          category: "time",
          start: s,
          end: e,
          backgroundColor: "#D1FAE5",
          borderColor: "#10B981",
          color: "#064E3B",
          isReadOnly: true,
          raw: {
            note_only: true,
            student_name: student,
            date: dateDot,
          },
        });
        continue; // ✅ skip rest of this loop
      }


      const roundToMin = (d: Date) => new Date(Math.round(d.getTime() / 60000) * 60000);
      const started = note?.started_at ? roundToMin(new Date(note.started_at)) : null;
      const ended   = note?.ended_at   ? roundToMin(new Date(note.ended_at))   : null;

      // compare only with past/today schedules for matching
      const candidates = pastSchedulesIndex.get(k) || [];
      let matched: { start: Date; end: Date; room_name?: string; teacher_name?: string } | null = null;

      if (started && ended && candidates.length) {
        for (const cand of candidates) {
          const startOK = minutesDiff(cand.start, started) <= MATCH_TOL_MIN;
          const endOK   = minutesDiff(cand.end,   ended)   <= MATCH_TOL_MIN;
          if (startOK && endOK) { matched = cand; break; }
        }
      }

      const s = matched ? matched.start : (started ?? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 9, 0, 0));
      const e = matched ? matched.end   : (ended   ?? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 9, 30, 0));

      const isGreen = Boolean(matched);
      const bg = isGreen ? "#D1FAE5" : "#FEF3C7"; ;
      const border = isGreen ? "#10B981" : "#DC2626";
      const text = isGreen ? "#064E3B" : "#7F1D1D";

      events.push({
        id: `note-${student}-${dateDot}-${Math.random().toString(36).slice(2)}`,
        calendarId: "classnote",
        title: isGreen ? `📝 ${student}님 수업 확인` : `⚠️ ${student}: 수업 없음`,
        category: "time",
        start: s,
        end: e,
        backgroundColor: bg,
        borderColor: border,
        color: text,
        isReadOnly: true,
        raw: {
          note_only: !matched,
          student_name: student,
          date: dateDot,
          room_name: matched?.room_name,
          teacher_name: matched?.teacher_name,
        },
      });
    }

    return events;
  }, [data, teacherColorMap, classnoteMap, pastSchedulesIndex]);

  /* ------------------------------- Apply filters ---------------------------- */
  const filteredEvents = useMemo(() => {
    return (eventsFromProps || []).filter((ev) => {
      const teacher = ev?.raw?.teacher_name || "";
      if (enableTeacherSidebar) {
        if (teacherFilter.size > 0 && !teacherFilter.has(teacher)) return false;
      }
      return true;
    });
  }, [eventsFromProps, enableTeacherSidebar, teacherFilter]);

  /* ------------------------------- API helpers ------------------------------- */
  const postJSON = async (url: string, method: "POST" | "PATCH" | "DELETE", body?: any) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${url} failed`);
    try { window.dispatchEvent(new CustomEvent("calendar:saved")); } catch {}
    return res.json().catch(() => ({}));
  };

  const saveCreate = async (payload: {
    date: string; time: number; duration: number; room_name: string; teacher_name: string; student_name: string; calendarId?: string;
  }) => postJSON(`${saveEndpointBase}`, "POST", payload);

  const saveUpdateById = async (id: string, date: string, time: number, duration: number) =>
    postJSON(`${saveEndpointBase}/${id}`, "PATCH", { date, time, duration });

  const saveDelete = async (scheduleId: string) =>
    postJSON(`${saveEndpointBase}/${scheduleId}`, "DELETE");

  /* -------------------------- Data-driven future match ----------------------- */
  function collectFutureMatchesFromData(
    base: EventObject,
    reference: { hour: number; durationH: number }
  ) {
    const baseStart = new Date(base.start as any);
    const baseDOW = baseStart.getDay();
    const baseDateOnly = toLocalDateOnly(baseStart);
    const student = base?.raw?.student_name ?? "";

    const matches: Array<{ scheduleId: string; date: Date }> = [];

    for (const row of data || []) {
      if (!row?.student_name || row.student_name !== student) continue;
      const dt = toDateYMD(row.date);
      if (!dt) continue;

      if (toLocalDateOnly(dt).getTime() < baseDateOnly.getTime()) continue;
      if (dt.getDay() !== baseDOW) continue;

      if (Number(row.time) !== reference.hour) continue;
      if (Number(row.duration) !== reference.durationH) continue;

      const scheduleId = String(row._id ?? row.id ?? "");
      if (!scheduleId) continue;
      matches.push({ scheduleId, date: dt });
    }
    return matches;
  }

  function updateVisibleEventIfMounted(id: string, calendarId: string, newStart: Date, newEnd: Date) {
    try {
      const existing = calRef.current?.getEvent?.(id, calendarId);
      if (existing) {
        calRef.current?.updateEvent(id, calendarId, { start: newStart, end: newEnd });
      }
    } catch {}
  }

  /* ------------------------------- Init calendar (ONCE) ------------------------------ */
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const mod = await import("@toast-ui/calendar");
      if (!isMounted || !containerRef.current) return;

      const Calendar: CalendarCtor = mod.default;
      if (!calRef.current) {
        calRef.current = new Calendar(containerRef.current, {
          defaultView: forceView ?? "week",
          useDetailPopup: false,
          usageStatistics: false,
          isReadOnly: false,
          gridSelection: true,
          template: {
            time(ev: any) {
              const student = ev?.raw?.student_name ?? "";
              const room = ev?.raw?.room_name ?? "";
              const s = new Date(ev.start);
              const e = new Date(ev.end);
              const hhmm = (d: Date) =>
                `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              const timeRange = `${hhmm(s)}–${hhmm(e)}`;
              return `
                <div class="tuic-event-sm">
                  <div class="tuic-line1">${student} • ${room}</div>
                  <div class="tuic-line2">${timeRange}</div>
                </div>
              `;
            },
            /** <-- this is the month cell schedule renderer */
            monthGridSchedule(ev: any) {
              const student = ev?.raw?.student_name ?? "";
              const room = ev?.raw?.room_name ?? "";
              const s = new Date(ev.start);
              const e = new Date(ev.end);
              const hhmm = (d: Date) => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
              const timeRange = `${hhmm(s)}–${hhmm(e)}`;
              return `
                <div class="tuic-event-sm">
                  <div class="tuic-line1">${student} • ${room}</div>
                  <div class="tuic-line2">${timeRange}</div>
                </div>
              `;
            },
          },
          week: {
            startDayOfWeek: 0,
            dayNames: ["일", "월", "화", "수", "목", "금", "토"],
            taskView: false,
            eventView: ["time"],
            showNowIndicator: true,
            hourStart: variant === "compact" ? 8 : 7,
            hourEnd:   24,
            workweek: false,
          },
          month: {
            isAlways6Weeks: false,
            visibleWeeksCount: 0,
            startDayOfWeek: 0,
            dayNames: ["일", "월", "화", "수", "목", "금", "토"],
            narrowWeekend: false,
            scheduleHeight: 28, 
          },

        });
        // --- Theme & CSS (once) ---
        const styleId = "tuic-modern-theme-unified";
        if (!document.getElementById(styleId)) {
          const el = document.createElement("style");
          el.id = styleId;
          el.textContent = `
        /* Base look */
        .toastui-calendar-layout { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Noto Sans", "Malgun Gothic", sans-serif; }
        .toastui-calendar-panel { background:#fff; border-radius:16px; overflow:hidden; }
        .toastui-calendar-daygrid, .toastui-calendar-week { border-color:#eef1f4; }
        .toastui-calendar-dayname { background:#f7f8fa; color:#4b5563; font-weight:600; border-bottom:1px solid #eef1f4; }
        .toastui-calendar-today .toastui-calendar-dayname-date-area, .toastui-calendar-today .toastui-calendar-weekday-grid-line { background:#eef6ff; }
        .toastui-calendar-timegrid-now-indicator { background:#0ea5e9; }
        .toastui-calendar-timegrid-now-indicator-arrow { border-bottom-color:#0ea5e9; }
        .toastui-calendar-timegrid-hour { color:#6b7280; font-size:10px; }
        .toastui-calendar-time-schedule { border:none !important; }
        .toastui-calendar-time-schedule-block { border-radius:12px !important; box-shadow:0 1px 2px rgba(16,24,40,.06); }
        .toastui-calendar-time-schedule .toastui-calendar-event-time-content { background:transparent !important; }

        /* === No vertical scroll: force grid to fill container height */
        .toastui-calendar-panel.toastui-calendar-time { overflow-y: hidden !important; }
        .toastui-calendar-timegrid,
        .toastui-calendar-timegrid-container,
        .toastui-calendar-timegrid-scrollarea,
        .toastui-calendar-timegrid-hour-area,
        .toastui-calendar-timegrid-schedules {
          height: 100% !important;
          min-height: 0 !important;
          overflow-y: hidden !important;
        }

        /* ====== COMPACT VARIANT ====== */
        .tuic-compact .toastui-calendar-dayname { font-size:12px; }
        .tuic-compact .toastui-calendar-timegrid-hour { font-size:9px; }
        .tuic-compact .toastui-calendar-timegrid-gridline { height:16px !important; }
        .tuic-compact .toastui-calendar-timegrid-half-hour { height:8px !important; }
        .tuic-compact .toastui-calendar-time-schedule-block { border-radius:10px !important; }
        .tuic-compact .tuic-event-sm .tuic-line1{ font-size:10px; }
        .tuic-compact .tuic-event-sm .tuic-line2{ font-size:9px; }
        .tuic-compact .toastui-calendar-timegrid .toastui-calendar-time-schedule-content { padding-top: 0; padding-bottom: 0; }
        /* Allow 2 lines in month cells for our custom template */
        .toastui-calendar-month .tuic-event-sm { line-height: 1.15; }
        .toastui-calendar-month .tuic-event-sm .tuic-line1 { 
          font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .toastui-calendar-month .tuic-event-sm .tuic-line2 { 
          margin-top: 2px; font-size: 10px; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* In case the month view enforces single-line heights on events */
        .toastui-calendar-month .toastui-calendar-weekday-schedule { height: auto !important; }
        .toastui-calendar-month .toastui-calendar-event-time-content { white-space: normal !important; }

        /* ====== FULL VARIANT ====== */
        .tuic-full .toastui-calendar-timegrid-gridline { height:auto !important; }
        .tuic-full .toastui-calendar-timegrid-half-hour { height:auto !important; }
        .tuic-full .toastui-calendar-timegrid .toastui-calendar-time-schedule-content { padding-top: 1px; padding-bottom: 1px; }
        
        /* Make month schedules tall enough for two lines */
        .toastui-calendar-month .toastui-calendar-weekday-schedule {
          height: auto !important;
          min-height: 28px;              /* match scheduleHeight or a bit less */
          padding: 2px 4px;
          box-sizing: border-box;
        }

        /* Our two-line template */
        .toastui-calendar-month .tuic-event-sm { 
          display: block; 
          line-height: 1.15; 
        }
        .toastui-calendar-month .tuic-event-sm .tuic-line1 { 
          font-size: 11px; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }
        .toastui-calendar-month .tuic-event-sm .tuic-line2 { 
          margin-top: 2px; 
          font-size: 10px; 
          opacity: .9; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }

        /* Prevent internal wrappers from forcing single-line clips */
        .toastui-calendar-month .toastui-calendar-event-time-content {
          white-space: normal !important;
        }

        `;
          document.head.appendChild(el);
        }

        // Theme (once)
        calRef.current.setTheme({
          common: {
            backgroundColor: "#ffffff",
            border: "1px solid #eef1f4",
            gridSelection: { backgroundColor: "rgba(99,102,241,0.06)", border: "1px dashed #c7d2fe" },
          },
          week: {
            dayName: { borderBottom: "1px solid #eef1f4", backgroundColor: "#f7f8fa", color: "#475569" },
            nowIndicatorLabel: { color: "#0ea5e9", backgroundColor: "#0ea5e9" },
            nowIndicatorPast: { border: "1px solid #0ea5e9" },
            nowIndicatorBullet: { backgroundColor: "#0ea5e9" },
          },
          month: {
            dayName: { borderBottom: "1px solid #eef1f4", backgroundColor: "#f7f8fa", color: "#475569" },
          },
          time: { fontSize: "12px", fontWeight: "500", color: "#1f2937", backgroundColor: "#eff6ff" },
        });

        // Handlers
        const handleClick = (args: { event: EventObject; nativeEvent?: MouseEvent }) => {
          const { event, nativeEvent } = args || {};
          if (!event) return;
          const rect = containerRef.current?.getBoundingClientRect();
          const x = (nativeEvent?.clientX ?? 0) - (rect?.left ?? 0);
          const y = (nativeEvent?.clientY ?? 0) - (rect?.top ?? 0);
          setDetail({ event, x, y });
          setAddOpen(false);
        };

        const handleBeforeUpdate = async ({ event, changes }: { event: EventObject; changes: Partial<EventObject> }) => {
          const oldStart = new Date(event.start as any);
          const oldEnd = new Date(event.end as any);
          const oldRef = { hour: oldStart.getHours(), durationH: getDurationHours(oldStart, oldEnd) };

          setDetail((d) => (d?.event?.id === event.id ? null : d));
          calRef.current?.updateEvent(event.id as string, event.calendarId as string, changes);

          try {
            const after = { ...event, ...changes };
            const start = new Date(after.start as any);
            const end = new Date(after.end as any);
            await saveUpdateById(
              String(after.raw?.schedule_id || after.id),
              ymdString(start),
              start.getHours() + start.getMinutes() / 60,
              getDurationHours(start, end)
            );
          } catch (e: any) {
            alert(`저장 실패: ${e?.message ?? e}`);
            return;
          }

          openBulkUpdatePanel({ ...event, ...changes }, oldRef, null);
        };

        const handleSelectDateTime = (args: any) => {
          const { start, end, nativeEvent } = args || {};
          if (!containerRef.current || !start) return;

          setDetail(null);

          const rect = containerRef.current.getBoundingClientRect();
          const x = (nativeEvent?.clientX ?? rect.left) - rect.left;
          const y = (nativeEvent?.clientY ?? rect.top) - rect.top;

          const s = new Date(start);
          const e = end ? new Date(end) : new Date(s.getTime() + 30 * 60 * 1000);
          const mins = Math.max(30, Math.round((e.getTime() - s.getTime()) / 60000));
          const hours = Math.round(mins / 30) / 2;

          setAddOpen(true);
          setRepeatMode(false);
          setAddAnchor({ x, y });
          setAddForm((p) => ({
            ...p,
            date: ymdString(s),
            time: String(s.getHours() + s.getMinutes() / 60),
            duration: String(hours),
          }));

          try { calRef.current?.clearGridSelections?.(); } catch {}
        };

        calRef.current.on("clickEvent", handleClick);
        calRef.current.on("beforeUpdateEvent", handleBeforeUpdate);
        calRef.current.on("selectDateTime", handleSelectDateTime);

        // open where the user last was
        calRef.current.setDate(viewDateRef.current);
        setCurrentDate(viewDateRef.current);
      }

      // keep hour range in sync with variant
      calRef.current!.setOptions({
        week: {
          hourStart: variant === "compact" ? 8 : 7,
          hourEnd:   24,
        },
      });
    })();

    return () => {
      isMounted = false;
      // do NOT destroy on data changes; only if container truly unmounted
      if (!containerRef.current && calRef.current) {
        try { calRef.current.destroy(); } catch {}
        calRef.current = null;
      }
    };
  }, [variant, forceView]);

  /* ----------------------- Only refresh events (no rebuild) ------------------ */
  useEffect(() => {
    const cal = calRef.current;
    if (!cal) return;
    const keep = viewDateRef.current || cal.getDate?.() || new Date();
    cal.clear();
    if (filteredEvents.length) cal.createEvents(filteredEvents);
    cal.setDate(keep);
  }, [filteredEvents]);

  /* ------------------- Fetch classnotes for current visible range ------------ */
  useEffect(() => {
    const center = currentDate || new Date();
    let rangeStart: Date;
    let rangeEnd: Date;

    if (viewName === "month") {
      rangeStart = new Date(center.getFullYear(), center.getMonth(), 1);
      rangeEnd   = new Date(center.getFullYear(), center.getMonth() + 1, 0);
    } else {
      const d = new Date(center);
      const dow = d.getDay();
      rangeStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
      rangeEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - dow));
    }

    const from = dateKeyFromDate(rangeStart);
    const to   = dateKeyFromDate(rangeEnd);

    const studentsSet = new Set<string>();
    (data || []).forEach(row => {
      const nm = row?.student_name?.trim();
      if (nm) studentsSet.add(nm);
    });
    const students = Array.from(studentsSet);
    if (!students.length) { setClassnoteMap(new Map()); return; }

    const params = new URLSearchParams();
    students.forEach(s => params.append("student_name", s));
    params.set("from", from);
    params.set("to", to);

    fetch(`/api/classnote/search?${params.toString()}`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const map = new Map<string, any[]>();
        for (const note of list) {
          const normalizedDate = ymdString(toDateYMD(note.date)!);
          const key = `${note.student_name}::${normalizedDate}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(note);
        }
        setClassnoteMap(map);
      })
      .catch(() => setClassnoteMap(new Map()));
  }, [currentDate?.getTime?.(), viewName, data]);

  // Close popovers on outside click / ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (popRef.current && !popRef.current.contains(t as Node)) setDetail(null);
      if (addRef.current && !addRef.current.contains(t as Node)) { setAddOpen(false); setAddAnchor(null); }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetail(null);
        setAddOpen(false);
        setAddAnchor(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  /* ------------------------------ Bulk actions ------------------------------ */
  const bulkRef = useRef<HTMLDivElement | null>(null);
  const [bulkPanel, setBulkPanel] = useState<null | {
    kind: "delete" | "update";
    anchor: { x?: number; y?: number } | null;
    baseEvent: EventObject;
    reference?: { hour: number; durationH: number };
    saving: boolean;
  }>(null);

  const openBulkDeletePanel = (baseEvent: EventObject, anchor?: { x: number; y: number } | null) => {
    const bs = new Date(baseEvent.start as any);
    const be = new Date(baseEvent.end as any);
    setBulkPanel({
      kind: "delete",
      baseEvent,
      anchor: anchor ?? null,
      reference: { hour: bs.getHours(), durationH: getDurationHours(bs, be) },
      saving: false,
    });
  };

  const openBulkUpdatePanel = (
    baseEvent: EventObject,
    oldRef: { hour: number; durationH: number },
    anchor?: { x: number; y: number } | null
  ) => {
    setBulkPanel({ kind: "update", baseEvent, reference: oldRef, anchor: anchor ?? null, saving: false });
  };

  const closeBulkPanel = () => setBulkPanel(null);

  const bulkPanelStyle = (() => {
    if (!containerRef.current) return {};
    const POP_W = 340, pad = 12;
    const cw = containerRef.current.clientWidth;
    let left = cw - POP_W - pad;
    let top = pad;
    if (bulkPanel?.anchor?.x != null && bulkPanel?.anchor?.y != null) {
      left = bulkPanel.anchor.x + 10;
      top = bulkPanel.anchor.y + 10;
      if (left + POP_W + pad > cw) left = Math.max(pad, cw - POP_W - pad);
    }
    return { left, top, width: POP_W } as React.CSSProperties;
  })();

  /* ------------------------------ Header actions ---------------------------- */
  const goToday = () => {
    calRef.current?.today();
    const d = calRef.current?.getDate() ?? new Date();
    rememberAndSetDate(d);
  };
  const goPrev  = () => {
    calRef.current?.prev();
    const d = calRef.current?.getDate() ?? new Date();
    rememberAndSetDate(d);
  };
  const goNext  = () => {
    calRef.current?.next();
    const d = calRef.current?.getDate() ?? new Date();
    rememberAndSetDate(d);
  };
  const toWeek  = () => {
    calRef.current?.changeView("week");
    setViewName("week");
    const d = calRef.current?.getDate() ?? viewDateRef.current ?? new Date();
    rememberAndSetDate(d);
  };
  const toMonth = () => {
    calRef.current?.changeView("month");
    setViewName("month");
    const d = calRef.current?.getDate() ?? viewDateRef.current ?? new Date();
    rememberAndSetDate(d);
  };

  /* --------------------------- Single delete (popover) ----------------------- */
  const handleDeleteSingle = async () => {
    if (!detail?.event) return;
    try {
      const ev = detail.event;
      const scheduleId = ev.raw?.schedule_id || ev.id;
      if (!scheduleId) return;
      await saveDelete(String(scheduleId));
      calRef.current?.deleteEvent(ev.id as string, ev.calendarId as string);
      setDetail(null);
    } catch (e: any) {
      alert(`삭제 실패: ${e?.message ?? e}`);
    }
  };

  /* ---------------------- Update future after drag/resize -------------------- */
  const confirmUpdateFuture = async () => {
    if (!bulkPanel || bulkPanel.kind !== "update" || !bulkPanel.reference) return;
    setBulkPanel((p) => (p ? { ...p, saving: true } : p));
    try {
      const base = bulkPanel.baseEvent;
      const baseStart = new Date(base.start as any);
      const baseEnd = new Date(base.end as any);
      const newHour = baseStart.getHours() + baseStart.getMinutes() / 60;
      const newDurHrs = getDurationHours(baseStart, baseEnd);

      const matches = collectFutureMatchesFromData(base, bulkPanel.reference!);

      for (const { scheduleId, date } of matches) {
        const intH = Math.floor(newHour);
        const intM = Math.round((newHour - intH) * 60);
        const newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), intH, intM, 0);
        const newEnd = new Date(newStart.getTime() + newDurHrs * 3600000);

        await saveUpdateById(scheduleId, ymdString(newStart), newHour, newDurHrs);
        updateVisibleEventIfMounted(scheduleId, "1", newStart, newEnd);
      }

      setBulkPanel(null);
      setDetail(null);
    } catch (e: any) {
      alert(`일괄 업데이트 실패: ${e?.message ?? e}`);
      setBulkPanel((p) => (p ? { ...p, saving: false } : p));
    }
  };

  /* -------------------------- Delete future (data-based) --------------------- */
  const confirmDeleteMany = async () => {
    if (!bulkPanel || bulkPanel.kind !== "delete" || !bulkPanel.reference) return;
    setBulkPanel((p) => (p ? { ...p, saving: true } : p));
    try {
      const base = bulkPanel.baseEvent;
      const refWindow = bulkPanel.reference;
      const matches = collectFutureMatchesFromData(base, refWindow);

      for (const { scheduleId } of matches) {
        try { await saveDelete(scheduleId); } catch {}
        calRef.current?.deleteEvent?.(scheduleId, "1");
      }

      setBulkPanel(null);
      setDetail(null);
    } catch (e: any) {
      alert(`일괄 삭제 실패: ${e?.message ?? e}`);
      setBulkPanel((p) => (p ? { ...p, saving: false } : p));
    }
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className={`w-full ${enableTeacherSidebar ? "flex gap-4" : ""}`}>
      {/* LEFT: Teacher filter sidebar (admin only) */}
      {enableTeacherSidebar && (
        <aside className="w-[240px] shrink-0 bg-white border border-gray-200 rounded-2xl p-3 h-fit sticky top-3">
          <div className="font-semibold text-gray-900 mb-2">Teachers</div>

          <div className="flex items-center gap-2 mb-3">
            <button onClick={selectAllTeachers} className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">Select All</button>
            <button onClick={clearTeachers} className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">Clear</button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {uniqueTeachers.map((t) => {
              const c = teacherColorMap.get(t);
              const active = teacherFilter.has(t);
              const inputId = `teacher-${t.replace(/[^a-z0-9_-]+/gi, "-")}`;
              return (
                <div
                  key={t}
                  className={`group flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1 ${active ? "bg-slate-50" : ""}`}
                >
                  <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleTeacher(t)}
                      className="accent-slate-700"
                    />
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded"
                        style={{ backgroundColor: c?.bg, border: `1px solid ${c?.border}` }}
                      />
                      <span className="text-gray-800">{t}</span>
                    </span>
                  </label>

                  <button
                    type="button"
                    title={`Delete ${t}`}
                    aria-label={`Delete ${t}`}
                    className="opacity-60 group-hover:opacity-100 shrink-0 rounded p-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.dispatchEvent(
                        new CustomEvent("teacherSidebar:delete", { detail: { name: t } })
                      );
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4V5h4V4a1 1 0 0 1 1-1zm8 4H7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM9 9h2v8H9V9zm4 0h2v8h-2V9zM9 5h6v0H9z" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {uniqueTeachers.length === 0 && (
              <div className="text-xs text-gray-500">No teachers in current data.</div>
            )}
          </div>
        </aside>
      )}

      {/* RIGHT: Header + Calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center my-3 gap-2">
          <button onClick={goPrev} className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300">←</button>
          <div className="text-xl mx-4 font-semibold tracking-tight">
            {currentDate.getFullYear()}. {currentDate.getMonth() + 1}
          </div>
          <button onClick={goNext} className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300">→</button>
          <button onClick={goToday} className="ml-2 p-1 px-3 border rounded-2xl hover:bg-slate-700 hover:text-white border-slate-300">Today</button>

          {!forceView && (
            <div className="ml-2 flex items-center gap-2">
              <button onClick={toWeek}  className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${viewName === "week"  ? "bg-slate-900 text-white" : ""}`}>Week</button>
              <button onClick={toMonth} className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${viewName === "month" ? "bg-slate-900 text-white" : ""}`}>Month</button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/teacher/admin_billing/"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Full Calendar"
              className="text-xs px-3 py-1 rounded-full border border-indigo-300 hover:bg-indigo-50 text-indigo-700"
            >
              Admin Billing
            </a>
            <a
              href="/teacher/schedule/admin/"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Full Calendar"
              className="text-xs px-3 py-1 rounded-full border border-indigo-300 hover:bg-indigo-50 text-indigo-700"
            >
              Full Calendar
            </a>
            <a
              href="https://fluent-erp-eight.vercel.app/student-registration"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Student Registration"
              className="text-xs px-3 py-1 rounded-full border border-indigo-300 hover:bg-indigo-50 text-indigo-700"
            >
              Student Registration
            </a>

            {/* Add Calendar button */}
            <button
              onClick={() =>
                setAddOpen((v) => {
                  const next = !v;
                  if (!next) setRepeatMode(false);
                  if (next && !addForm.student_name && studentOptions.length > 0) {
                    setAddForm((p) => ({ ...p, student_name: studentOptions[0] }));
                  }
                  if (next && !addForm.teacher_name && teacherOptions.length > 0) {
                    setAddForm((p) => ({ ...p, teacher_name: teacherOptions[0] }));
                  }
                  setAddAnchor(null);
                  return next;
                })
              }
              title="새 수업 등록"
              className={`text-xs px-3 py-1 rounded-full border ${addOpen ? "bg-indigo-600 text-white border-indigo-600" : "border-indigo-300 hover:bg-indigo-50 text-indigo-700"}`}
            >
              Add Class
            </button>
          </div>
        </div>

        {/* Calendar container must be relative for popovers */}
        <div className={`relative ${variant === "compact" ? "tuic-compact" : "tuic-full"}`} style={{ width: "100%", height: variant === "compact" ? "65vh" : "78vh" }}>
          <div ref={containerRef} className="absolute inset-0" />

          {/* Event popover */}
{detail?.event && (() => {
  const ev = detail.event;
  const raw = ev.raw || {};
  const student = raw.student_name ?? "";
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const dateKey = `${start.getFullYear()}. ${String(start.getMonth() + 1).padStart(2, "0")}. ${String(start.getDate()).padStart(2, "0")}.`;

  const notes = classnoteMap.get(`${student}::${dateKey}`) || [];
  const note = notes[0];
  const hasNote = !!note;
  const hasSchedule = !raw.note_only;

  const started = note?.started_at ? new Date(note.started_at) : null;
  const ended = note?.ended_at ? new Date(note.ended_at) : null;

  const matchOK =
    started && ended &&
    Math.abs((started.getTime() - start.getTime()) / 60000) <= 15 &&
    Math.abs((ended.getTime() - end.getTime()) / 60000) <= 15;

  const timeFmt = (d: any) =>
    d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";

  let caseType = "none";
  if (raw.note_only) caseType = "red_unscheduled";
  else if (ev.backgroundColor === "#D1FAE5") caseType = "green";
  else if (ev.backgroundColor === "#FECACA" && hasNote) caseType = "red_mismatch";
  else if (ev.backgroundColor === "#FECACA" && !hasNote) caseType = "red_no_note";

  else if (!hasNote && hasSchedule) caseType = "red_no_note";
  else if (hasNote && hasSchedule && !matchOK) caseType = "red_mismatch";
  else if (hasNote && !hasSchedule) caseType = "red_unscheduled";

  return (
    <div
      ref={popRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-[260px]"
      style={{
        left: `${detail.x + 12}px`,
        top: `${detail.y + 12}px`,
      }}
    >
    {caseType === "green" && (
      <div className="space-y-2 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">📘 {dateKey}</div>
        <div className="text-gray-600">{timeFmt(start)} – {timeFmt(end)}</div>
        <div className="flex gap-2 mt-2">
          <a
            href={`/teacher/student/quizlet?student_name=${encodeURIComponent(student)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
          >
            Quizlet
          </a>
          <a
            href={`/teacher/student/diary?student_name=${encodeURIComponent(student)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-md hover:bg-green-100"
          >
            Diary
          </a>
        </div>
      </div>
    )}

    {/* === For red or yellow === */}
    {(caseType === "red_no_note" ||
      caseType === "red_mismatch" ||
      caseType === "red_unscheduled") && (
      <div className="space-y-3 text-sm text-gray-700">
        <p className="text-center font-medium text-gray-900">
          {caseType === "red_no_note"
            ? "You didn’t have class today."
            : caseType === "red_unscheduled"
            ? `You had an unscheduled class at ${timeFmt(started)} – ${timeFmt(ended)}.`
            : `You had class at ${timeFmt(started)} – ${timeFmt(ended)}.`}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-md hover:bg-yellow-100">
            Paid Absence
          </button>

          <button
            onClick={handleDeleteSingle}
            className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-md hover:bg-rose-100"
          >
            Delete Single
          </button>

          <button
            onClick={() => openBulkDeletePanel(ev)}
            className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md hover:bg-red-100"
          >
            Delete Future Classes
          </button>

          <button
            onClick={async () => {
              try {
                if (!started || !ended) {
                  alert("No valid class note time found to sync.");
                  return;
                }

                const studentName = student;
                const teacherName = raw.teacher_name ?? "";
                const roomName = raw.room_name || "101";
                const date = ymdString(toLocalDateOnly(started));
                let time = started.getHours() + started.getMinutes() / 60;
                time = Math.round(time * 2) / 2;
                const duration = 1;

                const scheduleId = raw.schedule_id || raw._id || raw.id;

                // ✅ Sync schedule time first
                if (scheduleId) {
                  await saveUpdateById(scheduleId, date, time, duration);
                } else {
                  await saveCreate({
                    date,
                    time,
                    duration,
                    room_name: roomName,
                    teacher_name: teacherName,
                    student_name: studentName,
                    calendarId: "1",
                  });
                }

                // ✅ Then mark the related class note with reason
                const classnoteId = raw.classnote_id || note?._id;
                if (classnoteId) {
                  await fetch(`/api/classnote/${classnoteId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: "class time changed" }),
                  });
                }

                alert("✅ Schedule synced and classnote updated.");
                window.dispatchEvent(new CustomEvent("calendar:saved"));
                setDetail(null);
              } catch (err) {
                console.error("Sync schedule error:", err);
                alert("❌ Failed to sync schedule.");
              }
            }}
            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100"
          >
            Class Time Changed
          </button>

        </div>
      </div>
    )}

    </div>
  );
})()}



          {/* Add card */}
          {addOpen && (
            <div
              ref={addRef}
              className="absolute z-50 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm"
              style={(() => {
                if (!addAnchor || !containerRef.current) return { top: 12, right: 12 } as React.CSSProperties;
                const POP_W = 320, POP_H = 220, pad = 8;
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                let left = addAnchor.x + 10;
                let top = addAnchor.y + 10;
                if (left + POP_W + pad > cw) left = Math.max(pad, cw - POP_W - pad);
                if (top + POP_H + pad > ch) top = Math.max(pad, ch - POP_H - pad);
                return { left, top, width: POP_W } as React.CSSProperties;
              })()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-gray-900 leading-snug">새 수업 등록</div>
                <button onClick={() => { setAddOpen(false); setAddAnchor(null); }} className="text-gray-400 hover:text-gray-600 rounded-md px-2" aria-label="Close" title="닫기">✕</button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs">
                  <div className="text-gray-600 mb-1">Date</div>
                  <input
                    className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                    value={addForm.date}
                    onChange={(e) => updateAdd({ date: e.target.value })}
                    onBlur={(e) => { const dt = toDateYMD(e.target.value); if (dt) updateAdd({ date: ymdString(dt) }); }}
                    placeholder="YYYY. MM. DD."
                  />
                </label>
                <label className="text-xs">
                  <div className="text-gray-600 mb-1">Room</div>
                  <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.room_name} onChange={(e) => updateAdd({ room_name: e.target.value })} placeholder="101" />
                </label>
                <label className="text-xs">
                  <div className="text-gray-600 mb-1">Time</div>
                  <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.time} onChange={(e) => updateAdd({ time: e.target.value })} placeholder="18 or 18.5" />
                </label>
                <label className="text-xs">
                  <div className="text-gray-600 mb-1">Duration</div>
                  <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.duration} onChange={(e) => updateAdd({ duration: e.target.value })} placeholder="1 or 1.5" />
                </label>

                <label className="text-xs col-span-2">
                  <div className="text-gray-600 mb-1">Student</div>
                  {studentOptions.length ? (
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={addForm.student_name}
                        onChange={(e) => updateAdd({ student_name: e.target.value })}
                      >
                        {studentOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.24 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
                      </svg>
                    </div>
                  ) : (
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={addForm.student_name}
                      onChange={(e) => updateAdd({ student_name: e.target.value })}
                      placeholder="홍길동"
                    />
                  )}
                </label>

                <label className="text-xs col-span-2">
                  <div className="text-gray-600 mb-1">Teacher</div>
                  {teacherOptions.length > 0 ? (
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={addForm.teacher_name}
                        onChange={(e) => updateAdd({ teacher_name: e.target.value })}
                      >
                        {teacherOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.24 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
                      </svg>
                    </div>
                  ) : (
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={addForm.teacher_name}
                      onChange={(e) => updateAdd({ teacher_name: e.target.value })}
                      placeholder="Loading teachers..."
                    />
                  )}
                </label>
              </div>

              <div className="mt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setRepeatMode((v) => !v)}
                  aria-pressed={repeatMode}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    repeatMode
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  }`}
                  title="매주 같은 시간/강의실 반복 등록 토글"
                >
                  Repeat Class
                </button>

                <button
                  onClick={async () => {
                    if (submitting) return;
                    setSubmitting(true);
                    try {
                      const dt = toDateYMD(addForm.date);
                      const timeNum = Number(addForm.time);
                      const durNum = Number(addForm.duration);
                      if (!dt) return alert("날짜 형식: YYYY. MM. DD");

                      const isHalfStep = (n: number) =>
                        Number.isFinite(n) && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;

                      if (!isHalfStep(timeNum) || timeNum < 0 || timeNum > 23.5) {
                        return alert("Time must be 0, 0.5, …, 23.5");
                      }
                      if (!isHalfStep(durNum) || durNum <= 0) {
                        return alert("Duration must be 0.5, 1.0, 1.5, …");
                      }

                      if (!addForm.room_name) return alert("Room is required");
                      if (!addForm.student_name) return alert("Student is required");

                      const h = Math.floor(timeNum);
                      const m = Math.round((timeNum - h) * 60);

                      if (repeatMode) {
                        const base = toDateYMD(addForm.date);
                        if (!base) return alert("날짜 형식: YYYY. MM. DD");
                        const until = new Date(base);
                        until.setFullYear(until.getFullYear() + 1);

                        const createdEvents: any[] = [];
                        const baseLocal = new Date(base.getFullYear(), base.getMonth(), base.getDate());
                        const untilLocal = new Date(until.getFullYear(), until.getMonth(), until.getDate());

                        for (let i = 0; ; i++) {
                          const iter = new Date(
                            baseLocal.getFullYear(),
                            baseLocal.getMonth(),
                            baseLocal.getDate() + i * 7
                          );
                          if (iter > untilLocal) break;

                          const start = new Date(iter.getFullYear(), iter.getMonth(), iter.getDate(), h, m, 0);
                          const end = new Date(start.getTime() + durNum * 60 * 60 * 1000);

                          const payload = {
                            date: ymdString(iter),
                            time: timeNum,
                            duration: durNum,
                            room_name: addForm.room_name,
                            teacher_name: addForm.teacher_name ?? "",
                            student_name: addForm.student_name,
                            calendarId: "1",
                          };

                          const created = await saveCreate(payload);
                          const id = String(created?._id ?? `${Date.now()}-${Math.random()}`);
                          const color = teacherColorMap.get(payload.teacher_name);

                          createdEvents.push({
                            id,
                            calendarId: "1",
                            title: `${payload.room_name}호 ${payload.student_name}님`,
                            category: "time",
                            start,
                            end,
                            backgroundColor: color?.bg ?? "#EEF2FF",
                            borderColor: color?.border ?? "#C7D2FE",
                            dragBackgroundColor: color?.bg ?? "#E0E7FF",
                            color: "#111827",
                            raw: {
                              schedule_id: id,
                              room_name: payload.room_name,
                              teacher_name: payload.teacher_name,
                              student_name: payload.student_name,
                            },
                          });
                        }

                        calRef.current?.createEvents(createdEvents);
                      } else {
                        const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, m, 0);
                        const end = new Date(start.getTime() + durNum * 60 * 60 * 1000);

                        const payload = {
                          date: addForm.date,
                          time: timeNum,
                          duration: durNum,
                          room_name: addForm.room_name,
                          teacher_name: addForm.teacher_name ?? "",
                          student_name: addForm.student_name,
                          calendarId: "1",
                        };

                        const created = await saveCreate(payload);
                        const newId = String(created?._id ?? `${Date.now()}-${Math.random()}`);
                        const color = teacherColorMap.get(payload.teacher_name);

                        calRef.current?.createEvents([{
                          id: newId,
                          calendarId: "1",
                          title: `${payload.room_name}호 ${payload.student_name}님`,
                          category: "time",
                          start,
                          end,
                          backgroundColor: color?.bg ?? "#EEF2FF",
                          borderColor: color?.border ?? "#C7D2FE",
                          dragBackgroundColor: color?.bg ?? "#E0E7FF",
                          color: "#111827",
                          raw: {
                            schedule_id: newId,
                            room_name: payload.room_name,
                            teacher_name: payload.teacher_name,
                            student_name: payload.student_name,
                          },
                        }]);
                      }

                      setAddOpen(false);
                      setAddAnchor(null);
                      setRepeatMode(false);
                    } catch (e: any) {
                      alert(`생성 실패: ${e?.message ?? e}`);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className={`px-3 py-1 text-xs rounded-md ${
                    submitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white disabled:opacity-60 inline-flex items-center`}
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 017-7.94V2a10 10 0 100 20v-2.06A8 8 0 014 12z" />
                    </svg>
                  )}
                  {repeatMode ? "Add Multiple" : "Add"}
                </button>
              </div>
            </div>
          )}

          {/* Bulk action mini-panel */}
          {bulkPanel && (
            <div
              ref={bulkRef}
              className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm"
              style={bulkPanelStyle}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-semibold text-gray-900 leading-snug">
                  {bulkPanel.kind === "delete" ? "Delete future classes?" : "Update all future classes?"}
                </div>
                <button
                  onClick={() => (!bulkPanel.saving ? closeBulkPanel() : null)}
                  className={`text-gray-400 hover:text-gray-600 rounded-md px-2 ${bulkPanel.saving ? "opacity-40 cursor-not-allowed" : ""}`}
                  aria-label="Close"
                  title="닫기"
                  disabled={bulkPanel.saving}
                >
                  ✕
                </button>
              </div>

              {bulkPanel.kind === "delete" ? (
                <>
                  <p className="text-gray-700 mb-3">
                    같은 <b>학생</b> · 같은 <b>요일</b> · 같은 <b>시작시간(시 단위)/길이</b>를
                    <b> 이 날짜 포함 이후</b> 모두 삭제합니다. 계속할까요?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => (!bulkPanel.saving ? closeBulkPanel() : null)}
                      className="px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      disabled={bulkPanel.saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={bulkPanel.saving ? undefined : confirmDeleteMany}
                      disabled={bulkPanel.saving}
                      className={`px-3 py-1 text-xs rounded-md ${bulkPanel.saving ? "bg-rose-400" : "bg-rose-600 hover:bg-rose-700"} text-white`}
                    >
                      {bulkPanel.saving ? "Deleting..." : "Delete future"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 mb-3">
                    같은 <b>학생</b> · 같은 <b>요일</b> · <b>원래 시작시간(시 단위)/길이</b>에 해당하는 수업을
                    <b> 이 날짜 포함 이후</b> 모두 현재 시간/길이로 업데이트할까요?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => (!bulkPanel.saving ? closeBulkPanel() : null)}
                      className="px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      disabled={bulkPanel.saving}
                    >
                      Not now
                    </button>
                    <button
                      onClick={bulkPanel.saving ? undefined : confirmUpdateFuture}
                      disabled={bulkPanel.saving}
                      className={`px-3 py-1 text-xs rounded-md ${bulkPanel.saving ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
                    >
                      {bulkPanel.saving ? "Updating..." : "Update all future"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
