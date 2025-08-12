import { NextResponse } from "next/server";
import { getTeacherStatus, getStudentDiaryData, getStudentQuizletData, getStudentScheduleData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    console.log(url.pathname);
    const teachername = url.pathname.split("/").pop(); // Extract the teacher name from the URL

    if (!teachername) {
      return NextResponse.json({ error: "Teacher name not provided" }, { status: 400 });
    }

    const teacherStatus = await getTeacherStatus(teachername);
    console.log(teacherStatus)

    if (!teacherStatus) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacherChecklist = await Promise.all(
        teacherStatus.map(async (student) => {
          const diaryEntries = await getStudentDiaryData(student.name) ?? [{ class_date: '', date: '' }]; // Default to empty object
          const quizletEntries = await getStudentQuizletData(student.name) ?? [{ class_date: '', date: '' }]; // Default to empty object
          const scheduleEntries = await getStudentScheduleData(student.name) ?? []; // Default to empty object
          return {
            name: student.name,
            phoneNumber: student.phoneNumber,
            class_note_dates: quizletEntries.map(e => e.class_date),
            quizlet_dates: quizletEntries.map(e => e.date),
            diary_class_dates: diaryEntries.map(e => e.date),
            diary_edit_dates: diaryEntries.map(e => e.date),
            schedule_dates: scheduleEntries.map(e => e.date),
          };
        })
      );

    return NextResponse.json(teacherChecklist);
  } catch (error) {
    console.error("Error fetching teacher status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}