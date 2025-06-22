import { NextResponse } from "next/server";
import { getSchedulesByDate } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = decodeURIComponent(url.pathname.split('/').pop() ?? '').trim();

    if (!date) {
      return NextResponse.json({ error: "Date not provided" }, { status: 400 });
    }

    const schedules = await getSchedulesByDate(date);
    return NextResponse.json(schedules ?? []);
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
