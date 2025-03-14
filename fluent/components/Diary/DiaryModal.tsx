"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import Lottie from "lottie-react";
// import timerAnimationData from "@/src/app/lotties/timeLoading.json";
import "react-day-picker/dist/style.css";

interface QuizeletlModalProps {
  closeIsModal: () => void;
  next_class_date?: string;
}

// 기존 날짜 포맷 함수들 그대로 유지
const formatToISO = (date: string | undefined) => {
  try {
    if (date != undefined) {
      const parts = date.trim().replace(/\.$/, "").split(". ");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  } catch {
    return "";
  }
};

const today_formatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatToSave = (date: string | undefined) => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${year}. ${month}. ${day}.`;
};

export default function DiaryModal({
  closeIsModal,
  next_class_date,
}: QuizeletlModalProps) {
  const router = useRouter();
  const [class_date, setClassDate] = useState(
    formatToSave(formatToISO(next_class_date))
  );
  const [date] = useState(formatToSave(today_formatted()));
  const [original_text, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const student_name = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  const postDiary = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/diary/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ student_name, class_date, date, original_text }),
      });

      if (response.ok) {
        closeIsModal();
        router.push(
          `/student/diary?user=${student_name}&type=${type}&id=${user_id}`
        );
        window.location.reload();
      } else {
        console.error("Failed to save diary");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      {/* 로딩 중일 때 애니메이션 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-40 h-40 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
            {/* <Lottie animationData={timerAnimationData} /> */}
          </div>
        </div>
      )}

      <div className="relative w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* 닫기 버튼 */}
        <button
          onClick={() => !loading && closeIsModal()}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <form onSubmit={postDiary} className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center text-[#121B5C]">
            Write Diary
          </h2>

          {/* 수업 날짜 입력 */}
          <div className="space-y-2">
            <label
              htmlFor="class_date"
              className="text-sm font-medium text-gray-700"
            >
              Class Date
            </label>
            <input
              type="date"
              name="class_date"
              id="class_date"
              defaultValue={formatToISO(next_class_date)}
              onChange={(e) => setClassDate(formatToSave(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#121B5C]/50 transition-all"
              required
              disabled={loading}
            />
          </div>

          {/* 일기 날짜 입력
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="date"
              id="date"
              defaultValue={today_formatted()}
              onChange={(e) => setDate(formatToSave(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#121B5C]/50 transition-all"
              required
              disabled={loading}
            />
          </div> */}

          {/* 일기 내용 입력 */}
          <div className="space-y-2">
            <label
              htmlFor="original_text"
              className="text-sm font-medium text-gray-700"
            >
              Diary Content
            </label>
            <textarea
              id="original_text"
              rows={14}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#121B5C]/50 resize-none"
              placeholder="What did you do today?"
              disabled={loading}
            ></textarea>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className={`w-full py-4 rounded-lg text-white font-semibold 
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#121B5C] hover:bg-[#0f1a4e] transition-colors"
              }`}
            disabled={loading}
          >
            Submit Diary
          </button>
        </form>
      </div>

      {/* 애니메이션용 tailwind 클래스 */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
