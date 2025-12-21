import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify webhook signature (recommended for security)
    // const signature = req.headers.get('toss-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    // }

    const { orderId, paymentKey, status, method, totalAmount } = body;

    if (!orderId || !paymentKey) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Update payment status in database
    await updatePaymentStatus(orderId, {
      paymentKey,
      status,
      method,
      totalAmount
    });

    // NEW: Update payment document in payments collection (non-blocking)
    // This is SAFE: wrapped in try-catch, won't affect existing webhook flow
    try {
      const { updatePaymentStatus: updatePaymentDoc } = await import('@/lib/payments');
      const paymentStatus = status === 'DONE' ? 'COMPLETED' : status === 'CANCELED' ? 'CANCELLED' : 'FAILED';
      const updateResult = await updatePaymentDoc(orderId, {
        status: paymentStatus,
        paymentKey,
        tossData: {
          orderId,
          paymentKey,
          method,
          status,
          totalAmount,
        },
        source: 'webhook',
        notes: 'Payment status updated via webhook',
      });
      if (updateResult) {
        console.log(`[Webhook] Payment document updated successfully for orderId: ${orderId}`);
      } else {
        console.warn(`[Webhook] Payment document not found for orderId: ${orderId} (may not have been created initially)`);
      }
    } catch (err) {
      // Log but don't fail the request - payments collection is additional storage
      // Existing webhook flow continues normally even if this fails
      console.error('[Webhook] Failed to update payment document (non-critical):', err);
      // Don't throw - existing webhook processing already succeeded above
    }

    console.log(`Webhook: Payment ${status} for order ${orderId}`);

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// // Optional: Verify webhook signature
// function verifySignature(body: any, signature: string | null): boolean {
//   // Implement signature verification using Toss Payments secret key
//   // This is recommended for production security
//   return true; // Placeholder - implement proper verification
// }
