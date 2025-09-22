import { NextResponse } from "next/server";
import { saveScheduleData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const saved = await saveScheduleData(payload);
    // return the saved doc (includes _id)
    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    console.error("Error saving data:", error);
    const msg = error?.message || "Internal Server Error";
    const code = msg?.toLowerCase().includes("required") || msg?.toLowerCase().includes("invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
