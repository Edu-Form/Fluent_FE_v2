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

    console.log(`Webhook: Payment ${status} for order ${orderId}`);

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional: Verify webhook signature
function verifySignature(body: any, signature: string | null): boolean {
  // Implement signature verification using Toss Payments secret key
  // This is recommended for production security
  return true; // Placeholder - implement proper verification
}
