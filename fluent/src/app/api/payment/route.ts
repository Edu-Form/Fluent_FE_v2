import { NextRequest, NextResponse } from "next/server";
import { getBillingCheck2, saveInitialPayment, updatePaymentStatus, getStudentByOrderId, savePaymentConfirmStatus } from "@/lib/data";
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles the initiation of a payment.
 * This endpoint is called by the frontend when the user clicks "Pay".
 * It prepares the transaction by creating a unique order ID, saving the initial
 * state to the database, and returning the necessary details for the frontend SDK.
 */
export async function POST(req: NextRequest) {
  try {
    const { student_name, amount, yyyymm } = await req.json();

    if (!student_name || !amount) {
      return NextResponse.json({ message: 'Missing student_name or amount' }, { status: 400 });
    }

    // If yyyymm is provided, verify billing data exists (optional check)
    if (yyyymm) {
      try {
        const billingData = await getBillingCheck2({ student_name, yyyymm });
        if (!billingData) {
          console.warn(`Billing data not found for ${student_name} (${yyyymm}), but proceeding with payment`);
        }
      } catch (err) {
        console.warn("Error checking billing data:", err);
        // Continue with payment even if check fails
      }
    }

    // Generate a unique order ID for this transaction.
    const orderId = uuidv4();
    // Save the initial pending state of the transaction to the database.
    await saveInitialPayment(student_name, orderId, amount, yyyymm);

    const orderName = `${student_name}'s English class fee`;
    
    // The successUrl should not contain query parameters; Toss Payments will add them.
    const successUrl = `${process.env.NEXT_PUBLIC_URL}/payment/success`;
    const failUrl = `${process.env.NEXT_PUBLIC_URL}/payment/fail`;

    // Return the payment details to the frontend.
    // The frontend will use these to call the Toss Payments SDK.
    return NextResponse.json({
      amount,
      orderId,
      orderName,
      customerName: student_name,
      successUrl,
      failUrl,
    });
  } catch (error) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handles the verification of a payment after the user is redirected from Toss Payments.
 * This endpoint is called by the success page. It makes a secure server-to-server
 * request to the Toss Payments API to confirm the payment is valid and then updates
 * the payment status in the database.
 */
export async function GET(req: NextRequest) {
  try {
    // Extract payment details appended to the success URL by Toss Payments.
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    if (!orderId || !paymentKey || !amount) {
      return NextResponse.json({ message: 'Missing required query parameters' }, { status: 400 });
    }

    const secretKey = process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      console.error('TOSS_SECRET_KEY is not configured');
      return NextResponse.json({ 
        message: '결제 서버 설정 오류: TOSS_SECRET_KEY가 설정되지 않았습니다. 관리자에게 문의해주세요.' 
      }, { status: 500 });
    }

    // Make a request to the Toss Payments API to confirm and finalize the payment.
    // This must be done from the backend to protect the secret key.
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, amount, paymentKey }),
    });

    const payment = await response.json();

    if (!response.ok) {
      console.error('Toss Payments API error:', payment);
      // Handle cases where the payment confirmation fails.
      if (response.status === 401 || payment.code === 'UNAUTHORIZED') {
        return NextResponse.json({ 
          message: '결제 인증 오류: Toss Payments API 키가 올바르지 않습니다. 관리자에게 문의해주세요.' 
        }, { status: 500 });
      }
      return NextResponse.json({ 
        message: `Toss Payments Error: ${payment.message || payment.code || '알 수 없는 오류'}` 
      }, { status: response.status });
    }

    // If confirmation is successful, update the payment status in our database.
    await updatePaymentStatus(orderId, payment);

    // Get student info by orderId to retrieve student_name and yyyymm
    const studentInfo = await getStudentByOrderId(orderId);
    
    // Save PaymentConfirm status to billing collection if we have the info
    if (studentInfo?.student_name && studentInfo.yyyymm) {
      try {
        // Save PaymentConfirm status
        await savePaymentConfirmStatus({
          yyyymm: studentInfo.yyyymm,
          student_name: studentInfo.student_name,
          orderId: payment.orderId,
          paymentKey: payment.paymentKey,
          amount: payment.totalAmount,
          savedBy: 'payment-api',
          meta: {
            method: payment.method,
            status: payment.status,
            approvedAt: payment.approvedAt,
          },
        });
        console.log(`PaymentConfirm status saved for ${studentInfo.student_name} (${studentInfo.yyyymm})`);
      } catch (err) {
        console.error("Error saving PaymentConfirm status:", err);
        // Don't fail the whole request if status save fails
      }
    } else {
      console.warn("Could not save PaymentConfirm status: missing student_name or yyyymm", studentInfo);
    }

    // Return the final payment object to the frontend.
    return NextResponse.json(payment);
  } catch (error) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
