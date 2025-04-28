import { NextResponse } from "next/server";
import { saveScheduleData} from "@/lib/data";
import { deductCredit } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const scheduleData = await request.json();
    console.log(scheduleData.student_name)
    
    if (!scheduleData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // const credit = await deductCredit(scheduleData.student_name, scheduleData.date);
    const result = await saveScheduleData(scheduleData);

    return NextResponse.json({ message: "Data saved successfully", result}, { status: 200 });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

