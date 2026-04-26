// app/api/student/[name]/route.ts
import { NextResponse } from "next/server";
import { getStudentByName, updateStudentByName, deleteStudentByName } from "@/lib/data";

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
    const raw =
      studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];
    const student_name = decodeURIComponent(raw ?? "");

    if (!student_name) {
      return NextResponse.json(
        { error: "Student name not provided" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      creditDelta,
      creditReason,
      creditAmount,
      adminName,
      group_class,
      "1account2students": oneAccountTwoStudents,
    } = body;

    /* ===============================
       CREDIT ADJUSTMENT
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
        type: creditReason,
        delta: creditDelta,
        before,
        after,
        amount: creditAmount ?? 0,
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
       SPECIAL FLAGS (특이사항)
       =============================== */
    if (
      group_class !== undefined ||
      oneAccountTwoStudents !== undefined
    ) {
      const updateObj: any = {};

      if (group_class !== undefined) {
        updateObj.group_class = group_class;
      }

      if (oneAccountTwoStudents !== undefined) {
        updateObj["1account2students"] = oneAccountTwoStudents;
      }

      const updated = await updateStudentByName(
        student_name,
        updateObj
      );

      return NextResponse.json({ success: true, updated });
    }

    const allowedFields = [
      "teacher",
      "notes",
      "phoneNumber",
      "link",
      "paid",
      "hourlyRate",
    ];

    const updateObj: any = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateObj[key] = body[key];
      }
    }

    // 🔥 auto-sync status with paid
    if (body.paid !== undefined) {
      updateObj.status = body.paid
        ? "결제완료"
        : "상담중";
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    const updated = await updateStudentByName(student_name, updateObj);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const parts = pathname.split("/").filter(Boolean);
    const studentIdx = parts.lastIndexOf("student");
    const raw =
      studentIdx >= 0 ? parts[studentIdx + 1] : parts[parts.length - 1];

    const student_name = decodeURIComponent(raw ?? "");

    if (!student_name) {
      return NextResponse.json(
        { error: "Student name not provided" },
        { status: 400 }
      );
    }

    const success = await deleteStudentByName(student_name);

    if (!success) {
      return NextResponse.json(
        { error: "Student not found or delete failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

