"use client";

import { useState, useEffect, Suspense, ReactNode, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
import debounce from "lodash.debounce";
import "react-day-picker/dist/style.css";
import { useRef } from "react";



// 날짜 포맷 함수들 유지
const formatToISO = (date: string | undefined): string => {
  // 기존 함수 유지
  try {
    if (!date) return "";

    const parts = date.trim().replace(/\.$/, "").split(". ");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // 이미 ISO 형식인 경우 검증 후 반환
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }

    return "";
  } catch (error) {
    console.error("날짜 포맷 오류:", error);
    return "";
  }
};

const today_formatted = (): string => {
  // 기존 함수 유지
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("오늘 날짜 포맷 오류:", error);
    return new Date().toISOString().split("T")[0]; // 대체 방법
  }
};

const formatToSave = (date: string | undefined): string => {
  // 기존 함수 유지
  try {
    if (!date) return "";

    // 유효한 날짜 형식인지 확인
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return "";

    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return "";

    return `${year}. ${month}. ${day}.`;
  } catch (error) {
    console.error("저장 형식 변환 오류:", error);
    return "";
  }
};

// ⏱️ mm:ss
const formatElapsed = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const combineDateAndTime = (dateDot: string | undefined, timeHHMM: string) => {
  if (!dateDot || !timeHHMM) return null;

  const m = dateDot.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  if (!m) return null;
  const [, y, mo, d] = m;

  const [hhStr, mmStr] = timeHHMM.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  return new Date(Number(y), Number(mo) - 1, Number(d), hh, mm, 0, 0);
};


// 퀴즐렛 페이지 내용 컴포넌트
const ClassPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // URL 파라미터 안전하게 가져오기
  const getParam = (name: string): string => {
    try {
      return searchParams?.get(name) || "";
    } catch (error) {
      console.error(`파라미터 가져오기 오류 (${name}):`, error);
      return "";
    }
  };

  const hasInitializedContent = useRef(false);

  const next_class_date = getParam("next_class_date");
  const user = getParam("user");
  const student_name = getParam("student_name");
  const type = getParam("type");
  const user_id = getParam("id");
  // ✅ Extract group students from URL params (group1_student_name, group2_student_name, ...)
  const groupStudentNamesFromURL = (() => {
    if (!searchParams) return [];

    const result: string[] = [];

    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("group") && key.endsWith("_student_name")) {
        result.push(value);
      }
    }

    return result;
  })();
  // ✅ Final resolved student list for this class
  const resolvedStudentNames: string[] =
    student_name
      ? [student_name]
      : groupStudentNamesFromURL;

  const isGroupClass = resolvedStudentNames.length > 1;
  const [class_date, setClassDate] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [original_text, setOriginal_text] = useState<string>("");
  const [loading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [quizletLines, setQuizletLines] = useState<
    { eng: string; kor: string }[]
  >([]);
  const [translating, setTranslating] = useState(false);
  const saveTempClassNote = useCallback(
    debounce(async (html: string) => {
      console.log("💾 Attempting to autosave:", { student_name, html }); // ← Add this
      try {
        await fetch("/api/quizlet/temp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_name, original_text: html }),
        });
      } catch (error) {
        console.error("❌ Autosave failed:", error);
      }
    }, 1000),
    [student_name]
  );

  // ⏱️ class timer state
  const [classStarted, setClassStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  type ClassPhase = "idle" | "running" | "ended";
  const [classPhase, setClassPhase] = useState<ClassPhase>("idle");

  // 🔹 Modify-class mode states
  const [isModifyMode, setIsModifyMode] = useState(false);
  // 🔹 Manual time input modal
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [manualStartTime, setManualStartTime] = useState(""); // "HH:MM"
  const [manualEndTime, setManualEndTime] = useState("");     // "HH:MM"
  // Page lock & call-to-action state
  const [isEditable, setIsEditable] = useState(false);       // blocks all inputs & editor
  const [awaitingAction, setAwaitingAction] = useState(true); // controls blinking on initial load
  const [recentClassnote, setRecentClassnote] = useState<any>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");


  // ⏸️ Pause timer
  const pauseTimer = () => {
    setClassStarted(false); // stop ticking
  };

  // ▶️ Resume timer
  const resumeTimer = () => {
    setClassStarted(true);  
    if (startTime !== null) {
      setStartTime(Date.now() - elapsedMs); // continue from where paused
    }
  };


  useEffect(() => {
    let t: number | null = null;
    if (classStarted && startTime) {
      t = window.setInterval(() => setElapsedMs(Date.now() - startTime), 1000);
    }
    return () => {
      if (t) window.clearInterval(t);
    };
  }, [classStarted, startTime]);


  // 마운트 확인 및 초기 데이터 설정
  useEffect(() => {
    setIsMounted(true);

    // 초기 날짜값 설정
    try {
      const formattedClassDate = formatToSave(formatToISO(next_class_date));
      const formattedToday = formatToSave(today_formatted());

      setClassDate(formattedClassDate);
      setDate(formattedToday);
    } catch (error) {
      console.error("날짜 초기화 오류:", error);
      // 오류 발생 시 기본값으로 오늘 날짜 사용
      const todayISO = new Date().toISOString().split("T")[0];
      setClassDate(formatToSave(todayISO));
      setDate(formatToSave(todayISO));
    }
  }, [next_class_date]);

  const saveClassnoteAndTranslate = async (opts: {
  started_at: string | null;
  ended_at: string;
  duration_ms: number | null;
}) => {
  const groupNames =
    resolvedStudentNames.length > 0
      ? resolvedStudentNames
      : [student_name];


  if (!homework.trim()) {
    alert("Homework field is required.");
    return;
  }
  if (!original_text || original_text.trim().length === 0) {
    alert("Please write class notes.");
    return;
  }
  if (!class_date || class_date.trim() === "") {
    alert("Please select a class date.");
    return;
  }
  if (!original_text.includes("<mark>")) {
    alert("Please highlight at least one Quizlet expression.");
    return;
  }

  // SAVE CLASSNOTE
  try {
    const classnotesPayload = {
      quizletData: {
        student_names: groupNames,
        class_date,
        date: class_date,
        original_text,
      },
      homework,
      nextClass,
      started_at: opts.started_at,
      ended_at: opts.ended_at,
      duration_ms: opts.duration_ms,
      quizlet_saved: false,
      teacher_name: user || "",
      type: type || "",
    };

    const classnotesRes = await fetch("/api/classnote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(classnotesPayload),
    });

    if (!classnotesRes.ok) {
      const err = await classnotesRes.json().catch(() => ({}));
      alert(err?.error || "Failed to save classnotes.");
      return;
    }

    const json = await classnotesRes.json().catch(() => null);
    const saved =
      json?.results?.[0]?.result ||
      json?.results?.[0] ||
      json;

    setRecentClassnote(saved || {
      student_name,
      class_date,
      date,
      started_at: opts.started_at,
      ended_at: opts.ended_at,
    });

    // Make sure timer values appear in modal
    if (opts.started_at && opts.ended_at) {
      const s = new Date(opts.started_at);
      const e = new Date(opts.ended_at);

      setEditStartTime(
        `${String(s.getHours()).padStart(2, "0")}:${String(
          s.getMinutes()
        ).padStart(2, "0")}`
      );

      setEditEndTime(
        `${String(e.getHours()).padStart(2, "0")}:${String(
          e.getMinutes()
        ).padStart(2, "0")}`
      );
    }

  } catch (err) {
    console.error("Classnotes save failed:", err);
    alert("Failed to save classnotes.");
    return;
  }

  // TRANSLATE (same as your previous logic)
  setTranslating(true);
  try {
    const response = await fetch("/api/quizlet/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ original_text }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || "Translation failed");
    }

    const { eng_quizlet, kor_quizlet } = await response.json();
    const merged = eng_quizlet.map((eng: string, i: number) => ({
      eng,
      kor: kor_quizlet[i] || "",
    }));

    setQuizletLines(merged);
    setTranslationModalOpen(true);
  } catch (err) {
    if (err instanceof Error) {
      alert(err.message);
    } else {
      alert("Unknown translation error.");
    }
  } finally {
    setTranslating(false);
  }
  };


  const handleEndClassClick = () => {
    pauseTimer();

    const start = new Date(startTime!);
    const end = new Date(startTime! + elapsedMs);

    setEditStartTime(
      `${String(start.getHours()).padStart(2, "0")}:${String(
        start.getMinutes()
      ).padStart(2, "0")}`
    );

    setEditEndTime(
      `${String(end.getHours()).padStart(2, "0")}:${String(
        end.getMinutes()
      ).padStart(2, "0")}`
    );

    saveClassnoteAndTranslate({
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      duration_ms: elapsedMs,
    });
  };



  const handleManualTimeConfirm = async () => {
  if (!manualStartTime || !manualEndTime) {
    alert("Please enter both start and end time.");
    return;
  }
  if (!class_date) {
    alert("Missing class date.");
    return;
  }

  const startDt = combineDateAndTime(class_date, manualStartTime);
  const endDt = combineDateAndTime(class_date, manualEndTime);

  if (!startDt || !endDt) {
    alert("Invalid time.");
    return;
  }
  if (endDt.getTime() <= startDt.getTime()) {
    alert("End time must be after start time.");
    return;
  }

  const duration_ms = endDt.getTime() - startDt.getTime();

  // reuse your shared logic
  await saveClassnoteAndTranslate({
    started_at: startDt.toISOString(),
    ended_at: endDt.toISOString(),
    duration_ms,
  });

  setTimeModalOpen(false);
  };

  interface Note {
    _id: string;
    student_name: string;
    class_date: string;
    date: string;
    original_text: string;
    homework?: string;
    nextClass?: string; // Added nextClass property
  }

  const [searchedNotes, setSearchedNotes] = useState<Note[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const PersistentHeading = Extension.create({
    name: "persistentHeading",

    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          const { state, dispatch } = editor.view;
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name.startsWith("heading")) {
            const level = node.attrs.level;
            const shouldKeepHighlight = editor.isActive("highlight");

            splitBlock(state, dispatch);
            editor.commands.setNode("heading", { level });

            if (shouldKeepHighlight) {
              editor.commands.setMark("highlight");
            }

            return true;
          }

          return false;
        },
      };
    },
  });


  const CustomHighlight = Highlight.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      };
    },
  });

  type TabKey = "beginner" | "intermediate" | "business";

  type TemplateLevel = "beginner" | "intermediate" | "business";

  interface TemplateDoc {
    template_name: string;
    html: string;
    level: TemplateLevel;
  }

  const [activeTab, setActiveTab] = useState("beginner");

  const [templates, setTemplates] = useState<Record<TemplateLevel, TemplateDoc[]>>({
    beginner: [],
    intermediate: [],
    business: [],
  });

  // const templates: Record<TabKey, string[]> = {
  //   beginner: [
  //     DavidTemplate1,
  //     notesTemplate1,
  //     notesTemplate2,
  //     notesTemplate3,
  //     notesTemplate4,
  //     notesTemplate5,
  //     BegMockTest1,
  //     BegMockTest2,
  //   ],
  //   intermediate: [
  //     intermediateTemplate1,
  //     intermediateTemplate2,
  //     intermediateTemplate3,
  //     intermediateTemplate4,
  //     intermediateTemplate5,
  //     IntMockTest1,
  //     IntMockTest2,
  //   ],
  //   business: [
  //     businessTemplate1,
  //     businessTemplate2,
  //   ],
  // };

  const [homework, setHomework] = useState("");
  const [nextClass, setNextClass] = useState("");
  const latestNote = searchedNotes[0]; // already reversed = newest first
  const latestHomework = latestNote?.homework || "";
  const latestNextClass = latestNote?.nextClass || "";
  const [activeOption, setActiveOption] = useState<"option1" | "option2" | "option3">(
    "option1"
  );

  useEffect(() => {
    const fetchStudentNotes = async () => {
      // ✅ Decide which student to use for previous-notes lookup
      const historyStudent =
        student_name || groupStudentNamesFromURL[0];

      if (!historyStudent) return;


      setSearchLoading(true);
      setSearchError(null);
      setSearchedNotes([]);

      try {
        const res = await fetch(
          `/api/quizlet/student/${encodeURIComponent(historyStudent)}`
        );
        if (!res.ok) throw new Error("No student found");

        const data: Note[] = await res.json();
        if (!data || data.length === 0) {
          setSearchError("No student available.");
        } else {
          setSearchedNotes(data);
        }
      } catch {
        setSearchError("No student available.");
      } finally {
        setSearchLoading(false);
      }
    };

    fetchStudentNotes();
  }, [searchParams]);

  const [studentList, setStudentList] = useState<string[]>([]);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<string[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const group_student_names: string[] =
    selectedGroupStudents.length > 0
      ? [student_name, ...selectedGroupStudents]
      : [student_name];

  useEffect(() => {
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/classnote/template", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data: TemplateDoc[] = await res.json();

      const grouped: Record<TemplateLevel, TemplateDoc[]> = {
        beginner: [],
        intermediate: [],
        business: [],
      };

      data.forEach((tpl) => {
        if (tpl.level && grouped[tpl.level]) {
          grouped[tpl.level].push(tpl);
        }
      });

      setTemplates(grouped);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  fetchTemplates();
  }, []);


  // Fetch student list
  useEffect(() => {
    const fetchStudentList = async () => {
      try {
        const URL = `/api/diary/${type}/${user}`;
        const response = await fetch(URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch student list");

        const data: string[] = await response.json();
        setStudentList(data.filter((name) => name !== student_name)); // exclude current student
      } catch (error) {
        console.error("Error fetching student list:", error);
      }
    };

    fetchStudentList();
  }, [type, user, student_name]);

  const editor = useEditor({
    extensions: [StarterKit, CustomHighlight, Underline, PersistentHeading],
    content: original_text,
    editable: false, // 🔒 start locked
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setOriginal_text(html);
      saveTempClassNote(html);
    },
  });

  // useEffect(() => {
  //   const initFromRecent = async () => {
  //     if (!student_name || !editor) return;

  //     // 🚫 DO NOT OVERRIDE TEMP
  //     if (hasInitializedContent.current) return;

  //     try {
  //       const res = await fetch(
  //         `/api/classnote/recent?student_name=${encodeURIComponent(student_name)}`,
  //         { cache: "no-store" }
  //       );

  //       if (!res.ok) return;

  //       const recent = await res.json();
  //       setRecentClassnote(recent);

  //       // ONLY load if quizlet is unfinished
  //       if (recent?.quizlet_saved === false && recent?.original_text) {
  //         hasInitializedContent.current = true;

  //         setOriginal_text(recent.original_text);
  //         editor.commands.setContent(recent.original_text);
  //       }
  //     } catch (err) {
  //       console.error("recent classnote init error:", err);
  //     }
  //   };

  //   initFromRecent();
  // }, [student_name, editor]);


  useEffect(() => {
    if (editor) editor.setEditable(isEditable);
  }, [editor, isEditable]);

  useEffect(() => {
    const loadTempNote = async () => {
      if (!student_name || !editor) return;

      try {
        const res = await fetch(
          `/api/quizlet/temp?student_name=${encodeURIComponent(student_name)}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (!data?.original_text) return;

        // 🔥 TEMP HAS HIGHEST PRIORITY
        hasInitializedContent.current = true;

        setOriginal_text(data.original_text);
        editor.commands.setContent(data.original_text);
      } catch (err) {
        console.error("Failed to load temp note:", err);
      }
    };

    loadTempNote();
  }, [student_name, editor]);

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === original_text) return;

    editor.commands.setContent(original_text);
  }, [original_text, editor]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!original_text || original_text.trim() === "") return;

      e.preventDefault();
      e.returnValue = "지금 페이지를 나가면, 입력한 정보가 모두 삭제됩니다.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [original_text]);

  // 클라이언트 측 렌더링이 아직 완료되지 않았을 경우 간단한 로딩 표시
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F8F9FA]">
      {/* 로딩 오버레이 - 토스 스타일 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* 성공 메시지 - 토스 스타일 */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-72 bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 animate-scale-in">
            <div className="w-16 h-16 bg-[#3182F6] rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#191F28] mb-2">저장 완료</h2>
            <p className="text-[#8B95A1] text-center text-sm leading-relaxed">
              수업 노트가 성공적으로
              <br />
              저장되었습니다.
            </p>
          </div>
        </div>
      )}

      {/* 헤더 - 토스 스타일 */}
      <header
        className={`border-b px-6 py-5 flex items-center justify-between transition-colors
          ${
            isGroupClass
              ? "bg-[#F2F8FF] border-[#E8F3FF]"
              : "bg-white border-[#F2F4F6]"
          }
        `}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                user_id
              )}`;
              router.push(redirectUrl);
            }}
            className="p-2 hover:bg-[#F8F9FA] rounded-xl transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#4E5968]"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#191F28]">Class Note</h1>
            {resolvedStudentNames.length > 0 && (
              <div className="px-4 py-2 bg-[#F2F8FF] rounded-full border border-[#E8F3FF]">
                <span className="text-sm font-semibold text-[#3182F6]">
                  {resolvedStudentNames.join(", ")}
                </span>
              </div>
            )}
            {classStarted && (
              <div className="px-3 py-1.5 bg-[#FFF3BF] rounded-full border border-[#FFE066]">
                <span className="text-sm font-semibold text-[#E67700]">
                  {formatElapsed(elapsedMs)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all font-semibold text-sm shadow-sm"
          >
            Group Class
          </button>

          {/* 날짜 선택기 - 토스 스타일 */}
          <div className="relative">
            <input
              type="date"
              name="class_date"
              id="class_date"
              defaultValue={formatToISO(next_class_date)}
              onChange={(e) => setClassDate(formatToSave(e.target.value))}
              className="px-4 py-2.5 bg-white border border-[#E5E8EB] rounded-xl focus:border-[#3182F6] focus:ring-4 focus:ring-[#3182F6]/10 transition-all text-sm font-medium text-[#4E5968] w-40"
              required
              disabled={loading || !isEditable}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B95A1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>

          {/* 작성 가이드 툴팁 버튼 - 토스 스타일 */}
          <div className="relative group">
            <button
              type="button"
              className="p-2.5 text-[#8B95A1] hover:bg-[#F8F9FA] rounded-xl transition-colors"
              aria-label="작성 가이드"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>

            {/* 툴팁 내용 - 토스 스타일 */}
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#F2F4F6] rounded-2xl shadow-xl p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
              <p className="text-sm text-[#4E5968] leading-relaxed">
                Curriculum 1, 2, 3 버튼을 클릭해서 템플릿을 불러오세요.
              </p>
            </div>
          </div>

          {/* 닫기 버튼 - 토스 스타일 */}
          <button
            onClick={() => {
              const redirectUrl = `/teacher/home?user=${encodeURIComponent(
                user
              )}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(
                user_id
              )}`;
              router.push(redirectUrl);
            }}
            className="p-2.5 text-[#8B95A1] hover:bg-[#F8F9FA] rounded-xl transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex-grow flex flex-col overflow-hidden"
      >
        {/* 메인 컨텐츠 영역 */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          <div className="p-6 flex flex-col h-full gap-6">
            {/* Toolbar - 토스 스타일 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F2F4F6] shrink-0">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("bold")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("italic")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("underline")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Underline
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 1 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editor) return;

                    const { state } = editor;
                    const { from, to } = state.selection;
                    const paragraphs: {
                      start: number;
                      end: number;
                      text: string;
                    }[] = [];

                    // Step 1: Collect paragraph ranges
                    state.doc.nodesBetween(from, to, (node, pos) => {
                      if (node.type.name === "paragraph") {
                        const text = node.textContent.trim();
                        if (text.length > 0) {
                          paragraphs.push({
                            start: pos,
                            end: pos + node.nodeSize,
                            text,
                          });
                        }
                      }
                    });

                    // Step 2: Apply numbering from bottom to top to avoid offset shift
                    paragraphs
                      .slice()
                      .reverse()
                      .forEach(({ start, end, text }, idx, arr) => {
                        const number = arr.length - idx; // Top-down numbering
                        editor.commands.insertContentAt(
                          { from: start, to: end },
                          {
                            type: "paragraph",
                            content: [
                              {
                                type: "text",
                                text: `${number}. ${text}`,
                              },
                            ],
                          }
                        );
                      });

                    editor.chain().focus().run();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                >
                  Numbering
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("paragraph")
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
                  }`}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHighlight().run()
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    editor?.isActive("highlight")
                      ? "bg-[#FFE066] text-black shadow-sm"
                      : "bg-[#FFE066] text-black hover:bg-[#FFCC02]"
                  }`}
                >
                  Highlight
                </button>
              </div>
            </div>

            <div className="flex-grow flex gap-6 overflow-hidden">
              {/* Left: Editor - 메인 영역 (75% width) */}
              <div className="flex-[3] overflow-y-auto border border-[#F2F4F6] rounded-2xl p-6 bg-white shadow-sm">
                <EditorContent
                  editor={editor}
                  className="prose max-w-none min-h-[400px] custom-editor"
                />
              </div>

              {/* Right: Templates + Homework - 사이드 영역 (25% width) */}
              <div className="flex-[1] flex flex-col gap-3 min-w-[320px] overflow-y-auto">
                {/* 탭 스위치 - 토스 스타일 */}
                <div className="bg-white rounded-2xl p-1 shadow-sm border border-[#F2F4F6] shrink-0">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setActiveOption("option1")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option1"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Templates
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option2")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option2"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Previous Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOption("option3")}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                        activeOption === "option3"
                          ? "bg-[#3182F6] text-white shadow-sm"
                          : "text-[#8B95A1] hover:text-[#4E5968]"
                      }`}
                    >
                      Test Materials
                    </button>
                  </div>
                </div>

                {/* 컨텐츠 영역 */}
                {activeOption === "option1" && (
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Template Selection + Choose Template 통합 - 토스 스타일 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#191F28]">
                          Templates
                        </h3>

                        {/* Edit Templates */}
                        <button
                          type="button"
                          onClick={() => {
                            window.open("/teacher/templates", "_blank");
                          }}
                          className="text-[11px] font-semibold text-[#3182F6] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-3">
                        {(Object.keys(templates) as TabKey[]).map((key) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-2 py-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                              activeTab === key
                                ? "bg-[#3182F6] text-white shadow-sm"
                                : "bg-[#F8F9FA] text-[#4E5968] hover:bg-[#F2F4F6]"
                            }`}
                          >
                            {key.replace("curriculum", "C")}
                          </button>
                        ))}
                      </div>

                      {/* Choose Template 버튼들 */}
                      {activeTab && (
                        <div className="space-y-1">
                          {templates[activeTab as TemplateLevel].map((tpl, idx) => {
                            // 버튼 텍스트를 위한 함수
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => {
                                  setOriginal_text(tpl.html);
                                  editor?.commands.setContent(tpl.html || "");
                                }}
                                disabled={loading || !isEditable}
                                className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all disabled:opacity-50 shadow-sm"
                              >
                                {tpl.template_name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Homework Input - 더 큰 크기 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="homework"
                            className="block text-sm font-bold text-[#191F28] mb-1"
                          >
                            Homework <span className="text-[#FF6B6B]">*</span>
                          </label>
                          <textarea
                            id="homework"
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                            className="w-full border border-[#F2F4F6] bg-white rounded-xl px-3 py-2 text-sm resize-none h-20 focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 transition-all placeholder-[#8B95A1]"
                            placeholder="숙제 내용을 입력하세요..."
                            required
                            disabled={!isEditable}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#191F28] mb-1">
                            Last Homework
                          </label>
                          <div className="bg-[#F8F9FA] text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl p-2 h-16 whitespace-pre-wrap overflow-y-auto">
                            {latestHomework
                              ? latestHomework.slice(0, 150) +
                                (latestHomework.length > 150 ? "..." : "")
                              : "No previous homework found."}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Class Input - 더 큰 크기 */}
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="nextClass"
                            className="block text-sm font-bold text-[#191F28] mb-1"
                          >
                            Next Class <span className="text-[#FF6B6B]">*</span>
                          </label>
                          <textarea
                            id="nextClass"
                            value={nextClass}
                            onChange={(e) => setNextClass(e.target.value)}
                            className="w-full border border-[#F2F4F6] bg-white rounded-xl px-3 py-2 text-sm resize-none h-20 focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/10 transition-all placeholder-[#8B95A1]"
                            placeholder="다음 수업 계획을 입력하세요..."
                            required
                            disabled={!isEditable}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#191F28] mb-1">
                            For Today Class
                          </label>
                          <div className="bg-[#F8F9FA] text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl p-2 h-16 whitespace-pre-wrap overflow-y-auto">
                            {latestNextClass
                              ? latestNextClass.slice(0, 150) +
                                (latestNextClass.length > 150 ? "..." : "")
                              : "No previous next class found."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeOption === "option2" && (
                  <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm flex-1 flex flex-col">
                    <h3 className="text-xs font-bold text-[#191F28] mb-3">
                      Previous Notes
                    </h3>

                    <div className="flex-1 overflow-y-auto">
                      {searchLoading && (
                        <div className="text-[#8B95A1] text-xs flex items-center gap-2 py-4">
                          <div className="w-3 h-3 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
                          Loading notes...
                        </div>
                      )}

                      {searchError && (
                        <div className="text-[#FF6B6B] text-xs p-2 bg-[#FFF5F5] rounded-xl border border-[#FFE5E5] mb-3">
                          {searchError}
                        </div>
                      )}

                      {searchedNotes.length > 0 && (
                        <div className="space-y-2">
                          {[...searchedNotes].map((note) => (
                            <div
                              key={note._id}
                              onClick={() => {
                                const newWindow = window.open("", "_blank");
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Class Note - ${note.date}</title>
                                        <style>
                                          body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background-color: #f8f9fa;
                                            padding: 2rem;
                                          }
                              
                                          .container {
                                            max-width: 800px;
                                            margin: 0 auto;
                                            background-color: white;
                                            border: 1px solid #f2f4f6;
                                            border-radius: 16px;
                                            padding: 2rem;
                                            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                                          }
                              
                                          h2 {
                                            font-size: 1.5rem;
                                            margin-bottom: 1rem;
                                            color: #191f28;
                                            font-weight: 700;
                                          }
                              
                                          h3 {
                                            font-size: 1.25rem;
                                            margin-top: 2rem;
                                            margin-bottom: 0.75rem;
                                            color: #191f28;
                                            font-weight: 700;
                                          }
                              
                                          p, li {
                                            font-size: 1rem;
                                            line-height: 1.6;
                                            color: #4e5968;
                                          }
                              
                                          ul, ol {
                                            padding-left: 1.5rem;
                                            margin-bottom: 1rem;
                                          }
                              
                                          hr {
                                            margin: 2rem 0;
                                            border-color: #f2f4f6;
                                          }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="container">
                                          <h2>Class Note (${note.date})</h2>
                                          ${note.original_text}
                                          ${
                                            note.homework
                                              ? `<hr/><h3>Homework</h3><p>${note.homework}</p>`
                                              : ""
                                          }
                                          ${
                                            note.nextClass
                                              ? `<hr/><h3>Next Class</h3><p>${note.nextClass}</p>`
                                              : ""
                                          }
                                          
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                  newWindow.document.close();
                                }
                              }}
                              className="cursor-pointer border border-[#F2F4F6] bg-[#FAFBFC] p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                            >
                              <p className="text-xs text-[#3182F6] mb-1 font-semibold">
                                {note.date}
                              </p>
                              <div
                                className="text-xs text-[#8B95A1] line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    note.original_text.slice(0, 80) + "...",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeOption === "option3" && (
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="p-3 bg-white border border-[#F2F4F6] rounded-2xl shadow-sm">
                      <h3 className="text-xs font-bold text-[#191F28] mb-2">Test Materials</h3>

                      {/* Beginner Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-2">Beginner</h4>
                      <div className="space-y-1">
                        {["Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
                          <button
                            type="button"
                            key={`Beginner: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Beginner: ${label}`)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Intermediate Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-4">Intermediate</h4>
                      <div className="space-y-1">
                        {["Collect Bulk Answers", "Filter Grammer", "Filter Pillar Expressions", "Actual Level Test"].map((label) => (
                          <button
                            type="button"
                            key={`Intermediate: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Intermediate: ${label}`)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Business Buttons */}
                      <h4 className="text-sm font-semibold text-[#4E5968] mt-2">Business</h4>
                      <div className="space-y-1">
                        {["In Depth Business Conversation Topic List","Memorable Projects"].map((label) => (
                          <button
                            type="button"
                            key={`Beginner: ${label}`}
                            onClick={() => {
                              const url = `/teacher/student/test?student_name=${encodeURIComponent(student_name)}&user=teacher&title=${encodeURIComponent(`Business: ${label}`)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full px-3 py-1.5 bg-[#89baff] text-white rounded-lg text-xs font-semibold hover:bg-[#1B64DA] transition-all shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-white border-t border-[#F2F4F6] py-6 px-6 flex gap-4">
          {/* ✅ 수업 수정하기 — hidden once class starts */}
          {classPhase === "idle" && (
            <button
              type="button"
              onClick={() => {
                setIsEditable(true);
                setAwaitingAction(false);
                setIsModifyMode(true); // 🔹 ENTER MODIFY MODE
              }}
              className={`flex-1 py-4 rounded-2xl text-sm font-bold border transition-all
                ${awaitingAction ? "cta-blink" : ""}
                text-[#8B95A1] border-[#F2F4F6] hover:bg-[#F8F9FA]`}
              disabled={loading}
            >
              수업 수정하기
            </button>
          )}

          {/* Right side: Start → End flow OR Modify → Translate */}
          {classPhase === "idle" ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (isModifyMode) {
                  // 🔹 MODIFY MODE → open manual time modal
                  setTimeModalOpen(true);
                } else {
                  // 🕒 NORMAL CLASS → start timer
                  setClassStarted(true);
                  setClassPhase("running"); // ✅ ADD THIS
                  setStartTime(Date.now());
                  setElapsedMs(0);
                  setIsEditable(true);
                  setAwaitingAction(false);
                }
              }}
              className={`flex-1 py-4 rounded-2xl text-white text-sm font-bold transition-all shadow-sm
                ${awaitingAction ? "cta-blink" : ""}
                ${
                  loading
                    ? "bg-[#DEE2E6] cursor-not-allowed"
                    : "bg-[#3182F6] hover:bg-[#1B64DA]"
                }`}
            >
              {isModifyMode ? "Move to Translate" : "수업 시작하기"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                pauseTimer();  
                setClassPhase("ended");    // ✅ ADD THIS (CRITICAL)        // ⏸️ pause
                handleEndClassClick(); // run your existing class end logic
              }}
              className={`flex-1 py-4 rounded-2xl text-white text-sm font-bold transition-all shadow-sm
                ${
                  loading
                    ? "bg-[#DEE2E6] cursor-not-allowed"
                    : "bg-[#FF6B6B] hover:bg-[#FA5252]"
                }`}
            >
              수업 끝내기
            </button>
          )}
        </div>

      </form>

      {/* 모달들은 기존과 동일하게 유지하되 토스 스타일 적용 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-[90%] max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[#191F28]">
              Select Group Students
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {studentList.map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-3 text-sm p-3 rounded-xl hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupStudents.includes(name)}
                    onChange={() =>
                      setSelectedGroupStudents((prev) =>
                        prev.includes(name)
                          ? prev.filter((n) => n !== name)
                          : [...prev, name]
                      )
                    }
                    className="w-5 h-5 rounded-lg border-2 border-[#F2F4F6] text-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                  <span className="font-semibold text-[#191F28]">{name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl hover:bg-[#F8F9FA] transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all font-semibold shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        /* 데이트 픽커 스타일 오버라이드 */
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          cursor: pointer;
        }

        textarea::placeholder {
          color: #8b95a1;
          font-size: 14px;
        }

        /* 전체 고정 레이아웃 */
        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* 텍스트 영역 스크롤 */
        textarea {
          overflow-y: auto;
        }

        /* 포커스 시 아웃라인 없애기 */
        textarea:focus {
          outline: none;
          box-shadow: none;
        }

        /* 스크롤바 스타일링 - 토스 스타일 */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #e5e8eb;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }

        /* line-clamp 유틸리티 */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes cta-blink {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(49,130,246,0); }
          50%      { transform: scale(1.02); box-shadow: 0 0 0.75rem rgba(49,130,246,0.35); }
        }
        .cta-blink {
          animation: cta-blink 1.2s ease-in-out infinite;
        }

      `}</style>

      {translating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-80 bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-[#191F28]">
              Translating Quizlets...
            </p>
            <p className="text-sm text-[#8B95A1] mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {timeModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-[90%] max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[#191F28]">수업 시간 입력</h2>
            <p className="text-sm text-[#4E5968]">
              수정된 수업 노트의 시작 / 종료 시간을 입력해주세요.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Start Time</label>
                <input
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">End Time</label>
                <input
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setTimeModalOpen(false)}
                className="px-6 py-3 text-sm text-[#8B95A1] border rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleManualTimeConfirm}
                className="px-6 py-3 text-sm bg-[#3182F6] text-white rounded-xl"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}


      {translationModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-[90%] max-w-4xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            {translating && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                <div className="w-10 h-10 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#191F28]">
                Review Translations
              </h2>

              {/* 🔄 Re-Translate Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setTranslating(true);  // show loading spinner

                    const response = await fetch("/api/quizlet/translate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ original_text }),
                    });

                    if (!response.ok) {
                      const data = await response.json().catch(() => ({}));
                      throw new Error(data?.error || "Translation failed");
                    }

                    const { eng_quizlet, kor_quizlet } = await response.json();

                    const merged = eng_quizlet.map((eng: any, i: any) => ({
                      eng,
                      kor: kor_quizlet[i] || "",
                    }));

                    // 🔥 Update the modal inputs WITHOUT refreshing
                    setQuizletLines(merged);

                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Unknown re-translation error.");
                  } finally {
                    setTranslating(false);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-[#E7F1FF] text-[#3182F6] rounded-lg hover:bg-[#D9E9FF] transition-all"
              >
                🔄 Refresh Translations
              </button>
            </div>
            <p className="text-sm text-[#4E5968] mb-4 p-4 bg-[#F8F9FA] rounded-2xl border border-[#F2F4F6] leading-relaxed">
              Please revise any awkward translations before saving.
            </p>
            {/* 🧩 Class info block */}
            {recentClassnote && (
              <div className="mb-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E8EB] p-4 text-sm text-[#4E5968]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Editable Start Time */}
                  <div>
                    <label className="font-semibold text-[#191F28] block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                    />
                  </div>

                  {/* Editable End Time */}
                  <div>
                    <label className="font-semibold text-[#191F28] block mb-1">End Time</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                    />
                  </div>

                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-[#F2F4F6]">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="text-left bg-[#F8F9FA] border-b border-[#F2F4F6]">
                    <th className="p-4 w-8 text-center font-bold text-[#191F28]"></th>
                    <th className="p-4 font-bold text-[#191F28]">English</th>
                    <th className="p-4 font-bold text-[#191F28]">Korean</th>
                    <th className="p-4 font-bold text-[#191F28] text-center">Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {quizletLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="p-4 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="p-4">
                        <textarea
                          value={line.eng}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].eng = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </td>
                      <td className="p-4">
                        <textarea
                          value={line.kor}
                          onChange={(e) => {
                            const updated = [...quizletLines];
                            updated[idx].kor = e.target.value;
                            setQuizletLines(updated);
                          }}
                          className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...quizletLines];
                            updated.splice(idx, 1);
                            setQuizletLines(updated);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete this line"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>



              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setTranslationModalOpen(false);
                  resumeTimer(); // ▶️ resume timer when closing modal
                }}
                className="px-6 py-3 text-sm text-[#8B95A1] border border-[#F2F4F6] rounded-xl hover:bg-[#F8F9FA] transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const payload = {
                      quizletData: {
                        student_names: group_student_names,
                        class_date,
                        date,
                        original_text,
                      },
                      eng_quizlet: quizletLines.map((l) => l.eng),
                      kor_quizlet: quizletLines.map((l) => l.kor),
                      homework,
                      nextClass,

                      // 🔥 ADD THESE LINES
                      started_at: editStartTime
                        ? `${class_date} ${editStartTime}:00`
                        : recentClassnote?.started_at || null,

                      ended_at: editEndTime
                        ? `${class_date} ${editEndTime}:00`
                        : recentClassnote?.ended_at || null,
                    };


                    const res = await fetch("/api/quizlet/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });

                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData?.error || "Save failed.");
                    }


                    setTranslationModalOpen(false);
                    setSaveSuccess(true);

                    setTimeout(() => {
                      router.push(
                        `/teacher/home?user=${user}&type=${type}&id=${user_id}`
                      );
                    }, 1500);
                  } catch (err) {
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Unknown error saving data."
                    );
                  }
                }}
                className="px-6 py-3 text-sm bg-[#3182F6] text-white rounded-xl hover:bg-[#1B64DA] transition-all flex items-center gap-2 font-semibold shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 내보내기
export default function ClassPageWrapper(): ReactNode {
  return (
    <Suspense fallback={<div>Loading Diary Page...</div>}>
      <ClassPage />
    </Suspense>
  );
}

function ClassPage(): ReactNode {
  return <ClassPageContent />;
}
