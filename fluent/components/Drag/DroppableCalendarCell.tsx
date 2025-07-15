// DroppableCalendarCell.tsx
import React, { useState } from "react";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";

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

interface DroppableCalendarCellProps {
  date: Date;
  schedules: Schedule[];
  notes: any[];
  allNotes: any[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isDragOver: boolean;
  onDateClick: (date: Date) => void;
  onViewNote: (note: any) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, date: Date) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onScheduleDragStart: (e: React.DragEvent, schedule: Schedule) => void;
  index: number;
}

export const DroppableCalendarCell: React.FC<DroppableCalendarCellProps> = ({
  date,
  schedules,
  notes,
  allNotes,
  isCurrentMonth,
  isToday,
  isDragOver,
  onDateClick,
  onViewNote,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onScheduleDragStart,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 표시할 스케줄 수 결정
  const maxVisibleItems = 2;
  const totalItems = schedules.length + notes.length;
  const hasMoreItems = totalItems > maxVisibleItems;

  // 확장 상태에 따라 표시할 아이템 결정
  const visibleSchedules = isExpanded
    ? schedules
    : schedules.slice(0, maxVisibleItems);
  const remainingSlots = maxVisibleItems - visibleSchedules.length;
  const visibleNotes = isExpanded
    ? notes
    : notes.slice(0, Math.max(0, remainingSlots));

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // 날짜 클릭 이벤트 방지
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={() => onDateClick(date)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, date)}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`${
        isExpanded ? "min-h-[200px]" : "min-h-[120px]"
      } p-2 border-r border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-blue-50 ${
        !isCurrentMonth ? "bg-gray-50" : "bg-white"
      } ${index % 7 === 6 ? "border-r-0" : ""} ${
        isDragOver ? "drag-over" : ""
      }`}
      style={{
        backgroundColor: isDragOver ? "#e3f2fd" : undefined,
        border: isDragOver ? "2px dashed #2196f3" : undefined,
      }}
    >
      {/* 날짜 표시 */}
      <div
        className={`text-sm font-medium mb-2 ${
          isToday
            ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
            : !isCurrentMonth
            ? "text-gray-400"
            : index % 7 === 0
            ? "text-red-500"
            : index % 7 === 6
            ? "text-blue-500"
            : "text-gray-700"
        }`}
      >
        {date.getDate()}
      </div>

      {/* 스케줄 표시 - 드래그 가능하게 수정 */}
      <div className="space-y-1">
        {visibleSchedules.map((schedule) => (
          <div key={schedule._id} className="flex items-center gap-1">
            <div
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                onScheduleDragStart(e, schedule);
              }}
              className="text-xs px-2 py-1 rounded text-white font-medium truncate flex-1 bg-blue-500 hover:bg-blue-600 transition-colors cursor-grab active:cursor-grabbing select-none"
              title={`${schedule.time}:00 ${schedule.student_name} (${schedule.room_name}호, ${schedule.teacher_name}) - 드래그 가능`}
              style={{
                userSelect: "none",
                maxWidth: "500px",
                minWidth: "80px",
              }}
            >
              {schedule.time}:00 {schedule.student_name}
            </div>
            {allNotes.some(
              (note) => note.student_name === schedule.student_name
            ) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const note = allNotes.find(
                    (n) => n.student_name === schedule.student_name
                  );
                  if (note) {
                    onViewNote(note);
                  }
                }}
                className="p-1 hover:bg-blue-600 rounded bg-blue-500 transition-colors"
                title="View Class Note"
              >
                <Eye size={12} className="text-white" />
              </button>
            )}
          </div>
        ))}

        {/* 클래스 노트 표시 (스케줄이 없는 경우만) */}
        {visibleNotes.map((note) => (
          <div key={note._id} className="flex items-center gap-1">
            <div
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium truncate border border-red-200 flex-1"
              title={`Class Note: ${note.student_name}`}
            >
              {note.student_name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewNote(note);
              }}
              className="p-1 hover:bg-red-100 bg-red-200 rounded transition-colors"
              title="View Class Note"
            >
              <Eye size={12} className="text-red-600" />
            </button>
          </div>
        ))}

        {/* 확장/축소 버튼 - 더 많은 이벤트가 있을 때만 표시 */}
        {hasMoreItems && (
          <button
            onClick={handleExpandToggle}
            className="w-full text-xs text-gray-600 hover:text-blue-600 font-medium py-1 px-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
            title={isExpanded ? "축소하기" : "더 보기"}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} />
                축소
              </>
            ) : (
              <>
                <ChevronDown size={12} />+{totalItems - maxVisibleItems} more
              </>
            )}
          </button>
        )}

        {/* 드래그 오버 상태 표시 */}
        {isDragOver && (
          <div className="text-xs text-blue-600 font-medium animate-pulse">
            Drop here to move
          </div>
        )}
      </div>
    </div>
  );
};
