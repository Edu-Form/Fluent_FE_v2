//api/classnote/admin-search/route.ts
import { NextResponse } from "next/server";
import {
  getClassnotesByAdminQuery,
  updateClassnoteById,
} from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const student_name = url.searchParams.get("student_name")?.trim() || "";
    const teacher_name = url.searchParams.get("teacher_name")?.trim() || "";
    const date = url.searchParams.get("date")?.trim() || "";
    const class_date = url.searchParams.get("class_date")?.trim() || "";

    const data = await getClassnotesByAdminQuery({
      student_name,
      teacher_name,
      date,
      class_date,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/classnotes] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch classnotes" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const { _id, updates } = body || {};

    if (!_id) {
      return NextResponse.json(
        { error: "_id is required" },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    const updated = await updateClassnoteById(_id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Classnote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Classnote updated",
        data: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH /api/admin/classnotes] error:", err);
    return NextResponse.json(
      { error: "Failed to update classnote" },
      { status: 500 }
    );
  }
}