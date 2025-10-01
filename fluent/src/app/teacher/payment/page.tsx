"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

// Helper
function currencyKRW(n?: number) {
  if (!Number.isFinite(n || NaN)) return "-";
  return (n as number).toLocaleString("ko-KR");
}

function PaymentInner() {
  const search = useSearchParams();

  // Read query params
  const params = useMemo(() => {
    return {
      user: search.get("user") || "",
      type: search.get("type") || "",
      id: search.get("id") || "",
      amount: Number(search.get("amount") || "150000"),
      month: search.get("month") || "2025-10",
      student: search.get("student") || "홍길동",
    };
  }, [search]);

  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, tag?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag || "copied");
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  // Bank info
  const bankName = "KB국민은행";
  const bankAccount = "69760201254532";
  const bankHolder = "정현수";

  // Biz info
  const bizName = "데이빗의 영어회화";
  const bizNumber = "000-00-00000"; // TODO: real 사업자번호
  const bizAddress = "서울특별시 ○○구 ○○로 00, 0층"; // TODO: real 주소

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="text-lg font-semibold">결제 페이지</div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Product */}
        <div className="bg-white border rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                데이빗의 영어회화 1개월 비용
              </div>
              <div className="mt-1 text-sm text-gray-500">
                정산월: {params.month}
              </div>
            </div>
            <div className="text-xl font-bold">
              {currencyKRW(params.amount)}원
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white border rounded-2xl shadow-sm p-5 space-y-4">
          <div className="text-lg font-semibold">결제 방법</div>

          <button
            onClick={() =>
              window.open("https://pay.toss.im/", "_blank", "noopener,noreferrer")
            }
            className="w-full py-3 rounded-xl font-semibold border bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Toss 간편결제
          </button>

          <button
            onClick={() =>
              window.open(
                "https://smartstore.naver.com/davidsenglishconversation",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="w-full py-3 rounded-xl font-semibold border bg-green-600 text-white hover:bg-green-700"
          >
            네이버 스토어
          </button>

          {/* Bank transfer */}
          <div className="mt-4 border rounded-xl p-4 bg-slate-50">
            <div className="font-medium">계좌이체</div>
            <div className="mt-2 text-sm text-gray-700">
              {bankName} <span className="font-mono">{bankAccount}</span> / 예금주:{" "}
              {bankHolder}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() =>
                  copy(`${bankName} ${bankAccount} (${bankHolder})`, "acct")
                }
                className="px-3 py-1.5 text-xs rounded-lg border bg-slate-100 hover:bg-white"
              >
                계좌 복사
              </button>
              <button
                onClick={() => copy(`${params.amount}원`, "amt")}
                className="px-3 py-1.5 text-xs rounded-lg border bg-slate-100 hover:bg-white"
              >
                금액 복사
              </button>
              {copied && (
                <span className="text-xs text-emerald-600">
                  {copied === "amt" ? "금액" : "계좌"} 복사됨
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              이체 후 스크린샷을 담당 선생님 또는 운영팀 채팅방에 올려주세요.
            </div>
          </div>
        </div>

        {/* Refund policy */}
        <div className="bg-white border rounded-2xl shadow-sm p-5">
          <div className="text-lg font-semibold mb-3">환불 정책</div>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-6 text-gray-700">
            <li>결제일 기준 7일 이내, 수업 미이용 시 100% 환불 가능합니다.</li>
            <li>진행된 수업이 있는 경우, 이용한 수업료를 공제한 후 환불됩니다.</li>
            <li>수업 시작 이후 환불 요청 시, PG사 정책에 따라 3–7영업일 내 처리됩니다.</li>
            <li>문의는 담당 선생님 또는 운영팀에 해주세요.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 border-t bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500">
          <div>상호: {bizName}</div>
          <div>사업자등록번호: {bizNumber}</div>
          <div>주소: {bizAddress}</div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function PageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PaymentInner />
    </Suspense>
  );
}
