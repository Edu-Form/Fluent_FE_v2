import { NextResponse } from "next/server";
import { saveScheduleData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const scheduleData = await request.json();
    console.log(scheduleData)
    
    if (!scheduleData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const result = await saveScheduleData(scheduleData);

    return NextResponse.json({ message: "Data saved successfully", result }, { status: 200 });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}