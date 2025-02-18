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

  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const URL = `/api/schedules/${type}/${user}`;
  const ALL_STUDENTS_URL = `/api/students/${user}`;

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

  // 상태 토글 함수 (예시)
  const toggleStudentStatus = (studentId: string) => {
    // 실제 구현은 백엔드 API 호출 필요
    console.log(`Toggle status for student ${studentId}`);
  };

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
        <div className="space-y-4">
          {/* 캘린더 뷰 */}
          <div className="w-full">
            <Suspense fallback={<SkeletonLoader />}>
              <Teacher_toastUI data={classes} />
            </Suspense>
          </div>

          {/* 전체 학생 리스트 테이블 */}
          <div className="w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              전체 학생 리스트
            </h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      학생 이름
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Toggle
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Class Note
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Quizlet
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Diary 첨삭
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Diary 작성
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      스케줄
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((student, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-100 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStudentStatus(student.id)}
                          className="flex justify-center items-center w-full"
                        >
                          {student.is_active ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/teacher/student/classnote?student=${student.student_name}`}
                          className="flex justify-center items-center w-full"
                        >
                          {student.class_note_completed ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/teacher/student/quizlet?student=${student.student_name}`}
                          className="flex justify-center items-center w-full"
                        >
                          {student.quizlet_completed ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/teacher/student/diary?student=${student.student_name}`}
                          className="flex justify-center items-center w-full"
                        >
                          {student.diary_feedback_completed ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/teacher/student/diary?student=${student.student_name}`}
                          className="flex justify-center items-center w-full"
                        >
                          {student.diary_written ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/teacher/student/schedule?student=${student.student_name}`}
                          className="flex justify-center items-center w-full"
                        >
                          {student.schedule_updated ? (
                            <IoCheckmarkCircle className="text-green-500 text-xl" />
                          ) : (
                            <IoCloseCircle className="text-red-500 text-xl" />
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allStudents.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  학생 정보가 없습니다.
                </div>
              )}
            </div>
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
