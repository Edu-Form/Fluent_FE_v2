// src/app/api/chat/scheduling/route.ts
import { NextResponse } from "next/server";
import { openaiClient } from "@/lib/openaiClient";

type ProposedItem = {
  date: string;         // "YYYY. MM. DD."
  room_name: string;    // "HF1"
  time: string;         // "19"
  duration: string;     // "1"
  teacher_name?: string;
  student_name: string;
};

type Target = {
  _id?: string;
  date?: string;          // "YYYY. MM. DD."
  student_name?: string;  // fallback if no _id
};

function normDotDate(d: string) {
  const s = (d ?? "").trim().replace(/\s+/g, " ");
  if (!s) return s;
  return s.endsWith(".") ? s : `${s}.`;
}

function coerceCreateItems(raw: any, student_name: string, teacher_name?: string): ProposedItem[] {
  if (!raw || !Array.isArray(raw.items)) return [];
  return raw.items
    .map((it: any) => ({
      date: normDotDate(String(it?.date ?? "")),
      room_name: String(it?.room_name ?? "HF1"),
      time: String(it?.time ?? "19"),
      duration: String(it?.duration ?? "1"),
      teacher_name: String(it?.teacher_name ?? teacher_name ?? ""),
      student_name: String(it?.student_name ?? student_name),
    }))
    .filter((it: ProposedItem) => !!it.date);
}

function coerceUpdatePayload(raw: any, fallbackStudent: string) {
  const targets: Target[] = Array.isArray(raw?.targets) ? raw.targets : [];
  const patch = raw?.patch ?? {};
  // normalize date in patch if present
  if (patch?.date) patch.date = normDotDate(String(patch.date));
  // ensure targets have student_name if missing
  for (const t of targets) {
    if (!t.student_name) t.student_name = fallbackStudent;
    if (t.date) t.date = normDotDate(String(t.date));
  }
  return { targets, patch };
}

function coerceDeleteTargets(raw: any, fallbackStudent: string): Target[] {
  const targets: Target[] = Array.isArray(raw?.targets) ? raw.targets : [];
  for (const t of targets) {
    if (!t.student_name) t.student_name = fallbackStudent;
    if (t.date) t.date = normDotDate(String(t.date));
  }
  return targets;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      student_name,
      teacher_name,
      message = "",
      unscheduledDates = [],     // happened but not scheduled (string[])
      scheduled = [],            // [{_id,date,time,room_name,duration}], optional
      today,                     // optional ISO for phrases like "this month"
    } = body;

    if (!student_name) {
      return NextResponse.json({ error: "student_name is required" }, { status: 400 });
    }

    // ——— Tool definitions ———
    const tools: any[] = [
      // CREATE
      {
        type: "function",
        function: {
          name: "propose_create",
          description:
            "Propose new schedules to create. Use this when the user wants to register classes.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                description: "List of schedules to add for this student.",
                items: {
                  type: "object",
                  required: ["date", "room_name", "time", "duration", "student_name"],
                  properties: {
                    date: { type: "string", description: 'Exact "YYYY. MM. DD." (include trailing dot).' },
                    room_name: { type: "string", description: "Room code, e.g. HF1, EB1." },
                    time: { type: "string", description: 'Hour (0-23) as a string, e.g. "20".' },
                    duration: { type: "string", description: 'Duration in hours as a string, e.g. "1".' },
                    teacher_name: { type: "string" },
                    student_name: { type: "string" }
                  }
                }
              }
            },
            required: ["items"]
          }
        }
      },
      // UPDATE
      {
        type: "function",
        function: {
          name: "propose_update",
          description:
            "Propose updating existing schedules. Use targets by _id if known, otherwise by (student_name, date). Include a patch.",
          parameters: {
            type: "object",
            properties: {
              targets: {
                type: "array",
                description: "Schedules to update; prefer _id when possible.",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string", description: "Existing schedule id" },
                    date: { type: "string", description: 'If no _id, use date "YYYY. MM. DD."' },
                    student_name: { type: "string", description: "Student name" }
                  }
                }
              },
              patch: {
                type: "object",
                description: "Fields to change.",
                properties: {
                  date: { type: "string", description: 'New date "YYYY. MM. DD."' },
                  room_name: { type: "string" },
                  time: { type: "string" },
                  duration: { type: "string" }
                }
              }
            },
            required: ["targets", "patch"]
          }
        }
      },
      // DELETE
      {
        type: "function",
        function: {
          name: "propose_delete",
          description:
            "Propose deleting schedules. Use targets by _id if known, otherwise by (student_name, date).",
          parameters: {
            type: "object",
            properties: {
              targets: {
                type: "array",
                description: "Schedules to delete; prefer _id when possible.",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    date: { type: "string", description: 'If no _id, use date "YYYY. MM. DD."' },
                    student_name: { type: "string" }
                  }
                }
              }
            },
            required: ["targets"]
          }
        }
      }
    ];

    const systemPrompt = [
      "You are a scheduling assistant for a language school.",
      "Inputs you may receive:",
      "- student_name: the student",
      "- teacher_name: optional",
      "- message: user's natural language instruction",
      "- unscheduledDates: dates with a class note but no schedule",
      "- scheduled: current schedules (with _id, date, time, room_name, duration)",
      "- today: ISO timestamp to help interpret relative dates (this month, next week, etc.)",
      "",
      "Your job:",
      "- Detect intent: create, update, or delete schedules.",
      "- If CREATE: call propose_create with items. Dates must be exact 'YYYY. MM. DD.'",
      "- If UPDATE: call propose_update with targets and a patch.",
      "- If DELETE: call propose_delete with targets.",
      "- Prefer using provided _id for updates/deletes. If not available, use (student_name, date).",
      "- For CREATE, if the user specifies a weekday pattern (e.g., Tuesdays this month at 20:00 in EB1), expand into concrete dates.",
      "- You may use unscheduledDates to fill in missing schedules when relevant, but you are NOT limited to them.",
      "- Never invent dates that don't follow from the message. If ambiguous, ask a concise follow-up instead of calling a tool.",
    ].join("\n");

    const userContent = [
      `student_name: ${student_name}`,
      teacher_name ? `teacher_name: ${teacher_name}` : null,
      `unscheduledDates: ${JSON.stringify(unscheduledDates)}`,
      scheduled?.length ? `scheduled: ${JSON.stringify(scheduled)}` : null,
      today ? `today: ${today}` : null,
      `message: ${message}`
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      tools,
      tool_choice: "auto"
    });

    const choice = completion.choices?.[0];
    const msg = choice?.message;

    // Tool dispatch
    if (msg?.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        const name = call.function?.name;
        const argStr = call.function?.arguments ?? "{}";
        let args: any = {};
        try {
          args = JSON.parse(argStr);
        } catch {
          args = {};
        }

        if (name === "propose_create") {
          const items = coerceCreateItems(args, student_name, teacher_name);
          if (items.length > 0) {
            return NextResponse.json({ action: "propose_create", items });
          }
        }

        if (name === "propose_update") {
          const { targets, patch } = coerceUpdatePayload(args, student_name);
          if (Array.isArray(targets) && targets.length > 0 && patch && Object.keys(patch).length) {
            return NextResponse.json({ action: "propose_update", targets, patch });
          }
        }

        if (name === "propose_delete") {
          const targets = coerceDeleteTargets(args, student_name);
          if (Array.isArray(targets) && targets.length > 0) {
            return NextResponse.json({ action: "propose_delete", targets });
          }
        }
      }
    }

    // Fallback: assistant text
    const text = msg?.content?.toString().trim();
    return NextResponse.json({
      reply:
        text ||
        "I couldn't extract a clear scheduling intent. Please specify create/update/delete with dates, time, room, and duration.",
    });
  } catch (err) {
    console.error("scheduling/chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
