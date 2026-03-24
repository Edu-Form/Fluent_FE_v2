import { NextRequest, NextResponse } from "next/server";
import {
  createGroupClass,
  getGroupClasses,
} from "@/lib/data";


// ✅ CREATE GROUP CLASS
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { group_name, group_students } = body;

    if (!Array.isArray(group_students) || group_students.length < 2) {
      return NextResponse.json(
        { error: "At least 2 students required" },
        { status: 400 }
      );
    }

    const result = await createGroupClass({
      group_name,
      group_students,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create group class" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("POST group-class error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// ✅ GET GROUP CLASSES
export async function GET() {
  try {
    const groups = await getGroupClasses();

    return NextResponse.json(groups);
  } catch (err) {
    console.error("GET group-class error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}