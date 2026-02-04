"use client";

import { useEffect, useState } from "react";

type Level = "easy" | "medium" | "hard";

interface Quiz {
  question: string;
  options: string[];
  answer: string;
  level: Level;
}

/**
 * 🔒 HARDCODED QUIZ DATA (API 붙이기 전)
 */
const QUIZ_POOL: Quiz[] = [
  // 🟢 EASY
  {
    level: "easy",
    question: "apple 뜻은?",
    options: ["사과", "바나나", "포도"],
    answer: "사과",
  },
  {
    level: "easy",
    question: "run 뜻은?",
    options: ["걷다", "달리다", "자다"],
    answer: "달리다",
  },
  {
    level: "easy",
    question: "book 뜻은?",
    options: ["책", "연필", "가방"],
    answer: "책",
  },
  {
    level: "easy",
    question: "eat 뜻은?",
    options: ["마시다", "먹다", "보다"],
    answer: "먹다",
  },
  {
    level: "easy",
    question: "happy 뜻은?",
    options: ["슬픈", "화난", "행복한"],
    answer: "행복한",
  },
  {
    level: "easy",
    question: "big 뜻은?",
    options: ["작은", "큰", "느린"],
    answer: "큰",
  },
  {
    level: "easy",
    question: "sleep 뜻은?",
    options: ["일하다", "자다", "공부하다"],
    answer: "자다",
  },

  // 🟡 MEDIUM
  {
    level: "medium",
    question: "improve 뜻은?",
    options: ["향상하다", "줄이다", "멈추다"],
    answer: "향상하다",
  },
  {
    level: "medium",
    question: "decide 뜻은?",
    options: ["기다리다", "결정하다", "잊다"],
    answer: "결정하다",
  },
  {
    level: "medium",
    question: "borrow 뜻은?",
    options: ["빌리다", "주다", "사다"],
    answer: "빌리다",
  },
  {
    level: "medium",
    question: "return 뜻은?",
    options: ["떠나다", "돌아오다", "숨다"],
    answer: "돌아오다",
  },
  {
    level: "medium",
    question: "prepare 뜻은?",
    options: ["준비하다", "망치다", "피하다"],
    answer: "준비하다",
  },
  {
    level: "medium",
    question: "explain 뜻은?",
    options: ["설명하다", "숨기다", "추측하다"],
    answer: "설명하다",
  },
  {
    level: "medium",
    question: "continue 뜻은?",
    options: ["멈추다", "계속하다", "취소하다"],
    answer: "계속하다",
  },

  // 🔴 HARD
  {
    level: "hard",
    question: "significant 뜻은?",
    options: ["중요한", "작은", "느린"],
    answer: "중요한",
  },
  {
    level: "hard",
    question: "maintain 뜻은?",
    options: ["포기하다", "유지하다", "파괴하다"],
    answer: "유지하다",
  },
  {
    level: "hard",
    question: "consider 뜻은?",
    options: ["무시하다", "고려하다", "거절하다"],
    answer: "고려하다",
  },
  {
    level: "hard",
    question: "efficient 뜻은?",
    options: ["비효율적인", "효율적인", "위험한"],
    answer: "효율적인",
  },
  {
    level: "hard",
    question: "consequence 뜻은?",
    options: ["원인", "결과", "기회"],
    answer: "결과",
  },
  {
    level: "hard",
    question: "assume 뜻은?",
    options: ["증명하다", "가정하다", "거부하다"],
    answer: "가정하다",
  },
];


export default function TodayQuizCard() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  function loadRandomQuiz() {
    const random =
      QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
    setQuiz(random);
    setResult(null);
  }

  useEffect(() => {
    loadRandomQuiz();
  }, []);

  if (!quiz) return null;

  return (
    <div className="mt-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 relative">

      {/* 🔖 LEVEL BADGE */}
      <div className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-white shadow text-indigo-600">
        LEVEL · {quiz.level.toUpperCase()}
      </div>

      {/* TITLE */}
      <h3 className="text-sm font-bold text-indigo-700 mb-2">
        🎮 오늘의 퀴즈
      </h3>

      {/* QUESTION */}
      <p className="text-base font-semibold mb-3">
        Q. {quiz.question}
      </p>

      {/* OPTIONS */}
      <div className="grid grid-cols-1 gap-2">
        {quiz.options.map((opt) => {
          const isCorrect = opt === quiz.answer;

          return (
            <button
              key={opt}
              disabled={!!result}
              onClick={() =>
                setResult(isCorrect ? "correct" : "wrong")
              }
              className={`
                rounded-xl py-2 text-sm font-medium shadow-sm
                transition active:scale-95
                ${
                  result
                    ? isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                    : "bg-white"
                }
              `}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* RESULT */}
      {result && (
        <div
          className={`mt-3 text-sm font-bold ${
            result === "correct"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {result === "correct"
            ? "🎉 정답입니다!"
            : `❌ 정답: ${quiz.answer}`}
        </div>
      )}

      {/* NEXT BUTTON */}
      {result && (
        <button
          onClick={loadRandomQuiz}
          className="
            mt-3 w-full rounded-xl py-2
            bg-indigo-500 text-white text-sm font-bold
            active:scale-95 transition
          "
        >
          다음 문제 →
        </button>
      )}
    </div>
  );
}
