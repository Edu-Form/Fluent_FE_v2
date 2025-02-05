import { NextResponse } from "next/server";
import { getTodayScheduleData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const today = segments[segments.length - 2];
    const user = segments[segments.length - 1];
    console.log(today)
    console.log(user)

    if (!today || !user) {
      return NextResponse.json({ error: "Missing date or user parameter" }, { status: 400 });
    }

    const todaySchedule = await getTodayScheduleData(today, user);
    console.log(todaySchedule)

    return NextResponse.json(todaySchedule);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
