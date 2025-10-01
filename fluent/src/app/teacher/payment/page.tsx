"use client";

// File suggestion: app/store/checkout/page.tsx
// A client-side page that looks like a simple e‑commerce checkout.
// It reads query parameters and displays the purchase item, summary, payment links,
// refund policy, and business footer (사업자 번호/주소/상호) for regulatory purposes.

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function currencyKRW(n?: number) {
  if (!Number.isFinite(n || NaN)) return "-";
  return (n as number).toLocaleString("ko-KR");
}

export default function CheckoutPage() {
  const search = useSearchParams();
  const router = useRouter();

  // ── Read query params (all optional) ───────────────────────────────────────
  const params = useMemo(() => {
    const amount = Number(search.get("amount") || ""); // e.g., 150000
    const classes = Number(search.get("classes") || ""); // e.g., 8
    const student = search.get("student") || "";        // 학생명
    const teacher = search.get("teacher") || "";        // 선생님명
    const month = search.get("month") || "";            // e.g., 2025-10
    const plan = search.get("plan") || "1개월";          // 요금제 라벨
    const link = search.get("link") || "";              // external payment link (e.g., Toss)
    const naver = search.get("naver") || "";            // Naver store link
    return { amount, classes, student, teacher, month, plan, link, naver };
  }, [search]);

  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, tag?: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(tag || "copied"); setTimeout(() => setCopied(null), 1500);} catch {}
  };

  // Fallback values for display
  const title = "데이빗의 영어회화 1개월 비용";
  const amountLabel = currencyKRW(params.amount) + "원";

  // Bank transfer info (editable later)
  const bankName = "KB국민은행";
  const bankAccount = "69760201254532";
  const bankHolder = "정현수";

  // Business info (regulatory footer)
  const bizName = "데이빗의 영어회화";
  const bizNumber = "000-00-00000"; // TODO: 실제 사업자등록번호 입력
  const bizAddress = "서울특별시 ○○구 ○○로 00, 0층"; // TODO: 실제 주소 입력

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">결제</div>
          <button
            className="text-sm text-gray-500 hover:text-gray-800"
            onClick={() => router.back()}
          >
            뒤로가기
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Card */}
          <div className="bg-white border rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-semibold">{title}</div>
                <div className="mt-1 text-sm text-gray-500">{params.plan || "1개월"}</div>
              </div>
              <div className="text-xl font-bold">{amountLabel}</div>
            </div>

            {/* Metadata */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="text-gray-500">수강생</div>
                <div className="font-medium text-gray-900">{params.student || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="text-gray-500">담당 선생님</div>
                <div className="font-medium text-gray-900">{params.teacher || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="text-gray-500">정산 월</div>
                <div className="font-medium text-gray-900">{params.month || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="text-gray-500">결제 대상 수업</div>
                <div className="font-medium text-gray-900">{Number.isFinite(params.classes) && params.classes! > 0 ? `${params.classes}회` : "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <div className="text-gray-500">결제 금액</div>
                <div className="font-medium text-gray-900">{amountLabel}</div>
              </div>
            </div>
          </div>

          {/* Refund policy */}
          <div className="bg-white border rounded-2xl shadow-sm p-5">
            <div className="text-lg font-semibold mb-3">환불 정책</div>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-6 text-gray-700">
              <li>결제일 기준 7일 이내, 수업 미이용 시 100% 환불 가능합니다.</li>
              <li>진행된 수업이 있는 경우, 이용한 수업료를 공제한 후 환불됩니다.</li>
              <li>수업 시작 이후 환불 요청 시, 결제 수단 및 PG사 정책에 따라 영업일 기준 3–7일 내 처리됩니다.</li>
              <li>자세한 사항은 담당 선생님 또는 운영팀에 문의해 주세요.</li>
            </ul>
          </div>
        </div>

        {/* Right: Payment Box */}
        <div className="space-y-6">
          <div className="bg-white border rounded-2xl shadow-sm p-5">
            <div className="text-lg font-semibold">결제하기</div>
            <div className="mt-1 text-sm text-gray-500">안전한 결제 방식을 선택하세요.</div>

            <div className="mt-4 space-y-3">
              {/* Toss (external link) */}
              <button
                disabled={!params.link}
                onClick={() => params.link && window.open(params.link, "_blank", "noopener,noreferrer")}
                className={classNames(
                  "w-full py-3 rounded-xl font-semibold border",
                  params.link ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                )}
              >
                Toss 간편결제로 결제하기
              </button>

              {/* Bank transfer card */}
              <div className="mt-4 border rounded-xl p-4 bg-slate-50">
                <div className="font-medium">계좌이체</div>
                <div className="mt-2 text-sm text-gray-700">{bankName} <span className="font-mono">{bankAccount}</span> / 예금주: {bankHolder}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => copy(`${bankName} ${bankAccount} (${bankHolder})`, "acct")}
                    className="px-3 py-1.5 text-xs rounded-lg border hover:bg-white bg-slate-100"
                  >
                    계좌 복사
                  </button>
                  <button
                    onClick={() => copy(`${params.amount || ""}원`, "amt")}
                    className="px-3 py-1.5 text-xs rounded-lg border hover:bg-white bg-slate-100"
                  >
                    금액 복사
                  </button>
                  {copied && (
                    <span className="text-xs text-emerald-600">{copied === "amt" ? "금액" : "계좌"} 복사됨</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">이체 후 스크린샷을 담당 선생님 또는 운영팀 채팅방에 올려주세요.</div>
              </div>
            </div>
          </div>

          {/* Share link (optional) */}
          <div className="bg-white border rounded-2xl shadow-sm p-5">
            <div className="text-sm text-gray-700">
              아래 링크를 복사하여 학부모/학생에게 결제 페이지를 공유하세요.
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 bg-slate-50"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
              />
              <button
                onClick={() => typeof window !== "undefined" && copy(window.location.href, "share")}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
              >
                링크 복사
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Business info */}
      <div className="mt-6 border-t bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
          <div className="font-medium">사업자 정보</div>
          <div className="mt-1">상호: {bizName}</div>
          <div>사업자등록번호: {bizNumber}</div>
          <div>주소: {bizAddress}</div>

          {/* Regulation footer line */}
          <div className="mt-4 text-[11px] text-gray-400">
            © {new Date().getFullYear()} {bizName}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
