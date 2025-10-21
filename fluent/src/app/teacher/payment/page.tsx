"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

function currencyKRW(n?: number) {
  if (!Number.isFinite(n || NaN)) return "-";
  return (n as number).toLocaleString("ko-KR");
}

function PaymentInner() {
  const search = useSearchParams();
  const params = useMemo(() => {
    return {
      student: search.get("student_name") || search.get("student") || "",
      teacher: search.get("teacher_name") || search.get("user") || "",
      yyyymm: search.get("date") || search.get("yyyymm") || "",
    };
  }, [search]);

  const [billing, setBilling] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, tag?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag || "copied");
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        if (!params.student || !params.yyyymm) return;
        const res = await fetch(
          `/api/billing/check2?student_name=${encodeURIComponent(
            params.student
          )}&yyyymm=${encodeURIComponent(params.yyyymm)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json?.ok && json?.data) setBilling(json.data);
      } catch (err) {
        console.error("fetch billing error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [params.student, params.yyyymm]);

  // Biz / Bank info
  const bankName = "KB국민은행";
  const bankAccount = "69760201254532";
  const bankHolder = "정현수";
  const bizName = "데이빗의 영어회화";
  const bizNumber = "416-33-62140";
  const bizAddress = "서울특별시 마포구 포은로 14, 3층";
  const bizPhone = "010-2713-7397";
  const bizOwner = "정현수";
  const servicePeriod = "1개월";

  const monthLabel = billing?.yyyymm
    ? `${billing.yyyymm.slice(0, 4)}.${billing.yyyymm.slice(4)}`
    : "—";
  const totalAmount = billing?.amount_due_next ?? 0;
  const feePerClass = billing?.fee_per_class ?? 0;

  const summaryRows = [
    ["이번달 선결제(예정/스케줄)", billing?.carry_in_credit ?? 0],
    ["이번달 실제 수업 (노트 기준)", billing?.this_month_actual ?? 0],
    ["다음달 예정 수업 (스케줄)", billing?.next_month_planned ?? 0],
    ["다음달 차감 가능 수업", billing?.total_credits_available ?? 0],
    ["결제 대상 수업", billing?.next_to_pay_classes ?? 0],
    ["회당 수업료 (₩)", currencyKRW(feePerClass)],
    ["결제 금액 (₩)", currencyKRW(totalAmount)],
  ];

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">결제 정보를 불러오는 중...</div>
    );
  if (!billing)
    return (
      <div className="p-8 text-center text-gray-500">
        결제 정보가 존재하지 않습니다.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="text-lg font-semibold">결제 페이지</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* -------------- Main Summary Card -------------- */}
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          {/* Title + amount */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                {bizName} 수업료 – {monthLabel}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                담당 선생님: {billing.teacher_name || params.teacher || "—"} /
                서비스 제공기간: {servicePeriod}
              </div>
            </div>
            <div className="text-xl font-bold text-indigo-700">
              {currencyKRW(totalAmount)}원
            </div>
          </div>

          {/* Two-column layout: Left summary, Right payment */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: Settlement Summary */}
            <div>
              <div className="font-semibold mb-2 text-gray-800">정산 요약</div>
              <table className="w-full text-sm">
                <tbody className="[&>tr>*]:px-2 [&>tr>*]:py-1.5">
                  {summaryRows.map(([label, val], i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="text-gray-500 w-2/3">{label}</td>
                      <td className="text-right font-medium text-gray-800">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RIGHT: Payment Methods */}
            <div>
              <div className="font-semibold mb-2 text-gray-800">결제 방법</div>

              {/* Toss button */}
              <button
                onClick={() =>
                  window.open(
                    `https://pay.toss.im/your-business-link?amount=${totalAmount}&orderName=${encodeURIComponent(
                      `${bizName} ${monthLabel}`
                    )}&customerName=${encodeURIComponent(params.student)}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="w-full py-3 rounded-xl font-semibold border bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Toss 간편결제
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
                    onClick={() => copy(`${currencyKRW(totalAmount)}원`, "amt")}
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
          </div>
        </div>

        {/* Refund Policy */}
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="text-lg font-semibold mb-3">환불 정책</div>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-6 text-gray-700">
            <li>결제일 기준 7일 이내, 수업 미이용 시 100% 환불 가능합니다.</li>
            <li>진행된 수업이 있는 경우, 이용한 수업료를 공제한 후 환불됩니다.</li>
            <li>수업 시작 이후 환불 요청 시, PG사 정책에 따라 3–7영업일 내 처리됩니다.</li>
            <li>문의는 담당 선생님 또는 운영팀에 해주세요.</li>
          </ul>
          <div className="mt-2 text-xs text-gray-500">
            (본 환불정책은 Toss 계약 심사 및 서비스 운영 목적을 위해 명시됩니다.)
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="text-lg font-semibold mb-3">서비스 상세 안내</div>
          <div className="text-sm leading-6 text-gray-700 space-y-2">
            <p>
              {bizName}은(는) 실시간 영어회화 수업을 제공하는 교육 서비스로, 월 단위로
              수강료가 결제됩니다. 학생은 담당 선생님과의 일정을 조율하여 매월 지정된
              횟수만큼 수업을 진행합니다.
            </p>
            <p>
              서비스 제공기간은 {servicePeriod}이며, 결제 후 다음 달 수업 계획이 확정되면
              정해진 일정에 맞추어 수업이 진행됩니다. 수업이 이월되는 경우, 남은 수업은
              자동으로 다음달로 이월됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500 space-y-1 leading-5">
            <div>상호: {bizName}</div>
            <div>대표자: {bizOwner}</div>
            <div>전화번호: {bizPhone}</div>
            <div>주소: {bizAddress}</div>
            <div>사업자등록번호: {bizNumber}</div>
            <div>통신판매업신고번호: 2025-서울마포-1975</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PaymentInner />
    </Suspense>
  );
}
