// app/api/popup/route.ts
import { NextResponse } from "next/server";
import {
  getAllPopups,
  getActivePopup,
  createPopup,
  updatePopupById,
  deletePopupById,
} from "@/lib/data";

/**
 * GET
 * - ?mode=active  → get active popup (student)
 * - default       → get all popups (admin)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "active") {
      const popup = await getActivePopup();
      return NextResponse.json(popup);
    }

    const popups = await getAllPopups();
    return NextResponse.json(popups);
  } catch (error) {
    console.error("Popup GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Create popup
 * Body: { title?, message, active? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, active } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const popup = await createPopup({ title, message, active });
    if (!popup) {
      return NextResponse.json(
        { error: "Popup creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(popup);
  } catch (error) {
    console.error("Popup POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT
 * Update popup
 * Body: { id, title?, message?, active? }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Popup id is required" },
        { status: 400 }
      );
    }

    const updated = await updatePopupById(id, updateData);
    if (!updated) {
      return NextResponse.json(
        { error: "Popup not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Popup PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * Body: { id }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Popup id is required" },
        { status: 400 }
      );
    }

    const success = await deletePopupById(id);
    if (!success) {
      return NextResponse.json(
        { error: "Popup not found or delete failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Popup DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
