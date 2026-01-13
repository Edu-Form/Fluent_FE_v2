import { NextResponse } from 'next/server';
import { saveInitialPayment, getStudentByName } from '@/lib/data';

const tossSecretKey = process.env.TOSS_SECRET_KEY;

/**
 * Generate a fresh Toss payment link on-demand
 * This endpoint is called when a student clicks the wrapper payment link
 * to ensure the payment link is always fresh and not expired
 */
export async function POST(request: Request) {
  try {
    const { studentName, amount, orderId, yyyymm } = await request.json();

    if (!studentName || !amount) {
      return NextResponse.json({ 
        message: 'Student name and amount are required' 
      }, { status: 400 });
    }

    // Use provided orderId or generate a new one
    const finalOrderId = orderId || new Date().getTime().toString();
    const orderName = `${studentName} - Tuition`;
    
    // Save initial payment to students collection (if orderId is new)
    if (!orderId) {
      try {
        await saveInitialPayment(studentName, finalOrderId, amount, yyyymm);
        console.log(`[Payment Generate] Initial payment saved for ${studentName}, orderId: ${finalOrderId}`);
      } catch (err) {
        console.error('[Payment Generate] Failed to save initial payment:', err);
        // Continue - payment link creation should still work
      }
    } else {
      // OrderId was provided - payment might already be initialized, but check if it exists
      try {
        const { getStudentByOrderId } = await import('@/lib/data');
        const existing = await getStudentByOrderId(finalOrderId);
        if (!existing) {
          // OrderId provided but no record exists - create it
          console.log(`[Payment Generate] OrderId provided but no record found, creating initial payment`);
          await saveInitialPayment(studentName, finalOrderId, amount, yyyymm);
        }
      } catch (err) {
        console.warn('[Payment Generate] Could not check existing payment, proceeding:', err);
      }
    }
    
    // NEW: Create payment document in payments collection (ALWAYS, regardless of orderId)
    // This ensures payment is tracked even if orderId was pre-generated
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
        orderId: finalOrderId,
        student_name: studentName,
        student_id: finalStudentId,
        amount,
        yyyymm,
        description: `${studentName}'s tuition payment via payment link`,
        orderName,
        metadata: {
          source: 'payment-link-generate',
        },
      });
    } catch (err) {
      // Log but don't fail - payment link creation should continue
      console.error('[Payment Generate] Failed to create payment document (non-critical):', err);
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
        orderId: finalOrderId,
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
        return NextResponse.json({ 
          message: errorJson.message || 'Failed to create payment link' 
        }, { status: response.status });
      } catch {
        return NextResponse.json({ 
          message: 'Failed to create payment link and received non-JSON error response from Toss.', 
          details: errorBody 
        }, { status: response.status });
      }
    }

    const paymentLinkData = await response.json();

    return NextResponse.json({
      studentName,
      amount,
      paymentLink: paymentLinkData.checkout.url,
      orderId: finalOrderId,
    });
  } catch (error) {
    console.error('Failed to generate payment link:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error' 
    }, { status: 500 });
  }
}

