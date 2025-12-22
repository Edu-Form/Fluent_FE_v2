"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function PaymentLinkPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentLink = searchParams.get("link");

  useEffect(() => {
    if (paymentLink) {
      // Decode the payment link if it's encoded
      const decodedLink = decodeURIComponent(paymentLink);
      // Redirect to the Toss payment page
      window.location.href = decodedLink;
    } else {
      // If no link provided, show error
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }
  }, [paymentLink, router]);

  if (!paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">결제 링크 오류</h1>
          <p className="text-gray-600">결제 링크가 제공되지 않았습니다.</p>
          <p className="text-sm text-gray-500 mt-2">3초 후 메인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">결제 페이지로 이동 중...</h1>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default function PaymentLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <PaymentLinkPageInner />
    </Suspense>
  );
}

