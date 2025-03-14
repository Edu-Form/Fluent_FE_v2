"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import Link from "next/link";

// 동적 컴포넌트 로딩
const Announcement = dynamic(
  () => import("@/components/Announcement/TeacherAnnouncement"),
  { ssr: false }
);

const TeacherNotice = dynamic(() => import("@/components/TeacherNotice"), {
  ssr: false,
});

const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });

const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  { ssr: false }
);

// 로딩 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg w-full h-full"></div>
);

const HomePageContent = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const URL = `/api/schedules/${type}/${user}`;
  const ALL_STUDENTS_URL = `/api/teacherStatus/${user}`;

  // 진행률 계산 함수
  const calculateProgress = (student: any) => {
    const completedItems = [
      student.class_note ? 1 : 0,
      student.quizlet_date ? 1 : 0,
      student.diary_date ? 1 : 0,
      student.diary_edit ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (completedItems / 4) * 100;
  };

  // 완료된 항목 수 계산 함수
  const countCompletedItems = (student: any) => {
    return [
      student.class_note ? 1 : 0,
      student.quizlet_date ? 1 : 0,
      student.diary_date ? 1 : 0,
      student.diary_edit ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  };

  useEffect(() => {
    if (!user || classes.length > 0) return;

    // 수업 스케줄 데이터 불러오기
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setClasses(data);
      })
      .catch((error) => console.log("Error fetching data:", error));

    // 모든 학생 데이터 불러오기
    fetch(ALL_STUDENTS_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched all students:", data);
        setAllStudents(data);
      })
      .catch((error) => console.log("Error fetching students:", error));
  }, [user, URL, ALL_STUDENTS_URL, classes.length]);

  return (
    <div className="flex w-full h-screen p-4 gap-4">
      {/* 왼쪽 영역 */}
      <div className="flex flex-col w-[40%] gap-4">
        {/* 시간 표시 - Alert 컴포넌트로 대체 */}
        <div className="rounded-lg h-[70px] overflow-hidden">
          <Suspense fallback={<SkeletonLoader />}>
            <Alert />
          </Suspense>
        </div>

        {/* 공지사항 */}
        <div className="bg-white rounded-lg p-4 shadow-lg h-[20%]">
          <div className="h-full">
            <Suspense fallback={<SkeletonLoader />}>
              <TeacherNotice />
            </Suspense>
          </div>
        </div>

        {/* 오늘의 학생 리스트 (확장됨) */}
        <div className="bg-white rounded-lg p-4 shadow-lg flex-1">
          <Suspense fallback={<SkeletonLoader />}>
            <Announcement />
          </Suspense>
        </div>
      </div>

      {/* 오른쪽 스케줄 영역 */}
      <div className="w-[60%] bg-white rounded-lg p-4 shadow-lg overflow-auto">
        <div className="space-y-6">
          {/* 캘린더 뷰 */}
          <div className="w-full">
            <Suspense fallback={<SkeletonLoader />}>
              <Teacher_toastUI data={classes} />
            </Suspense>
          </div>

          {/* 전체 학생 리스트 - 행 기반 테이블 디자인 */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                전체 학생 체크리스트
              </h2>
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                총 {allStudents.length}명
              </div>
            </div>

            {allStudents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">학생 정보가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 whitespace-nowrap">
                        학생 이름
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        진행 상황
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        Class Note
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        Quizlet
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        Diary 작성
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        Diary 첨삭
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        스케줄
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.map((student, index) => {
                      const completedCount = countCompletedItems(student);
                      const progressPercent = calculateProgress(student);

                      // 진행 상황에 따른 색상 설정
                      const progressColor =
                        progressPercent >= 75
                          ? "green"
                          : progressPercent >= 50
                          ? "blue"
                          : progressPercent >= 25
                          ? "orange"
                          : "red";

                      const colorClasses = {
                        green: "bg-green-100 text-green-800 border-green-200",
                        blue: "bg-blue-100 text-blue-800 border-blue-200",
                        orange:
                          "bg-orange-100 text-orange-800 border-orange-200",
                        red: "bg-red-100 text-red-800 border-red-200",
                      };

                      return (
                        <tr
                          key={index}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-3 font-medium text-gray-900">
                            {student.name}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center">
                              <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full`}
                                  style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor:
                                      progressColor === "green"
                                        ? "#22c55e"
                                        : progressColor === "blue"
                                        ? "#3b82f6"
                                        : progressColor === "orange"
                                        ? "#f97316"
                                        : "#ef4444",
                                  }}
                                ></div>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[progressColor]}`}
                              >
                                {completedCount}/4
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/student/class_note?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              className="inline-flex items-center justify-center"
                            >
                              <div
                                className={`${
                                  student.class_note
                                    ? "text-green-500"
                                    : "text-red-400"
                                } mr-1`}
                              >
                                {student.class_note ? (
                                  <IoCheckmarkCircle size={18} />
                                ) : (
                                  <IoCloseCircle size={18} />
                                )}
                              </div>
                              {student.class_note && (
                                <span className="text-xs text-gray-500">
                                  {student.class_note}
                                </span>
                              )}
                            </Link>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/student/quizlet?user=${user}&student_name=${student.name}`}
                              className="inline-flex items-center justify-center"
                            >
                              <div
                                className={`${
                                  student.quizlet_date
                                    ? "text-green-500"
                                    : "text-red-400"
                                } mr-1`}
                              >
                                {student.quizlet_date ? (
                                  <IoCheckmarkCircle size={18} />
                                ) : (
                                  <IoCloseCircle size={18} />
                                )}
                              </div>
                              {student.quizlet_date && (
                                <span className="text-xs text-gray-500">
                                  완료
                                </span>
                              )}
                            </Link>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/student/diary_note?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              className="inline-flex items-center justify-center"
                            >
                              <div
                                className={`${
                                  student.diary_date
                                    ? "text-green-500"
                                    : "text-red-400"
                                } mr-1`}
                              >
                                {student.diary_date ? (
                                  <IoCheckmarkCircle size={18} />
                                ) : (
                                  <IoCloseCircle size={18} />
                                )}
                              </div>
                              {student.diary_date && student.diary_edit && (
                                <span className="text-xs text-gray-500">
                                  {student.diary_edit}
                                </span>
                              )}
                            </Link>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/student/diary?user=${user}&type=teacher&student_name=${student.name}`}
                              className="inline-flex items-center justify-center"
                            >
                              <div
                                className={`${
                                  student.diary_edit
                                    ? "text-green-500"
                                    : "text-red-400"
                                } mr-1`}
                              >
                                {student.diary_edit ? (
                                  <IoCheckmarkCircle size={18} />
                                ) : (
                                  <IoCloseCircle size={18} />
                                )}
                              </div>
                              {student.diary_edit && (
                                <span className="text-xs text-gray-500">
                                  완료
                                </span>
                              )}
                            </Link>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/schedule?user=${user}&type=teacher&id=${id}`}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                              스케줄 보기
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
