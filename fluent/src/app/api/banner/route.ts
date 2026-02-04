import { NextRequest, NextResponse } from "next/server";
import {
  getActiveBanner,
  getAllBanners,
  createBanner,
  toggleBannerActive,
  deleteBanner,
} from "@/lib/data";

/* ---------------- GET ----------------
   - no query → student page (active banner)
   - ?admin=true → admin page (all banners)
-------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    if (isAdmin) {
      const data = await getAllBanners();
      return NextResponse.json(data);
    }

    const banner = await getActiveBanner();
    return NextResponse.json(banner);
  } catch (error) {
    console.error("GET /api/banner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------- POST ---------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const banner = await createBanner(body);
    return NextResponse.json(banner);
  } catch (error) {
    console.error("POST /api/banner error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

/* ---------------- PUT ---------------- */

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, active } = body;

    if (!id || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "id and active are required" },
        { status: 400 }
      );
    }

    await toggleBannerActive(id, active);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/banner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------- DELETE ---------------- */

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const result = await deleteBanner(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/banner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
