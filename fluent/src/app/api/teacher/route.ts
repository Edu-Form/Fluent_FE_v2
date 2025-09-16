// app/api/teachers/route.ts
import { NextResponse } from "next/server";
import { addTeacher, getTeachers } from "@/lib/data";

export const dynamic = "force-dynamic";

/** GET /api/teachers */
export async function GET() {
  try {
    const teachers = await getTeachers();
    return NextResponse.json(teachers, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message ?? "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

/** POST /api/teachers
 * Body: { name: string, phoneNumber?: string, experience?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.name || !String(body.name).trim()) {
      return NextResponse.json({ message: "name is required" }, { status: 400 });
    }

    const created = await addTeacher({
      name: String(body.name).trim(),
      phoneNumber: String(body.phoneNumber || "").trim(),
      experience: String(body.experience || "").trim(),
      createdAt: new Date(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ message: "duplicate teacher" }, { status: 409 });
    }
    return NextResponse.json(
      { message: err?.message ?? "Failed to create teacher" },
      { status: 500 }
    );
  }
}
