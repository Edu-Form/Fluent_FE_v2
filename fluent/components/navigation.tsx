"use client";

import { Suspense } from "react";
import { IconType } from "react-icons";
import { RiHome6Fill } from "react-icons/ri";
import { PiBookBookmarkFill } from "react-icons/pi";
import { TbCardsFilled } from "react-icons/tb";
import { RiEdit2Fill } from "react-icons/ri"; // 다이어리 쓰기 아이콘 추가
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface NavIconProps {
  Icon: IconType;
  isActive: boolean;
  label: string;
  onClick: () => void;
}

// 네비게이션 아이콘 컴포넌트
function NavIcon({ Icon, isActive, label, onClick }: NavIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 w-16"
    >
      <div
        className={`p-2 rounded-full ${
          isActive ? "bg-blue-100 text-blue-600" : "text-gray-500"
        }`}
      >
        <Icon className="text-xl" />
      </div>
      <span
        className={`text-xs mt-1 ${
          isActive ? "text-blue-600 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// 로그아웃 확인 모달 컴포넌트
interface LogoutConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-72 max-w-[90%]">
        <h3 className="text-lg font-medium mb-2">로그아웃</h3>
        <p className="text-gray-600 mb-4">정말 로그아웃 하시겠습니까?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-200 rounded-md text-gray-700"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// 메인 네비게이션 컴포넌트
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isHomePage = pathname === "/onboard" || pathname === "/";
  const displayPage = pathname === "/onboard" || pathname === "/";

  useEffect(() => {
    if (pathname.includes("/home") && !func) {
      setActiveIndex(0);
    } else if (
      pathname.includes("/quizlet") ||
      (pathname.includes("/student") && func === "quizlet")
    ) {
      setActiveIndex(1);
    } else if (
      (pathname.includes("/diary") && !pathname.includes("/write")) ||
      (pathname.includes("/student") &&
        func === "diary" &&
        !pathname.includes("/write"))
    ) {
      setActiveIndex(2);
    } else if (
      pathname.includes("/diary/write") ||
      (pathname.includes("/diary") && pathname.includes("/write"))
    ) {
      setActiveIndex(3);
    }
  }, [pathname, func]);

  const handleHomeClick = () => {
    router.push(`/${type}/home?${url_data}`);
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

  const handleDiaryWriteClick = () => {
    router.push(`/teacher/${type}/diary_note?${diary_url_data}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    router.push("/");
  };

  if (isHomePage || displayPage) {
    return null;
  }

  return (
    <>
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      <div className="flex w-full justify-center bg-white shadow-lg z-40 ">
        <div className="flex w-full justify-around items-center py-2">
          <NavIcon
            Icon={RiHome6Fill}
            isActive={activeIndex === 0}
            label="홈"
            onClick={() => {
              setActiveIndex(0);
              handleHomeClick();
            }}
          />
          <NavIcon
            Icon={TbCardsFilled}
            isActive={activeIndex === 1}
            label="퀴즐렛"
            onClick={() => {
              setActiveIndex(1);
              handleCardsClick();
            }}
          />
          <NavIcon
            Icon={PiBookBookmarkFill}
            isActive={activeIndex === 2}
            label="다이어리"
            onClick={() => {
              setActiveIndex(2);
              handleBookmarkClick();
            }}
          />
          <NavIcon
            Icon={RiEdit2Fill}
            isActive={activeIndex === 3}
            label="쓰기"
            onClick={() => {
              setActiveIndex(3);
              handleDiaryWriteClick();
            }}
          />
          {/* <NavIcon
            Icon={LuLogOut}
            isActive={false}
            label="로그아웃"
            onClick={() => setShowLogoutConfirm(true)}
          /> */}
        </div>
        {/* 아이폰 하단 안전 영역 */}
        <div className="h-safe-bottom bg-white" />
      </div>

      {/* 하단 네비게이션 공간 확보를 위한 패딩 */}
      <div className="bg-white pb-16" />
    </>
  );
}

// 모바일 여부를 확인하는 hook
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 초기 검사
    checkMobile();

    // 윈도우 리사이즈 리스너 설정
    window.addEventListener("resize", checkMobile);

    // 클린업
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// 특정 페이지에서 활성화된 인덱스를 설정하기 위한 인터페이스
interface NavigationProps {
  defaultActiveIndex?: number;
  mobileOnly?: boolean;
}

// 외부에서 사용할 메인 네비게이션 컴포넌트
export default function Navigation({ mobileOnly = false }: NavigationProps) {
  const isMobile = useMobileDetection();

  // 모바일 전용 모드인데 모바일이 아닌 경우 null 반환
  if (mobileOnly && !isMobile) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NavigationComponent />
    </Suspense>
  );
}
