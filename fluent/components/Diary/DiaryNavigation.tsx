"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EnterButton from "../Button/Button";
import DiaryModal from "@/components/Diary/DiaryModal";
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

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return type == "student" ? (
    <>
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
              scrollPosition < 500 ? "block" : "hidden"
            }`}
          >
            <button
              onClick={openIsModal}
              className="px-4 py-2 bg-[#3f4166] text-white rounded-lg hover:bg-[#555b8a] transition-colors duration-300"
            >
              {content.write}
            </button>
          </div>
        </div>
      </div>

      {scrollPosition >= 500 && (
        <button
          onClick={openIsModal}
          className="fixed bottom-10 right-10 w-16 h-16 bg-[#3f4166] hover:bg-[#555b8a] text-white text-4xl rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-300"
        >
          +
        </button>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <DiaryModal
          closeIsModal={closeIsModal}
          next_class_date={today_date || undefined}
        />
      )}
    </>
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
