import { NextRequest, NextResponse } from "next/server";
import { deleteSchedulesByHolidayDatesForTeacher } from "@/lib/data";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { dates, teacher_name } = body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: "dates array required" },
        { status: 400 }
      );
    }

    if (!teacher_name) {
      return NextResponse.json(
        { error: "teacher_name required" },
        { status: 400 }
      );
    }

    const result = await deleteSchedulesByHolidayDatesForTeacher(
      dates,
      teacher_name
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Holiday delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}