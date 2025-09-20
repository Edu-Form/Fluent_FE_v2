'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount) {
      fetch(`/api/payment?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`)
        .then(async res => {
          if (res.ok) {
            const payment = await res.json();
            alert(`Payment successful! Order ID: ${payment.orderId}`);
          } else {
            const error = await res.json();
            alert(`Payment verification failed: ${error.message}`);
          }
        })
        .catch(err => {
          console.error(err);
          alert('An error occurred during payment verification.');
        })
        .finally(() => {
          // Redirect to home page
          router.push('/');
        });
    } else {
        // Handle case where params are missing
        alert('Payment success page loaded without required parameters. Redirecting home.');
        router.push('/');
    }
  }, [searchParams, router]);

  return <div><h2>결제 처리중...</h2><p>잠시만 기다려주세요.</p></div>;
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
