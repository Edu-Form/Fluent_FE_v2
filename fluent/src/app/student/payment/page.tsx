"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Minus, Plus, History } from "lucide-react";

function PaymentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  // hooks MUST be here (before any returns)
  const [loading, setLoading] = useState(false);
  // Quantity state for each payment item
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "3개월 플랜": 1,
    "1개월 플랜": 1,
    "6개월 플랜": 1,
    "12개월 플랜": 1,
    "오프라인 1:1 수업": 1,
    "온라인 1:1 수업": 1,
    "오프라인 2:1 그룹수업": 1,
    "David 1:1 Class": 1,
  });

  const updateQuantity = (label: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[label] || 1;
      const newQuantity = Math.max(1, current + delta);
      return { ...prev, [label]: newQuantity };
    });
  };

  // ❗ now safe: hooks already executed
  if (!user || !type || !user_id) {
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

  async function handlePay(baseAmount: number, label: string) {
    const quantity = quantities[label] || 1;
    const totalAmount = baseAmount * quantity;

    // Calculate credits based on plan/product
    let credits = 0;
    if (label === "3개월 플랜") {
      credits = 26 * quantity;
    } else if (label === "1개월 플랜") {
      credits = 8 * quantity;
    } else if (label === "6개월 플랜") {
      credits = 54 * quantity;
    } else if (label === "12개월 플랜") {
      credits = 111 * quantity;
    } else if (label === "오프라인 1:1 수업" || label === "온라인 1:1 수업" || label === "오프라인 2:1 그룹수업" || label === "David 1:1 Class") {
      // Tuition fees: 1 credit per class
      credits = quantity;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user,
          amount: totalAmount,
          credits: credits,
          label: quantity > 1 ? `${label} x${quantity}` : label,
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

  // Quantity selector component
  const QuantitySelector = ({ quantity, onUpdate }: { quantity: number; onUpdate: (delta: number) => void }) => (
    <div className="flex items-center gap-3 mt-3">
      <span className="text-sm text-gray-600">수량:</span>
      <div className="flex items-center border border-gray-300 rounded-lg">
        <button
          type="button"
          onClick={() => onUpdate(-1)}
          disabled={quantity <= 1}
          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => onUpdate(1)}
          className="p-2 hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-6 py-8 flex justify-center">
      <div className="w-full max-w-lg">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => router.push(`/student/payment/history?user=${encodeURIComponent(user || "")}&type=${type || "student"}&id=${user_id || ""}`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              <History className="w-4 h-4" />
              결제 내역
            </button>
            <div className="flex-1"></div>
          </div>
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
          {/* 3개월 플랜 */}
          <div className="relative bg-white rounded-2xl shadow-lg border border-blue-200 p-6 transition transform hover:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
              Most Popular
            </div>

            <h2 className="text-xl font-bold text-gray-900">3개월 플랜</h2>
            <p className="text-sm text-gray-600 mt-1">24회 + 무료 추가수업 2회</p>
            <p className="mt-4 text-2xl font-extrabold text-blue-600">
              1,440,000원
            </p>

            <QuantitySelector
              quantity={quantities["3개월 플랜"]}
              onUpdate={(delta) => updateQuantity("3개월 플랜", delta)}
            />

            {quantities["3개월 플랜"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(1440000 * quantities["3개월 플랜"]).toLocaleString()}원
              </p>
            )}

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

            <QuantitySelector
              quantity={quantities["1개월 플랜"]}
              onUpdate={(delta) => updateQuantity("1개월 플랜", delta)}
            />

            {quantities["1개월 플랜"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(480000 * quantities["1개월 플랜"]).toLocaleString()}원
              </p>
            )}

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

            <QuantitySelector
              quantity={quantities["6개월 플랜"]}
              onUpdate={(delta) => updateQuantity("6개월 플랜", delta)}
            />

            {quantities["6개월 플랜"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(2880000 * quantities["6개월 플랜"]).toLocaleString()}원
              </p>
            )}

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

            <QuantitySelector
              quantity={quantities["12개월 플랜"]}
              onUpdate={(delta) => updateQuantity("12개월 플랜", delta)}
            />

            {quantities["12개월 플랜"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(5760000 * quantities["12개월 플랜"]).toLocaleString()}원
              </p>
            )}

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

        {/* TUITION SECTION */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
          Tuition Fee
        </h2>


        <div className="space-y-5 mb-20">

          {/* David 1:1 (70,000원 / 회당) */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 transition transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-gray-900">
              David 1:1 Class
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              데이비드 선생님 수업 · 회당 70,000원
            </p>


            <QuantitySelector
              quantity={quantities["David 1:1 Class"]}
              onUpdate={(delta) => updateQuantity("David 1:1 Class", delta)}
            />

            {quantities["David 1:1 Class"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(70000 * quantities["David 1:1 Class"]).toLocaleString()}원
              </p>
            )}

            <button
              onClick={() => handlePay(70000, "David 1:1 Class")}
              className="w-full mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>

          {/* Offline 1:1 */}
          <div className="bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  오프라인 1:1 맞춤수업 Best
                </h3>
                <p className="text-gray-600 text-sm mt-1">60,000원 / 회당</p>
              </div>
            </div>

            <QuantitySelector
              quantity={quantities["오프라인 1:1 수업"]}
              onUpdate={(delta) => updateQuantity("오프라인 1:1 수업", delta)}
            />

            {quantities["오프라인 1:1 수업"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(60000 * quantities["오프라인 1:1 수업"]).toLocaleString()}원
              </p>
            )}

            <button
              onClick={() => handlePay(60000, "오프라인 1:1 수업")}
              className="w-full mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>

          {/* Online 1:1 */}
          <div className="bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  온라인 1:1 맞춤수업
                </h3>
                <p className="text-gray-600 text-sm mt-1">50,000원 / 회당</p>
              </div>
            </div>

            <QuantitySelector
              quantity={quantities["온라인 1:1 수업"]}
              onUpdate={(delta) => updateQuantity("온라인 1:1 수업", delta)}
            />

            {quantities["온라인 1:1 수업"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(50000 * quantities["온라인 1:1 수업"]).toLocaleString()}원
              </p>
            )}

            <button
              onClick={() => handlePay(50000, "온라인 1:1 수업")}
              className="w-full mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              결제하기
            </button>
          </div>

          {/* Group 2:1 */}
          <div className="bg-white rounded-xl shadow-sm border p-5 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  오프라인 2:1 그룹수업
                </h3>
                <p className="text-gray-600 text-sm mt-1">40,000원 / 회당</p>
              </div>
            </div>

            <QuantitySelector
              quantity={quantities["오프라인 2:1 그룹수업"]}
              onUpdate={(delta) => updateQuantity("오프라인 2:1 그룹수업", delta)}
            />

            {quantities["오프라인 2:1 그룹수업"] > 1 && (
              <p className="mt-2 text-sm text-gray-700">
                총 금액: {(40000 * quantities["오프라인 2:1 그룹수업"]).toLocaleString()}원
              </p>
            )}

            <button
              onClick={() => handlePay(40000, "오프라인 2:1 그룹수업")}
              className="w-full mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-50"
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
