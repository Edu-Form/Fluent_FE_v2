"use client";

import React from "react";
import Image from "next/image";

interface BtnProps {
  id: string;
  image: string;
}

const EnterBtn: React.FC<BtnProps> = ({ id, image }) => {
  const getDetails = (id: string) => {
    switch (id) {
      case "quizlet":
        return {
          main: "QUIZLET",
          sub: "Quizlet의 한줄소개",
          shadow: "shadow-indigo-500/30",
        };
      case "diary":
        return {
          main: "DIARY",
          sub: "Diary의 한줄소개",
          shadow: "shadow-orange-500/30",
        };
      case "schedule":
        return {
          main: "Schedule",
          sub: "Schedule 더보기",
          shadow: "shadow-cyan-500/30",
        };
      case "ai":
        return {
          main: "AI",
          sub: "AI의 한줄소개",
          shadow: "shadow-blue-500/30",
        };
      default:
        return {
          main: "Unknown",
          sub: "No details available",
          shadow: "shadow-gray-500/30",
        };
    }
  };

  // ID에 맞는 데이터를 가져옴
  const { shadow } = getDetails(id);

  return (
    <button>
      <div
        id={id}
        className={`cursor-pointer rounded-2xl duration-300 ease-in-out transform shadow-lg hover:scale-105 ${shadow}`}
      >
        <Image
          src={image} // public 폴더 기준 경로
          alt="image"
          width={270}
          height={40}
        />
      </div>
    </button>
  );
};

export default EnterBtn;
