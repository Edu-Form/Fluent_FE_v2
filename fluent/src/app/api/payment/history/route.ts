import { NextRequest, NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getPaymentsByStudent } from "@/lib/payments";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get("studentName");

    if (!studentName) {
      return NextResponse.json({ error: "Student name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("school_management");

    // Get student info with payment history
    const student = await db.collection("students").findOne(
      { name: studentName },
      { projection: { paymentHistory: 1, credits: 1, orderId: 1, paymentId: 1, paymentStatus: 1 } }
    );

    // NEW: Get payments from payments collection (most comprehensive source)
    // This is non-blocking - if it fails, we fall back to existing collections
    let paymentsCollectionData: any[] = [];
    try {
      const paymentsDocs = await getPaymentsByStudent(studentName, {
        limit: 1000, // Get all payments
        status: undefined, // Get all statuses
      });
      
      // Convert PaymentDocument to the format expected by the frontend
      paymentsCollectionData = paymentsDocs.map((doc) => ({
        orderId: doc.orderId,
        paymentKey: doc.paymentKey || "",
        amount: doc.amount,
        method: doc.tossData?.method || doc.method || "카드",
        status: doc.status === 'COMPLETED' ? 'DONE' : doc.status,
        approvedAt: doc.tossData?.approvedAt || doc.completedAt?.toISOString(),
        savedAt: doc.updatedAt?.toISOString() || doc.createdAt?.toISOString(),
        yyyymm: doc.yyyymm,
        description: doc.description, // Additional field available from payments collection
        receiptUrl: doc.tossData?.receipt?.url || doc.tossData?.card?.receiptUrl || null, // Toss receipt URL
        receiptKey: doc.tossData?.receipt?.receiptKey || null, // Toss receipt key
      })).sort((a, b) => {
        const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
        const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
      
      console.log(`[Payment History] Found ${paymentsCollectionData.length} payments from payments collection for ${studentName}`);
    } catch (err) {
      console.warn('[Payment History] Could not fetch from payments collection (non-critical):', err);
      // Continue with existing collections - non-blocking
    }

    // Get payment confirmations from billing collection
    // Handle both array and string formats for student_names
    const paymentConfirms = await db.collection("billing").find({
      step: "PaymentConfirm",
      $or: [
        { student_names: studentName }, // String format
        { student_names: { $in: [studentName] } }, // Array contains
        { "student_names": { $type: "array", $elemMatch: { $eq: studentName } } }, // Array element match
      ],
    }).toArray();

    // Also search in meta field if student name is there
    const paymentConfirmsMeta = await db.collection("billing").find({
      step: "PaymentConfirm",
      $or: [
        { "meta.student_name": studentName },
        { "meta.customerName": studentName },
      ],
    }).toArray();

    // Combine both results and remove duplicates
    const allPaymentConfirms = [...paymentConfirms, ...paymentConfirmsMeta];
    const uniquePaymentConfirms = Array.from(
      new Map(allPaymentConfirms.map(item => [item._id.toString(), item])).values()
    );

    // Also check students collection for payment info
    const studentPaymentInfo = await db.collection("students").findOne(
      { name: studentName },
      { projection: { orderId: 1, paymentId: 1, paymentStatus: 1, paymentYyyymm: 1 } }
    );

    // Combine payment data from billing collection
    const studentPayments = uniquePaymentConfirms
      .map((pc) => ({
        orderId: pc.meta?.orderId || "",
        paymentKey: pc.meta?.paymentKey || studentPaymentInfo?.paymentId || "",
        amount: pc.meta?.amount || 0,
        method: pc.meta?.method || "카드",
        status: pc.meta?.status || studentPaymentInfo?.paymentStatus || "UNKNOWN",
        approvedAt: pc.meta?.approvedAt || pc.savedAt,
        savedAt: pc.savedAt,
        yyyymm: pc.yyyymm || studentPaymentInfo?.paymentYyyymm,
      }))
      .filter((p) => p.orderId) // Only include payments with orderId
      .sort((a, b) => {
        const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
        const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

    // If no payments found in billing, try to get from paymentHistory string
    const fallbackPayments: typeof studentPayments = [];
    if (studentPayments.length === 0 && student?.paymentHistory) {
      // Try to parse payment history for any payment info
      const historyMatch = student.paymentHistory.match(/(\d{4}-\d{2}-\d{2}T[^:]+):\s*(.+?)\s+(\d+)/g);
      if (historyMatch) {
        historyMatch.forEach((entry: string) => {
          const match = entry.match(/(\d{4}-\d{2}-\d{2}T[^:]+):\s*(.+?)\s+(\d+)/);
          if (match && !match[2].includes("Credit -1")) {
            fallbackPayments.push({
              orderId: `hist_${Date.now()}_${fallbackPayments.length}`,
              paymentKey: "",
              amount: parseInt(match[3], 10),
              method: match[2] || "카드",
              status: "COMPLETED",
              approvedAt: match[1],
              savedAt: match[1],
              yyyymm: undefined,
            });
          }
        });
      }
    }
    
    // Parse payment history string to extract credit additions
    const creditTransactions: Array<{
      date: string;
      type: "payment" | "deduction";
      amount: number;
      description: string;
      classDetails?: {
        teacher?: string;
        room?: string;
        time?: string;
        date?: string;
        preview?: string;
      };
    }> = [];

    if (student?.paymentHistory) {
      // Parse payment history string format: "date: description amount"
      const historyEntries = student.paymentHistory.trim().split(/\s+(?=\d{4})/);
      historyEntries.forEach((entry: string) => {
        const match = entry.match(/(\d{4}-\d{2}-\d{2}T[^:]+):\s*(.+)/);
        if (match) {
          const [, date, description] = match;
          // Check if it's a credit deduction or payment
          if (description.includes("Credit -1")) {
            creditTransactions.push({
              date,
              type: "deduction",
              amount: -1,
              description: "수업 크레딧 사용",
            });
          } else {
            // Try to extract payment amount
            const amountMatch = description.match(/(\d+)/);
            if (amountMatch) {
              creditTransactions.push({
                date,
                type: "payment",
                amount: parseInt(amountMatch[1], 10),
                description,
              });
            }
          }
        }
      });
    }

    // Get classnotes to find credit deductions with detailed class information
    let classnotes: any[] = [];
    try {
      const classnotesDb = client.db("room_allocation_db");
      classnotes = await classnotesDb.collection("classnotes").find({
        student_name: studentName,
      }).sort({ date: -1, createdAt: -1 }).toArray();
    } catch (err) {
      console.warn('[Payment History] Could not fetch classnotes (non-critical):', err);
      // Continue without classnotes - fallback to schedules
    }

    // Extract credit deductions from classnotes (when class happened)
    classnotes.forEach((note) => {
      if (note.date) {
        const classDate = note.date;
        const teacherName = note.teacher_name || "";
        const roomName = note.room_name || "";
        const time = note.started_at || note.time || "";
        const classDescription = note.original_text ? 
          (note.original_text.substring(0, 50) + (note.original_text.length > 50 ? "..." : "")) : "";
        
        creditTransactions.push({
          date: classDate,
          type: "deduction",
          amount: -1,
          description: `수업 진행`,
          classDetails: {
            teacher: teacherName,
            room: roomName,
            time: time,
            date: classDate,
            preview: classDescription,
          },
        });
      }
    });

    // Also get class schedules as fallback (for older data)
    const schedules = await db.collection("schedules").find({
      student_name: studentName,
    }).sort({ date: -1 }).toArray();

    // Extract credit deductions from schedules (when class was completed) - only if not already in classnotes
    const existingDates = new Set(classnotes.map(n => n.date));
    schedules.forEach((schedule) => {
      if (schedule.date && schedule.completed && !existingDates.has(schedule.date)) {
        creditTransactions.push({
          date: schedule.date,
          type: "deduction",
          amount: -1,
          description: `수업 (${schedule.room_name || ""} ${schedule.time || ""}시)`,
        });
      }
    });

    // Sort all transactions by date (most recent first)
    creditTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Combine payments: prioritize payments collection, then billing, then fallback
    // Create a map to deduplicate by orderId (payments collection takes priority)
    const paymentsMap = new Map<string, any>();
    
    // First add payments from payments collection (highest priority - most comprehensive)
    paymentsCollectionData.forEach(payment => {
      if (payment.orderId) {
        paymentsMap.set(payment.orderId, payment);
      }
    });
    
    // Then add billing collection payments (only if not already in payments collection)
    studentPayments.forEach(payment => {
      if (payment.orderId && !paymentsMap.has(payment.orderId)) {
        paymentsMap.set(payment.orderId, payment);
      }
    });
    
    // Finally add fallback payments from paymentHistory string (only if not already present)
    fallbackPayments.forEach(payment => {
      if (payment.orderId && !paymentsMap.has(payment.orderId)) {
        paymentsMap.set(payment.orderId, payment);
      }
    });
    
    // Convert map to array and sort by date (most recent first)
    const allPayments = Array.from(paymentsMap.values()).sort((a, b) => {
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Debug logging
    console.log(`Payment history for ${studentName}:`, {
      paymentsFound: allPayments.length,
      fromPaymentsCollection: paymentsCollectionData.length,
      fromBillingCollection: studentPayments.length,
      fromFallback: fallbackPayments.length,
      creditTransactionsFound: creditTransactions.length,
      currentCredits: student?.credits || 0,
      hasPaymentHistory: !!student?.paymentHistory,
      billingDocsFound: uniquePaymentConfirms.length,
      studentFound: !!student,
    });

    return NextResponse.json({
      payments: allPayments,
      creditTransactions,
      currentCredits: student?.credits || 0,
      debug: {
        studentFound: !!student,
        billingDocsCount: uniquePaymentConfirms.length,
        paymentsCollectionCount: paymentsCollectionData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
