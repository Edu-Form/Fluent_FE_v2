import { NextRequest, NextResponse } from "next/server";
import { saveScheduleData, deleteScheduleDataBulk, updateScheduleDataBulk } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const saved = await saveScheduleData(payload);
    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    console.error("Error saving schedules:", error);
    const msg = error?.message || "Internal Server Error";
    const code =
      msg?.toLowerCase().includes("required") || msg?.toLowerCase().includes("invalid")
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

// --- BULK DELETE ---
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await deleteScheduleDataBulk(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting schedules:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateScheduleDataBulk(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error updating schedules:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}