"use client";

import type * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaSearch, FaCheck } from "react-icons/fa";
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
    <div className="w-[300px] h-full border-r bg-white flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="학생 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A8CAF] focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {filteredData.map((item: string, index: number) => (
            <div
              key={index}
              onClick={() => handleStudentClick(item)}
              className="w-full h-20 p-2 gap-2 rounded-xl flex justify-start items-center text-black bg-white hover:bg-[#8A8CAF] hover:border-[#8A8CAF] transform hover:scale-105 transition-all duration-300 border border-gray-100 shadow-sm cursor-pointer"
            >
              <div className="flex w-2 h-12 rounded-xl bg-[#2675F8]"></div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <FaCheck className="text-[#2675F8] text-lg" />
              </div>
              <div className="text-center font-semibold m-2 text-lg">
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
