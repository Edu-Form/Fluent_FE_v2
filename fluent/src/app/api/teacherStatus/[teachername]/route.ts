// app/api/teacherStatus/[user]/route.ts
import { NextResponse } from "next/server";
import {
  getTeacherStatus,
  getStudentDiaryData,
  getStudentQuizletData,
  getStudentScheduleData,
  saveTeacherStatus,
  getClassnotes,        // ✅ REAL classnotes
} from "@/lib/data";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function toDateDot(v: any): Date | null {
  if (!v) return null;
  const m = String(v).trim().match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/);
  if (!m) return null;
  const year = Number(m[1]),
    month = Number(m[2]),
    day = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  return Number.isFinite(dt.getTime())
    ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
    : null;
}

function isBetweenInclusive(d: Date | null, a: Date | null, b: Date | null) {
  if (!d || !a || !b) return false;
  const min = a < b ? a : b;
  const max = a < b ? b : a;
  return d >= min && d <= max;
}

function toDotDate(raw?: string | null) {
  if (!raw) return "";
  const s = String(raw).trim().replace(/\.+$/, "");
  const m =
    s.match(/^(\d{4})\s*[.\-\/]\s*(\d{1,2})\s*[.\-\/]\s*(\d{1,2})$/) ||
    s.match(/^(\d{4})(\d{2})(\d{2})$/) ||
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/);
  if (!m) return s;
  const y = m[1],
    mo = String(m[2]).padStart(2, "0"),
    d = String(m[3]).padStart(2, "0");
  return `${y}. ${mo}. ${d}.`;
}

function formatDotDate(dateInput: any) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}.`;
}
/* ────────────────────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const teachername = url.pathname.split("/").pop();

    if (!teachername) {
      return NextResponse.json(
        { error: "Teacher name not provided" },
        { status: 400 }
      );
    }

    const teacherStatus = await getTeacherStatus(teachername);
    if (!teacherStatus) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const teacherChecklist = await Promise.all(
      teacherStatus.map(async (student: any) => {
        /* ─── Fetch supporting data ──────────────────────────── */
        const recent_diary = (await getStudentDiaryData(student.name)) ?? [];
        const recent_quizlet = (await getStudentQuizletData(student.name)) ?? [];
        const schedule_list = (await getStudentScheduleData(student.name)) ?? [];

        /* ─── REAL CLASSNOTES (fixes EVERYTHING) ─────────────── */
        const allNotes = await getClassnotes(student.name);

        // Sorted newest → oldest
        allNotes.sort((a: any, b: any) => {
          const da = new Date(a.class_date || a.date);
          const db = new Date(b.class_date || b.date);
          return db.getTime() - da.getTime();
        });

        const latestNote = allNotes[0];
        const previousNote = allNotes[1];

        const classNoteDate =
          latestNote?.class_date ||
          latestNote?.date ||
          "";

        const previousClassNoteDate =
          previousNote?.class_date ||
          previousNote?.date ||
          "";

        /* ─── Quizlet / Diary Logic ───────────────────────────── */
        const q0 = recent_quizlet[0] ?? { class_date: "", date: "" };
        const d0 = recent_diary[0] ?? { class_date: "", date: "" };

        /* ─── Match schedule with REAL classnote date ─────────── */
        let scheduleDate = "";
        if (classNoteDate) {
          const found = schedule_list.find(
            (s: any) => s.date === classNoteDate
          );
          scheduleDate = found ? found.date : "";
        }

        /* ─── Build final row ─────────────────────────────────── */
        const row = {
          name: student.name,
          phoneNumber: student.phoneNumber,

          class_note: toDotDate(classNoteDate),
          previous_class_note: toDotDate(previousClassNoteDate),

          quizlet_date: toDotDate(q0.class_date || q0.date),
          diary_date: toDotDate(d0.class_date),
          diary_edit: toDotDate(d0.date),

          schedule_date: scheduleDate,
        };

        /* ─── Diary window validation ─────────────────────────── */
        const diary_in_window =
          row.class_note &&
          row.previous_class_note &&
          row.diary_date &&
          isBetweenInclusive(
            toDateDot(row.diary_date),
            toDateDot(row.class_note),
            toDateDot(row.previous_class_note)
          )
            ? toDotDate(row.diary_date)
            : "N/A";

        /* ─── Persist snapshot for admin dashboard ───────────── */
        if (row.class_note) {
          await saveTeacherStatus(
            row.name,
            row.class_note,
            row.quizlet_date || "N/A",
            diary_in_window,
            row.phoneNumber
          ).catch((e: any) =>
            console.warn("saveTeacherStatus failed:", row.name, e)
          );
        }

        return row;
      })
    );

    return NextResponse.json(teacherChecklist);
  } catch (error) {
    console.error("Error fetching teacher status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
