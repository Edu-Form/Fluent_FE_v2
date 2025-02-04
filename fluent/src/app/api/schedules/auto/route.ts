import { NextResponse } from "next/server";
import { saveManyScheduleData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const scheduleManyData = await request.json();
    console.log(scheduleManyData)
    
    if (!scheduleManyData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const result = await saveManyScheduleData(scheduleManyData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}