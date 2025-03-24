"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Calendar as Plus, Layers } from "lucide-react";
import "react-day-picker/dist/style.css";
import AddRoom from "@/components/addroom";
import VariousRoom from "@/components/VariousRoom";

const Schedule_toastUI = dynamic(
  () => import("@/components/ToastUI/schedule_toastui"),
  {
    ssr: false,
  }
);

const SchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariousRoomOpen, setIsVariousRoomOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const openAddSchedule = () => setIsModalOpen(true);
  const closeAddSchedule = () => setIsModalOpen(false);

  const openVariousSchedule = () => setIsVariousRoomOpen(true);
  const closeVariousSchedule = () => setIsVariousRoomOpen(false);

  const URL = `/api/schedules/${type}/${user}`;

  useEffect(() => {
    if (!user || classes.length > 0) return;

    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setClasses(data);
      })
      .catch((error) => console.log("Error fetching data:", error));
  }, [user, URL, classes.length]);

  useEffect(() => {
    if (selectedDate) {
      const originalFormattedDate = selectedDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const formattedDates = [originalFormattedDate];

      const studentsForDate = classes.filter((cls) => {
        const isMatch = formattedDates.some((formattedDate) => {
          const classDateParts = cls.date.trim().split(". ");
          const selectedDateParts = formattedDate.trim().split(/\.\s*/);

          const yearMatch = classDateParts[0] === selectedDateParts[0];
          const monthMatch = classDateParts[1] === selectedDateParts[1];
          const dayMatch = classDateParts[2] === selectedDateParts[2];

          const fullMatch = cls.date.trim() === formattedDate.trim();

          return fullMatch || (yearMatch && monthMatch && dayMatch);
        });

        return isMatch;
      });

      const formattedStudents = studentsForDate.map((student) => ({
        ...student,
        displayText: `${student.time.toString().padStart(2, "0")}:00 ${
          student.room_name
        } - ${student.student_name} 학생`,
      }));

      console.log("Formatted Students:", formattedStudents);

      setFilteredStudents(formattedStudents);
    }
  }, [selectedDate, classes]);

  const handleDateSelect = (date: Date) => {
    console.log("날짜 선택됨:", date);
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  // 날짜 포맷 함수
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    };

    return date.toLocaleDateString("ko-KR", options);
  };

  // CSS 스타일 요소 추가
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      /* 전체 레이아웃 스타일 */
      .schedule-container {
        display: flex;
        width: 100%;
        height: 80vh;
        background-color: #f9f9f9;
        padding: 16px;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* 사이드바 스타일 */
      .sidebar {
        width: 320px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* 날짜 정보 스타일 */
      .date-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        position: relative;
      }

      .selected-date {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .date-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .date-icon:hover {
        background-color: #f0f0f0;
      }

      /* 학생 리스트 섹션 */
      .student-section {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #666;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .student-list {
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 4px;
      }

      .student-list::-webkit-scrollbar {
        width: 6px;
      }

      .student-list::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 3px;
      }

      .student-list::-webkit-scrollbar-track {
        background-color: #f5f5f5;
      }

      /* 학생 카드 스타일 */
      .student-card {
        background-color: white;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 12px;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .student-card:hover {
        border-color: #3366CC;
        box-shadow: 0 2px 6px rgba(51, 102, 204, 0.1);
      }

      .student-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .student-name {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .student-time {
        font-size: 12px;
        font-weight: 500;
        color: #3366CC;
        background-color: #EBF3FF;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .student-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .student-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #888;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #4CAF50;
      }

      /* 버튼 스타일 */
      .button-section {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        outline: none;
      }

      .primary-button {
        background-color: #3366CC;
        color: white;
      }

      .primary-button:hover {
        background-color: #2952A3;
      }

      .secondary-button {
        background-color: #4CAF50;
        color: white;
      }

      .secondary-button:hover {
        background-color: #3D8B40;
      }

      /* 캘린더 컨테이너 */
      .calendar-container {
        flex-grow: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        padding: 20px;
        overflow: hidden;
      }

      /* 일정 없음 메시지 */
      .empty-state {
        color: #888;
        font-size: 13px;
        text-align: center;
        padding: 20px 0;
      }


      
      /* 모달 오버레이 스타일 */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      
      /* 반응형 레이아웃 */
      @media (max-width: 768px) {
        .schedule-container {
          flex-direction: column;
          height: auto;
        }
        
        .sidebar {
          width: 100%;
          margin-bottom: 16px;
        }
        
        .calendar-container {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }, []);

  return (
    <div className="schedule-container">
      {/* 왼쪽: 사이드바 (날짜 선택 및 학생 리스트) */}
      <div className="sidebar">
        {/* 날짜 선택 섹션 */}
        <div className="date-section">
          <div className="selected-date">{formatDate(selectedDate)}</div>
          <div
            className="date-icon"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            role="button"
            aria-label="캘린더 열기"
          ></div>
        </div>

        {/* 학생 리스트 */}
        <div className="student-section">
          <div className="section-title">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 10.9C11.39 10.9 10.9 11.39 10.9 12C10.9 12.61 11.39 13.1 12 13.1C12.61 13.1 13.1 12.61 13.1 12C13.1 11.39 12.61 10.9 12 10.9ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM14.19 14.19L6 18L9.81 9.81L18 6L14.19 14.19Z"
                fill="#666666"
              />
            </svg>
            학생 리스트
          </div>
          {filteredStudents.length > 0 ? (
            <div className="student-list">
              {filteredStudents.map((student, index) => (
                <div key={index} className="student-card">
                  <div className="student-header">
                    <div className="student-name">
                      {student.student_name} 학생
                    </div>
                    <div className="student-time">
                      {student.time.toString().padStart(2, "0")}:00
                    </div>
                  </div>
                  <div className="student-details">
                    <div className="student-info">
                      <span>{student.room_name}호</span>
                      <span>•</span>
                      <span>{student.teacher_name}</span>
                    </div>
                    <div className="status-dot"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">선택된 날짜의 스케줄이 없습니다.</div>
          )}
        </div>

        {/* 버튼 섹션 */}
        <div className="button-section">
          <button
            onClick={openAddSchedule}
            className="action-button primary-button"
          >
            <Plus size={16} />
            수업 추가
          </button>
          <button
            onClick={openVariousSchedule}
            className="action-button secondary-button"
          >
            <Layers size={16} />
            여러 수업 추가
          </button>
        </div>
      </div>

      {/* 오른쪽: 캘린더 영역 */}
      <div className="calendar-container">
        <Schedule_toastUI data={classes} onDateSelect={handleDateSelect} />
      </div>

      {/* AddRoom 모달 */}
      {type !== "student" && isModalOpen && (
        <div className="modal-overlay">
          <AddRoom closeAddSchedule={closeAddSchedule} />
        </div>
      )}
      {/* VariousRoom 모달 */}
      {type !== "student" && isVariousRoomOpen && (
        <div className="modal-overlay">
          <VariousRoom closeVariousSchedule={closeVariousSchedule} />
        </div>
      )}
    </div>
  );
};

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulePage />
    </Suspense>
  );
}
