// src/app/api/schedules/teacher/[user]/route.ts
import { NextResponse } from "next/server";
import { getTeacherScheduleData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user = url.pathname.split('/').pop(); // Extract the user from the URL

    if (!user) {
      return NextResponse.json({ error: "User not provided" }, { status: 400 });
    }

    const schedules = await getTeacherScheduleData(user); // Pass user to getTeacherScheduleData

    if (!schedules) {
      return NextResponse.json({ error: "Schedules not found" }, { status: 404 });
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching teacher's schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
