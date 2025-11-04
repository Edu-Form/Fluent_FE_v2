"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function KakaoMessageTestPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("안녕하세요! 테스트 메시지입니다.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!phoneNumber || !message) {
      setError("전화번호와 메시지를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/kakao-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setError(null);
      } else {
        setError(data.error || "메시지 전송에 실패했습니다.");
        setResult(null);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Kakao Message Test
            </CardTitle>
            <p className="text-gray-600 mt-2">
              카카오 메시지 전송 기능을 테스트합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 (Phone Number)
              </label>
              <Input
                type="text"
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 (Message)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="전송할 메시지를 입력하세요"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "전송 중..." : "메시지 전송"}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">오류</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">전송 완료</p>
                <pre className="text-green-600 text-sm mt-2 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 font-medium mb-2">설정 안내</p>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>• .env.local 파일에 KAKAO_ADMIN_KEY를 추가하세요</li>
                <li>• 카카오 개발자 콘솔에서 앱을 생성하세요</li>
                <li>• Admin Key를 발급받아 환경 변수에 추가하세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
