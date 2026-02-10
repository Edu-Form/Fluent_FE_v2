// app/api/student/[name]/route.ts
import { NextResponse } from "next/server";
import { getStudentByName, updateStudentByName } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Robustly grab the segment after "student" to avoid issues with trailing slashes/basePath
    const parts = pathname.split("/").filter(Boolean);
    const studentIdx = parts.lastIndexOf("student");
    const raw = studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];

    const student_name = decodeURIComponent(raw ?? "");

    if (!student_name) {
      return NextResponse.json(
        { error: "Student name not provided" },
        { status: 400 }
      );
    }

    const student = await getStudentByName(student_name);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const parts = pathname.split("/").filter(Boolean);
    const studentIdx = parts.lastIndexOf("student");
    const raw = studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];
    const student_name = decodeURIComponent(raw ?? "");

    if (!student_name) {
      return NextResponse.json(
        { error: "Student name not provided" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { creditDelta, creditReason, adminName, hourlyRate } = body;

    /* ===============================
       CREDIT ADJUSTMENT (from modal)
       =============================== */
    if (typeof creditDelta === "number") {
      if (!creditReason || !adminName) {
        return NextResponse.json(
          { error: "creditReason and adminName required" },
          { status: 400 }
        );
      }

      const student = await getStudentByName(student_name);
      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      const before = parseInt(student.credits ?? "0", 10);
      const after = before + creditDelta;

      const historyEntry = {
        type: "admin_adjustment",
        delta: creditDelta,
        before,
        after,
        reason: creditReason,
        admin_name: adminName,
        createdAt: new Date(),
      };

      await updateStudentByName(student_name, {
        credits: String(after),
        Credit_Automation_History: [
          ...(student.Credit_Automation_History ?? []),
          historyEntry,
        ],
      });

      return NextResponse.json({ success: true, before, after });
    }

    /* ===============================
       NON-CREDIT UPDATE (hourlyRate)
       =============================== */
    if (hourlyRate !== undefined) {
      const updated = await updateStudentByName(student_name, { hourlyRate });
      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json(
      { error: "No valid fields provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
