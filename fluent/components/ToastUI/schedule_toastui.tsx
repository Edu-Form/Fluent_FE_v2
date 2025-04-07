"use client";

import { useEffect, useRef, useState } from "react";
import Calendar from "@toast-ui/calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

interface ToastUIProps {
  data: {
    _id: string;
    id: string;
    calendarId: string;
    room_name: string;
    date: string | undefined;
    time: number;
    duration: number;
    teacher_name: string;
    student_name: string;
  }[];
  onDateSelect?: (date: Date) => void;
}

const ScheduleToastUI: React.FC<ToastUIProps> = ({ data, onDateSelect }) => {
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<typeof Calendar | null>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  // 현재 날짜 상태
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  useEffect(() => {
    const formattedData = data
      .map((event) => {
        const eventId = event._id || event.id;

        if (!event.date || isNaN(event.time) || isNaN(event.duration))
          return null;

        const [year, month, day] = event.date.split(". ").map(Number);

        if (!year || !month || !day) return null;

        const start = new Date(year, month - 1, day, event.time, 0, 0);
        const end = new Date(start.getTime() + event.duration * 60 * 60 * 1000);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        return {
          id: eventId,
          calendarId: event.calendarId,
          title: `${event.room_name}호 ${event.student_name}님`,
          category: "time",
          start,
          end,
          raw: {
            room_name: event.room_name,
            teacher_name: event.teacher_name,
            student_name: event.student_name,
            schedule_id: eventId,
            date: new Date(year, month - 1, day), // 날짜 정보 저장
          },
        };
      })
      .filter((event) => event !== null);

    setScheduleData(formattedData);
  }, [data]);

  useEffect(() => {
    if (calendarContainerRef.current && !calendarInstanceRef.current) {
      calendarInstanceRef.current = new Calendar(calendarContainerRef.current, {
        defaultView: "month",
        useDetailPopup: true,
        usageStatistics: false,
      });
    }
    if (calendarInstanceRef.current && scheduleData.length > 0) {
      calendarInstanceRef.current.clear();
      calendarInstanceRef.current.createEvents(scheduleData);
    }

    calendarInstanceRef.current.setOptions({
      useFormPopup: false,
      useDetailPopup: false,
      isReadOnly: true, // 읽기 전용 모드 해제
      gridSelection: false, // 그리드 선택 활성화
      template: {
        time: function (event: any) {
          const { title } = event;
          return `<div class="toastui-calendar-event-time-content" style="height: 100%; background-color: #E6F0FF;">
                    <span class="toastui-calendar-template-time">
                      <strong style="color: #3366CC;">${event.start.getHours()}:${String(
            event.start.getMinutes()
          ).padStart(2, "0")}</strong>&nbsp;
                      <span>${title}</span>
                    </span>
                  </div>`;
        },
        popupDetailAttendees({ raw }: { raw: any }) {
          const teacherName = raw?.teacher_name || "알 수 없음";
          return `${teacherName} 선생님`;
        },
        popupDetailState() {
          return "lesson";
        },
      },
      week: {
        startDayOfWeek: 0,
        dayNames: ["일", "월", "화", "수", "목", "금", "토"],
        taskView: false,
        eventView: ["time"],
      },
      month: {
        isAlways6Weeks: false,
      },
    });

    // 사용자 정의 CSS 스타일 추가
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .toastui-calendar-event-time-content .toastui-calendar-template-time strong {
        color: #000000 !important;
      }
      .toastui-calendar-event-time-content {
      padding: 0 0.5rem;
      border-radius: 2rem;
        background-color: #cfe3ff !important;
      }
        .toastui-calendar-weekday-event-dot {
        background-color: #5389ff !important;
      }
    `;
    document.head.appendChild(styleElement);

    // 기본 테마 설정
    calendarInstanceRef.current.setTheme({
      common: {
        border: "1px dotted #e5e5e5",
        today: {
          color: "white",
          backgroundColor: "#3f4166",
        },
        saturday: {
          color: "rgba(64, 64, 255)",
        },
        gridSelection: {
          backgroundColor: "rgba(81, 230, 92, 0.05)",
          border: "1px dotted #ff0000",
        },
      },
      week: {
        dayName: {
          borderBottom: "1px solid #e5e5e5",
          backgroundColor: "#f8f8f8",
        },
        timeGrid: {
          borderRight: "1px solid #e5e5e5",
        },
        weekend: {
          backgroundColor: "aliceblue",
        },
      },
      time: {
        fontSize: "12px",
        fontWeight: "normal",
        color: "#333",
        backgroundColor: "#E6F0FF",
      },
      timeTemplate: {
        fontWeight: "bold",
        color: "#3366CC",
      },
      month: {
        weekend: {
          backgroundColor: "aliceblue",
        },
        holidayExceptThisMonth: {
          color: "red",
        },
        dayName: {
          border: "20px",
          backgroundColor: "none",
        },
        moreView: {
          border: "1px solid #3f4166",
          borderRadius: "1rem",
          boxShadow: "0 2px 6px 0 grey",
          backgroundColor: "white",
          width: 320,
          height: 200,
        },
      },
    });

    // 이벤트 클릭 시 날짜 선택
    calendarInstanceRef.current.on(
      "clickEvent",
      ({ event }: { event: any }) => {
        const clickedEvent = event.raw;
        console.log("클릭한 이벤트 데이터:", clickedEvent);

        // 클릭한 이벤트의 날짜 정보를 부모 컴포넌트로 전달
        if (onDateSelect && clickedEvent.date) {
          onDateSelect(clickedEvent.date);
        }
      }
    );

    // 날짜 그리드 클릭 시 날짜 선택
    calendarInstanceRef.current.on("beforeCreateSchedule", (eventInfo: any) => {
      // 빈 그리드 클릭 시 기본 일정 생성 취소하고 날짜만 전달
      eventInfo.preventDefault();
      if (onDateSelect && eventInfo.start) {
        onDateSelect(new Date(eventInfo.start));
      }
    });

    // 날짜 헤더 클릭 시 날짜 선택
    calendarInstanceRef.current.on("clickDayName", (eventInfo: any) => {
      if (onDateSelect && eventInfo.date) {
        onDateSelect(new Date(eventInfo.date));
      }
    });

    // 현재 표시 중인 연도와 월 업데이트
    calendarInstanceRef.current.on("afterRender", () => {
      const date = calendarInstanceRef.current?.getDate();
      if (date) {
        setCurrentDate({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        });
      }
    });
  }, [scheduleData, onDateSelect]);

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

    // Today 버튼 클릭 시 오늘 날짜 선택
    if (onDateSelect) {
      onDateSelect(new Date());
    }
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
      <div className="flex items-center my-5">
        <button
          onClick={handlePrevClick}
          className="p-1 px-3 border-2 rounded-[100%] hover:bg-slate-500 hover:text-white"
        >
          ←
        </button>

        <div className="text-xl mx-8">
          {currentDate.year}. {currentDate.month}
        </div>

        <button
          onClick={handleNextClick}
          className="p-1 px-3 border-2 rounded-[100%] hover:bg-slate-500 hover:text-white"
        >
          →
        </button>

        <button
          onClick={handleTodayClick}
          className="ml-5 p-1 px-3 border-2 rounded-2xl hover:bg-slate-500 hover:text-white"
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

export default ScheduleToastUI;
