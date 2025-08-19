"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ProposedItem = {
  date: string;        // "YYYY. MM. DD."
  room_name: string;   // "HF1"
  time: string;        // "19"
  duration: string;    // "1"
  teacher_name?: string;
  student_name: string;
};

type ChatMessage =
  | { role: "assistant" | "user" | "system"; content: string }
  | { role: "assistant"; content: React.ReactNode };

function uniqSortedDates(dates: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of dates) {
    if (!seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
  }
  return out;
}

// —— Update / Delete support ————————————————————————————————
type Target = { _id?: string; date?: string; student_name?: string };
type UpdateDraft = { targets: Target[]; patch: Partial<ProposedItem> };

// If only (student_name, date) are known, resolve schedule _id via API
async function resolveId(t: Target) {
  if (t._id) return t._id;
  const qs = new URLSearchParams({
    student_name: t.student_name ?? "",
    date: (t.date ?? "").trim(),
  });
  const r = await fetch(`/api/schedules/lookup?${qs.toString()}`);
  if (!r.ok) return undefined;
  const j = await r.json();
  return j?._id as string | undefined;
}

type ScheduledRow = {
  _id?: string;
  date: string;        // "YYYY. MM. DD."
  time?: string;
  room_name?: string;
  duration?: string;
};

export default function ChatSchedulerPanel({
  studentName,
  teacherName,
  unscheduledDates,
  scheduled,            // class happened but NOT scheduled
  ready,                // parent tells us both fetches are complete
  onApply,              // optimistic calendar add/refresh
  onRefreshCalendar,    // authoritative re-fetch calendar
}: {
  studentName: string;
  teacherName?: string;
  unscheduledDates: string[];
  scheduled: ScheduledRow[];
  ready: boolean;
  onApply: (items: ProposedItem[]) => void;
  onRefreshCalendar?: () => Promise<void> | void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [draftItems, setDraftItems] = useState<ProposedItem[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // NEW: update/delete state INSIDE component
  const [updateDraftState, setUpdateDraftState] = useState<UpdateDraft | null>(null);
  const [deleteDraftState, setDeleteDraftState] = useState<Target[] | null>(null);

  const initialPushedRef = useRef(false);

  const cleanDates = useMemo(
    () => uniqSortedDates(unscheduledDates || []),
    [unscheduledDates]
  );

  // Reset when student changes
  useEffect(() => {
    setMessages([]);
    setDraftItems(null);
    setInput("");
    setUpdateDraftState(null);
    setDeleteDraftState(null);
    initialPushedRef.current = false;
  }, [studentName]);

  // Initial assistant message after data is ready
  useEffect(() => {
    if (!ready) return;
    if (initialPushedRef.current) return;
    if (!studentName) return;

    initialPushedRef.current = true;

    if (cleanDates.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm leading-6">
              <div className="font-semibold text-green-800 mb-1">All good ✅</div>
              <div className="text-green-700">
                Hello, <b>{studentName}</b> is up to date with all classes and scheduled classes! Bravo 🎉
              </div>
            </div>
          ),
        },
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm leading-6">
              <div className="font-semibold text-yellow-900 mb-2">
                Hello, <b>{studentName}</b> had classes on the following dates, but no schedules are registered:
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-900">
                {cleanDates.map((d) => (
                  <li key={d} className="font-medium">{d}</li>
                ))}
              </ul>
              <div className="mt-3 text-yellow-800">
                Please tell me the <b>time</b> (0–23) and <b>room</b> (e.g., HF1) for these dates.
              </div>
            </div>
          ),
        },
      ]);
    }
  }, [ready, studentName, cleanDates]);

  const sendToAssistant = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
        const res = await fetch("/api/chat/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            student_name: studentName,
            teacher_name: teacherName,
            unscheduledDates: cleanDates,   // string[] of dates missing schedules
            scheduled,                      // [{ _id, date, time, room_name, duration }]
            message: text,
            today: new Date().toISOString(),
        }),
    });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const raw = await res.text();
        try { data = JSON.parse(raw); } catch { data = { reply: raw }; }
      }
      console.log("[/api/chat/scheduling] response:", data);

      if (data?.action === "propose_create" && Array.isArray(data?.items)) {
        setDraftItems(data.items as ProposedItem[]);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: <AssistantBubble>Sure thing. Here is a form to review and submit.</AssistantBubble> },
        ]);
      } else if (data?.action === "propose_update" && Array.isArray(data?.targets)) {
        setUpdateDraftState({ targets: data.targets as Target[], patch: (data.patch ?? {}) as Partial<ProposedItem> });
        setMessages((m) => [
          ...m,
          { role: "assistant", content: <AssistantBubble>Certainly ! Here is a form to edit and apply.</AssistantBubble> },
        ]);
      } else if (data?.action === "propose_delete" && Array.isArray(data?.targets)) {
        setDeleteDraftState(data.targets as Target[]);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: <AssistantBubble>Select items to delete and confirm.</AssistantBubble> },
        ]);
      } else if (data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: <AssistantBubble>{data.reply}</AssistantBubble> }]);
      } else {
        // Only show this when we truly can't parse
        setMessages((m) => [
          ...m,
          { role: "assistant", content: <AssistantBubble>Sorry, I couldn’t parse that.</AssistantBubble> },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: <AssistantBubble>Network error. Please try again.</AssistantBubble> },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Rename to avoid collision with updateDraftState
  const updateDraftItem = (idx: number, patch: Partial<ProposedItem>) => {
    setDraftItems((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const submitAll = async () => {
    if (!draftItems || draftItems.length === 0) return;
    setSubmitting(true);

    try {
      for (const item of draftItems) {
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: item.room_name,
            date: item.date,
            time: item.time,
            duration: item.duration,
            teacher_name: item.teacher_name ?? teacherName ?? "",
            student_name: item.student_name,
          }),
        });
      }

      onApply(draftItems);
      await onRefreshCalendar?.();

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm leading-6">
              <div className="font-semibold text-green-900 mb-1">Schedules saved ✅</div>
              <div className="text-green-800">
                I’ve registered {draftItems.length} class{draftItems.length > 1 ? "es" : ""}. The calendar has been updated.
              </div>
            </div>
          ),
        },
      ]);
      setDraftItems(null);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm leading-6 text-red-800">
              Failed to save one or more schedules. Please try again.
            </div>
          ),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpdate = async () => {
    if (!updateDraftState) return;
    setSubmitting(true);
    try {
      for (const t of updateDraftState.targets) {
        const id = await resolveId(t);
        if (!id) continue;
        await fetch(`/api/schedules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateDraftState.patch),
        });
      }

      if (updateDraftState.patch?.date) {
        onApply(
          updateDraftState.targets.map((t) => ({
            date: updateDraftState.patch?.date || t.date || "",
            room_name: updateDraftState.patch?.room_name || "",
            time: updateDraftState.patch?.time || "",
            duration: updateDraftState.patch?.duration || "1",
            teacher_name: teacherName,
            student_name: t.student_name || studentName,
          }))
        );
      }
      await onRefreshCalendar?.();

      setMessages((m) => [...m, { role: "assistant", content: <AssistantBubble>Updates applied ✅</AssistantBubble> }]);
      setUpdateDraftState(null);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: <AssistantBubble>Failed to update. Try again.</AssistantBubble> }]);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteDraftState || deleteDraftState.length === 0) return;
    setSubmitting(true);
    try {
      for (const t of deleteDraftState) {
        const id = await resolveId(t);
        if (!id) continue;
        await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      }
      await onRefreshCalendar?.();

      setMessages((m) => [...m, { role: "assistant", content: <AssistantBubble>Deleted selected schedules 🗑️</AssistantBubble> }]);
      setDeleteDraftState(null);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: <AssistantBubble>Failed to delete. Try again.</AssistantBubble> }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-1/3 bg-gray-50 flex flex-col border-l">
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            {m.role === "user" ? (
              <div className="inline-block max-w-[85%] bg-blue-600 text-white px-3 py-2 rounded-2xl">
                {m.content}
              </div>
            ) : (
              <div className="inline-block max-w-[85%] bg-white border px-3 py-2 rounded-2xl">
                {m.content}
              </div>
            )}
          </div>
        ))}

        {/* Create editor */}
        {draftItems && (
          <div className="mt-2">
            <div className="font-semibold text-sm text-gray-800 mb-2">Review & Edit</div>
            <div className="space-y-2">
              {draftItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 bg-white border rounded-xl p-3">
                  <Field
                    label="Date"
                    value={it.date}
                    onChange={(v) => updateDraftItem(idx, { date: v })}
                    placeholder="YYYY. MM. DD."
                  />
                  <Field
                    label="Room"
                    value={it.room_name}
                    onChange={(v) => updateDraftItem(idx, { room_name: v })}
                    placeholder="HF1"
                  />
                  <Field
                    label="Time"
                    value={it.time}
                    onChange={(v) => updateDraftItem(idx, { time: v })}
                    placeholder="19"
                  />
                  <Field
                    label="Duration"
                    value={it.duration}
                    onChange={(v) => updateDraftItem(idx, { duration: v })}
                    placeholder="1"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={submitAll}
              disabled={submitting}
              className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit All"}
            </button>
          </div>
        )}

        {/* Update editor */}
        {updateDraftState && (
          <div className="mt-3 space-y-3">
            <div className="font-semibold text-sm text-gray-800">Update Schedules</div>
            <div className="bg-white border rounded-xl p-3 space-y-2">
              <div className="text-xs text-gray-500">Targets:</div>
              <ul className="list-disc list-inside text-sm text-gray-800">
                {updateDraftState.targets.map((t, i) => (
                  <li key={i}>
                    {t.student_name ?? studentName} • {t.date ?? "(date)"} {t._id ? `• id:${t._id}` : ""}
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="New Date"
                  value={updateDraftState.patch.date ?? ""}
                  onChange={(v) => setUpdateDraftState(d => d && ({ ...d, patch: { ...d.patch, date: v } }))}
                  placeholder="YYYY. MM. DD."
                />
                <Field
                  label="Room"
                  value={updateDraftState.patch.room_name ?? ""}
                  onChange={(v) => setUpdateDraftState(d => d && ({ ...d, patch: { ...d.patch, room_name: v } }))}
                  placeholder="HF1"
                />
                <Field
                  label="Time"
                  value={updateDraftState.patch.time ?? ""}
                  onChange={(v) => setUpdateDraftState(d => d && ({ ...d, patch: { ...d.patch, time: v } }))}
                  placeholder="19"
                />
                <Field
                  label="Duration"
                  value={updateDraftState.patch.duration ?? ""}
                  onChange={(v) => setUpdateDraftState(d => d && ({ ...d, patch: { ...d.patch, duration: v } }))}
                  placeholder="1"
                />
              </div>

              <button
                onClick={submitUpdate}
                disabled={submitting}
                className="mt-2 w-full rounded-lg bg-amber-600 text-white py-2 hover:bg-amber-700 disabled:opacity-60"
              >
                {submitting ? "Applying..." : "Apply Updates"}
              </button>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteDraftState && (
          <div className="mt-3 space-y-3">
            <div className="font-semibold text-sm text-gray-800">Delete Schedules</div>
            <div className="bg-white border rounded-xl p-3">
              <ul className="list-disc list-inside text-sm text-gray-800 mb-3">
                {deleteDraftState.map((t, i) => (
                  <li key={i}>
                    {t.student_name ?? studentName} • {t.date ?? "(date)"} {t._id ? `• id:${t._id}` : ""}
                  </li>
                ))}
              </ul>
              <button
                onClick={submitDelete}
                disabled={submitting}
                className="w-full rounded-lg bg-red-600 text-white py-2 hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t flex">
        <input
          type="text"
          placeholder='e.g. "Register classes" or "Update 2025. 06. 24 to HF1 19:00 1h"'
          className="flex-1 border rounded-lg px-3 py-2 bg-white text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendToAssistant()}
        />
        <button
          onClick={sendToAssistant}
          disabled={loading}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-800 leading-6">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-sm">
      <div className="text-gray-600 mb-1">{label}</div>
      <input
        className="w-full border rounded-lg px-2 py-1.5 bg-white text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
