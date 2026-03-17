import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus as updateStudentPayment } from "@/lib/data";
import { updatePaymentStatus as updatePaymentDoc, getPaymentByOrderId } from "@/lib/payments";

const tossSecretKey = process.env.TOSS_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // 🔥 0. CHECK EXISTING PAYMENT (CRITICAL)
    const existingPayment = await getPaymentByOrderId(orderId);

    if (existingPayment?.status === "COMPLETED") {
      // ✅ ALREADY PROCESSED → DO NOTHING
      return NextResponse.json({
        orderId,
        totalAmount: existingPayment.amount,
        method: existingPayment.tossData?.method,
        message: "Already confirmed",
      });
    }

    // 🔥 1. Confirm with Toss
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error("Toss confirm failed:", tossData);
      return NextResponse.json({ message: "Confirm failed" }, { status: 400 });
    }

    if (tossData.status !== "DONE") {
      return NextResponse.json({ message: "Payment not completed" }, { status: 400 });
    }

    // 🔥 2. UPDATE payments collection
    await updatePaymentDoc(orderId, {
      status: "COMPLETED",
      paymentKey,
      tossData,
      source: "api", // ✅ FIXED TYPE
      notes: "Confirmed via frontend",
    });

    // 🔥 3. UPDATE student credits (ONLY ONCE)
    await updateStudentPayment(orderId, {
      paymentKey,
      status: "DONE",
      totalAmount: amount,
      method: tossData.method,
    });

    return NextResponse.json({
      orderId,
      totalAmount: tossData.totalAmount,
      method: tossData.method,
    });

  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}