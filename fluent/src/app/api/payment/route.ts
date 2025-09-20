import { NextRequest, NextResponse } from "next/server";
import { getBillingDataByStudent, saveInitialPayment, updatePaymentStatus } from "@/lib/data";
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles the initiation of a payment.
 * This endpoint is called by the frontend when the user clicks "Pay".
 * It prepares the transaction by creating a unique order ID, saving the initial
 * state to the database, and returning the necessary details for the frontend SDK.
 */
export async function POST(req: NextRequest) {
  try {
    const { student_name, amount } = await req.json();

    if (!student_name || !amount) {
      return NextResponse.json({ message: 'Missing student_name or amount' }, { status: 400 });
    }

    // Before proceeding, check if the student has a valid billing profile.
    const billingData = await getBillingDataByStudent(student_name);

    if (!billingData) {
      return NextResponse.json({ message: 'Billing data not found' }, { status: 404 });
    }

    // Generate a unique order ID for this transaction.
    const orderId = uuidv4();
    // Save the initial pending state of the transaction to the database.
    await saveInitialPayment(student_name, orderId, amount);

    const orderName = `${student_name}'s English class fee`;
    
    // The successUrl should not contain query parameters; Toss Payments will add them.
    const successUrl = `${process.env.NEXT_PUBLIC_URL}/student/billing/success`;
    const failUrl = `${process.env.NEXT_PUBLIC_URL}/student/billing/fail`;

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
      // Handle cases where the payment confirmation fails.
      return NextResponse.json({ message: `Toss Payments Error: ${payment.message}` }, { status: response.status });
    }

    // If confirmation is successful, update the payment status in our database.
    await updatePaymentStatus(orderId, payment);

    // Return the final payment object to the frontend.
    return NextResponse.json(payment);
  } catch (error) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
