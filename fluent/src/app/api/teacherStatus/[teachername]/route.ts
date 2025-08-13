import { NextResponse } from "next/server";
import { getTeacherStatus, getStudentDiaryData, getStudentQuizletData } from "@/lib/data";

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
          const recent_diary = await getStudentDiaryData(student.name) ?? [{ class_date: '', date: '' }]; // Default to empty object
          const recent_quizlet = await getStudentQuizletData(student.name) ?? [{ class_date: '', date: '' }]; // Default to empty object
          return {
            name: student.name,
            phoneNumber: student.phoneNumber,
            class_note: recent_quizlet[0].class_date ?? '',
            quizlet_date: recent_quizlet[0].date ?? '',
            diary_date: recent_diary[0].class_date ?? '',
            diary_edit: recent_diary[0].date ?? ''
          };
        })
      );

    return NextResponse.json(teacherChecklist);
  } catch (error) {
    console.error("Error fetching teacher status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}