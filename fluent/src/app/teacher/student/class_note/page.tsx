"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";
import timerAnimationData from "@/src/app/lotties/timeLoading.json";
import "react-day-picker/dist/style.css";

// 기존 날짜 포맷 함수들 유지
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

const QuizletModalContent = ({
  closeIsModal,
  next_class_date,
}: QuizeletlModalProps) => {
  const router = useRouter();
  const [class_date, setClassDate] = useState(
    formatToSave(formatToISO(next_class_date))
  );
  const [date] = useState(formatToSave(today_formatted()));
  const [original_text, setOriginal_text] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const student_name = searchParams.get("student_name");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");

  const postQuizlet = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/quizlet/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ student_name, class_date, date, original_text }),
      });

      if (response.ok) {
        window.close();
      } else {
        console.error("Failed to save quizlet");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-40 h-40 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
            <Lottie animationData={timerAnimationData} />
          </div>
        </div>
      )}

      <div className="relative w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        <form onSubmit={postQuizlet} className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center text-[#121B5C]">
            Class Note
          </h2>

          <div className="space-y-2"></div>

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

          <div className="space-y-2">
            <label
              htmlFor="original_text"
              className="text-sm font-medium text-gray-700"
            >
              Quizlet Content
            </label>
            <textarea
              id="original_text"
              rows={14}
              onChange={(e) => setOriginal_text(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#121B5C]/50 resize-none"
              placeholder="Enter quizlet content here..."
              disabled={loading}
            ></textarea>
          </div>

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
            Create Quizlet
          </button>
        </form>
      </div>

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
};

export default function QuizletModal(props: QuizeletlModalProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-40 h-40 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
            <Lottie animationData={timerAnimationData} />
          </div>
        </div>
      }
    >
      <QuizletModalContent {...props} />
    </Suspense>
  );
}
