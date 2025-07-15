"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { IoCheckmarkCircle, IoCloseCircle, IoMenu } from "react-icons/io5";
import Link from "next/link";

// 동적 컴포넌트 로딩
const Announcement = dynamic(
  () => import("@/components/Announcement/TeacherAnnouncement"),
  { ssr: false }
);

// const TeacherNotice = dynamic(() => import("@/components/TeacherNotice"), {
//   ssr: false,
// });

const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });

const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  { ssr: false }
);

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Step 1: 수업 등록", "Step 2: 수업 노트", "퀴즐렛", "다이어리", "완료"];
  const minPercent = 10; // Minimum width to show some progress
  const progressPercent =
    currentStep === 1
      ? minPercent
      : ((currentStep - 1) / (steps.length - 1)) * 100;
  const currentLabel = steps[currentStep - 1] || "";

  return (
    <div className="relative w-full h-6 bg-purple-200 rounded-full overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-300"
        style={{ width: `${progressPercent}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-sm font-medium z-10">
          {currentLabel}
        </span>
      </div>
    </div>
  );
};

const StepDetailPanel = ({
  currentStep,
  studentName,
  classNoteDate,
  onStepUpdated,
  user,
  student,
}: {
  currentStep: number;
  studentName: string;
  classNoteDate?: string;
  onStepUpdated: (newStep: number) => void;
  user?: string | null;
  student?: any;
}) => {
  const [scheduleDates, setScheduleDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentStep === 1 && studentName) {
      fetch(`/api/schedules/student/${studentName}`)
        .then((res) => res.json())
        .then((data) => setScheduleDates(data.map((d: any) => d.date)))
        .catch((err) => console.error("Failed to fetch schedule:", err));
    }
  }, [currentStep, studentName]);

  useEffect(() => {
    if (currentStep === 2 && classNoteDate) {
      setSelectedDate(classNoteDate);
    }
  }, [currentStep, classNoteDate]);

  const handleSubmitStep1 = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          step: "수업 등록",
          date: selectedDate,
        }),
      });
      if (res.ok) onStepUpdated(2);
      else console.error("등록 실패");
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStep2 = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          current_progress_update: { class_note: selectedDate },
        }),
      });
      if (res.ok) onStepUpdated(3);
      else console.error("업데이트 실패");
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStep4 = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          current_progress_update: { quizlet: student?.quizlet_link || "" },
        }),
      });
      if (res.ok) onStepUpdated(5);
      else console.error("업데이트 실패");
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="date-select" className="sr-only">
          수업 날짜 선택
        </label>
        <select
          id="date-select"
          className="flex-1 border border-gray-300 rounded p-1 text-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="">날짜를 선택하세요</option>
          {scheduleDates.map((date, idx) => (
            <option key={idx} value={date}>
              {date}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmitStep1}
          disabled={isSubmitting || !selectedDate}
          className={`px-3 py-1 text-sm font-medium rounded text-white transition ${
            isSubmitting || !selectedDate
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isSubmitting ? "등록 중..." : "다음"}
        </button>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="step2-date-select" className="sr-only">
          클래스 노트 날짜 선택
        </label>
        <select
          id="step2-date-select"
          className="flex-1 border border-gray-300 rounded p-1 text-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled
        >
          <option value={classNoteDate}>{classNoteDate}</option>
        </select>
        <button
          onClick={handleSubmitStep2}
          disabled={isSubmitting}
          className={`px-3 py-1 text-sm font-medium rounded text-white transition ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isSubmitting ? "업데이트 중..." : "다음"}
        </button>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="mt-2">
        Quizlet Link:{" "}
        <Link
          href={`/teacher/student/quizlet?user=${user}&student_name=${studentName}`}
          className="inline-flex items-center justify-center hover:bg-blue-50 p-2 rounded-lg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          여기 클릭
        </Link>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="mt-2">
        <button
          onClick={handleSubmitStep4}
          disabled={isSubmitting}
          className={`px-3 py-1 text-sm font-medium rounded text-white transition ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isSubmitting ? "처리중..." : "AI 확인 완료"}
        </button>
      </div>
    );
  }

  return null;
};






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
  const [activeTab, setActiveTab] = useState("calendar"); // 'calendar' 또는 'students'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [studentProgress, setStudentProgress] = useState<{ [name: string]: number }>({});

  const URL = `/api/schedules/${type}/${user}`;
  const ALL_STUDENTS_URL = `/api/teacherStatus/${user}`;

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // 모바일에서 사이드바는 기본적으로 닫혀있도록 설정
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // 초기 로드 시 체크
    checkMobile();

    // 리사이즈 이벤트에 대한 리스너 추가
    window.addEventListener("resize", checkMobile);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

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
  
    // Fetch schedules
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
      })
      .catch((error) => console.log("Error fetching data:", error));
  
    // Fetch student list
    fetch(ALL_STUDENTS_URL)
      .then((res) => res.json())
      .then(async (data) => {
        setAllStudents(data);
  
        // 🔽 Fetch individual progress for each student
        const progressMap: { [name: string]: number } = {};
  
        await Promise.all(
          data.map(async (student: any) => {
            try {
              const res = await fetch(`/api/progress/${student.name}`);
              const result = await res.json();
              progressMap[student.name] = result?.step || 1;
            } catch (err) {
              console.error(`Error loading progress for ${student.name}`, err);
              progressMap[student.name] = 1; // fallback
            }
          })
        );
  
        setStudentProgress(progressMap);
      })
      .catch((error) => console.log("Error fetching students:", error));
  }, [user, URL, ALL_STUDENTS_URL, classes.length]);
  

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600"
          >
            <IoMenu size={24} />
          </button>
          <h1 className="text-lg font-bold">{user || "교사"} 대시보드</h1>
          <div className="w-8"></div> {/* 균형을 위한 빈 공간 */}
        </div>

        {/* 모바일 탭 */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "calendar"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            캘린더
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "students"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            학생 체크리스트
          </button>
        </div>
      </div>

      {/* 사이드바 - 모바일에서는 오버레이로 표시 */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 z-40 md:z-0 transition-transform duration-300 
        bg-white md:w-[40%] lg:w-[30%] h-screen md:h-auto shadow-lg md:shadow-none 
        top-0 left-0 overflow-auto pt-16 md:pt-4 pb-4 px-4`}
      >
        {/* 모바일에서 사이드바 닫기 버튼 */}
        <div className="md:hidden absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full bg-gray-100 text-gray-600"
          >
            <IoCloseCircle size={20} />
          </button>
        </div>

        {/* 사이드바 내용 */}
        <div className="flex flex-col h-full gap-4">
          {/* 시간 표시 - Alert 컴포넌트 */}
          <div className="rounded-lg h-[70px] overflow-hidden">
            <Suspense fallback={<SkeletonLoader />}>
              <Alert />
            </Suspense>
          </div>

          {/* 공지사항 */}
          {/* <div className="bg-white rounded-lg p-4 shadow-sm md:h-[20%]">
            <div className="h-full">
              <Suspense fallback={<SkeletonLoader />}>
                <TeacherNotice />
              </Suspense>
            </div>
          </div> */}

          {/* 오늘의 학생 리스트 */}
          <div className="bg-white rounded-lg p-4 shadow-sm flex-1">
            <Suspense fallback={<SkeletonLoader />}>
              <Announcement />
            </Suspense>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-grow overflow-auto md:p-4 pt-32 md:pt-4 pb-20 md:pb-4">
        {/* 캘린더 뷰 - 모바일에서는 탭에 따라 표시 */}
        <div
          className={`${
            activeTab === "calendar" || !isMobile ? "block" : "hidden"
          } md:block mb-6`}
        >
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:hidden">
              캘린더
            </h2>
            <Suspense fallback={<SkeletonLoader />}>
              <Teacher_toastUI data={classes} />
            </Suspense>
          </div>
        </div>

        {/* 전체 학생 리스트 - 모바일에서는 탭에 따라 표시 */}
        <div
          className={`${
            activeTab === "students" || !isMobile ? "block" : "hidden"
          } md:block`}
        >
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                전체 학생 체크리스트
              </h2>
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                총 {allStudents.length}명
              </div>
            </div>

            {allStudents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">학생 정보가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                {/* 모바일 뷰 - 카드 형태로 표시 */}
                <div className="md:hidden space-y-4">
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
                      orange: "bg-orange-100 text-orange-800 border-orange-200",
                      red: "bg-red-100 text-red-800 border-red-200",
                    };

                    return (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-900">
                            {student.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[progressColor]}`}
                          >
                            {completedCount}/4
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="h-2 rounded-full"
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

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <div
                              className={`${
                                student.class_note
                                  ? "text-green-500"
                                  : "text-red-400"
                              } mr-2`}
                            >
                              {student.class_note ? (
                                <IoCheckmarkCircle size={16} />
                              ) : (
                                <IoCloseCircle size={16} />
                              )}
                            </div>
                            <Link
                              href={`/teacher/student/class_record?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              className="text-gray-700 hover:text-blue-600 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Class Note
                            </Link>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`${
                                student.quizlet_date
                                  ? "text-green-500"
                                  : "text-red-400"
                              } mr-2`}
                            >
                              {student.quizlet_date ? (
                                <IoCheckmarkCircle size={16} />
                              ) : (
                                <IoCloseCircle size={16} />
                              )}
                            </div>
                            <Link
                              href={`/teacher/student/quizlet?user=${user}&student_name=${student.name}`}
                              className="text-gray-700 hover:text-blue-600 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Quizlet
                            </Link>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`${
                                student.diary_date
                                  ? "text-green-500"
                                  : "text-red-400"
                              } mr-2`}
                            >
                              {student.diary_date ? (
                                <IoCheckmarkCircle size={16} />
                              ) : (
                                <IoCloseCircle size={16} />
                              )}
                            </div>
                            <Link
                              href={`/teacher/student/diary_note?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              className="text-gray-700 hover:text-blue-600 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Diary 작성
                            </Link>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`${
                                student.diary_edit
                                  ? "text-green-500"
                                  : "text-red-400"
                              } mr-2`}
                            >
                              {student.diary_edit ? (
                                <IoCheckmarkCircle size={16} />
                              ) : (
                                <IoCloseCircle size={16} />
                              )}
                            </div>
                            <Link
                              href={`/teacher/student/diary?user=${user}&type=teacher&student_name=${student.name}`}
                              className="text-gray-700 hover:text-blue-600 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Diary 첨삭
                            </Link>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                          <Link
                            href={`/teacher/schedule?user=${user}&type=teacher&id=${id}`}
                            className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            스케줄 보기
                          </Link>

                          <Link
                            href={`/teacher/student/curriculum?user=${user}&type=teacher&id=${id}&student_name=${student.name}`}
                            className="text-xs text-yellow-500 font-medium hover:text-yellow-700 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            커리큘럼
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱 뷰 - 테이블 형태로 표시 */}
                <table className="hidden md:table w-full text-sm text-left">
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
                      <th
                        scope="col"
                        className="px-3 py-3 text-center whitespace-nowrap"
                      >
                        커리큘럼
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
                                  className="h-2 rounded-full"
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
                              href={`/teacher/student/class_record?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              className="inline-flex items-center justify-center hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
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
                              className="inline-flex items-center justify-center hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
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
                              className="inline-flex items-center justify-center hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
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
                              className="inline-flex items-center justify-center hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
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
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:bg-indigo-50 px-3 py-2 rounded-lg inline-block"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              스케줄 보기
                            </Link>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/teacher/student/curriculum?user=${user}&type=teacher&id=${id}&student_name=${student.name}`}
                              className="text-xs text-yellow-500 hover:text-yellow-700 font-medium transition-colors hover:bg-yellow-50 px-3 py-2 rounded-lg inline-block"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              커리큘럼
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Step Progress View 추가 */}
                <div className="hidden md:block mt-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    전체 학생 Checklist
                  </h3>
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">학생 이름</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Progress</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.map((student, index) => {
                          const currentStep = studentProgress[student.name] || 1;
                          return (
                            <React.Fragment key={student.name}>
                            <tr
                              className="border-t"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium w-[15%]">{student.name}</td>
                              <td className="px-4 py-3 w-[30%]">
                                <StepProgress currentStep={currentStep} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="mt-2 bg-purple-50 p-3 rounded">
                                <StepDetailPanel
                                  currentStep={currentStep}
                                  studentName={student.name}
                                  classNoteDate={student.class_note}
                                  onStepUpdated={(newStep) => {
                                    setStudentProgress((prev) => ({
                                      ...prev,
                                      [student.name]: newStep,
                                    }));
                                  }}
                                />
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

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
