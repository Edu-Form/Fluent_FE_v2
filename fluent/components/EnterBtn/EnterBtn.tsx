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
          sub: "학생들의 Quizlet을 작성하고 관리하세요!",
          shadow: "shadow-indigo-500/30",
          bgColor: "bg-indigo-50",
          hoverColor: "hover:bg-indigo-100",
          textColor: "text-indigo-600",
        };
      case "diary":
        return {
          main: "DIARY",
          sub: "학생들의 일기를 열람하고 관리하세요!",
          shadow: "shadow-orange-500/30",
          bgColor: "bg-orange-50",
          hoverColor: "hover:bg-orange-100",
          textColor: "text-orange-600",
        };
      case "schedule":
        return {
          main: "SCHEDULE",
          sub: "학생들의 수업일정을 짜보세요!",
          shadow: "shadow-cyan-500/30",
          bgColor: "bg-cyan-50",
          hoverColor: "hover:bg-cyan-100",
          textColor: "text-cyan-600",
        };
      case "ai":
        return {
          main: "AI",
          sub: "AI의 한줄소개",
          shadow: "shadow-blue-500/30",
          bgColor: "bg-blue-50",
          hoverColor: "hover:bg-blue-100",
          textColor: "text-blue-600",
        };
      default:
        return {
          main: "Unknown",
          sub: "No details available",
          shadow: "shadow-gray-500/30",
          bgColor: "bg-gray-50",
          hoverColor: "hover:bg-gray-100",
          textColor: "text-gray-600",
        };
    }
  };

  // ID에 맞는 데이터를 가져옴
  const { main, sub, shadow, bgColor, hoverColor, textColor } = getDetails(id);

  return (
    <div
      className={`
        flex items-center 
        w-full min-w-[300px] max-w-[480px] 
        ${bgColor} ${hoverColor} shadow-lg
        space-x-6 p-4 rounded-xl 
        transition-all duration-300 ease-in-out 
        transform hover:scale-105 group
      `}
    >
      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        <Image
          src={image}
          alt={`${id} icon`}
          fill
          className={`
            object-contain 
            transition-all duration-300 ease-in-out
            group-hover:scale-[1.2] 
            group-hover:translate-y-[-10px]
            group-hover:rotate-3
            
            group-hover:animate-float
            
          `}
        />
      </div>

      <div className="flex-1">
        <h1 className={`text-2xl font-bold ${textColor}`}>{main}</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-[300px]">{sub}</p>
      </div>
    </div>
  );
};

export default EnterBtn;
