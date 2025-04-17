import {deleteScheduleData } from "@/lib/data";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
    try {
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const schedule_id = segments[segments.length - 1]; 
  
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
  