"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import {
  Calendar as Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import "react-day-picker/dist/style.css";
import AddRoom from "@/components/addroom";
import VariousRoom from "@/components/VariousRoom";
import { DraggableScheduleCard } from "@/components/Drag/DraggableScheduleCard";
import { DroppableCalendarCell } from "@/components/Drag/DroppableCalendarCell";

interface ClassNote {
  _id: string;
  student_name: string;
  class_date: string;
  date: string;
  original_text: string;
  homework?: string;
  nextClass?: string;
}

interface Schedule {
  _id: string;
  id: string;
  calendarId: string;
  room_name: string;
  date: string | undefined;
  time: number;
  duration: number;
  teacher_name: string;
  student_name: string;
}

// 클래스 노트 뷰어 컴포넌트
interface ClassNoteViewerProps {
  note: ClassNote;
  onClose: () => void;
}

const ClassNoteViewer: React.FC<ClassNoteViewerProps> = ({ note, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <p className="text-2xl font-semibold text-gray-600 mt-1">
              {note.student_name} - {note.class_date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* 클래스 노트 내용 */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
                Class Notes
              </h3>
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: note.original_text }}
              />
            </div>

            {/* 숙제 */}
            {note.homework && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
                  Homework
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {note.homework}
                  </p>
                </div>
              </div>
            )}

            {/* 다음 수업 계획 */}
            {note.nextClass && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
                  Next Class Plan
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {note.nextClass}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Created: {note.date}</span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 커스텀 월간 캘린더 컴포넌트 with Enhanced Drag & Drop
interface CustomCalendarProps {
  data: Schedule[];
  classNotes: ClassNote[];
  onDateSelect?: (date: Date) => void;
  onViewNote?: (note: ClassNote) => void;
  onScheduleMove?: (schedule: Schedule, newDate: Date) => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  data,
  classNotes,
  onDateSelect,
  onViewNote,
  onScheduleMove,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedSchedule, setDraggedSchedule] = useState<Schedule | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // 월의 첫째 날과 마지막 날 구하기
  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays = [];
    const currentCalendarDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(currentCalendarDate));
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }

    return { calendarDays, currentMonth: month, currentYear: year };
  };

  const { calendarDays, currentMonth, currentYear } = getMonthData(currentDate);

  // 날짜별 스케줄과 노트 데이터 그룹화
  const getDateData = (date: Date) => {
    const dateStr = `${date.getFullYear()}. ${String(
      date.getMonth() + 1
    ).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}.`;

    const daySchedules = data.filter((schedule) => schedule.date === dateStr);
    const dayNotes = classNotes.filter((note) => note.class_date === dateStr);
    const notesWithoutSchedule = dayNotes.filter(
      (note) =>
        !daySchedules.some(
          (schedule) => schedule.student_name === note.student_name
        )
    );

    return {
      schedules: daySchedules,
      notes: notesWithoutSchedule,
      allNotes: dayNotes,
    };
  };

  // 드래그 이벤트 핸들러 - 캘린더 스케줄용
  const handleScheduleDragStart = (e: React.DragEvent, schedule: Schedule) => {
    setDraggedSchedule(schedule);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);

    // 드래그 이미지 커스터마이징 - 너비 제한
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = "rotate(5deg)";
    dragImage.style.opacity = "0.8";
    dragImage.style.width = "120px";
    dragImage.style.maxWidth = "120px";
    dragImage.style.fontSize = "11px";
    dragImage.style.padding = "4px 6px";
    dragImage.style.whiteSpace = "nowrap";
    dragImage.style.overflow = "hidden";
    dragImage.style.textOverflow = "ellipsis";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    dragImage.style.left = "-1000px";
    dragImage.style.zIndex = "9999";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 15);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // 셀을 완전히 벗어났을 때만 dragOverDate를 null로 설정
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();

    if (draggedSchedule && onScheduleMove) {
      // 시간 충돌 검사
      const targetDateStr = `${targetDate.getFullYear()}. ${String(
        targetDate.getMonth() + 1
      ).padStart(2, "0")}. ${String(targetDate.getDate()).padStart(2, "0")}.`;

      const existingSchedules = data.filter(
        (schedule) =>
          schedule.date === targetDateStr &&
          schedule._id !== draggedSchedule._id
      );

      const hasTimeConflict = existingSchedules.some(
        (schedule) => schedule.time === draggedSchedule.time
      );

      if (hasTimeConflict) {
        alert(`${draggedSchedule.time}:00 시간에 이미 다른 수업이 있습니다.`);
        setDraggedSchedule(null);
        setDragOverDate(null);
        return;
      }

      onScheduleMove(draggedSchedule, targetDate);

      // 성공 메시지
      console.log(
        `✅ ${draggedSchedule.student_name}'s class moved to ${targetDateStr}`
      );
    }

    setDraggedSchedule(null);
    setDragOverDate(null);
  };

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 오늘 날짜 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 현재 달인지 확인
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  return (
    <div className="bg-[#f9fafb] rounded-xl p-2 border border-gray-200 shadow-lg overflow-scroll  w-[100%] h-full">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm"
          >
            Today
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all duration-200 text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all duration-200 text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            {currentYear}년 {monthNames[currentMonth]}
          </h1>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`p-4 text-center font-medium text-sm border-r border-gray-200 last:border-r-0 ${
              index === 0
                ? "text-red-500"
                : index === 6
                ? "text-blue-500"
                : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const { schedules, notes, allNotes } = getDateData(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isDragOver =
            dragOverDate?.toDateString() === date.toDateString();

          return (
            <DroppableCalendarCell
              key={date.toISOString()}
              date={date}
              schedules={schedules}
              notes={notes}
              allNotes={allNotes}
              isCurrentMonth={isCurrentMonthDate}
              isToday={isTodayDate}
              isDragOver={isDragOver}
              onDateClick={handleDateClick}
              onViewNote={onViewNote || (() => {})}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={(e) => handleDragEnter(e, date)}
              onDragLeave={handleDragLeave}
              onScheduleDragStart={handleScheduleDragStart}
              index={index}
            />
          );
        })}
      </div>

      {/* 가이드 */}
      <div className="flex justify-center p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-700">
              정규 스케줄 (캘린더에서도 드래그 가능)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-700">클래스 노트</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-500" />
            <span className="text-gray-700">클릭하여 보기</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DragDropSchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariousRoomOpen, setIsVariousRoomOpen] = useState(false);
  const [classes, setClasses] = useState<Schedule[]>([]);
  const [classNotes, setClassNotes] = useState<ClassNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<ClassNote[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClassNote | null>(null);

  // 드래그 상태
  const [draggedSchedule, setDraggedSchedule] = useState<Schedule | null>(null);

  const openAddSchedule = () => setIsModalOpen(true);
  const closeAddSchedule = () => setIsModalOpen(false);
  const closeVariousSchedule = () => setIsVariousRoomOpen(false);

  const scheduleURL = `/api/schedules/${type}/${user}`;

  // 스케줄 데이터 가져오기
  useEffect(() => {
    if (!user || classes.length > 0) return;

    fetch(scheduleURL, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched schedule data:", data);
        setClasses(data);
      })
      .catch((error) => console.log("Error fetching schedule data:", error));
  }, [user, scheduleURL, classes.length]);

  // 클래스 노트 데이터 가져오기
  useEffect(() => {
    if (!user || classNotes.length > 0) return;

    const fetchAllClassNotes = async () => {
      try {
        const studentListResponse = await fetch(`/api/diary/${type}/${user}`, {
          cache: "no-store",
        });
        if (!studentListResponse.ok) return;

        const studentList = await studentListResponse.json();
        console.log("Student list:", studentList);

        const allNotes: ClassNote[] = [];

        for (const studentName of studentList) {
          try {
            const notesResponse = await fetch(
              `/api/quizlet/student/${encodeURIComponent(studentName)}`,
              { cache: "no-store" }
            );
            if (notesResponse.ok) {
              const studentNotes = await notesResponse.json();
              if (Array.isArray(studentNotes)) {
                allNotes.push(...studentNotes);
              }
            }
          } catch (error) {
            console.error(`Error fetching notes for ${studentName}:`, error);
          }
        }

        console.log("All class notes:", allNotes);
        setClassNotes(allNotes);
      } catch (error) {
        console.error("Error fetching class notes:", error);
      }
    };

    fetchAllClassNotes();
  }, [user, type, classNotes.length]);

  // 스케줄 이동 핸들러 (로컬 상태만 업데이트)
  const handleScheduleMove = (schedule: Schedule, newDate: Date) => {
    const newDateStr = `${newDate.getFullYear()}. ${String(
      newDate.getMonth() + 1
    ).padStart(2, "0")}. ${String(newDate.getDate()).padStart(2, "0")}.`;

    setClasses((prevClasses) =>
      prevClasses.map((cls) =>
        cls._id === schedule._id ? { ...cls, date: newDateStr } : cls
      )
    );

    console.log(`Moved ${schedule.student_name}'s class to ${newDateStr}`);
  };

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
          const classDateParts = cls.date?.trim().split(". ") || [];
          const selectedDateParts = formattedDate.trim().split(/\.\s*/);

          const yearMatch = classDateParts[0] === selectedDateParts[0];
          const monthMatch = classDateParts[1] === selectedDateParts[1];
          const dayMatch = classDateParts[2] === selectedDateParts[2];

          const fullMatch = cls.date?.trim() === formattedDate.trim();

          return fullMatch || (yearMatch && monthMatch && dayMatch);
        });

        return isMatch;
      });

      const notesForDate = classNotes.filter((note) => {
        return formattedDates.some((formattedDate) => {
          const noteDateParts = note.class_date.trim().split(". ");
          const selectedDateParts = formattedDate.trim().split(/\.\s*/);

          const yearMatch = noteDateParts[0] === selectedDateParts[0];
          const monthMatch = noteDateParts[1] === selectedDateParts[1];
          const dayMatch = noteDateParts[2] === selectedDateParts[2];

          const fullMatch = note.class_date.trim() === formattedDate.trim();

          return fullMatch || (yearMatch && monthMatch && dayMatch);
        });
      });

      const formattedStudents = studentsForDate.map((student) => ({
        ...student,
        displayText: `${student.time.toString().padStart(2, "0")}:00 ${
          student.room_name
        } - ${student.student_name} 학생`,
        type: "schedule",
      }));

      setFilteredStudents(formattedStudents);
      setFilteredNotes(notesForDate);
    }
  }, [selectedDate, classes, classNotes]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handleViewNote = (note: ClassNote) => {
    setSelectedNote(note);
  };

  const handleCloseNoteViewer = () => {
    setSelectedNote(null);
  };

  const handleDragStart = (e: React.DragEvent, student: any) => {
    setDraggedSchedule(student);
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

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .schedule-container {
        display: flex;
        width: 100%;
        height: 100vh;
        background-color: #f9f9f9;
        padding: 16px;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

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

      .student-card.draggable {
        cursor: grab;
      }

      .student-card.dragging {
        opacity: 0.5;
        transform: rotate(2deg);
      }

      .note-card {
        background-color: #fff8f8;
        border: 1px solid #ffcccc;
        border-radius: 8px;
        padding: 12px;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(255, 0, 0, 0.1);
      }

      .note-card:hover {
        border-color: #ff6666;
        box-shadow: 0 2px 6px rgba(255, 102, 102, 0.15);
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

      .note-student-name {
        font-size: 14px;
        font-weight: 600;
        color: #cc3333;
      }

      .student-time {
        font-size: 12px;
        font-weight: 500;
        color: #3366CC;
        background-color: #EBF3FF;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .note-tag {
        font-size: 12px;
        font-weight: 500;
        color: #cc3333;
        background-color: #ffe6e6;
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

      .note-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #cc6666;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #4CAF50;
      }

      .note-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ff6666;
      }

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

      

      .empty-state {
        color: #888;
        font-size: 13px;
        text-align: center;
        padding: 20px 0;
      }

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

      .view-note-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 8px;
        background-color: #3366CC;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        outline: none;
      }

      .view-note-button:hover {
        background-color: #2952A3;
      }

      .note-view-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 8px;
        background-color: #cc3333;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        outline: none;
      }

      .note-view-button:hover {
        background-color: #aa2222;
      }

      .drag-over {
        background-color: #e3f2fd !important;
        border: 2px dashed #2196f3 !important;
      }

      /* 캘린더 스케줄 드래그 스타일 */
      .cursor-grab {
        cursor: grab;
      }

      .active\\:cursor-grabbing:active {
        cursor: grabbing;
      }

      /* 드래그 중일 때 캘린더 스케줄 스타일 */
      .bg-blue-500:hover {
        background-color: #2563eb !important;
        transform: scale(1.02);
        box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
      }
      
      @media (max-width: 768px) {
        .schedule-container {
          flex-direction: column;
          height: auto;
        }
        
        .sidebar {
          width: 100%;
          margin-bottom: 16px;
        }
        
        
      }
    `;
    document.head.appendChild(styleElement);
  }, []);

  return (
    <div className="schedule-container">
      <div className="sidebar">
        {type === "teacher" &&
          ((user === "David" && id === "01027137397") ||
            (user === "Phil" && id === "01082413315")) && (
            <button
              onClick={() =>
                window.open(
                  `/teacher/admin_schedule?user=${user}&type=${type}&id=${id}`,
                  "_blank"
                )
              }
              className="action-button primary-button"
            >
              관리자 페이지로 들어가기
            </button>
          )}

        <div className="date-section">
          <div className="selected-date">{formatDate(selectedDate)}</div>
          <div
            className="date-icon"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            role="button"
            aria-label="캘린더 열기"
          ></div>
        </div>

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
            스케줄 및 수업 노트 (모든 곳에서 드래그 가능)
          </div>
          {filteredStudents.length > 0 || filteredNotes.length > 0 ? (
            <div className="student-list">
              {filteredStudents.map((student, index) => {
                const studentNote = filteredNotes.find(
                  (note) => note.student_name === student.student_name
                );

                return (
                  <DraggableScheduleCard
                    key={`schedule-${index}`}
                    student={student}
                    studentNote={studentNote}
                    onViewNote={handleViewNote}
                    onDragStart={handleDragStart}
                    isDragging={draggedSchedule?._id === student._id}
                  />
                );
              })}

              {filteredNotes.map((note, index) => {
                const hasSchedule = filteredStudents.some(
                  (student) => student.student_name === note.student_name
                );

                if (hasSchedule) return null;

                return (
                  <div key={`note-${index}`} className="note-card">
                    <div className="student-header">
                      <div className="note-student-name">
                        {note.student_name} 학생
                      </div>
                      <div className="note-tag">Class Record</div>
                    </div>
                    <div className="student-details">
                      <div className="note-info">
                        <span>수업 노트 존재</span>
                        <span>•</span>
                        <span>{note.class_date}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleViewNote(note)}
                          className="note-view-button"
                          title="클래스 노트 보기"
                        >
                          <Eye size={12} />
                          보기
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              선택된 날짜의 스케줄 및 수업 노트가 없습니다.
            </div>
          )}
        </div>

        <div className="button-section">
          <button
            onClick={openAddSchedule}
            className="action-button primary-button"
          >
            <Plus size={16} />
            수업 추가
          </button>
        </div>
      </div>

      <CustomCalendar
        data={classes}
        classNotes={classNotes}
        onDateSelect={handleDateSelect}
        onViewNote={handleViewNote}
        onScheduleMove={handleScheduleMove}
      />

      {type !== "student" && isModalOpen && (
        <div className="modal-overlay">
          <AddRoom closeAddSchedule={closeAddSchedule} />
        </div>
      )}
      {type !== "student" && isVariousRoomOpen && (
        <div className="modal-overlay">
          <VariousRoom closeVariousSchedule={closeVariousSchedule} />
        </div>
      )}

      {/* 클래스 노트 뷰어 모달 */}
      {selectedNote && (
        <ClassNoteViewer note={selectedNote} onClose={handleCloseNoteViewer} />
      )}
    </div>
  );
};

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DragDropSchedulePage />
    </Suspense>
  );
}
