"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function PaymentPageInner() {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");

  // 🔒 Only allow David
  if (user !== "David") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">접근 권한 없음</h1>
          <p className="text-gray-600 mt-2">
            이 페이지는 현재 이용하실 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);

  async function handlePay(amount: number, label: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user,
          amount,
          label,
        }),
      });

      const data = await res.json();

      if (!data?.paymentLink) {
        alert("결제 링크 생성 실패");
        setLoading(false);
        return;
      }

      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      alert("결제 요청 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-6 py-8 flex justify-center">
      <div className="w-full max-w-lg">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Fluent Learning Programs
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Good things take time.
            <br />
            미리 공부 계획을 세우고 할인 혜택을 받아보세요.
          </p>
        </div>

        {/* PROGRAM PLANS */}
        <div className="space-y-6">
          {/* 3개월 플랜 - Most Popular */}
          <div className="relative bg-white rounded-2xl shadow-lg border border-blue-200 p-6 transition transform hover:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
              Most Popular
            </div>

            <h2 className="text-xl font-bold text-gray-900">3개월 플랜</h2>
            <p className="text-sm text-gray-600 mt-1">24회 + 무료 추가수업 2회</p>

            <p className="mt-4 text-2xl font-extrabold text-blue-600">
              1,440,000원
            </p>

            <button
              onClick={() => handlePay(1440000, "3개월 플랜")}
              className="w-full mt-5 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "결제 페이지 이동..." : "구매하기"}
            </button>
          </div>

          {/* 1개월 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 transition transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-gray-900">
              1개월 플랜 (8회)
            </h2>
            <p className="text-sm text-gray-600 mt-1">기본 단기 플랜</p>
            <p className="mt-4 text-2xl font-bold text-gray-900">480,000원</p>

            <button
              onClick={() => handlePay(480000, "1개월 플랜")}
              className="w-full mt-5 bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm shadow hover:bg-gray-900 transition disabled:opacity-50"
              disabled={loading}
            >
              구매하기
            </button>
          </div>

          {/* 6개월 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 transition transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-gray-900">6개월 플랜</h2>
            <p className="text-sm text-gray-600 mt-1">
              48회 + 무료 추가수업 6회
            </p>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              2,880,000원
            </p>

            <button
              onClick={() => handlePay(2880000, "6개월 플랜")}
              className="w-full mt-5 bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm shadow hover:bg-gray-900 transition disabled:opacity-50"
              disabled={loading}
            >
              구매하기
            </button>
          </div>

          {/* 12개월 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 transition transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-gray-900">12개월 플랜</h2>
            <p className="text-sm text-gray-600 mt-1">
              96회 + 무료 추가수업 15회
            </p>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              5,760,000원
            </p>

            <button
              onClick={() => handlePay(5760000, "12개월 플랜")}
              className="w-full mt-5 bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm shadow hover:bg-gray-900 transition disabled:opacity-50"
              disabled={loading}
            >
              구매하기
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 border-t border-gray-200"></div>

        {/* Tuition Section */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
          Tuition Fee
        </h2>

        <div className="space-y-5 mb-20">
          {/* Offline 1:1 */}
          <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                오프라인 1:1 맞춤수업 Best
              </h3>
              <p className="text-gray-600 text-sm mt-1">60,000원 / 회당</p>
            </div>

            <button
              onClick={() => handlePay(60000, "오프라인 1:1 수업")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>

          {/* Online 1:1 */}
          <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                온라인 1:1 맞춤수업
              </h3>
              <p className="text-gray-600 text-sm mt-1">50,000원 / 회당</p>
            </div>

            <button
              onClick={() => handlePay(50000, "온라인 1:1 수업")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>

          {/* Group 2:1 */}
          <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                오프라인 2:1 그룹수업
              </h3>
              <p className="text-gray-600 text-sm mt-1">40,000원 / 회당</p>
            </div>

            <button
              onClick={() => handlePay(40000, "오프라인 2:1 그룹수업")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PaymentPageInner />
    </Suspense>
  );
}
