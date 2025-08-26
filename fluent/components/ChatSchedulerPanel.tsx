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
type Target = { _id?: string; date?: string; time?: string; student_name?: string };
type UpdateDraft = { targets: Target[]; patch: Partial<ProposedItem> };

// Backend single-lookup (fallback)
async function lookupOneId(t: Target) {
  if (t._id) return t._id;
  const qs = new URLSearchParams({
    student_name: t.student_name ?? "",
    date: (t.date ?? "").trim(),
    time: (t.time ?? "").trim(), // backend may ignore if unsupported
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
  student_name?: string;
};

const toDateYMD = (raw?: string | null) => {
  if (!raw) return null;
  const m = String(raw).trim().match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
};
const ymdString = (d: Date) =>
  `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,"0")}. ${String(d.getDate()).padStart(2,"0")}`;

function mode<T>(arr: T[]): T | undefined {
  const c = new Map<T, number>();
  for (const v of arr) c.set(v, (c.get(v) ?? 0) + 1);
  let best: T | undefined; let bestN = 0;
  for (const [k, n] of c) if (n > bestN) { best = k; bestN = n; }
  return best;
}

// One or two weekly slots inferred
type InferredSlot = {
  weekday: number;   // 0..6 (Sun..Sat)
  time: string;      // "19"
  duration: string;  // "1"
  room_name: string; // "HF1"
  count: number;     // internal strength
};

/** Infer 1–2 weekly slots from scheduled rows */
function inferPatterns(rows: ScheduledRow[]): InferredSlot[] {
  if (!rows?.length) return [];
  // group by weekday
  const buckets = new Map<number, { count: number; times: string[]; durs: string[]; rooms: string[] }>();
  for (const r of rows) {
    const dt = toDateYMD(r.date);
    if (!dt) continue;
    const wd = dt.getDay();
    const b = buckets.get(wd) ?? { count: 0, times: [], durs: [], rooms: [] };
    b.count += 1;
    if (r.time) b.times.push(String(r.time));
    if (r.duration) b.durs.push(String(r.duration));
    if (r.room_name) b.rooms.push(String(r.room_name));
    buckets.set(wd, b);
  }
  const slots: InferredSlot[] = Array.from(buckets.entries()).map(([wd, b]) => ({
    weekday: wd,
    time: mode(b.times) ?? "19",
    duration: mode(b.durs) ?? "1",
    room_name: mode(b.rooms) ?? "101",
    count: b.count,
  }));
  slots.sort((a, b) => b.count - a.count);
  if (slots.length <= 1) return slots;
  // decide if second weekday is significant enough
  const primary = slots[0];
  const secondary = slots[1];
  const threshold = Math.max(4, Math.round(primary.count * 0.6)); // tune if needed
  return secondary.count >= threshold ? [primary, secondary] : [primary];
}

export default function ChatSchedulerPanel({
  studentName,
  teacherName,
  unscheduledDates,     // dates where class happened but not scheduled (past)
  scheduled,            // all registered schedules for the student
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

  // update/delete draft states
  const [updateDraftState, setUpdateDraftState] = useState<UpdateDraft | null>(null);
  const [deleteDraftState, setDeleteDraftState] = useState<Target[] | null>(null);

  const initialPushedRef = useRef(false);
  const futureSuggestionDoneRef = useRef(false); // only suggest future plan once per student

  const cleanDates = useMemo(
    () => uniqSortedDates(unscheduledDates || []),
    [unscheduledDates]
  );

  // inferred pattern(s) from existing schedules (once or twice a week)
  const patterns = useMemo(() => inferPatterns(scheduled), [scheduled]);

  // helper → build 6 months draft from patterns (local fallback)
  const buildDraftFromPatterns = React.useCallback((): ProposedItem[] => {
    if (!patterns.length) return [];
    const end = new Date();
    end.setMonth(end.getMonth() + 6);

    const items: ProposedItem[] = [];

    for (const slot of patterns) {
      // next occurrence of this weekday from today
      const start = new Date();
      const diff = (slot.weekday - start.getDay() + 7) % 7;
      start.setDate(start.getDate() + diff);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        items.push({
          date: ymdString(d),
          room_name: slot.room_name,
          time: slot.time,
          duration: slot.duration,
          teacher_name: teacherName,
          student_name: studentName,
        });
      }
    }

    // chronological
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [patterns, studentName, teacherName]);

  const proposeFromPatterns = React.useCallback(() => {
    const items = buildDraftFromPatterns();
    if (!items.length) return;
    setDraftItems(items);
    setMessages(m => [
      ...m,
      {
        role: "assistant",
        content: (
          <AssistantBubble>
            I drafted a 6-month weekly plan based on your recent pattern
            {patterns.length === 2 ? "s" : ""}. Review and submit below.
          </AssistantBubble>
        ),
      },
    ]);
  }, [buildDraftFromPatterns, patterns.length]);

  // try AI prediction first, then fallback to local
  const proposeFutureViaAIOnce = React.useCallback(async () => {
    if (futureSuggestionDoneRef.current) return;
    futureSuggestionDoneRef.current = true; // ensure once

    try {
      const res = await fetch("/api/chat/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Predict future weekly plan for the next 6 months from past schedules and notes.",
          student_name: studentName,
          teacher_name: teacherName,
          scheduled,
          unscheduledDates: cleanDates,
          inferredPattern: patterns, // give model a hint
          today: new Date().toISOString(),
          intent: "predict_future_plan",
        }),
      });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const raw = await res.text();
        try { data = JSON.parse(raw); } catch { data = null; }
      }

      if (data?.action === "propose_create" && Array.isArray(data?.items) && data.items.length > 0) {
        setDraftItems(data.items as ProposedItem[]);
        setMessages(m => [
          ...m,
          {
            role: "assistant",
            content: (
              <AssistantBubble>
                I analyzed your recent classes and drafted a 6-month plan. Please review and submit.
              </AssistantBubble>
            ),
          },
        ]);
        return;
      }
    } catch {
      // ignore network errors → fallback below
    }

    // fallback
    const items = buildDraftFromPatterns();
    if (items.length) {
      setDraftItems(items);
      setMessages(m => [
        ...m,
        {
          role: "assistant",
          content: (
            <AssistantBubble>
              I drafted a 6-month plan from your recent pattern. Please review and submit.
            </AssistantBubble>
          ),
        },
      ]);
    }
  }, [studentName, teacherName, scheduled, cleanDates, patterns, buildDraftFromPatterns]);

  // Reset when student changes
  useEffect(() => {
    setMessages([]);
    setDraftItems(null);
    setInput("");
    setUpdateDraftState(null);
    setDeleteDraftState(null);
    initialPushedRef.current = false;
    futureSuggestionDoneRef.current = false;
  }, [studentName]);

  // Initial assistant message after data is ready
  useEffect(() => {
    if (!ready) return;
    if (initialPushedRef.current) return;
    if (!studentName) return;

    initialPushedRef.current = true;

    // 1) PAST CHECK: class notes vs schedules
    if (cleanDates.length > 0) {
      setMessages([
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm leading-6">
              <div className="font-semibold text-yellow-900 mb-2">
                Hi! I found classes that happened but are not registered in schedule:
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-900 mb-3">
                {cleanDates.map((d) => (
                  <li key={d} className="font-medium">{d}</li>
                ))}
              </ul>
              <div className="text-yellow-900">
                Would you like me to create schedules for these past dates? You can edit before saving.
              </div>
            </div>
          ),
        },
      ]);
      return; // don't proceed to future check until past is handled
    }

    // 2) FUTURE CHECK: if no future schedules, propose (AI-first, once)
    const today = new Date();
    const hasFuture = (scheduled || []).some((s) => {
      const dt = toDateYMD(s.date);
      return dt ? dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;
    });

    if (!hasFuture) {
      setMessages([
        {
          role: "assistant",
          content: (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm leading-6">
              <div className="font-semibold text-green-900 mb-1">All good ✅</div>
              <div className="text-green-800">
                Past classes and schedules are synced. There are no future classes registered though.
              </div>
              <div className="mt-2 text-green-800">
                I can draft the next 6 months based on your recent patterns. Want me to prepare a plan you can review?
              </div>
              <button
                onClick={() => proposeFutureViaAIOnce()}
                className="mt-3 text-xs px-3 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Draft future plan (6 months)
              </button>
            </div>
          ),
        },
      ]);
      return;
    }

    // Everything aligned & has future schedules
    setMessages([
      {
        role: "assistant",
        content: (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm leading-6">
            <div className="font-semibold text-green-900 mb-1">All good ✅</div>
            <div className="text-green-800">
              Hello, <b>{studentName}</b> is up to date and has upcoming classes scheduled. Bravo 🎉
            </div>
          </div>
        ),
      },
    ]);
  }, [ready, studentName, cleanDates, scheduled, proposeFutureViaAIOnce]);

  // Send message
  const sendToAssistant = async () => {
    const text = input.trim();
    if (!text) return;

    // show user bubble first
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // local intent detection: register/add/create schedules
    const normalized = text.toLowerCase();
    const wantsRegister =
      /(register|add|create|make|schedule|plan|등록|추가|생성|만들|스케줄|일정)/i.test(normalized) &&
      /(class|classes|schedule|schedules|수업|클래스|스케줄|일정)/i.test(normalized);

    if (patterns.length && wantsRegister) {
      // build proposal locally & show editor (no server call)
      proposeFromPatterns();
      return;
    }

    // otherwise continue with server call
    setLoading(true);

    // include prior history + this last user message
    const historyBase = messages
      .filter(m => typeof m.content === "string")
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content as string,
      }))
      .slice(-30);
    const history = [...historyBase, { role: "user", content: text }];

    try {
      const res = await fetch("/api/chat/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          student_name: studentName,
          teacher_name: teacherName,
          scheduled,                 // [{ _id?, date, time?, room_name?, duration? }]
          unscheduledDates: cleanDates,
          inferredPattern: patterns, // pass 1–2 slots
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
          { role: "assistant", content: <AssistantBubble>Certainly! Here is a form to edit and apply.</AssistantBubble> },
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

  // Simple editor helpers
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

  // ---- Multi-resolve helpers (fix multi-delete / multi-update) -------------
  function normalizeDateStr(s?: string) {
    return (s ?? "").trim().replace(/\.$/, "").replace(/\s+/g, " ");
  }

  // resolve all IDs for a target; prefer local matches; fallback to lookup
  const resolveIds = async (t: Target): Promise<string[]> => {
    if (t._id) return [t._id];

    const tDate = normalizeDateStr(t.date);
    const tTime = (t.time ?? "").trim();

    // local matches (by date [+ time])
    const localMatches = (scheduled || []).filter((row) => {
      const sameDate = normalizeDateStr(row.date) === tDate;
      if (!sameDate) return false;
      if (tTime) return String(row.time ?? "") === tTime;
      return true; // date-only ⇒ delete all on that date
    });
    const localIds = localMatches.map((r) => r._id).filter(Boolean) as string[];
    if (localIds.length) return localIds;

    // fallback single lookup
    const looked = await lookupOneId(t);
    return looked ? [looked] : [];
  };

  const submitUpdate = async () => {
    if (!updateDraftState) return;
    setSubmitting(true);
    try {
      // resolve all to unique IDs
      const idLists = await Promise.all(updateDraftState.targets.map(resolveIds));
      const ids = Array.from(new Set(idLists.flat()));

      await Promise.all(
        ids.map(async (id) => {
          await fetch(`/api/schedules/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateDraftState.patch),
          });
        })
      );

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
      // resolve all to unique IDs (date-only ⇒ delete all on that date)
      const idLists = await Promise.all(deleteDraftState.map(resolveIds));
      const ids = Array.from(new Set(idLists.flat().filter(Boolean)));

      await Promise.all(ids.map((id) => fetch(`/api/schedules/${id}`, { method: "DELETE" })));

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
                    {t.student_name ?? studentName} • {t.date ?? "(date)"} {t.time ? `• ${t.time}:00` : ""} {t._id ? `• id:${t._id}` : ""}
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
                    {t.student_name ?? studentName} • {t.date ?? "(date)"} {t.time ? `• ${t.time}:00` : ""} {t._id ? `• id:${t._id}` : ""}
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
