"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EnterButton from "../Button/Button";
import DiaryModal from "@/components/Diary/DiaryModal";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

//edit button
const content = {
  submit: "submit",
  edit: "click Edit",
  write: "Write Diary",
};

const DiaryNavigation = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const today_date = searchParams.get("today_date");
  const type = searchParams.get("type");

  const openIsModal = () => setIsModalOpen(true);
  const closeIsModal = () => setIsModalOpen(false);

  const updateScroll = () => {
    setScrollPosition(window.scrollY);
  };

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(updateScroll);
    };

    window.addEventListener("scroll", handleScroll);

    // 컴포넌트가 언마운트될 때 이벤트 리스너를 제거하여 메모리 누수를 방지하려고 만들어놨습니다~
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // 빈 배열을 넣으면 컴포넌트가 처음 렌더링될 때만 실행 -> 이벤트 한번만!

  return type == "student" ? (
    <div
      className={`header flex z-10 fixed w-[100vw] ${
        scrollPosition < 500 ? "top-0" : "top-[-100px]" // 스크롤 내리면 위로 숨김
      }`}
    >
      <div
        className={`w-full h-20 flex items-center justify-between transition-all duration-700 ${
          scrollPosition < 500
            ? "bg-transparent text-white" // 스크롤 500 이하일 때 투명
            : "bg-white text-black" // 스크롤 500 이상일 때 배경색과 텍스트 색상
        }`}
      >
        <Link href="/" className={`pl-24 text-xl font-['Playwrite']`}>
          Fluent
        </Link>
        <div
          className={`font-['Playwrite'] mr-7 ${
            scrollPosition < 500 ? "" : "hidden"
          }`} // 스크롤 500 이상일 때 버튼 숨김
          onClick={openIsModal}
        >
          <EnterButton content={content.write} />
        </div>
        {/* 모달 */}
        {isModalOpen && (
          <DiaryModal
            closeIsModal={closeIsModal}
            next_class_date={today_date || undefined}
          />
        )}
      </div>

      {scrollPosition >= 500 && (
        <motion.div
          className="fixed bottom-10 right-10 w-16 h-16  bg-[#3f4166]  hover:bg-[#a5a8eb] text-white text-4xl rounded-full flex items-center justify-center cursor-pointer shadow-lg"
          onClick={openIsModal}
          initial={{ y: 100, opacity: 0 }} // 아래에서 시작하고 투명한 상태로 시작
          animate={{ y: 0, opacity: 1 }} // 올라오고 완전하게 불투명해짐
          exit={{ y: 100, opacity: 0 }} // 아래로 내려가면서 사라짐
          transition={{
            type: "spring",
            stiffness: 500, // 더 빠르게 반응하도록 stiffness 증가
            damping: 25, // 진동 감소 (버퍼링 감소)
            duration: 0.3, // 빠르게 애니메이션을 완료하도록 설정
          }}
        >
          +
        </motion.div>
      )}
    </div>
  ) : (
    <div
      className={`header flex z-10 fixed w-[100vw] ${
        scrollPosition < 500 ? "top-0" : "top-[-100px]" // 스크롤 내리면 위로 숨김
      }`}
    >
      <div
        className={`w-full h-20 flex items-center justify-between transition-all duration-700 ${
          scrollPosition < 500
            ? "bg-transparent text-white" // 스크롤 500 이하일 때 투명
            : "bg-white text-black" // 스크롤 500 이상일 때 배경색과 텍스트 색상
        }`}
      >
        <Link href="/" className={`pl-24 text-xl font-['Playwrite']`}>
          Fluent
        </Link>
      </div>
    </div>
  );
};

export default DiaryNavigation;

// : "w-[80vw] top-10"
// : "bg-white text-black border-2 border-gray-300 rounded-3xl shadow-md"
