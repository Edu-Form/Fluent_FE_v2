import { NextResponse } from "next/server";
import {
  getTemplateByName,
  getTemplateById,
  createTemplateByName,
  updateTemplateByName,
  deleteTemplateByName,
  getAllTemplates
} from "@/lib/data";

/* ---------------- GET ---------------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const id = url.searchParams.get("id");
    const template_name = url.searchParams.get("template_name");

    // ✅ GET SINGLE template by ID (HIGHEST PRIORITY)
    if (id) {
      const template = await getTemplateById(id);

      if (!template) {
        return NextResponse.json(
          { message: "Template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(template);
    }

    // ✅ GET SINGLE template by NAME (legacy / fallback)
    if (template_name) {
      const template = await getTemplateByName(template_name);

      if (!template) {
        return NextResponse.json(
          { message: "Template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(template);
    }

    // ✅ LIST ALL templates
    const templates = await getAllTemplates();
    return NextResponse.json(templates);

  } catch (error) {
    console.error("GET /api/classnote/template error:", error);
    return NextResponse.json([], { status: 200 }); // NEVER crash frontend
  }
}



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template_name, html, level } = body;

    if (!template_name) {
      return NextResponse.json(
        { message: "Missing template_name" },
        { status: 400 }
      );
    }

    const result = await createTemplateByName(
      template_name,
      html ?? "",
      level ?? "beginner" // ✅ DEFAULT SAFETY
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/classnote/template error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}



export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const template_name = url.searchParams.get("template_name");

    if (!template_name) {
      return NextResponse.json(
        { message: "Missing template_name" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { html, level } = body;

    if (html === undefined && level === undefined) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 }
      );
    }

    const result = await updateTemplateByName(
      template_name,
      html,
      level
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/classnote/template error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}



/* ---------------- DELETE ---------------- */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const template_name = url.searchParams.get("template_name");

    if (!template_name) {
      return NextResponse.json(
        { message: "Missing template_name" },
        { status: 400 }
      );
    }

    const result = await deleteTemplateByName(template_name);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/classnote/template error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
