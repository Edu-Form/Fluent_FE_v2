import { NextResponse } from "next/server";
import {
  getTeacherStatus,
  getStudentDiaryData,
  getStudentQuizletData,
  getStudentScheduleData,
} from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const teachername = url.pathname.split("/").pop();

    if (!teachername) {
      return NextResponse.json({ error: "Teacher name not provided" }, { status: 400 });
    }

    const teacherStatus = await getTeacherStatus(teachername);

    if (!teacherStatus) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacherChecklist = await Promise.all(
      teacherStatus.map(async (student) => {
        const recent_diary = (await getStudentDiaryData(student.name)) ?? [];
        const recent_quizlet = (await getStudentQuizletData(student.name)) ?? [];
        const schedule_list = (await getStudentScheduleData(student.name)) ?? [];

        const q0 = recent_quizlet[0] ?? { class_date: "", date: "" };
        const q1 = recent_quizlet[1] ?? { class_date: "", date: "" };
        const d0 = recent_diary[0] ?? { class_date: "", date: "" };

        // ✅ just match the strings directly
        let scheduleDate = "";
        if (q0.class_date) {
          const found = schedule_list.find(
            (s) => s.date === q0.class_date
          );
          scheduleDate = found ? found.date : "";
        }

        return {
          name: student.name,
          phoneNumber: student.phoneNumber,
          class_note: q0.class_date || "",
          previous_class_note: q1.class_date || "",
          quizlet_date: q0.date || "",
          diary_date: d0.class_date || "",
          diary_edit: d0.date || "",
          schedule_date: scheduleDate, // blank if no matching schedule
        };
      })
    );

    return NextResponse.json(teacherChecklist);
  } catch (error) {
    console.error("Error fetching teacher status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
