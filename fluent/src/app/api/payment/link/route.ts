import { NextResponse } from 'next/server';

const tossSecretKey = process.env.TOSS_SECRET_KEY;

export async function POST(request: Request) {
  console.log("Toss Secret Key:", process.env.TOSS_SECRET_KEY ? "Loaded" : "Missing");
  console.log("NEXT_PUBLIC_URL:", process.env.NEXT_PUBLIC_URL || "Missing");
  try {
    const { studentName, amount } = await request.json();

    if (!studentName || !amount) {
      return NextResponse.json({ message: 'Student name and amount are required' }, { status: 400 });
    }

    const orderId = new Date().getTime().toString();
    const orderName = `${studentName} - Tuition`;

    const response = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${tossSecretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'CARD',
        amount,
        orderId,
        orderName,
        successUrl: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failUrl: `${process.env.NEXT_PUBLIC_URL}/payment/fail`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Failed to create payment link from Toss. Status:", response.status, "Body:", errorBody);
      try {
        const errorJson = JSON.parse(errorBody);
        return NextResponse.json({ message: errorJson.message || 'Failed to create payment link' }, { status: response.status });
      } catch {
        return NextResponse.json({ message: 'Failed to create payment link and received non-JSON error response from Toss.', details: errorBody }, { status: response.status });
      }
    }

    const paymentLinkData = await response.json();

    return NextResponse.json({
      studentName,
      amount,
      paymentLink: paymentLinkData.checkout.url,
    });
  } catch (error) {
    console.error('Failed to create payment link:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}