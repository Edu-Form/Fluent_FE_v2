"use client";

import { useEffect, useRef, useState } from "react";
import Calendar from "@toast-ui/calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

interface ToastUIProps {
  data: {
    _id: string; // _id 필드 추가
    id: string;
    calendarId: string;
    room_name: string;
    date: string | undefined;
    time: number;
    duration: number;
    teacher_name: string;
    student_name: string;
  }[];
}

const ToastUI: React.FC<ToastUIProps> = ({ data }) => {
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<typeof Calendar | null>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  //시간췌크
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const formattedData = data
      .map((event) => {
        const eventId = event._id || event.id;

        // date와 time이 존재하는지, 그리고 유효한 형식인지 확인
        if (!event.date || isNaN(event.time) || isNaN(event.duration))
          return null;

        const [year, month, day] = event.date.split(". ").map(Number);

        // 날짜 형식이 올바르지 않으면 제외
        if (!year || !month || !day) return null;

        // 이벤트 시작 시간과 종료 시간 계산
        const start = new Date(year, month - 1, day, event.time, 0, 0);
        const end = new Date(start.getTime() + event.duration * 60 * 60 * 1000);

        // 유효하지 않은 날짜 값은 제외
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        return {
          id: eventId,
          calendarId: event.calendarId,
          title: `${event.room_name}호 ${event.teacher_name} 선생님`,
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
      .filter((event) => event !== null); // 유효한 이벤트만 남기기

    setScheduleData(formattedData);
  }, [data]);

  useEffect(() => {
  if (calendarContainerRef.current && !calendarInstanceRef.current) {
    calendarInstanceRef.current = new Calendar(calendarContainerRef.current, {
      defaultView: "month",
      useDetailPopup: false,
      usageStatistics: false,
      isReadOnly: true,
      gridSelection: false,

  template: {
    time(schedule: any) {
      if (!schedule?.start) return "";

      const start = new Date(schedule.start);
      const hours = start.getHours().toString().padStart(2, "0");
      const minutes = start.getMinutes().toString().padStart(2, "0");
      const time = `${hours}:${minutes}`;

      return `
        <div class="mobile-stack">
          <div class="mobile-time">${time}</div>
          <div class="mobile-room">${schedule.raw?.room_name}</div>
        </div>
        <span class="desktop-only">
          ${time} ${schedule.raw?.room_name} ${schedule.raw?.teacher_name}
        </span>
      `;
    },
  },

  month: {
    isAlways6Weeks: false,
    visibleEventCount: 99,   // 🔥 show all events
  },
  });
}

  if (!calendarInstanceRef.current) return;

  // 🔥 THEN render events
  calendarInstanceRef.current.clear();
  calendarInstanceRef.current.createEvents(scheduleData);

}, [scheduleData]);

  const updateCurrentDate = () => {
    const date = calendarInstanceRef.current?.getDate();
    if (date) {
      setCurrentDate({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }
  };

  // today 버튼 클릭 핸들러
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

  return (
    <div>
      <div className="flex items-center mb-5">
        <button
          onClick={handlePrevClick}
          className="p-1 px-3  border-2 rounded-[100%] hover:bg-slate-500 hover:text-white"
        >
          ←
        </button>

        <div className="text-xl mx-8">
          {currentDate.year}. {currentDate.month}
        </div>

        <button
          onClick={handleNextClick}
          className=" p-1 px-3  border-2 rounded-[100%] hover:bg-slate-500 hover:text-white"
        >
          →
        </button>

        <button
          onClick={handleTodayClick}
          className="ml-5 p-1 px-3  border-2 rounded-2xl  hover:bg-slate-500 hover:text-white"
        >
          Today
        </button>
      </div>

      <div
        ref={calendarContainerRef}
        style={{ width: "100%", height: "65vh" }}
      />
    </div>
  );
};

export default ToastUI;
