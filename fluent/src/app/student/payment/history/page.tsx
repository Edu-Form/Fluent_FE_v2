"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Download, Receipt, TrendingUp, TrendingDown, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Payment {
  orderId: string;
  paymentKey: string;
  amount: number;
  method: string;
  status: string;
  approvedAt?: string;
  savedAt?: string;
  yyyymm?: string;
  receiptUrl?: string | null;
  receiptKey?: string | null;
}

interface CreditTransaction {
  date: string;
  type: "payment" | "deduction";
  amount: number;
  description: string;
  classDetails?: {
    teacher?: string;
    room?: string;
    time?: string;
    date?: string;
    preview?: string;
  };
}

function PaymentHistoryInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = searchParams.get("user");
  const user_id = searchParams.get("id");
  const type = searchParams.get("type") || "student";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "credits">("payments");
  const [showExampleData, setShowExampleData] = useState(false);

  useEffect(() => {
    if (!user) {
      setError("사용자 정보가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/payment/history?studentName=${encodeURIComponent(user)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("결제 내역을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        console.log("Payment history data:", data); // Debug log
        
        // Prepare example data (for testing/demo)
        const examplePayments: Payment[] = [
          {
            orderId: "example_order_001",
            paymentKey: "example_payment_key_001",
            amount: 480000,
            method: "카드",
            status: "DONE",
            approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            savedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            yyyymm: "202412",
            receiptUrl: "https://docs.tosspayments.com/receipt/example",
          },
          {
            orderId: "example_order_002",
            paymentKey: "example_payment_key_002",
            amount: 240000,
            method: "간편결제",
            status: "DONE",
            approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            savedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            yyyymm: "202411",
            receiptUrl: "https://docs.tosspayments.com/receipt/example",
          },
        ];
        
        const exampleCredits: CreditTransaction[] = [
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: "payment",
            amount: 10,
            description: "카드 결제로 크레딧 충전",
          },
          {
            date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            type: "deduction",
            amount: -1,
            description: "수업 진행",
            classDetails: {
              teacher: "David",
              room: "Room A",
              time: "14:00",
              date: "2024. 12. 15.",
              preview: "Today we learned about present perfect tense...",
            },
          },
          {
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            type: "deduction",
            amount: -1,
            description: "수업 진행",
            classDetails: {
              teacher: "David",
              room: "Room B",
              time: "16:00",
              date: "2024. 12. 20.",
              preview: "We practiced conversation skills and reviewed vocabulary...",
            },
          },
          {
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            type: "payment",
            amount: 5,
            description: "간편결제로 크레딧 충전",
          },
        ];
        
        // Add example data if enabled (for testing/demo)
        if (showExampleData) {
          setPayments([...examplePayments, ...(data.payments || [])]);
          setCreditTransactions([...exampleCredits, ...(data.creditTransactions || [])]);
        } else {
          setPayments(data.payments || []);
          setCreditTransactions(data.creditTransactions || []);
        }
        setCurrentCredits(data.currentCredits || 0);
        
        // Log if no data found
        if ((!data.payments || data.payments.length === 0) && (!data.creditTransactions || data.creditTransactions.length === 0)) {
          console.warn("No payment or credit data found for student:", user);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("결제 내역을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, showExampleData]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const generateReceipt = (payment: Payment) => {
    const receiptContent = `
╔═══════════════════════════════════════╗
║         Fluent English Academy        ║
║            결제 영수증 (Receipt)         ║
╠═══════════════════════════════════════╣
║ 주문번호 (Order ID)                    ║
║ ${payment.orderId}                   ║
╠═══════════════════════════════════════╣
║ 결제번호 (Payment Key)                  ║
║ ${payment.paymentKey}                ║
╠═══════════════════════════════════════╣
║ 학생명: ${user || "-"}                    ║
║ 결제일시: ${formatDate(payment.approvedAt || payment.savedAt)} ║
║ 결제수단: ${payment.method}              ║
║ 결제상태: ${payment.status === "DONE" ? "완료" : payment.status} ║
╠═══════════════════════════════════════╣
║ 결제금액 (Amount)                      ║
║ ${formatCurrency(payment.amount)}     ║
╠═══════════════════════════════════════╣
║           감사합니다                    ║
╚═══════════════════════════════════════╝
    `.trim();

    // Create blob and download
    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt_${payment.orderId}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${type}/home?user=${encodeURIComponent(user || "")}&type=${type}&id=${user_id || ""}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">결제 및 크레딧 내역</h1>
            <button
              onClick={() => setShowExampleData(!showExampleData)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              {showExampleData ? "예시 데이터 숨기기" : "예시 데이터 보기"}
            </button>
          </div>
          <p className="text-gray-600">
            결제 내역과 크레딧 사용 내역을 확인하실 수 있습니다.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">현재 보유 크레딧:</span>
              <span className="text-2xl font-bold text-blue-600">{currentCredits.toLocaleString()} 크레딧</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "payments"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Receipt className="inline-block w-5 h-5 mr-2" />
            결제 내역
          </button>
          <button
            onClick={() => setActiveTab("credits")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "credits"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Calendar className="inline-block w-5 h-5 mr-2" />
            크레딧 내역
          </button>
        </div>

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">결제 내역이 없습니다.</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.orderId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.method} 결제
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === "DONE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status === "DONE" ? "완료" : payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        주문번호: {payment.orderId}
                      </p>
                      <p className="text-sm text-gray-600">
                        결제일시: {formatDate(payment.approvedAt || payment.savedAt)}
                      </p>
                      {payment.yyyymm && (
                        <p className="text-sm text-gray-600">기간: {payment.yyyymm}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        {formatCurrency(payment.amount)}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => generateReceipt(payment)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          <Download className="w-4 h-4" />
                          영수증 다운로드
                        </button>
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            <Receipt className="w-4 h-4" />
                            Toss 영수증 보기
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === "credits" && (
          <div className="space-y-3">
            {creditTransactions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">크레딧 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          일시
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          유형
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          설명
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          크레딧
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {creditTransactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.type === "payment" ? (
                              <span className="flex items-center gap-2 text-green-600">
                                <TrendingUp className="w-4 h-4" />
                                <span className="font-medium">충전</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-red-600">
                                <TrendingDown className="w-4 h-4" />
                                <span className="font-medium">사용</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.classDetails && (
                                <div className="mt-1 text-xs text-gray-500 space-y-1">
                                  <div>선생님: {transaction.classDetails.teacher || "-"}</div>
                                  <div>수업일: {transaction.classDetails.date || transaction.date}</div>
                                  {transaction.classDetails.time && (
                                    <div>시간: {transaction.classDetails.time}</div>
                                  )}
                                  {transaction.classDetails.room && (
                                    <div>장소: {transaction.classDetails.room}</div>
                                  )}
                                  {transaction.classDetails.preview && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700 italic">
                                      &ldquo;{transaction.classDetails.preview}&rdquo;
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={`font-semibold ${
                                transaction.type === "payment"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "payment" ? "+" : "-"}
                              {Math.abs(transaction.amount).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <PaymentHistoryInner />
    </Suspense>
  );
}
