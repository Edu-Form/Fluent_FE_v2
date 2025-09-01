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
  time: number;             // hour 0-23
  duration: number;         // hours
  teacher_name: string;
  student_name: string;
}

interface Props {
  data: ToastEventInput[];
  variant?: Variant;                 // "compact" | "full"
  saveEndpointBase?: string;         // default: "/api/schedules"
  forceView?: "month" | "week";      // optional lock
  // Optional defaults for Add card (handy on schedule page):
  defaults?: {
    teacher_name?: string;
    student_name?: string;
    room_name?: string;
    time?: number;       // 0-23
    duration?: number;   // hours
  };
  studentOptions?: string[];         // list of student names for the Add card dropdown
}

function toDateYMD(str?: string | null) {
  if (!str) return null;
  const m = String(str).trim().match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function ymdString(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
}

export default function TeacherToastUI({
  data,
  variant = "compact",
  saveEndpointBase = "/api/schedules",
  forceView,
  defaults,
  studentOptions = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<InstanceType<CalendarCtor> | null>(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewName, setViewName] = useState<"week" | "month">(forceView ?? "week");

  // Clicked-event popover
  const popRef = useRef<HTMLDivElement | null>(null);
  const [detail, setDetail] = useState<{ event: EventObject | null; x: number; y: number } | null>(null);

  // Add card popover (top-right inside calendar)
  const addRef = useRef<HTMLDivElement | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    date: ymdString(new Date()),
    room_name: defaults?.room_name ?? "101",
    time: String(defaults?.time ?? 18),
    duration: String(defaults?.duration ?? 1),
    student_name: defaults?.student_name ?? "",
    teacher_name: defaults?.teacher_name ?? "",
  });
  const updateAdd = (patch: Partial<typeof addForm>) => setAddForm((p) => ({ ...p, ...patch }));

  const [repeatMode, setRepeatMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  // Prefill first student option when add card opens
  useEffect(() => {
    if (addOpen && !addForm.student_name && studentOptions.length > 0) {
      setAddForm((p) => ({ ...p, student_name: studentOptions[0] }));
    }
  }, [addOpen, studentOptions]);

  // Normalize incoming -> Toast events
  const events = useMemo(() => {
    return (data || [])
      .map((e) => {
        const eventId = e._id || e.id;
        if (!e.date || Number.isNaN(e.time) || Number.isNaN(e.duration)) return null;
        const base = toDateYMD(e.date);
        if (!base) return null;

        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), e.time, 0, 0);
        const end = new Date(start.getTime() + e.duration * 3600000);

        const evt: EventObject = {
          id: String(eventId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)),
          calendarId: e.calendarId ?? "1",
          title: `${e.room_name}호 ${e.student_name}님`,
          category: "time",
          start,
          end,
          backgroundColor: "#EEF2FF",
          borderColor: "#C7D2FE",
          dragBackgroundColor: "#E0E7FF",
          color: "#111827",
          raw: {
            schedule_id: eventId,
            room_name: e.room_name,
            teacher_name: e.teacher_name,
            student_name: e.student_name,
          },
        };
        return evt;
      })
      .filter(Boolean) as EventObject[];
  }, [data]);

  // --- API helpers ---
  const postJSON = async (url: string, method: "POST" | "PATCH" | "DELETE", body?: any) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${url} failed`);
    try {
      window.dispatchEvent(new CustomEvent("calendar:saved"));
    } catch {}
    return res.json().catch(() => ({}));
  };

  const saveCreate = async (payload: {
    date: string; time: number; duration: number; room_name: string; teacher_name: string; student_name: string; calendarId?: string;
  }) => {
    const created = await postJSON(`${saveEndpointBase}`, "POST", payload);
    return created; // expect { _id: "...", ... }
  };

  const saveUpdate = async (ev: EventObject) => {
    const id = ev?.raw?.schedule_id || ev?.id;
    if (!id) return;
    const start = new Date(ev.start as any);
    const end = new Date(ev.end as any);
    const date = ymdString(start);
    const time = start.getHours();
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
    await postJSON(`${saveEndpointBase}/${id}`, "PATCH", { date, time, duration });
  };

  const saveDelete = async (scheduleId: string) => {
    await postJSON(`${saveEndpointBase}/${scheduleId}`, "DELETE");
  };

  // --- Init Toast UI (lazy import to avoid SSR "window is not defined") ---
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const mod = await import("@toast-ui/calendar");
      if (!isMounted || !containerRef.current) return;

      const Calendar: CalendarCtor = mod.default;
      if (!calRef.current) {
        calRef.current = new Calendar(containerRef.current, {
          defaultView: forceView ?? "week",
          useDetailPopup: false,    // we render our own popovers
          usageStatistics: false,
          isReadOnly: false,        // enable drag & drop updates
          gridSelection: false,     // creation via Add card (not drag-select)
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
          },
          week: {
            startDayOfWeek: 0,
            dayNames: ["일", "월", "화", "수", "목", "금", "토"],
            taskView: false,
            eventView: ["time"],
            showNowIndicator: true,
            hourStart: variant === "compact" ? 8 : 7,
            hourEnd:   variant === "compact" ? 22 : 23,
            workweek: false,
          },
          month: {
            isAlways6Weeks: false,
            visibleWeeksCount: 0,
            startDayOfWeek: 0,
            dayNames: ["일", "월", "화", "수", "목", "금", "토"],
            narrowWeekend: false,
          },
        });

        // --- Theme & CSS (once) ---
        const styleId = "tuic-modern-theme-unified";
        if (!document.getElementById(styleId)) {
          const el = document.createElement("style");
          el.id = styleId;
          el.textContent = `
/* ===== Base look ===== */
.toastui-calendar-layout { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif; }
.toastui-calendar-panel { background:#fff; border-radius:16px; overflow:hidden; }
.toastui-calendar-daygrid, .toastui-calendar-week { border-color:#eef1f4; }
.toastui-calendar-dayname { background:#f7f8fa; color:#4b5563; font-weight:600; border-bottom:1px solid #eef1f4; }
.toastui-calendar-today .toastui-calendar-dayname-date-area, .toastui-calendar-today .toastui-calendar-weekday-grid-line { background:#eef6ff; }
.toastui-calendar-timegrid-now-indicator { background:#0ea5e9; }
.toastui-calendar-timegrid-now-indicator-arrow { border-bottom-color:#0ea5e9; }
.toastui-calendar-timegrid-hour { color:#6b7280; font-size:10px; }
.toastui-calendar-time-schedule { border:none !important; }
.toastui-calendar-time-schedule-block { background:#EEF2FF !important; border:1px solid #C7D2FE !important; border-radius:12px !important; box-shadow:0 1px 2px rgba(16,24,40,.06); }
.toastui-calendar-time-schedule .toastui-calendar-event-time-content { background:transparent !important; }
/* Compact 2-line event content */
.tuic-event-sm{
  display:flex;
  flex-direction:column;
  gap:2px;
  line-height:1.15;
}
.tuic-event-sm .tuic-line1{
  font-size:11px;         /* smaller */
  font-weight:600;
  color:#111827;          /* slate-900 */
}
.tuic-event-sm .tuic-line2{
  font-size:10px;         /* smaller */
  color:#4b5563;          /* slate-600 */
  font-variant-numeric: tabular-nums;
}
/* ===== Make week time slots shorter WITHOUT scaling ===== */
/* Kill the internal min-heights and inner scroll so the 24 hours compress to fit the container */
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

/* In some versions gridlines/half-hour rows have fixed px heights; unset them */
.toastui-calendar-timegrid-gridline,
.toastui-calendar-timegrid-half-hour {
  height: auto !important;
  min-height: 0 !important;
}

/* Optional: slightly tighter event paddings for dense rows */
.toastui-calendar-timegrid .toastui-calendar-time-schedule-content { padding-top: 1px; padding-bottom: 1px; }
          `;
          document.head.appendChild(el);
        }

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

        // --- Handlers ---
        const handleClick = (args: { event: EventObject; nativeEvent?: MouseEvent }) => {
          const { event, nativeEvent } = args || {};
          if (!event) return;
          const rect = containerRef.current?.getBoundingClientRect();
          const x = (nativeEvent?.clientX ?? 0) - (rect?.left ?? 0);
          const y = (nativeEvent?.clientY ?? 0) - (rect?.top ?? 0);
          setDetail({ event, x, y });
          setAddOpen(false);
        };

        const handleBeforeUpdate = ({ event, changes }: { event: EventObject; changes: Partial<EventObject> }) => {
          setDetail((d) => (d?.event?.id === event.id ? null : d));
          calRef.current?.updateEvent(event.id as string, event.calendarId as string, changes);
          saveUpdate({ ...event, ...changes }).catch((e) => alert(`저장 실패: ${e.message}`));
        };

        calRef.current.on("clickEvent", handleClick);
        calRef.current.on("beforeUpdateEvent", handleBeforeUpdate);
      }

      const cal = calRef.current!;
      cal.clear();
      if (events.length) cal.createEvents(events);
      cal.setOptions({
        week: {
          hourStart: variant === "compact" ? 8 : 7,
          hourEnd:   variant === "compact" ? 22 : 23,
        },
      });
      setCurrentDate(cal.getDate() ?? new Date());
    })();

    return () => {
      const cal = calRef.current;
      if (!cal) return;
      try {
        cal.off("clickEvent");
        cal.off("beforeUpdateEvent");
        cal.destroy();
        calRef.current = null;
      } catch {}
      isMounted = false;
    };
  }, [events, variant, forceView]);

  // Close popovers on outside click / ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (popRef.current && !popRef.current.contains(t as Node)) setDetail(null);
      if (addRef.current && !addRef.current.contains(t as Node)) setAddOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetail(null);
        setAddOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Header controls
  const goToday = () => { calRef.current?.today(); setCurrentDate(calRef.current?.getDate() ?? new Date()); };
  const goPrev = () => { calRef.current?.prev(); setCurrentDate(calRef.current?.getDate() ?? new Date()); };
  const goNext = () => { calRef.current?.next(); setCurrentDate(calRef.current?.getDate() ?? new Date()); };
  const toWeek = () => { calRef.current?.changeView("week"); setViewName("week"); };
  const toMonth = () => { calRef.current?.changeView("month"); setViewName("month"); };

  // Delete from event popover
  const handleDeleteFromPopover = async () => {
    const ev = detail?.event;
    if (!ev) return;
    const scheduleId = ev.raw?.schedule_id || ev.id;
    if (!scheduleId) return;
    try {
      await saveDelete(String(scheduleId));
      calRef.current?.deleteEvent(ev.id as string, ev.calendarId as string);
      setDetail(null);
    } catch (e: any) {
      alert(`삭제 실패: ${e?.message ?? e}`);
    }
  };

// Orchestrator: called by the Add button
const handleAddClick = async () => {
  if (submitting) return;
  if (repeatMode) {
    await handleRepeatSubmit();
  } else {
    await handleAddSubmit();
  }
};

// SINGLE add (wrap existing logic with submitting lock)
const handleAddSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    const dt = toDateYMD(addForm.date);
    const timeNum = Number(addForm.time);
    const durNum = Number(addForm.duration);
    if (!dt) return alert("날짜 형식: YYYY. MM. DD");
    if (!Number.isFinite(timeNum) || timeNum < 0 || timeNum > 23) return alert("Time: 0–23");
    if (!Number.isFinite(durNum) || durNum <= 0) return alert("Duration: 1+");
    if (!addForm.room_name) return alert("Room is required");
    if (!addForm.student_name) return alert("Student is required");

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
    const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), timeNum, 0, 0);
    const end = new Date(start.getTime() + durNum * 3600000);

    calRef.current?.createEvents([{
      id: newId,
      calendarId: "1",
      title: `${payload.room_name}호 ${payload.student_name}님`,
      category: "time",
      start,
      end,
      backgroundColor: "#EEF2FF",
      borderColor: "#C7D2FE",
      dragBackgroundColor: "#E0E7FF",
      color: "#111827",
      raw: {
        schedule_id: newId,
        room_name: payload.room_name,
        teacher_name: payload.teacher_name,
        student_name: payload.student_name,
      },
    }]);

    setAddOpen(false);
    setRepeatMode(false);
  } catch (e: any) {
    alert(`생성 실패: ${e?.message ?? e}`);
  } finally {
    setSubmitting(false);
  }
};

// REPEAT add for 1 year (weekly), with submitting lock
const handleRepeatSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    const base = toDateYMD(addForm.date);
    const timeNum = Number(addForm.time);
    const durNum = Number(addForm.duration);

    if (!base) return alert("날짜 형식: YYYY. MM. DD");
    if (!Number.isFinite(timeNum) || timeNum < 0 || timeNum > 23) return alert("Time: 0–23");
    if (!Number.isFinite(durNum) || durNum <= 0) return alert("Duration: 1+");
    if (!addForm.room_name) return alert("Room is required");
    if (!addForm.student_name) return alert("Student is required");

    // 1 year instead of 6 months
    const until = new Date(base);
    until.setFullYear(until.getFullYear() + 1);

    const payloads: Array<{
      date: string; time: number; duration: number;
      room_name: string; teacher_name: string; student_name: string; calendarId?: string;
    }> = [];

    for (let d = new Date(base); d <= until; d.setDate(d.getDate() + 7)) {
      payloads.push({
        date: ymdString(d),
        time: timeNum,
        duration: durNum,
        room_name: addForm.room_name,
        teacher_name: addForm.teacher_name ?? "",
        student_name: addForm.student_name,
        calendarId: "1",
      });
    }

    const createdEvents: EventObject[] = [];
    for (const p of payloads) {
      const created = await saveCreate(p);
      const id = String(created?._id ?? `${Date.now()}-${Math.random()}`);
      const d = toDateYMD(p.date)!;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), timeNum, 0, 0);
      const end = new Date(start.getTime() + durNum * 3600000);

      createdEvents.push({
        id,
        calendarId: "1",
        title: `${p.room_name}호 ${p.student_name}님`,
        category: "time",
        start,
        end,
        backgroundColor: "#EEF2FF",
        borderColor: "#C7D2FE",
        dragBackgroundColor: "#E0E7FF",
        color: "#111827",
        raw: {
          schedule_id: id,
          room_name: p.room_name,
          teacher_name: p.teacher_name,
          student_name: p.student_name,
        },
      });
    }

    calRef.current?.createEvents(createdEvents);
    setAddOpen(false);
    setRepeatMode(false);
  } catch (e: any) {
    alert(`반복 등록 실패: ${e?.message ?? e}`);
  } finally {
    setSubmitting(false);
  }
};


  // Positioning of the clicked-event popover
  const popStyle = (() => {
    if (!detail || !containerRef.current) return { display: "none" } as React.CSSProperties;
    const POP_W = 320, POP_H = 180, pad = 8;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    let left = detail.x + 10;
    let top = detail.y + 10;
    if (left + POP_W + pad > cw) left = Math.max(pad, cw - POP_W - pad);
    if (top + POP_H + pad > ch) top = Math.max(pad, ch - POP_H - pad);
    return { left, top, width: POP_W } as React.CSSProperties;
  })();

  const ev = detail?.event;
  const startStr = ev ? new Date(ev.start as any).toLocaleString() : "";
  const endStr = ev ? new Date(ev.end as any).toLocaleString() : "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center my-3 gap-2">
        <button onClick={goPrev} className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300">←</button>
        <div className="text-xl mx-4 font-semibold tracking-tight">
          {currentDate.getFullYear()}. {currentDate.getMonth() + 1}
        </div>
        <button onClick={goNext} className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300">→</button>
        <button onClick={goToday} className="ml-2 p-1 px-3 border rounded-2xl hover:bg-slate-700 hover:text-white border-slate-300">Today</button>

        <div className="ml-4 flex items-center gap-2">
          {!forceView && (
            <>
              <button onClick={toWeek}  className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${viewName === "week"  ? "bg-slate-900 text-white" : ""}`}>Week</button>
              <button onClick={toMonth} className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${viewName === "month" ? "bg-slate-900 text-white" : ""}`}>Month</button>
            </>
          )}
        </div>

        {/* Add Calendar button */}
        <button
          onClick={() =>
            setAddOpen((v) => {
              const next = !v;
              if (!next) setRepeatMode(false); // clear toggle when closing
              if (next && !addForm.student_name && studentOptions.length > 0) {
                setAddForm((p) => ({ ...p, student_name: studentOptions[0] }));
              }
              return next;
            })
          }
          title="새 수업 등록"
          className={`ml-auto text-xs px-3 py-1 rounded-full border ${addOpen ? "bg-indigo-600 text-white border-indigo-600" : "border-indigo-300 hover:bg-indigo-50 text-indigo-700"}`}
        >
          Add Class
        </button>

      </div>

      {/* Calendar container must be relative for popovers */}
      <div className="relative" style={{ width: "100%", height: variant === "compact" ? "65vh" : "78vh" }}>
        <div ref={containerRef} className="absolute inset-0" />

        {/* Event popover (click an event) */}
        {ev && (
          <div
            ref={popRef}
            className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm"
            style={popStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-gray-900 leading-snug">{ev.title || "이벤트"}</div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 rounded-md px-2" aria-label="Close" title="닫기">✕</button>
            </div>
            <div className="mt-2 space-y-1 text-gray-700">
              <div><span className="text-gray-500">시작:</span> {startStr}</div>
              <div><span className="text-gray-500">종료:</span> {endStr}</div>
              {ev.raw?.room_name && <div><span className="text-gray-500">강의실:</span> {ev.raw.room_name}</div>}
              {ev.raw?.student_name && <div><span className="text-gray-500">학생:</span> {ev.raw.student_name}</div>}
              {ev.raw?.teacher_name && <div><span className="text-gray-500">선생님:</span> {ev.raw.teacher_name}</div>}
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleDeleteFromPopover} className="px-3 py-1 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700" title="삭제">Delete</button>
            </div>
          </div>
        )}

        {/* Add card (small) */}
        {addOpen && (
          <div
            ref={addRef}
            className="absolute z-50 top-3 right-3 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-gray-900 leading-snug">새 수업 등록</div>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-md px-2" aria-label="Close" title="닫기">✕</button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs">
                <div className="text-gray-600 mb-1">Date</div>
                <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.date} onChange={(e) => updateAdd({ date: e.target.value })} placeholder="YYYY. MM. DD" />
              </label>
              <label className="text-xs">
                <div className="text-gray-600 mb-1">Room</div>
                <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.room_name} onChange={(e) => updateAdd({ room_name: e.target.value })} placeholder="101" />
              </label>
              <label className="text-xs">
                <div className="text-gray-600 mb-1">Time</div>
                <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.time} onChange={(e) => updateAdd({ time: e.target.value })} placeholder="18" />
              </label>
              <label className="text-xs">
                <div className="text-gray-600 mb-1">Duration</div>
                <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.duration} onChange={(e) => updateAdd({ duration: e.target.value })} placeholder="1" />
              </label>

              {/* Student as dropdown (falls back to input if options empty) */}
              <label className="text-xs col-span-2">
                <div className="text-gray-600 mb-1">Student</div>
                {studentOptions.length ? (
                  <select
                    className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                    value={addForm.student_name}
                    onChange={(e) => updateAdd({ student_name: e.target.value })}
                  >
                    {studentOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
                    value={addForm.student_name}
                    onChange={(e) => updateAdd({ student_name: e.target.value })}
                    placeholder="홍길동"
                  />
                )}
              </label>

              <label className="text-xs col-span-2">
                <div className="text-gray-600 mb-1">Teacher</div>
                <input className="w-full border rounded-lg px-2 py-1.5 bg-white text-black" value={addForm.teacher_name} onChange={(e) => updateAdd({ teacher_name: e.target.value })} placeholder="김선생" />
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
                onClick={handleAddClick}
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
      </div>
    </div>
  );
}
