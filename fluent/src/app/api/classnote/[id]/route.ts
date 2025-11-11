// app/api/classnote/[id]/route.ts
import { NextResponse } from "next/server";
import { updateClassnoteData } from "@/lib/data";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const result = await updateClassnoteData(id, body);
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    );
  } catch (error) {
    console.error("PATCH /api/classnote/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
