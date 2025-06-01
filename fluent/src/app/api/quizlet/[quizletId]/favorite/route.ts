import { NextResponse } from "next/server";
import { updateFavoriteFlags } from "@/lib/data";

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const quizlet_id = decodeURIComponent(url.pathname.split('/').slice(-2)[0] ?? '');

    if (!quizlet_id) {
      return NextResponse.json({ error: "Quizlet ID not provided" }, { status: 400 });
    }

    const body = await request.json();
    const { favorite_flags } = body;

    if (!Array.isArray(favorite_flags)) {
      return NextResponse.json({ error: "favorite_flags must be an array" }, { status: 400 });
    }

    const updated = await updateFavoriteFlags(quizlet_id, favorite_flags);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update favorite flags" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Favorite flags updated successfully",
      updated,
    });
  } catch (error) {
    console.error("Error updating favorite flags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
