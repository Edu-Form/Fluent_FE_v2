"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ClassnoteDoc = {
  _id: string;
  student_name?: string;
  teacher_name?: string;
  date?: string;
  class_date?: string;
  original_text?: string;
  homework?: string;
  nextClass?: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration_ms?: number | null;
  quizlet_saved?: boolean;
  type?: string;
  reason?: string;
  reason_note?: string;
  comment?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type TeacherOption = {
  name: string;
};

type StudentOption = {
  id: string;
  name: string;
  phoneNumber?: string;
};

function normalizeDateInput(raw: string) {
  if (!raw) return "";

  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/\.+$/, "");

  const match =
    cleaned.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/) ||
    cleaned.match(/^(\d{4})-\s*(\d{1,2})-\s*(\d{1,2})$/) ||
    cleaned.match(/^(\d{4})\/\s*(\d{1,2})\/\s*(\d{1,2})$/) ||
    cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (!match) return trimmed;

  const y = match[1];
  const m = String(match[2]).padStart(2, "0");
  const d = String(match[3]).padStart(2, "0");

  return `${y}. ${m}. ${d}.`;
}

function formatDuration(ms?: number | null) {
  if (!ms || !Number.isFinite(Number(ms))) return "-";

  const totalMin = Math.round(Number(ms) / 1000 / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h <= 0) return `${m}분`;
  if (m <= 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-gray-500">{label}</div>
      {children}
    </label>
  );
}

function ClassnoteAdminPageInner() {
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "";

  const adminUsers = ["Phil", "David", "Inhyung"];
  const isAdmin = adminUsers.includes(user);

  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<
  Record<string, StudentOption[]>
  >({});

  const [studentName, setStudentName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [date, setDate] = useState("");

  const [classnotes, setClassnotes] = useState<ClassnoteDoc[]>([]);
  const [selected, setSelected] = useState<ClassnoteDoc | null>(null);
  const [editForm, setEditForm] = useState<ClassnoteDoc | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resultCountText = useMemo(() => {
    if (!classnotes.length) return "검색 결과 없음";
    return `${classnotes.length}개 검색됨`;
  }, [classnotes.length]);

useEffect(() => {
  let cancelled = false;

  const loadTeacherAndStudentData = async () => {
    try {
      const [teacherRes, studentRes] = await Promise.all([
        fetch("/api/teacher", { cache: "no-store" }).catch(() => null),
        fetch("/api/studentList", { cache: "no-store" }).catch(() => null),
      ]);

      const teacherListRaw: string[] = [];

      if (teacherRes && teacherRes.ok) {
        const teacherJson = await teacherRes.json();

        const rawTeachers = Array.isArray(teacherJson)
          ? teacherJson
          : Array.isArray(teacherJson?.teachers)
          ? teacherJson.teachers
          : Array.isArray(teacherJson?.data)
          ? teacherJson.data
          : [];

        rawTeachers.forEach((item: any) => {
          const name =
            typeof item === "string"
              ? item.trim()
              : String(item?.name || item?.teacher_name || "").trim();

          if (name) teacherListRaw.push(name);
        });
      }

      const studentMap: Record<string, StudentOption[]> = {};

      if (studentRes && studentRes.ok) {
        const studentJson = await studentRes.json();

        const rawStudents = Array.isArray(studentJson)
          ? studentJson
          : Array.isArray(studentJson?.students)
          ? studentJson.students
          : Array.isArray(studentJson?.data)
          ? studentJson.data
          : [];

        rawStudents.forEach((item: any, index: number) => {
          const teacher = String(
            item?.teacher ??
              item?.teacher_name ??
              item?.teacherName ??
              item?.assigned_teacher ??
              ""
          ).trim();

          const studentName = String(
            item?.student_name ??
              item?.name ??
              item?.full_name ??
              `학생-${index + 1}`
          ).trim();

          if (!studentName) return;

          const entry: StudentOption = {
            id: String(item?._id ?? item?.id ?? `${index}`),
            name: studentName,
            phoneNumber: item?.phoneNumber ? String(item.phoneNumber) : "",
          };

          if (!studentMap[teacher]) studentMap[teacher] = [];
          studentMap[teacher].push(entry);
        });
      }

      const combinedTeachers = Array.from(
        new Set([
          ...teacherListRaw,
          ...Object.keys(studentMap).filter((name) => name && name.trim()),
        ])
      ).sort((a, b) => a.localeCompare(b, "en"));

      combinedTeachers.forEach((teacher) => {
        if (!studentMap[teacher]) {
          studentMap[teacher] = [];
        } else {
          studentMap[teacher].sort((a, b) =>
            a.name.localeCompare(b.name, "ko")
          );
        }
      });

      if (!cancelled) {
        setTeacherOptions(combinedTeachers.map((name) => ({ name })));
        setTeacherStudents(studentMap);
      }
    } catch (err) {
      console.error("Failed to load teacher/student data:", err);
      if (!cancelled) {
        setTeacherOptions([]);
        setTeacherStudents({});
      }
    }
  };

  loadTeacherAndStudentData();

  return () => {
    cancelled = true;
  };
}, []);

const currentStudentOptions = useMemo(() => {
  if (!teacherName.trim()) return [];
  return teacherStudents[teacherName] ?? [];
}, [teacherName, teacherStudents]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams();

      if (studentName.trim()) {
        params.set("student_name", studentName.trim());
      }

      if (teacherName.trim()) {
        params.set("teacher_name", teacherName.trim());
      }

      if (date.trim()) {
        params.set("date", normalizeDateInput(date));
      }

      const url = params.toString()
      ? `/api/classnote/admin-search?${params.toString()}`
      : "/api/classnote/admin-search";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch classnotes");
      }

      setClassnotes(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "검색 중 오류가 발생했습니다.");
      setClassnotes([]);
    } finally {
      setLoading(false);
    }
  };

    const handleReset = () => {
    setStudentName("");
    setTeacherName("");
    setDate("");
    setClassnotes([]);
    setSelected(null);
    setEditForm(null);
    setMessage("");
    setError("");
    };

  const openEditor = (doc: ClassnoteDoc) => {
    setSelected(doc);
    setEditForm({
      ...doc,
      date: normalizeDateInput(doc.date || ""),
      class_date: normalizeDateInput(doc.class_date || doc.date || ""),
    });
    setMessage("");
    setError("");
  };

  const closeEditor = () => {
    setSelected(null);
    setEditForm(null);
  };

  const updateEditField = (key: keyof ClassnoteDoc, value: any) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const handleSave = async () => {
    if (!selected?._id || !editForm) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updates: Record<string, any> = {};

      Object.entries(editForm).forEach(([key, value]) => {
        if (key === "_id") return;
        if (key === "createdAt") return;

        if (key === "date" || key === "class_date") {
            updates[key] = normalizeDateInput(String(value || ""));
            return;
        }

        if (key === "duration_ms") {
            updates[key] =
            value === "" || value === null || value === undefined
                ? null
                : Number(value);
            return;
        }

        if (key === "quizlet_saved") {
            updates[key] = Boolean(value);
            return;
        }

        updates[key] = value;
      });

      const res = await fetch("/api/classnote/admin-search", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: selected._id,
          updates,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update classnote");
      }

      const updatedDoc = data?.data;

      setClassnotes((prev) =>
        prev.map((item) => (item._id === selected._id ? updatedDoc : item))
      );

      setSelected(updatedDoc);
      setEditForm(updatedDoc);
      setMessage("Classnote가 업데이트되었습니다.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <h1 className="text-lg font-bold">접근 권한 없음</h1>
          <p className="mt-2 text-sm">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Admin Tool
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Classnote 수정
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                선생님, 학생명, 날짜로 classnote를 검색하고 수정할 수 있습니다.
              </p>
            </div>

            <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              {resultCountText}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Teacher">
              <select
                value={teacherName}
                onChange={(e) => {
                setTeacherName(e.target.value);
                setStudentName("");
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">전체 선생님</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.name} value={teacher.name}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Student Name">
            {teacherName.trim() ? (
                <select
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                <option value="">
                    {currentStudentOptions.length === 0
                    ? "해당 선생님 학생 없음"
                    : "전체 학생"}
                </option>

                {currentStudentOptions.map((student) => (
                    <option key={student.id || student.name} value={student.name}>
                    {student.name}
                    {student.phoneNumber ? ` (${student.phoneNumber})` : ""}
                    </option>
                ))}
                </select>
            ) : (
                <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="학생명 입력"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
            )}
            </Field>

            <Field label="Date">
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => setDate((prev) => normalizeDateInput(prev))}
                placeholder="2026. 04. 20."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="h-11 flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "검색 중..." : "검색"}
              </button>

              <button
                onClick={handleReset}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            날짜는 항상 <span className="font-semibold">YYYY. MM. DD.</span>{" "}
            형식으로 저장됩니다. 예: 2026. 04. 20.
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">검색 결과</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Student</th>
                  <th className="whitespace-nowrap px-4 py-3">Teacher</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Duration</th>
                  <th className="whitespace-nowrap px-4 py-3">Quizlet</th>
                  <th className="whitespace-nowrap px-4 py-3">Homework</th>
                  <th className="whitespace-nowrap px-4 py-3">Updated</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      검색 중입니다...
                    </td>
                  </tr>
                ) : classnotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  classnotes.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {doc.date || doc.class_date || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {doc.student_name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {doc.teacher_name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {doc.type || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDuration(doc.duration_ms)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            doc.quizlet_saved
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {doc.quizlet_saved ? "Saved" : "Not saved"}
                        </span>
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-gray-600">
                        {doc.homework || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {doc.updatedAt || doc.createdAt || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => openEditor(doc)}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Classnote 수정
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  ID: {editForm._id}
                </p>
              </div>

              <button
                onClick={closeEditor}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">
                    주요 필드
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                    자주 수정하는 classnote 필드입니다.
                    </p>
                </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Student Name">
                    <input
                    value={editForm.student_name || ""}
                    onChange={(e) =>
                        updateEditField("student_name", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Teacher">
                    <select
                    value={editForm.teacher_name || ""}
                    onChange={(e) =>
                        updateEditField("teacher_name", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                    <option value="">선생님 없음</option>
                    {teacherOptions.map((teacher) => (
                        <option key={teacher.name} value={teacher.name}>
                        {teacher.name}
                        </option>
                    ))}
                    </select>
                </Field>

                <Field label="Type">
                    <input
                    value={editForm.type || ""}
                    onChange={(e) => updateEditField("type", e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Date">
                    <input
                    value={editForm.date || ""}
                    onChange={(e) => updateEditField("date", e.target.value)}
                    onBlur={() =>
                        updateEditField(
                        "date",
                        normalizeDateInput(editForm.date || "")
                        )
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Class Date">
                    <input
                    value={editForm.class_date || ""}
                    onChange={(e) =>
                        updateEditField("class_date", e.target.value)
                    }
                    onBlur={() =>
                        updateEditField(
                        "class_date",
                        normalizeDateInput(editForm.class_date || "")
                        )
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Quizlet Saved">
                    <select
                    value={editForm.quizlet_saved ? "true" : "false"}
                    onChange={(e) =>
                        updateEditField("quizlet_saved", e.target.value === "true")
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                    <option value="false">false</option>
                    <option value="true">true</option>
                    </select>
                </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Started At">
                    <input
                    value={editForm.started_at || ""}
                    onChange={(e) =>
                        updateEditField("started_at", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Ended At">
                    <input
                    value={editForm.ended_at || ""}
                    onChange={(e) =>
                        updateEditField("ended_at", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Duration MS">
                    <input
                    type="number"
                    value={
                        editForm.duration_ms === null ||
                        editForm.duration_ms === undefined
                        ? ""
                        : editForm.duration_ms
                    }
                    onChange={(e) =>
                        updateEditField("duration_ms", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Reason">
                    <input
                    value={editForm.reason || ""}
                    onChange={(e) => updateEditField("reason", e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Reason Note">
                    <input
                    value={editForm.reason_note || ""}
                    onChange={(e) =>
                        updateEditField("reason_note", e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Homework">
                    <textarea
                    value={editForm.homework || ""}
                    onChange={(e) =>
                        updateEditField("homework", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Next Class">
                    <textarea
                    value={editForm.nextClass || ""}
                    onChange={(e) =>
                        updateEditField("nextClass", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Comment">
                    <textarea
                    value={editForm.comment || ""}
                    onChange={(e) =>
                        updateEditField("comment", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>

                <Field label="Note">
                    <textarea
                    value={editForm.note || ""}
                    onChange={(e) =>
                        updateEditField("note", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>
                </div>

                <div className="mt-4">
                <Field label="Original Text / Class Note HTML">
                    <textarea
                    value={editForm.original_text || ""}
                    onChange={(e) =>
                        updateEditField("original_text", e.target.value)
                    }
                    rows={14}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Field>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="text-xs text-gray-500">
                저장 시 date/class_date는 자동으로 YYYY. MM. DD. 형식으로 정리됩니다.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeEditor}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClassnoteAdminPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ClassnoteAdminPageInner />
    </Suspense>
  );
}