"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function PaymentLinkPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  // Support both old format (link parameter) and new format (studentName + amount)
  const paymentLink = searchParams.get("link");
  const studentName = searchParams.get("studentName");
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const generateAndRedirect = async () => {
      // Old format: direct link provided
      if (paymentLink) {
        const decodedLink = decodeURIComponent(paymentLink);
        window.location.href = decodedLink;
        return;
      }

      // New format: generate payment link on-demand
      if (studentName && amount) {
        try {
          const res = await fetch("/api/payment/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentName,
              amount: parseInt(amount, 10),
              orderId: orderId || undefined,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "결제 링크 생성에 실패했습니다.");
          }

          const data = await res.json();
          if (data.paymentLink) {
            // Redirect to the freshly generated Toss payment link
            window.location.href = data.paymentLink;
          } else {
            throw new Error("결제 링크를 받을 수 없습니다.");
          }
        } catch (err) {
          console.error("Payment link generation error:", err);
          setError((err as Error).message || "결제 링크 생성 중 오류가 발생했습니다.");
          setTimeout(() => {
            router.push("/");
          }, 5000);
        }
      } else {
        // No valid parameters provided
        setError("결제 링크 정보가 제공되지 않았습니다.");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    };

    generateAndRedirect();
  }, [paymentLink, studentName, amount, orderId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">결제 링크 오류</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">잠시 후 메인 페이지로 이동합니다...</p>
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

