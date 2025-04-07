"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [Quizletopen, setQuizletOpen] = useState(false);
  const [Diaryopen, setDiaryOpen] = useState(false);
  const [MockTestopen, setMockTestOpen] = useState(false);
  const [textData, setTextData] = useState<[]>([]);
  const [text2Data, setText2Data] = useState<[]>([]);

  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const id = searchParams.get("id");
  const student_name = searchParams.get("student_name");

  useEffect(() => {
    const fetchQuizletData = async () => {
      try {
        const response = await fetch(`/api/quizlet/student/${student_name}`);

        if (!response.ok) {
          setTextData([]);
          return;
        }

        const quizletData = await response.json();
        setTextData(quizletData); // Assuming textData is an array
      } catch (error) {
        console.error("Error fetching quizlet data:", error);
      }
    };

    const fetchDiaryData = async () => {
      try {
        const response = await fetch(`/api/diary/student/${student_name}`);

        if (!response.ok) {
          setText2Data([]);
          return;
        }

        const diaryData = await response.json();
        setText2Data(diaryData); // Assuming textData is an array
      } catch (error) {
        console.error("Error fetching quizlet data:", error);
      }
    };

    fetchQuizletData();
    fetchDiaryData();
  }, [student_name]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-[20vw] bg-gray-800 text-white p-4 flex flex-col space-y-4 overflow-auto">
        <h1 className="font-bold">Curriculum</h1>
        <div className="w-[20vw] bg-gray-800 text-white p-4 flex flex-col space-y-2">
          <h2
            className="text-xl font-bold cursor-pointer flex items-center gap-1"
            onClick={() => setQuizletOpen(!Quizletopen)}
          >
            {Quizletopen ? "🔻" : "▶️"} Quizlet Notes
          </h2>
          {Quizletopen && (
            <>
              <Link
                href={`/teacher/student/curriculum/class_note?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
              >
                <span
                  className={`block p-2 rounded ml-3 ${
                    pathname ===
                    `/teacher/student/curriculum/class_note?user=${user}&type=teacher&id=${id}&student_name=${student_name}`
                      ? "bg-gray-700"
                      : ""
                  }`}
                >
                  새로운 Quizlet 만들기
                </span>
              </Link>
              <nav className="">
                {Array.isArray(textData) && textData.length > 0 ? (
                  textData
                    .slice()
                    .reverse()
                    .map((item: any, index) => (
                      <Link
                        key={index}
                        href={`/teacher/student/curriculum/class_note/text?user=${user}&type=teacher&id=${id}&student_name=${student_name}&item_id=${item._id}`}
                      >
                        <span
                          className={`ml-3 block p-2 rounded ${
                            pathname ===
                            `/teacher/student/curriculum/class_note/text?user=${user}&type=teacher&id=${id}&student_name=${student_name}&item_id=${item._id}`
                              ? "bg-gray-700"
                              : ""
                          }`}
                        >
                          {item.class_date}
                        </span>
                      </Link>
                    ))
                ) : (
                  <p className="text-gray-400">Loading...</p>
                )}
              </nav>
            </>
          )}

          <h2
            className="text-xl font-bold cursor-pointer flex items-center gap-1"
            onClick={() => setDiaryOpen(!Diaryopen)}
          >
            {Diaryopen ? "🔻" : "▶️"} Diary Notes
          </h2>
          {Diaryopen && (
            <>
              <Link
                href={`/teacher/student/curriculum/diary_note?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
              >
                <span
                  className={`block p-2 rounded ml-3 ${
                    pathname === "/teacher/student/curriculum/diary_note"
                      ? "bg-gray-700"
                      : ""
                  }`}
                >
                  새로운 Diary 만들기
                </span>
              </Link>
              <nav className="">
                {Array.isArray(text2Data) && text2Data.length > 0 ? (
                  text2Data
                    .slice()
                    .reverse()
                    .map((item: any, index) => (
                      <Link
                        key={index}
                        href={`/teacher/student/curriculum/diary_note/text?user=${user}&type=teacher&id=${id}&student_name=${student_name}&item_id=${item._id}`}
                      >
                        <span
                          className={`ml-3 block p-2 rounded ${
                            pathname ===
                            `/teacher/student/curriculum/diary_note/text?item_id=${item._id}`
                              ? "bg-gray-700"
                              : ""
                          }`}
                        >
                          {item.class_date}
                        </span>
                      </Link>
                    ))
                ) : (
                  <p className="text-gray-400">Loading...</p>
                )}
              </nav>
            </>
          )}

          <h2
            className="text-xl font-bold cursor-pointer flex items-center gap-1"
            onClick={() => setMockTestOpen(!MockTestopen)}
          >
            {MockTestopen ? "🔻" : "▶️"} Mock Test
          </h2>
          {MockTestopen && (
            <>
              <nav className="">
                <Link
                  href={`/teacher/student/curriculum/mock_test/self_introduction?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
                >
                  <span
                    className={`ml-3 block p-2 rounded ${
                      pathname ===
                      `/teacher/student/curriculum/mock_test/self_introduction?user=${user}&type=teacher&id=${id}&student_name=${student_name}`
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    Self Introduction
                  </span>
                </Link>
                <Link
                  href={`/teacher/student/curriculum/mock_test/grammar?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
                >
                  <span
                    className={`ml-3 block p-2 rounded ${
                      pathname ===
                      `/teacher/student/curriculum/mock_test/grammar?user=${user}&type=teacher&id=${id}&student_name=${student_name}`
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    Grammar
                  </span>
                </Link>
                <Link
                  href={`/teacher/student/curriculum/mock_test/bulk_answers?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
                >
                  <span
                    className={`ml-3 block p-2 rounded ${
                      pathname ===
                      `/teacher/student/curriculum/mock_test/bulk_answers?user=${user}&type=teacher&id=${id}&student_name=${student_name}`
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    Bulk Answers
                  </span>
                </Link>
                <Link
                  href={`/teacher/student/curriculum/mock_test/pillar_expressions?user=${user}&type=teacher&id=${id}&student_name=${student_name}`}
                >
                  <span
                    className={`ml-3 block p-2 rounded ${
                      pathname ===
                      `/teacher/student/curriculum/mock_test/pillar_expressions?user=${user}&type=teacher&id=${id}&student_name=${student_name}`
                        ? "bg-gray-700"
                        : ""
                    }`}
                  >
                    Pillar Expressions
                  </span>
                </Link>
              </nav>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
