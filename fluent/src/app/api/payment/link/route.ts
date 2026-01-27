import { NextResponse } from 'next/server';
import { saveInitialPayment, getStudentByName } from '@/lib/data';

const tossSecretKey = process.env.TOSS_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { studentName, amount, yyyymm, credits } = await request.json();

    if (!studentName || !amount) {
      return NextResponse.json({ message: 'Student name and amount are required' }, { status: 400 });
    }

    const orderId = new Date().getTime().toString();
    const orderName = `${studentName} - Tuition`;

    // Save initial payment to students collection (existing flow)
    try {
      await saveInitialPayment(studentName, orderId, amount, yyyymm, credits);
      console.log(`[Payment Link] Initial payment saved for ${studentName}, orderId: ${orderId}, credits: ${credits || 0}`);
    } catch (err) {
      console.error('[Payment Link] Failed to save initial payment:', err);
      // Continue - payment link creation should still work
    }

    // NEW: Create payment document in payments collection (non-blocking)
    try {
      let finalStudentId;
      try {
        const student = await getStudentByName(studentName);
        if (student && student.phoneNumber) {
          finalStudentId = student.phoneNumber;
        }
      } catch {
        // Continue without student_id - it's optional
      }

      const { createPayment } = await import('@/lib/payments');
      await createPayment({
        orderId,
        student_name: studentName,
        student_id: finalStudentId,
        amount,
        yyyymm,
        description: `${studentName}'s tuition payment via payment link`,
        orderName,
        metadata: {
          source: 'payment-link',
          credits: credits || 0, // Store credits in metadata
        },
      });
    } catch (err) {
      // Log but don't fail - payment link creation should continue
      console.error('[Payment Link] Failed to create payment document (non-critical):', err);
    }

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