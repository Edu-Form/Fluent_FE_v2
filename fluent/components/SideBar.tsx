"use client";

import type * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaSearch, FaUser } from "react-icons/fa";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
import timerAnimationData from "@/src/app/lotties/mainLoading.json";

interface SidebarLayoutProps {
  onStudentSelect: (student: string) => void;
}

export function SidebarLayout({ onStudentSelect }: SidebarLayoutProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarContent onStudentSelect={onStudentSelect} />
    </Suspense>
  );
}

const SidebarContent = ({ onStudentSelect }: SidebarLayoutProps) => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const currentStudent = searchParams.get("student_name");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const URL = `/api/diary/${type}/${user}`;
        const res = await fetch(URL, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch");
        const responseData = await res.json();
        setData(responseData);
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, type]);

  const filteredData = data.filter((item: string) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentClick = (student: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("student_name", student);
    window.history.pushState(null, "", `?${searchParams.toString()}`);
    onStudentSelect(student);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-[300px] border-r">
        <Lottie animationData={timerAnimationData} className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div className="w-[300px] h-full bg-white flex flex-col">
      {/* 헤더 영역 */}
      <div className="flex-none px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[17px] font-semibold text-gray-900">학생 목록</h1>
          <div className="text-[13px] text-gray-600">
            총 {filteredData.length}명
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            placeholder="이름으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 px-4 py-2 pl-11 text-[15px] bg-gray-100 rounded-[14px] 
              placeholder-gray-500 border-0 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
              transition-all"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* 학생 리스트 */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3">
        <div className="py-1 space-y-[2px]">
          {filteredData.map((item, index) => (
            <div
              key={index}
              onClick={() => handleStudentClick(item)}
              className={`group px-2 py-[10px] rounded-xl transition-all cursor-pointer
                ${currentStudent === item ? "bg-blue-50" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    currentStudent === item
                      ? "bg-blue-100"
                      : "bg-gray-100 group-hover:bg-blue-50"
                  }`}
                >
                  <FaUser
                    className={`text-[15px] 
                    ${
                      currentStudent === item
                        ? "text-blue-600"
                        : "text-gray-600 group-hover:text-blue-500"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <p
                    className={`text-[15px] font-medium
                    ${
                      currentStudent === item
                        ? "text-blue-600"
                        : "text-gray-900"
                    }`}
                  >
                    {item}
                  </p>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    최근 수업: data
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FaSearch className="text-gray-400 text-lg" />
            </div>
            <p className="text-[15px] text-gray-900">검색 결과가 없습니다</p>
            <p className="text-[13px] text-gray-500 mt-1">
              다른 검색어를 입력해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
