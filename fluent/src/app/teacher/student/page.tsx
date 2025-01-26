"use client";

import { API } from "@/utils/api";
import Lottie from "lottie-react";
import timerAnimationData from "@/src/app/lotties/mainLoading.json";
import { FaCheck } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

// DiaryContent 컴포넌트 예시
const DiaryContent = ({ student_name }: { student_name: string }) => {
  return <div>Diary Content for {student_name}</div>;
};

// QuizletContent 컴포넌트
const QuizletContent = ({ student_name }: { student_name: string }) => {
  const [quizletData, setQuizletData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizletData = async () => {
      try {
        const response = await fetch(
          `http://example.com/api/quizlet/${student_name}`
        );
        const data = await response.json();
        setQuizletData(data);
      } catch (error) {
        console.error("Error fetching Quizlet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizletData();
  }, [student_name]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-xl font-['Playwrite']">
        <div>Loading Quizlet...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quizlet for {student_name}</h2>
      <div className="space-y-4">
        {quizletData.map((item, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p>{item.description}</p>
            {/* 퀴즈렛 카드 내용 */}
          </div>
        ))}
      </div>
    </div>
  );
};

const Student_List = ({ data }: any) => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const student_name = searchParams.get("student_name");
  const func = searchParams.get("func");

  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item: string[]) =>
    item[0].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRightContent = () => {
    if (!student_name)
      return <div> 오른쪽 공간은 학생클릭시 나올 내용 (수정필요))</div>;
    switch (type) {
      case "diary":
        return <DiaryContent student_name={student_name} />;
      case "quizlet":
        return <QuizletContent student_name={student_name} />;
      default:
        return <div>잘못된 타입입니다.</div>;
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* Left side - Student List */}
      <div className="w-[300px] min-w-[300px] flex flex-col items-center border-r border-gray-200 bg-white p-4 h-full">
        <div className="w-full">
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

        <div className="flex flex-col justify-center p-4 gap-4 w-full overflow-y-auto">
          {filteredData.map((item: string[], index: number) => (
            <div key={index}>
              <Link
                href={`/teacher/student/${func}?user=${user}&type=${type}&id=${user}&student_name=${item[0]}`}
                className="w-full h-20 p-2 gap-2 rounded-xl flex justify-start items-center text-black bg-white hover:bg-[#8A8CAF] hover:border-[#8A8CAF] transform hover:scale-105 transition-all duration-300 border border-gray-100 shadow-sm"
              >
                <div className="flex w-2 h-12 rounded-xl bg-[#2675F8]"></div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <FaCheck className="text-[#2675F8] text-lg" />
                </div>
                <div className="text-center font-semibold m-2 text-lg">
                  {item[0]}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Dynamic Content */}
      <div className="flex-1 overflow-hidden">{renderRightContent()}</div>
    </div>
  );
};

const Home = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const URL = `${API}/api/diary/${type}/${user}`;
        const res = await fetch(URL, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setData(data);
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, type]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center text-xl font-['Playwrite']">
        <div>Fluent</div>
        <div className="mt-4 w-32 h-32">
          <Lottie animationData={timerAnimationData} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {data.length >= 1 ? <Student_List data={data} /> : <div>Loading...</div>}
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}
