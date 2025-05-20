"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function StudentAlert() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const displayPage = pathname === "/";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours} : ${minutes}`;

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
      const formattedDate = `${year}. ${month}. ${day} ${weekday.toLowerCase()}`;

      setTime(formattedTime);
      setDate(formattedDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // 매초 업데이트
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`alart flex h-full items-center justify-center ${
        isHomePage || displayPage ? "hidden" : ""
      }`}
    >
      <div
        className={`flex items-center relative bg-[#2675f8] w-full px-8 py-5 overflow-hidden rounded-lg   ${
          isHomePage || displayPage ? "hidden" : ""
        }`}
      >
        <div className="flex items-end text-white gap-4">
          {/* <span className="text-base font-bold">{user || "Unknown"}</span> */}
          <h1 className="text-4xl font-extrabold text-center z-10">{time}</h1>
          <h2 className=" text-xs text-center  z-10">{date}</h2>
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <Image
            src="/images/megaphone.svg"
            alt="megaphone"
            width={0}
            height={0}
            className="h-fill w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
