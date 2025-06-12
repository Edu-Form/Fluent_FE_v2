import { NextResponse } from "next/server";
import { markQuizletAsDeleted } from "@/lib/data";

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const quizlet_id = decodeURIComponent(url.pathname.split("/").slice(-2)[0] ?? "");
    console.log(quizlet_id)

    if (!quizlet_id) {
      return NextResponse.json({ error: "Quizlet ID not provided" }, { status: 400 });
    }

    const result = await markQuizletAsDeleted(quizlet_id);

    if (!result) {
      return NextResponse.json({ error: "Failed to mark quizlet as deleted" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Quizlet marked as deleted",
      deleted: result,
    });
  } catch (error) {
    console.error("Error deleting quizlet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
