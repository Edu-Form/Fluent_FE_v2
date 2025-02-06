import { NextResponse } from "next/server";
import { getRoomData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const date = segments[segments.length - 2];
    const time = segments[segments.length - 1];

    if (!date || !time) {
      return NextResponse.json({ error: "Missing date or time parameter" }, { status: 400 });
    }

    const availableRooms = await getRoomData(date, time);

    return NextResponse.json(availableRooms);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
