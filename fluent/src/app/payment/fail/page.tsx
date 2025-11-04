'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function FailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        const message = searchParams.get('message') || searchParams.get('messageKey') || '결제가 취소되었습니다';
        const code = searchParams.get('code') || searchParams.get('errorCode');

        const handleFailure = async () => {
            try {
                // If we have orderId, update payment status to FAILED
                if (orderId) {
                    // Optionally call an API to update payment status as FAILED
                    // For now, the orderId remains as PENDING in the database
                    console.log(`Payment failed for order: ${orderId}`);
                }
            } catch (err) {
                console.error('Error handling payment failure:', err);
            } finally {
                setProcessing(false);
            }
        };

        handleFailure();
    }, [searchParams, router]);

    if (processing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">결제 실패 처리 중...</h2>
                    <p className="text-gray-600">잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }

    const message = searchParams.get('message') || searchParams.get('messageKey') || '결제가 취소되었습니다';
    const code = searchParams.get('code') || searchParams.get('errorCode');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h2>
                    <p className="text-gray-600 mb-4">{message}</p>
                    {code && (
                        <p className="text-sm text-gray-500 mb-6">에러 코드: {code}</p>
                    )}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/teacher/payment?student_name=' + encodeURIComponent(searchParams.get('customerName') || ''))}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                        >
                            다시 결제하기
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <FailContent />
        </Suspense>
    )
}
