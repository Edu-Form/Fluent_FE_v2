// app/api/operation-task/route.ts

import { NextResponse } from "next/server";
import { createOperationTask, getOperationTasks } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      date,
      time,
      duration,
      operation_teacher,
      notes,
    } = body;

    // 🔴 strict validation (don’t be loose here)
    if (!date || time === undefined || !operation_teacher) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const id = await createOperationTask({
      date,
      time,
      duration,
      operation_teacher,
      notes,
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Operation Task POST error:", err);

    return NextResponse.json(
      { error: "Failed to create operation task" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tasks = await getOperationTasks();
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("Operation Task GET error:", err);

    return NextResponse.json(
      { error: "Failed to fetch operation tasks" },
      { status: 500 }
    );
  }
}