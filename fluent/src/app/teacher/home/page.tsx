"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
// import { IoCheckmarkCircle, IoCloseCircle, IoMenu, IoCloseCircle as IoCloseIcon } from "react-icons/io5";
// import Link from "next/link";
import { IoCheckmarkCircle, IoCloseCircle, IoMenu, IoCloseCircle as IoCloseIcon } from "react-icons/io5";
import Link from "next/link";

// 동적 컴포넌트 로딩
const Announcement = dynamic(
  () => import("@/components/Announcement/TeacherAnnouncement"),
  { ssr: false }
);
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });
const Teacher_toastUI = dynamic(
  () => import("@/components/ToastUI/teacher_toastui"),
  { ssr: false }
);

// --- UI helpers ---
const Pill = ({
  ok,
  children,
  className = "",
}: {
  ok: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ring-1";
  const okCls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  const noCls = "bg-rose-50 text-rose-700 ring-rose-200";
  return <span className={`${base} ${ok ? okCls : noCls} ${className}`}>{children}</span>;
};

const CellWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex flex-col items-center gap-1">{children}</div>
);

// --- helpers (top of file, above any component) ---
function toDate(v: any): Date | null {
  if (!v) return null;
  const m = String(v).trim().match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function isBetweenInclusive(d: Date | null, a: Date | null, b: Date | null) {
  if (!d || !a || !b) return false;
  const min = a < b ? a : b;
  const max = a < b ? b : a;
  return d >= min && d <= max;
}

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

  // Put below other useState hooks
  const INACTIVE_DAYS_THRESHOLD = 21;
  const MS = 24 * 60 * 60 * 1000;

  const sortedStudents = React.useMemo(() => {
    const now = Date.now();
    const withFlag = (allStudents || []).map((s: any) => {
      const dt = toDate(s.class_note); // returns Date | null
      const inactive =
        dt ? (now - dt.getTime()) > (INACTIVE_DAYS_THRESHOLD * MS) : false;
      return { ...s, _inactive: inactive };
    });
    // inactive at bottom
    withFlag.sort((a: any, b: any) => {
      const ai = !!a._inactive;
      const bi = !!b._inactive;
      return ai === bi ? 0 : ai ? 1 : -1;
    });
    return withFlag;
  }, [allStudents]);

  const URL = `/api/schedules/${type}/${user}`;
  const ALL_STUDENTS_URL = `/api/teacherStatus/${user}`;

  // --- fetch helpers (with no-store) ---
  const fetchSchedules = async () => {
    if (!user) return;
    try {
      const res = await fetch(URL, { cache: "no-store" });
      const data = await res.json();
      setClasses(data || []);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const fetchStudents = async () => {
    if (!user) return;
    try {
      const res = await fetch(ALL_STUDENTS_URL, { cache: "no-store" });
      const data = await res.json();
      setAllStudents(data || []);
    } catch (error) {
      console.log("Error fetching students:", error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!user) return;
    fetchSchedules();
    fetchStudents();
  }, [user, URL, ALL_STUDENTS_URL]);

  // Listen for calendar mutations (POST/PATCH/DELETE) from toastui
  useEffect(() => {
    const onSaved = () => {
      fetchSchedules();
      fetchStudents();
    };
    window.addEventListener("calendar:saved", onSaved);
    return () => window.removeEventListener("calendar:saved", onSaved);
  }, [user, URL, ALL_STUDENTS_URL]);

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
            <IoCloseIcon size={20} />
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
              <Teacher_toastUI
                data={classes}
                studentOptions={allStudents.map((s: any) => s.name)}
                defaults={{ teacher_name: user || "", room_name: "HF1", time: 18, duration: 1 }}
                variant="compact"
              />
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
                            className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[progressColor as keyof typeof colorClasses]}`}
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
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱 뷰 - 테이블 형태로 표시 */}
                <table className="hidden md:table w-full text-sm text-left border-separate border-spacing-y-2">
                  <thead className="text-[11px] tracking-wide text-gray-600 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-center">학생 이름</th>
                      <th className="px-3 py-2 text-center">Class Note</th>
                      <th className="px-3 py-2 text-center">Quizlet</th>
                      <th className="px-3 py-2 text-center">AI Diary</th>
                      <th className="px-3 py-2 text-center">스케줄</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedStudents.map((student: any, index: number) => {
                      const isInactive = !!student._inactive;
                      const classNoteDate = toDate(student.class_note);
                      const prevClassNoteDate = toDate(student.previous_class_note);
                      const diaryDate = toDate(student.diary_date);
                      const diaryGreen = isBetweenInclusive(diaryDate, classNoteDate, prevClassNoteDate); // Rule 3

                      const classNoteOk = !!student.class_note;
                      const diaryOk = !!student.diary_date && diaryGreen;
                      const scheduleOk = !!student.schedule_date;

                      const cellBg = isInactive ? "bg-gray-100" : "bg-white";
                      const textTone = isInactive ? "text-gray-400" : "text-gray-900";

                      return (
                        <tr
                          key={index}
                          className={`shadow-sm ${isInactive ? "opacity-90" : ""}`}
                        >
                          <td className={`px-3 py-3 text-center align-middle rounded-l-xl border border-gray-100 ${cellBg}`}>
                            <div className={`text-[15px] font-semibold ${textTone}`}>{student.name}</div>
                          </td>

                          {/* Class Note */}
                          <td className={`px-3 py-3 text-center align-middle border border-l-0 border-gray-100 ${cellBg}`}>
                            <Link
                              href={`/teacher/student/class_record?user=${user}&type=${type}&id=${id}&student_name=${student.name}`}
                              target="_blank" rel="noopener noreferrer"
                              className="hover:opacity-90"
                              title="Open Class Note"
                            >
                              <CellWrap>
                                <Pill ok={classNoteOk}>
                                  {classNoteOk ? "Done" : "Missing"}
                                </Pill>
                                {student.class_note && (
                                  <span className="text-[11px] text-gray-500">{student.class_note}</span>
                                )}
                              </CellWrap>
                            </Link>
                          </td>

                          {/* Quizlet */}
                          <td
                            className={`px-3 py-3 text-center align-middle border border-l-0 border-gray-100 ${cellBg}`}
                          >
                            <Link
                              href={`/teacher/student/quizlet?user=${user}&student_name=${student.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-90"
                              title="Open Quizlet"
                            >
                              <CellWrap>
                                {(() => {
                                  const quizletDate = toDate(student.quizlet_date);
                                  const classNoteDate = toDate(student.class_note);
                                  const isBefore =
                                    quizletDate && classNoteDate && quizletDate < classNoteDate;
                                  const ok = !!student.quizlet_date && !isBefore;

                                  return (
                                    <>
                                      <Pill ok={ok}>{ok ? "Done" : "Missing"}</Pill>
                                      {student.quizlet_date && (
                                        <span
                                          className={`text-[11px] ${
                                            isBefore ? "text-red-500 font-medium" : "text-gray-500"
                                          }`}
                                        >
                                          {student.quizlet_date}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </CellWrap>
                            </Link>
                          </td>

                          {/* AI Diary */}
                          <td className={`px-3 py-3 text-center align-middle border border-l-0 border-gray-100 ${cellBg}`}>
                            <Link
                              href={`/teacher/student/diary?user=${user}&type=teacher&student_name=${student.name}`}
                              target="_blank" rel="noopener noreferrer"
                              className="hover:opacity-90"
                              title="Open AI Diary"
                            >
                              <CellWrap>
                                <Pill ok={diaryOk}>
                                  {diaryOk ? "Done" : "Missing"}
                                </Pill>
                                {student.diary_date && (
                                  <>
                                    <span className="text-[11px] text-gray-500">{student.diary_date}</span>
                                  </>
                                )}
                              </CellWrap>
                            </Link>
                          </td>

                          {/* Schedule */}
                          <td className={`px-3 py-3 text-center align-middle rounded-r-xl border border-l-0 border-gray-100 ${cellBg}`}>
                            <Link
                              href={`/teacher/schedule?user=${user}&type=teacher&student_name=${student.name}&id=${id}`}
                              target="_blank" rel="noopener noreferrer"
                              className="hover:opacity-90"
                              title="Open Schedule"
                            >
                              <CellWrap>
                                <Pill ok={scheduleOk}>
                                  {scheduleOk ? "Ready" : "Missing"}
                                </Pill>
                                {student.schedule_date && (
                                  <span className="text-[11px] text-gray-500">{student.schedule_date}</span>
                                )}
                              </CellWrap>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Step Progress View 추가 */}
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
