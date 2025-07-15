// DraggableScheduleCard.tsx
import React from "react";
import { Eye } from "lucide-react";

interface DraggableScheduleCardProps {
  student: any;
  studentNote?: any;
  onViewNote: (note: any) => void;
  onDragStart: (e: React.DragEvent, student: any) => void;
  isDragging: boolean;
}

export const DraggableScheduleCard: React.FC<DraggableScheduleCardProps> = ({
  student,
  studentNote,
  onViewNote,
  onDragStart,
  isDragging,
}) => {
  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, student)}
      className={`student-card draggable ${isDragging ? "dragging" : ""}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        transition: "all 0.2s ease",
      }}
    >
      <div className="student-header">
        <div className="student-name">{student.student_name} 학생</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {studentNote && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewNote(studentNote);
              }}
              className="view-note-button"
              title="클래스 노트 보기"
            >
              <Eye size={12} />
              보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
