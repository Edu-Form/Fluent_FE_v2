"use client";

import { useEffect, useRef, useState } from "react";
import Calendar from "@toast-ui/calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import axios from "axios";

interface StudentLite {
  name: string;
  class_note?: string;            // "YYYY. MM. DD"
  previous_class_note?: string;   // "YYYY. MM. DD"
}

interface ToastUIProps {
  data: {
    _id: string;
    id: string;
    calendarId: string;
    room_name: string;
    date: string | undefined; // "YYYY. MM. DD"
    time: number;             // hour 0-23
    duration: number;         // hours
    teacher_name: string;
    student_name: string;
  }[];
  students?: StudentLite[];       // optional, for Predict button
}

const ToastUI: React.FC<ToastUIProps> = ({ data }) => {
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<InstanceType<typeof Calendar> | null>(null);

  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [viewName, setViewName] = useState<"week" | "month">("week");

  // ---------- utils ----------




  // ---------- normalize incoming data to Toast events ----------
  useEffect(() => {
    const formattedData = data
      .map((event) => {
        const eventId = event._id || event.id;
        if (!event.date || isNaN(event.time) || isNaN(event.duration))
          return null;

        const parts = event.date.split(". ").map((v) => Number(v));
        const [year, month, day] = [parts[0], parts[1], parts[2]];
        if (!year || !month || !day) return null;

        const start = new Date(year, month - 1, day, event.time, 0, 0);
        const end = new Date(start.getTime() + event.duration * 3600000);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        return {
          id: eventId,
          calendarId: event.calendarId ?? "1",
          title: `${event.room_name}호 ${event.student_name}님`,
          category: "time",
          start,
          end,
          raw: {
            room_name: event.room_name,
            teacher_name: event.teacher_name,
            student_name: event.student_name,
            schedule_id: eventId,
          },
        };
      })
      .filter(Boolean) as any[];

    setScheduleData(formattedData);
  }, [data]);

  // ---------- create/init calendar & keep options/theme/listeners ----------
  useEffect(() => {
    if (calendarContainerRef.current && !calendarInstanceRef.current) {
      calendarInstanceRef.current = new Calendar(calendarContainerRef.current, {
        defaultView: "week",
        useDetailPopup: false,
        usageStatistics: false,
        isReadOnly: true,
        gridSelection: false,
      });
    }

    if (calendarInstanceRef.current) {
      calendarInstanceRef.current.clear();
      if (scheduleData.length > 0) {
        calendarInstanceRef.current.createEvents(scheduleData);
      }

      // Options per view
      calendarInstanceRef.current.setOptions({
        template: {
          // compact time renderer: 18:00 • 101호 홍길동
          time(event: any) {
            const s = new Date(event.start);
            const hh = String(s.getHours()).padStart(2, "0");
            const mm = String(s.getMinutes()).padStart(2, "0");
            return `<div class="tuic-event">
              <span class="tuic-event-time">${hh}:${mm}</span>
              <span class="tuic-dot"></span>
              <span class="tuic-event-title">${event.title ?? ""}</span>
            </div>`;
          },
        },
        week: {
          startDayOfWeek: 0,
          dayNames: ["일", "월", "화", "수", "목", "금", "토"],
          taskView: false,
          eventView: ["time"],
          showNowIndicator: true,
          hourStart: 7,     // tighter morning start
          hourEnd: 23,      // later end
          workweek: false,
        },
        month: {
          isAlways6Weeks: false,
          visibleWeeksCount: 0, // auto
          startDayOfWeek: 0,
          dayNames: ["일", "월", "화", "수", "목", "금", "토"],
          narrowWeekend: false,
        },
      });

      // Inject CSS overrides (scoped, modern look)
      const styleId = "tuic-modern-theme";
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement("style");
        styleElement.id = styleId;
        styleElement.textContent = `
/* -------- Base polish -------- */
.toastui-calendar-layout { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif; }
.toastui-calendar-panel { background: #fff; border-radius: 16px; overflow: hidden; }
.toastui-calendar-daygrid, .toastui-calendar-week { border-color: #eef1f4; }

/* Headings (week & month) */
.toastui-calendar-dayname { background: #f7f8fa; color: #4b5563; font-weight: 600; border-bottom: 1px solid #eef1f4; }
.toastui-calendar-dayname-date-area { padding: 8px 0; }

/* Today badge */
.toastui-calendar-today .toastui-calendar-dayname-date-area,
.toastui-calendar-today .toastui-calendar-weekday-grid-line { background: #eef6ff; }
.toastui-calendar-today .toastui-calendar-dayname-date { color: #0f172a; font-weight: 700; }

/* Week grid lines & current time */
.toastui-calendar-timegrid,
.toastui-calendar-timegrid .toastui-calendar-gridline,
.toastui-calendar-timegrid .toastui-calendar-timegrid-timezone,
.toastui-calendar-timegrid-schedules { border-color: #eef1f4; }
.toastui-calendar-timegrid-now-indicator { background: #0ea5e9; } /* line dot */
.toastui-calendar-timegrid-now-indicator-arrow { border-bottom-color: #0ea5e9; }

/* Hour labels */
.toastui-calendar-timegrid-hour { color: #6b7280; font-size: 12px; }

/* Event chips */
.toastui-calendar-time-schedule { border: none !important; }
.toastui-calendar-time-schedule-content { padding: 6px 8px !important; }
.toastui-calendar-time-schedule-block { border-radius: 10px !important; box-shadow: 0 1px 2px rgba(16,24,40,.08), 0 1px 1px rgba(16,24,40,.06); background: #eff6ff; }
.toastui-calendar-time-schedule .toastui-calendar-event-time-content { background: transparent !important; }
.tuic-event { display:flex; align-items:center; gap:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tuic-event-time { font-weight:700; color:#1d4ed8; font-variant-numeric: tabular-nums; }
.tuic-event-title { color:#1f2937; font-weight:600; overflow:hidden; text-overflow:ellipsis; }
.tuic-dot { width:6px; height:6px; border-radius:9999px; background:#6366f1; opacity:.9; }

/* Hover state */
.toastui-calendar-time-schedule:hover .toastui-calendar-time-schedule-block { box-shadow: 0 4px 10px rgba(17, 24, 39, .08); transform: translateY(-1px); transition: all .15s ease; }

/* Month view events */
.toastui-calendar-month-daygrid .toastui-calendar-weekday .toastui-calendar-month-more { color:#334155; }
.toastui-calendar-month-more { border-radius:10px; box-shadow: 0 8px 24px rgba(16,24,40,.12); }
.toastui-calendar-month-more .toastui-calendar-more-title { font-weight:700; color:#0f172a; }
.toastui-calendar-month-week-item { border-color:#eef2f7; }
.toastui-calendar-month-daygrid { --cellPad: 8px; }
.toastui-calendar-month-daygrid .toastui-calendar-weekday > .toastui-calendar-daygrid-cell {
  padding: var(--cellPad);
}
.toastui-calendar-month-week > .toastui-calendar-weekday .toastui-calendar-template-monthMoreTitle {
  font-weight:600;
}

/* Weekend subtle tint */
.toastui-calendar-week .toastui-calendar-daygrid-cell.tui-full-calendar-sat, 
.toastui-calendar-week .toastui-calendar-daygrid-cell.tui-full-calendar-sun,
.toastui-calendar-month .toastui-calendar-weekday.tui-full-calendar-sat .toastui-calendar-daygrid-cell,
.toastui-calendar-month .toastui-calendar-weekday.tui-full-calendar-sun .toastui-calendar-daygrid-cell {
  background: #fbfdff;
}

/* Drag/selection disabled visuals just in case */
.toastui-calendar-grid-selection { background: rgba(99,102,241,0.06) !important; border: 1px dashed #c7d2fe !important; }

/* More popover sizing */
.toastui-calendar-more-popup { width: 360px !important; border-radius: 14px !important; }

/* Scrollbars */
.toastui-calendar-timegrid-schedules::-webkit-scrollbar { height: 8px; width: 8px; }
.toastui-calendar-timegrid-schedules::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.toastui-calendar-timegrid-schedules::-webkit-scrollbar-track { background: #f1f5f9; }

/* Readonly cursor */
.toastui-calendar-time-schedule, 
.toastui-calendar-month-more { cursor: pointer; }
        `;
        document.head.appendChild(styleElement);
      }

      // Theme API: fine-grained tokens
      calendarInstanceRef.current.setTheme({
        common: {
          // matching our neutral surface
          backgroundColor: "#ffffff",
          border: "1px solid #eef1f4",
          saturday: { color: "#334155" },
          today: { color: "#0f172a", backgroundColor: "#eef6ff" },
          gridSelection: {
            backgroundColor: "rgba(99,102,241,0.06)",
            border: "1px dashed #c7d2fe",
          },
        },
        week: {
          dayName: {
            borderBottom: "1px solid #eef1f4",
            backgroundColor: "#f7f8fa",
            color: "#475569",
          },
          timeGrid: { borderRight: "1px solid #eef1f4" },
          nowIndicatorLabel: { color: "#0ea5e9", backgroundColor: "#0ea5e9" },
          nowIndicatorPast: { border: "1px solid #0ea5e9" },
          nowIndicatorBullet: { backgroundColor: "#0ea5e9" },
        },
        month: {
          dayName: {
            borderBottom: "1px solid #eef1f4",
            backgroundColor: "#f7f8fa",
            color: "#475569",
          },
          weekend: { backgroundColor: "#fbfdff" },
          moreView: {
            boxShadow: "0 8px 24px rgba(16,24,40,.12)",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
          },
        },
        // smaller typography for times
        time: {
          fontSize: "12px",
          fontWeight: "500",
          color: "#1f2937",
          backgroundColor: "#eff6ff",
        },
      });

      // click → select event for deletion modal
      // calendarInstanceRef.current.on("clickEvent", ({ event }: { event: any }) => {
      //   setSelectedEvent(event.raw);
      // });

      // keep current yyyy/mm in header
      calendarInstanceRef.current.on("afterRender", () => {
        const date = calendarInstanceRef.current?.getDate();
        if (date) {
          setCurrentDate({ year: date.getFullYear(), month: date.getMonth() + 1 });
        }
      });
    }
  }, [scheduleData]);

  // ---------- header controls ----------
  const updateCurrentDate = () => {
    const date = calendarInstanceRef.current?.getDate();
    if (date) setCurrentDate({ year: date.getFullYear(), month: date.getMonth() + 1 });
  };

  const handleTodayClick = () => {
    calendarInstanceRef.current?.today();
    updateCurrentDate();
  };
  const handlePrevClick = () => {
    calendarInstanceRef.current?.prev();
    updateCurrentDate();
  };
  const handleNextClick = () => {
    calendarInstanceRef.current?.next();
    updateCurrentDate();
  };

  const handleSwitchToWeek = () => {
    if (!calendarInstanceRef.current) return;
    calendarInstanceRef.current.changeView("week");
    setViewName("week");
  };

  const handleSwitchToMonth = () => {
    if (!calendarInstanceRef.current) return;
    calendarInstanceRef.current.changeView("month");
    setViewName("month");
  };

  // ---------- delete ----------
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      const response = await axios.delete(`/api/schedules/${selectedEvent.schedule_id}`);
      if (response.status === 200) {
        setScheduleData((prev) =>
          prev.filter((event) => event.id !== selectedEvent.schedule_id)
        );
        setSelectedEvent(null);
      } else {
        console.log("삭제 실패");
      }
    } catch (error) {
      console.error("삭제 요청 중 오류 발생", error);
    }
  };

  // ---------- predict & register ----------

  return (
    <div>
      <div className="flex items-center my-5 gap-2">
        <button
          onClick={handlePrevClick}
          className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300"
        >
          ←
        </button>

        <div className="text-xl mx-4 font-semibold tracking-tight">
          {currentDate.year}. {currentDate.month}
        </div>

        <button
          onClick={handleNextClick}
          className="p-1 px-3 border rounded-full hover:bg-slate-700 hover:text-white border-slate-300"
        >
          →
        </button>

        <button
          onClick={handleTodayClick}
          className="ml-2 p-1 px-3 border rounded-2xl hover:bg-slate-700 hover:text-white border-slate-300"
        >
          Today
        </button>

        <div className="ml-4 flex items-center gap-2">
          <button
            onClick={handleSwitchToWeek}
            className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${
              viewName === "week" ? "bg-slate-900 text-white" : ""
            }`}
          >
            Week
          </button>
          <button
            onClick={handleSwitchToMonth}
            className={`p-1 px-3 border rounded-2xl border-slate-300 hover:bg-slate-700 hover:text-white ${
              viewName === "month" ? "bg-slate-900 text-white" : ""
            }`}
          >
            Month
          </button>
        </div>

        {/* <button
          onClick={handlePredictAndRegister}
          disabled={isPredicting}
          className="ml-auto p-1 px-3 border rounded-2xl border-indigo-300 hover:bg-indigo-600 hover:text-white disabled:opacity-50"
          title="최근/이전 Class Note 간격으로 앞으로의 수업을 예측해 등록"
        >
          {isPredicting ? "Predicting…" : "Predict & Register"}
        </button> */}
      </div>

      <div ref={calendarContainerRef} style={{ width: "100%", height: "65vh" }} />

      {/* 삭제 모달 */}
      {selectedEvent && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-500/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[360px]">
            <h3 className="text-lg font-semibold mb-2">정말로 삭제하시겠습니까?</h3>
            <p className="text-sm text-slate-600">
              일정: <span className="font-medium">{selectedEvent.room_name}호</span>{" "}
              {selectedEvent.teacher_name} 선생님
            </p>
            <div className="flex mt-5 gap-3">
              <button
                onClick={handleDeleteEvent}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                삭제
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToastUI;
