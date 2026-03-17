'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function FailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'processing' | 'success' | 'retry' | 'error'>('processing');
  const [loading, setLoading] = useState(false);

  // ✅ Extract params ONCE (important)
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const confirmPayment = async () => {
    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/payment/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });

      if (!res.ok) throw new Error();

      setStatus('success');
    } catch {
      setStatus('retry');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: wait for params
  useEffect(() => {
    if (paymentKey && orderId && amount) {
      confirmPayment();
    }
  }, [paymentKey, orderId, amount]);

  // 🔁 Auto retry (important for mobile / Kakao)
  useEffect(() => {
    if (status === 'retry') {
      const timer = setTimeout(() => {
        confirmPayment();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // 🔵 PROCESSING
  if (status === 'processing') {
    return (
      <CenteredCard>
        <Spinner />
        <Title>결제 상태를 확인 중입니다...</Title>
        <Sub>잠시만 기다려주세요</Sub>
      </CenteredCard>
    );
  }

  // 🟢 SUCCESS (override fail)
  if (status === 'success') {
    return (
      <CenteredCard>
        <SuccessIcon />
        <Title>결제 완료</Title>
        <Sub>결제가 정상적으로 처리되었습니다.</Sub>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold"
        >
          확인
        </button>
      </CenteredCard>
    );
  }

  // 🟡 RETRY
  if (status === 'retry') {
    return (
      <CenteredCard>
        <Title>결제 확인 필요</Title>
        <Sub>
          결제가 완료되었을 수 있습니다.<br />
          아래 버튼을 눌러 결제를 확정해주세요.
        </Sub>

        <button
          onClick={confirmPayment}
          disabled={loading}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? '확인 중...' : '토스 결제 후 클릭해주세요'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-3 bg-gray-200 py-3 rounded-lg"
        >
          홈으로 이동
        </button>
      </CenteredCard>
    );
  }

  // 🔴 REAL FAIL
  return (
    <CenteredCard>
      <ErrorIcon />
      <Title>결제 실패</Title>
      <Sub>결제가 완료되지 않았습니다.</Sub>

      <button
        onClick={() => router.push('/')}
        className="w-full mt-6 bg-gray-200 py-3 rounded-lg"
      >
        홈으로 이동
      </button>
    </CenteredCard>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FailContent />
    </Suspense>
  );
}

/* ================= UI Components ================= */

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {children}
      </div>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-gray-900 mt-2">{children}</h2>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 mt-2">{children}</p>;
}

function Spinner() {
  return (
    <div className="flex justify-center mb-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function SuccessIcon() {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-green-100 rounded-full p-3">
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-red-100 rounded-full p-3">
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}