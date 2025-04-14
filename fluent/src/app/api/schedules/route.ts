import { NextResponse } from "next/server";
import { saveScheduleData, deleteScheduleData } from "@/lib/data";
import { deductCredit } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const scheduleData = await request.json();
    console.log(scheduleData.student_name)
    
    if (!scheduleData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const credit = await deductCredit(scheduleData.student_name, scheduleData.date);
    const result = await saveScheduleData(scheduleData);

    return NextResponse.json({ message: "Data saved successfully", result, credit }, { status: 200 });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { schedule_id } = await request.json();

    if (!schedule_id) {
      return NextResponse.json({ message: "No schedule ID provided" }, { status: 400 });
    }

    const { status, message } = await deleteScheduleData(schedule_id);

    return NextResponse.json({ message }, { status });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
