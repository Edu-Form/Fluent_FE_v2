import { NextResponse } from "next/server";
import { deleteScheduleData, updateScheduleData } from "@/lib/data";

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
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

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const schedule_id = segments[segments.length - 1];

    if (!schedule_id) {
      return NextResponse.json({ message: "No schedule ID provided" }, { status: 400 });
    }

    const patch = await request.json();
    // Allowed fields (all optional): date, room_name, time, duration, teacher_name, student_name
    const allowed = ["date", "room_name", "time", "duration", "teacher_name", "student_name"] as const;
    const clean: Record<string, any> = {};
    for (const k of allowed) {
      if (patch[k] !== undefined) clean[k] = patch[k];
    }

    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }

    const { status, message, updated } = await updateScheduleData(schedule_id, clean);
    return NextResponse.json({ message, updated }, { status });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
