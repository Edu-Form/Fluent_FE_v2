/**
 * Test endpoint to verify payments collection integration
 * GET /api/payment/test-integration
 * This will test if createPayment works without making an actual payment
 */

import { NextResponse } from 'next/server';
import { createPayment } from '@/lib/payments';

export async function GET() {
  try {
    const testOrderId = `test_${Date.now()}`;
    const testStudentName = 'TEST_INTEGRATION';
    
    console.log(`[Test Integration] Testing payment creation with orderId: ${testOrderId}`);
    
    try {
      const result = await createPayment({
        orderId: testOrderId,
        student_name: testStudentName,
        amount: 1000,
        description: 'Integration test payment',
        orderName: 'Test Payment',
        metadata: {
          source: 'test-integration',
        },
      });
      
      console.log(`[Test Integration] ✅ SUCCESS! Payment document created:`, {
        orderId: result.orderId,
        student: result.student_name,
        status: result.status,
        _id: result._id,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Payment integration test PASSED',
        payment: {
          orderId: result.orderId,
          student_name: result.student_name,
          status: result.status,
          amount: result.amount,
        },
        instructions: 'Check MongoDB payments collection for this test payment',
      });
    } catch (err) {
      console.error(`[Test Integration] ❌ FAILED! Error creating payment:`, err);
      return NextResponse.json({
        success: false,
        message: 'Payment integration test FAILED',
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test Integration] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
