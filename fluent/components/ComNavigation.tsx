"use client";

import { Suspense } from "react";
import { IconType } from "react-icons";
import { RiHome6Fill } from "react-icons/ri";
import { FaCalendarDays } from "react-icons/fa6";
import { PiBookBookmarkFill } from "react-icons/pi";
import { TbCardsFilled } from "react-icons/tb";
import { LuLogOut } from "react-icons/lu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface NavIconProps {
  Icon: IconType;
  isActive: boolean;
  tooltip: string;
  onClick: () => void;
}

function NavigationComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const user_id = searchParams.get("id");
  const func = searchParams.get("func");
  const url_data = `user=${user}&type=${type}&id=${user_id}`;
  const quizlet_url_data = `user=${user}&type=${type}&id=${user_id}&func=quizlet`;
  const diary_url_data = `user=${user}&type=${type}&id=${user_id}&func=diary`;
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const isHomePage = pathname === "/onboard" || pathname === "/";
  const displayPage = pathname === "/onboard" || pathname === "/";

  useEffect(() => {
    if (pathname.includes("/home") && !func) {
      setActiveIndex(0);
    } else if (pathname.includes("/schedule")) {
      setActiveIndex(1);
    } else if (pathname.includes("/student") && func === "quizlet") {
      setActiveIndex(2);
    } else if (pathname.includes("/student") && func === "diary") {
      setActiveIndex(3);
    }
  }, [pathname, func]);

  const handleHomeClick = () => {
    router.push(`/${type}/home?${url_data}`);
  };

  const handleScheduleClick = () => {
    router.push(`/${type}/schedule?${url_data}`);
  };

  const handleCardsClick = () => {
    if (type === "teacher") {
      router.push(`/${type}/student?${quizlet_url_data}`);
    } else {
      router.push(`/${type}/quizlet?${quizlet_url_data}`);
    }
  };

  const handleBookmarkClick = () => {
    if (type === "teacher") {
      router.push(`/${type}/student?${diary_url_data}`);
    } else {
      router.push(`/${type}/diary?${diary_url_data}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    router.push("/");
  };

  return (
    <div
      className={`flex p-4 h-full w-full items-center justify-center ${
        isHomePage || displayPage ? "hidden" : ""
      }`}
    >
      <div className="bg-white px-12 py-4 rounded-xl shadow-lg space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-10 flex items-center p-2">
        <NavIcon
          Icon={RiHome6Fill}
          isActive={activeIndex === 0}
          tooltip="Home"
          onClick={() => {
            setActiveIndex(0);
            handleHomeClick();
          }}
        />
        <NavIcon
          Icon={FaCalendarDays}
          isActive={activeIndex === 1}
          tooltip="Schedule"
          onClick={() => {
            setActiveIndex(1);
            handleScheduleClick();
          }}
        />
        <NavIcon
          Icon={TbCardsFilled}
          isActive={activeIndex === 2}
          tooltip="Quizlet"
          onClick={() => {
            setActiveIndex(2);
            handleCardsClick();
          }}
        />
        <NavIcon
          Icon={PiBookBookmarkFill}
          isActive={activeIndex === 3}
          tooltip="Diary"
          onClick={() => {
            setActiveIndex(3);
            handleBookmarkClick();
          }}
        />
        <button
          onClick={handleLogout}
          className="flex items-center bg-red-500 text-white px-2 py-1 rounded-md sm:px-3 sm:py-2 sm:rounded-xl"
        >
          <span className="mr-1 sm:mr-2 text-sm sm:text-base">Logout</span>
          <LuLogOut className="text-xl sm:text-2xl" />
        </button>
      </div>
    </div>
  );
}

function NavIcon({ Icon, isActive, tooltip, onClick }: NavIconProps) {
  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className={`p-1 sm:p-2 rounded-xl cursor-pointer ${
          isActive ? "bg-blue-600 text-white" : "bg-white text-black"
        } hover:bg-blue-600 hover:text-white transition duration-200`}
      >
        <Icon className="text-2xl sm:text-3xl" />
      </div>
      <div
        className="absolute left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded-md px-2 py-1 whitespace-nowrap transition-opacity duration-200"
        style={{ bottom: "120%" }}
      >
        {tooltip}
      </div>
    </div>
  );
}

export default function Navigation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NavigationComponent />
    </Suspense>
  );
}
