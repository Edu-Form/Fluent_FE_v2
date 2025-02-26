// src/app/api/schedules/student/[username]/route.ts
import { NextResponse } from "next/server";
import { getStudentScheduleData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user = decodeURIComponent(url.pathname.split('/').pop() ?? ''); // Extract the user from the URL
    console.log("decodeURI:", user)

    if (!user) {
      return NextResponse.json({ error: "User not provided" }, { status: 400 });
    }

    const schedules = await getStudentScheduleData(user); // Pass user to getTeacherScheduleData
    console.log(schedules)
    if (!schedules) {
      return NextResponse.json({ error: "Schedules not found" }, { status: 404 });
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching student's schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
