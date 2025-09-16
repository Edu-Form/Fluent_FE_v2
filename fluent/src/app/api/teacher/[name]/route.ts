// app/api/teachers/[name]/route.ts
import { NextResponse } from "next/server";
import { removeTeacher } from "@/lib/data";

export const dynamic = "force-dynamic";

/** DELETE /api/teachers/[name] */
export async function DELETE(request: Request) {
  // Extract [name] from the URL path
  const { pathname } = new URL(request.url);
  const parts = pathname.split("/").filter(Boolean);
  const teachersIdx = parts.lastIndexOf("teachers");
  const raw = teachersIdx >= 0 ? parts[teachersIdx + 1] : parts[parts.length - 1];
  const name = decodeURIComponent(raw ?? "").trim();

  if (!name) {
    return NextResponse.json({ message: "name is required" }, { status: 400 });
  }

  try {
    const { deletedCount } = await removeTeacher(name);
    if (!deletedCount) {
      return NextResponse.json({ message: "teacher not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, name }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message ?? "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
