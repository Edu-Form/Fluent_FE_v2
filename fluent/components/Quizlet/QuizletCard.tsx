"use client";

import { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

export default function QuizletCard({
  content,
}: {
  content: QuizletCardProps;
}) {
  const date = content.date;
  const engWords = content.eng_quizlet || [];
  const korWords = content.kor_quizlet || [];
  // engWords와 korWords를 매핑해 cards로 변환
  const cards = engWords.map((eng, index) => [eng, korWords[index] || ""]);
  const [card, setCard] = useState(0);
  const [cardface, setCardface] = useState(0);

  return (
    <div className="flex flex-col justify-center items-center ">
      {content.date ? (
        <div className="text-2xl font-bold mb-10 text-[#2675f8]">{date}</div>
      ) : (
        <div className="text-2xl font-bold mb-10 text-[#2675f8]">
          Please Select a Quizlet
        </div>
      )}
      <div
        className="flex flex-col justify-center items-center w-[40vw] h-[40vh] rounded overflow-hidden shadow-base border-2 bg-white"
        onClick={() => setCardface((prev) => 1 - prev)} // 카드 면 변경
      >
        <div className="flex items-center px-6 py-4">
          {cards.length > 0 ? (
            <div className="font-bold text-3xl mb-2 text-center">
              {cards[card][cardface]}
            </div>
          ) : (
            <div>Select Quizlet에서 날짜를 확인하세요.</div>
          )}
        </div>
      </div>
      <div className="flex mt-3 gap-10 quizlet-card-button">
        <IoIosArrowBack
          className="inline text-4xl hover:animate-pulse text-[#2675f8] rounded-[100%] hover:bg-slate-200"
          onClick={() => {
            setCard((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
            setCardface(0); // 영어로 초기화
          }}
        />
       {/* 숫자 */}
        {cards.length > 0 && (
          <div className="flex text-[#2675f8] align-middle text-xl">
            {card + 1} / {cards.length}
          </div>
        )}
        <IoIosArrowForward
          className="inline text-4xl hover:animate-pulse text-[#2675f8] rounded-[100%] hover:bg-slate-200"
          onClick={() => {
            setCard((prev) => (prev + 1 === cards.length ? 0 : prev + 1));
            setCardface(0); // 영어로 초기화
          }}
        />
      </div>
    </div>
  );
}
