import { clientPromise } from "@/lib/mongodb";
import type { Student, Teacher } from "./definitions";
import { ObjectId } from "mongodb";

export function serialize_document(document: any) {
  if (document._id) {
    document._id = document._id.toString(); // Convert _id to string
  }
  return document;
}

// lib/data.ts (top, near imports)
const toDotDate = (raw?: string | null) => {
  if (!raw) return "";
  let s = String(raw).trim();

  // Strip trailing dots and normalize separators
  s = s.replace(/\.+$/, "");

  // Accept "YYYY. M. D", "YYYY-M-D", "YYYY/M/D", "YYYYMMDD"
  const m =
    s.match(/^(\d{4})\s*[.\-\/]\s*(\d{1,2})\s*[.\-\/]\s*(\d{1,2})$/) ||
    s.match(/^(\d{4})(\d{2})(\d{2})$/) ||
    s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/);

  if (!m) {
    // Not a date (e.g., "N/A") — return as-is
    return s;
  }

  const y = m[1];
  const mo = String(m[2]).padStart(2, "0");
  const d  = String(m[3]).padStart(2, "0");

  // ✅ Always returns with trailing dot
  return `${y}. ${mo}. ${d}.`;
};

const normalizeName = (raw: string) =>
  raw.trim().replace(/\s+/g, " ");

/** Incoming payload shape from the client */
export interface ScheduleInput {
  date: string;           // "YYYY. MM. DD." (local date string)
  time: number;           // supports halves (e.g., 9.5 for 09:30)
  duration: number;       // supports halves (e.g., 1.5 for 1h30m)
  room_name: string;
  teacher_name?: string;
  student_name: string;
  calendarId?: string;
}

/** Saved document shape (what we insert into MongoDB) */
export interface ScheduleDoc {
  _id?: ObjectId | string;
  date: string;
  time: number;
  duration: number;
  startMinutes: number;
  durationMinutes: number;
  startISO: string;
  endISO: string;
  room_name: string;
  teacher_name: string;
  student_name: string;
  calendarId: string;
  createdAt: string;
  updatedAt?: string;
}

/* ------------------------ helpers (keep in /lib) ------------------------ */
function parseYMD(dateStr: string): Date | null {
  if (!dateStr) return null;
  const m = String(dateStr).trim().match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d); // local midnight
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function isHalfStep(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

/**
 * Normalize & validate the schedule payload. Converts fractional hours to minutes,
 * computes concrete start/end ISO datetimes, and returns a ready-to-insert doc.
 */
function normalizeSchedule(input: ScheduleInput): ScheduleDoc {
  const {
    date,
    time,
    duration,
    room_name,
    teacher_name = "",
    student_name,
    calendarId = "1",
  } = input || ({} as ScheduleInput);

  if (!date) throw new Error("date required");
  if (!room_name) throw new Error("room_name required");
  if (!student_name) throw new Error("student_name required");

  const dt = parseYMD(date);
  if (!dt) throw new Error("Invalid date format. Use 'YYYY. MM. DD.'");

  const timeNum = Number(time);
  const durNum = Number(duration);

  if (!isHalfStep(timeNum) || timeNum < 0 || timeNum > 23.5) {
    throw new Error("time must be 0, 0.5, …, 23.5");
  }
  if (!isHalfStep(durNum) || durNum <= 0) {
    throw new Error("duration must be 0.5, 1.0, 1.5, …");
  }

  const startMinutes = Math.round(timeNum * 60);   // e.g., 9.5 -> 570
  const durationMinutes = Math.round(durNum * 60); // e.g., 1.5 -> 90

  const h = Math.floor(startMinutes / 60);
  const m = startMinutes % 60;

  const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, m, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return {
    date,
    time: timeNum,
    duration: durNum,
    startMinutes,
    durationMinutes,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    room_name,
    teacher_name,
    student_name,
    calendarId,
    createdAt: new Date().toISOString(),
  };
}

/** Build normalized time fields from date/time/duration (supports half-hours). */
function buildTimeFields(date: string, time: number, duration: number) {
  const dt = parseYMD(date);
  if (!dt) throw new Error("Invalid date format. Use 'YYYY. MM. DD.'");
  if (!isHalfStep(time) || time < 0 || time > 23.5) {
    throw new Error("time must be 0, 0.5, …, 23.5");
  }
  if (!isHalfStep(duration) || duration <= 0) {
    throw new Error("duration must be 0.5, 1.0, 1.5, …");
  }

  const startMinutes = Math.round(time * 60);
  const durationMinutes = Math.round(duration * 60);
  const h = Math.floor(startMinutes / 60);
  const m = startMinutes % 60;

  const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, m, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return {
    date,
    time,
    duration,
    startMinutes,
    durationMinutes,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

export async function saveTeacherStatus(
  studentName: string,
  classNoteDateRaw: string | null | undefined,
  quizletDateRaw?: string | null,
  diaryDateRaw?: string | null,
  phoneNumber?: string | null // optional: helps match the right doc
): Promise<{ status: number; message: string; updated?: any }> {
  try {
    const name = normalizeName(studentName || "");
    const classNoteDate = toDotDate(classNoteDateRaw);
    if (!name || !classNoteDate) {
      return { status: 200, message: "Skipped: missing student or class_note date" };
    }
    const quizlet_date = quizletDateRaw ? toDotDate(quizletDateRaw) : "N/A";
    const diary_date   = diaryDateRaw   ? toDotDate(diaryDateRaw)   : "N/A";

    const client = await clientPromise;
    const db = client.db("school_management");       // ensure this matches your real DB
    const collection = db.collection("students");    // ensure this matches your real collection

    // 1) Find existing student (NO upsert). Try by normalized name; fallback by phone.
    const filter: any = { name: normalizeName(name) };
    if (phoneNumber) {
      filter.$or = [{ name: normalizeName(name) }, { phoneNumber }];
    }

    // Use case-insensitive collation to be safer with name case
    const existing = await collection.findOne(filter, {
      projection: { _id: 1, name: 1, phoneNumber: 1, class_history: 1 },
      collation: { locale: "en", strength: 2 },
    });

    if (!existing) {
      console.warn("[saveTeacherStatus] Student not found — skipped write:", { name, phoneNumber });
      return { status: 404, message: "Student not found (skipped write)" };
    }

    // 2) Prepare updated history
    const history: Array<Record<string, { quizlet_date: string; diary_date: string }>> =
      Array.isArray(existing.class_history) ? [...existing.class_history] : [];

    const key = classNoteDate;
    const idx = history.findIndex((item) => item && Object.prototype.hasOwnProperty.call(item, key));
    const payload = { quizlet_date, diary_date };

    if (idx >= 0) {
      history[idx][key] = payload;
    } else {
      history.push({ [key]: payload });
    }

    // 3) Update by _id ONLY (prevents creating a new student)
    const res = await collection.findOneAndUpdate(
      { _id: existing._id },
      { $set: { class_history: history, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    return { status: 200, message: "class_history saved", updated: res?.value ?? res };
  } catch (error) {
    console.error("saveTeacherStatus error:", error);
    return { status: 500, message: "Internal Server Error" };
  }
}


/** Get all teachers (latest first). */
export async function getTeachers() {
  const client = await clientPromise;
  const database = client.db("school_management");
  const col = database.collection("teachers");

  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    phoneNumber: doc.phoneNumber ?? "",
    experience: doc.experience ?? "",
  }));
}

/** Create a new teacher. */
export async function addTeacher(teacher: any) {
  const client = await clientPromise;
  const database = client.db("school_management");
  const col = database.collection("teachers");

  const payload = {
    name: teacher?.name || "",
    phoneNumber: teacher?.phoneNumber || "",
    experience: teacher?.experience || "",
    createdAt: teacher?.createdAt || new Date(),
  };

  const result = await col.insertOne(payload);
  return { ...payload, _id: result.insertedId.toString() };
}

/** Delete a teacher by exact name. */
export async function removeTeacher(name: string) {
  const client = await clientPromise;
  const database = client.db("school_management");
  const col = database.collection("teachers");

  const trimmed = String(name ?? "").trim();
  if (!trimmed) return { deletedCount: 0 };

  const result = await col.deleteOne({ name: trimmed });
  return { deletedCount: result.deletedCount ?? 0 };
}

/** Fetch a single student profile by exact name match. */
export async function getStudentByName(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const student = await db.collection("students").findOne({ name: student_name });
    if (!student) return null;
    return serialize_document(student);
  } catch (err) {
    console.error("getStudentByName error:", err);
    return null;
  }
}

export async function getStudentQuizletData(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    // Find the quizlets related to the student name, sorted by date
    const filteredQuizlets = await db
      .collection("quizlet")
      .find({ student_name, deleted: { $ne: true } })
      .sort({ date: -1 })
      .toArray(); // Convert cursor to an array

    if (!filteredQuizlets || filteredQuizlets.length === 0) {
      return null; // Return null if no quizlets are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredQuizlets.map(serialize_document);
  } catch (error) {
    console.error("Error fetching diaries:", error);
    return null;
  }
}

export async function getStudentCurriculumData(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Find the quizlets related to the student name, sorted by date
    const filteredCurriculum = await db
      .collection("curriculum")
      .find({ student_name })
      .sort({ date: 1 })
      .toArray(); // Convert cursor to an array

    if (!filteredCurriculum || filteredCurriculum.length === 0) {
      return null; // Return null if no quizlets are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredCurriculum.map(serialize_document);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return null;
  }
}

export async function getStudentDiaryData(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    // Find the diaries related to the student name, sorted by date
    const filteredDiaries = await db
      .collection("diary")
      .find({ student_name })
      .sort({ date: -1 })
      .toArray(); // Convert cursor to an array
    console.log(filteredDiaries);
    if (!filteredDiaries || filteredDiaries.length === 0) {
      return null; // Return null if no diaries are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredDiaries.map(serialize_document);
  } catch (error) {
    console.error("Error fetching diaries:", error);
    return null;
  }
}

export async function getStudentListData(teacherName: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Find the students related to the teacher name
    const filteredStudents = await db
      .collection("students")
      .find({ teacher: teacherName })
      .sort({ name: 1 })
      .toArray(); // Convert cursor to an array

    if (!filteredStudents || filteredStudents.length === 0) {
      return null; // Return null if no students are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return filteredStudents.map((student) => student.name);
  } catch (error) {
    console.error("Error fetching students:", error);
    return null;
  }
}

export async function getAllBillingData() {
  const client = await clientPromise;
  const db = client.db("school_management");
  return await db.collection("billing").find({}).toArray();
}

export async function getBillingDataByStudent(student_name: string) {
  const client = await clientPromise;
  const db = client.db("school_management");
  return await db.collection("billing").findOne({ student_name });
}

export async function updateBillingProgress({
  student_name,
  step,
  date,
}: {
  student_name: string;
  step: "class_note" | "quizlet" | "diary" | "calendar";
  date: string;
}) {
  const client = await clientPromise;
  const db = client.db("school_management");
  const collection = db.collection("billing");

  const existing = await collection.findOne({ student_name });

  if (!existing) {
    const newEntry = {
      student_name,
      teacher_name: "", // Optional: fill dynamically if needed
      current_class: { [step]: date },
      history: [],
    };
    await collection.insertOne(newEntry);
    return { created: true };
  }

  const current_class = existing.current_class || {};

  // ✅ Special case: "calendar" step completes the process
  if (step === "calendar") {
    const updatedHistory = [...(existing.history || []), current_class];
    await collection.updateOne(
      { _id: new ObjectId(existing._id) },
      {
        $set: {
          current_class: {}, // clear
          history: updatedHistory,
        },
      }
    );
    return { finished: true };
  }

  // ✅ Normal update path
  current_class[step] = date;

  const isComplete =
    "class_note" in current_class &&
    "quizlet" in current_class &&
    "diary" in current_class;

  if (isComplete) {
    // All 3 steps are set → wait for "calendar" to finish it
    await collection.updateOne(
      { _id: new ObjectId(existing._id) },
      { $set: { current_class } }
    );
    return { ready_for_calendar: true };
  } else {
    await collection.updateOne(
      { _id: new ObjectId(existing._id) },
      { $set: { current_class } }
    );
    return { updated: true };
  }
}

export const getRoomData = async (date: string, time: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const filteredSchedules = await db
      .collection("schedules")
      .find({ date: date.replace(/%20/g, " "), time })
      .sort({ room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)
    console.log(filteredSchedules);

    // Get all room names
    const db2 = client.db("room_allocation_db");
    const allRooms = await db2.collection("roomList").find().toArray();
    const allRoomNames = allRooms.map((room) => room.room_name);

    // Create a Set of unavailable rooms
    const unavailableRooms = new Set(
      filteredSchedules.map((schedule) => schedule.room_name)
    );

    // Filter out unavailable rooms from the allRoomNames list
    const availableRooms = allRoomNames.filter(
      (roomName) => !unavailableRooms.has(roomName)
    );

    console.log(availableRooms);
    return availableRooms.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw new Error("Database error");
  }
};

// Function to get teacher's schedule
export const getTeacherScheduleData = async (teacherName: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const teacherSchedule = await db
      .collection("schedules")
      .find({ teacher_name: teacherName })
      .sort({ date: 1, time: 1, room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    return teacherSchedule.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    throw new Error("Database error");
  }
};

// Function to get student's schedule
export const getStudentScheduleData = async (studentName: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const studentSchedule = await db
      .collection("schedules")
      .find({ student_name: studentName })
      .sort({ date: -1, time: 1, room_name: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    return studentSchedule.map(serialize_document); // Serialize and return
  } catch (error) {
    console.error("Error fetching student schedule:", error);
    throw new Error("Database error");
  }
};

export async function deductCredit(student_name: string, date: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const studentData = (await db
      .collection("students")
      .findOne({ name: student_name })) || { paymentHistory: "" };
    const result = await db
      .collection("students")
      .updateOne({ name: student_name }, { $inc: { credits: -1 } });
    const result2 = await db.collection("students").updateOne(
      { name: student_name },
      {
        $set: {
          paymentHistory: `${studentData.paymentHistory} ${date}: Credit -1`,
        },
      }
    );
    return { result, result2 };
  } catch (error) {
    console.error("Error deducting credit:", error);
    throw new Error("Database error");
  }
}

export async function saveScheduleData(input: ScheduleInput) {
  const doc = normalizeSchedule(input);

  const client = await clientPromise;
  const db = client.db("school_management");
  const res = await db.collection<ScheduleDoc>("schedules").insertOne(doc);

  // return inserted doc with _id as string (useful for the client)
  return { _id: String(res.insertedId), ...doc };
}

export async function saveProgressData(progress: {
  student_name: string;
  step: string;
  date: string;
}) {
  const client = await clientPromise;
  const db = client.db("school_management");
  const collection = db.collection("progress"); // ✅ updated collection name

  const { student_name, step, date } = progress;

  // Step 1: Check if student already has a progress doc
  const existing = await collection.findOne({ student_name });

  if (!existing) {
    // Step 2: Create a new document if not found
    const newDoc = {
      student_name,
      current_progress: [{ schedule: date }],
      history: [],
      created_at: new Date()
    };

    const result = await collection.insertOne(newDoc);
    return { insertedId: result.insertedId };
  } else {
    // Step 3: Update existing document
    const result = await collection.updateOne(
      { student_name },
      {
        $set: {
          current_progress: [{ schedule: date }]
        },
        $push: {
          history: {
            step: step,
            date: date,
            updated_at: new Date()
          } as any // ✅ prevent TypeScript error from push operator typing
        }
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  }
}

export async function getProgressDataByStudentName(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    const progress = await db
      .collection("progress")
      .findOne({ student_name });

    return progress;
  } catch (error) {
    console.error("Error fetching progress data:", error);
    throw new Error("Database error");
  }
}

export async function updateProgressData(
  student_name: string,
  current_progress_update: Record<string, any>
) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    const result = await db.collection("progress").updateOne(
      { student_name }, // find by student_name
      {
        $set: Object.fromEntries(
          Object.entries(current_progress_update).map(([key, value]) => [
            `current_progress.${key}`,
            value,
          ])
        ),
      },
      { upsert: true } // create if not exists
    );

    return result;
  } catch (error) {
    console.error("Error updating progress data:", error);
    throw new Error("Database error");
  }
}

export async function getTestData(student_name: string, title: string) {
  try {
    const client = await clientPromise;
    const db = client.db('school_management');

    const result = await db.collection('test').findOne({
      student_name,
      title,
    });

    return result;
  } catch (error) {
    console.error('Error fetching test data:', error);
    return null;
  }
}

export async function saveOrUpdateTestData(student_name: string, title: string, text: string) {
  try {
    const client = await clientPromise;
    const db = client.db('school_management');

    const result = await db.collection('test').updateOne(
      { student_name, title },
      { $set: { text } },
      { upsert: true }
    );
    console.log(result)
    return result;
    
  } catch (error) {
    console.error('Error saving/updating test data:', error);
    return null;
  }
}


export const getSchedulesByDate = async (dateStr: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const schedules = await db
      .collection("schedules")
      .find({ date: dateStr })  // Assuming the 'date' field is a string like "2025. 06. 16."
      .sort({ time: 1, room_name: 1 })
      .toArray();

    return schedules.map(serialize_document);
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    throw new Error("Database error");
  }
};

export async function updateScheduleData(
  id: string,
  patch: Partial<{
    date: string;
    room_name: string;
    time: number;       // ← number, supports halves
    duration: number;   // ← number, supports halves
    teacher_name: string;
    student_name: string;
  }>
): Promise<{ status: number; message: string; updated?: any }> {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const collection = db.collection("schedules");
    const _id = new ObjectId(id);

    // Load current doc so we can recompute derived fields for partial patches
    const curr = await collection.findOne({ _id });
    if (!curr) return { status: 404, message: "Schedule not found" };

    const next: Record<string, any> = {};

    // Copy over simple fields if provided
    for (const k of ["room_name", "teacher_name", "student_name"] as const) {
      if (patch[k] !== undefined) next[k] = patch[k];
    }

    // If any of date/time/duration are provided, recompute normalized fields
    const hasDate = patch.date !== undefined;
    const hasTime = patch.time !== undefined;
    const hasDur  = patch.duration !== undefined;

    if (hasDate || hasTime || hasDur) {
      const date = hasDate ? patch.date! : curr.date;
      const time = hasTime ? Number(patch.time) : Number(curr.time);
      const duration = hasDur ? Number(patch.duration) : Number(curr.duration);

      const normalized = buildTimeFields(date, time, duration);
      Object.assign(next, normalized);
    }

    if (Object.keys(next).length === 0) {
      return { status: 400, message: "No valid fields to update" };
    }

    await collection.updateOne(
      { _id },
      { $set: { ...next, updatedAt: new Date().toISOString() } }
    );

    const updated = await collection.findOne({ _id });
    return {
      status: 200,
      message: "Schedule updated successfully",
      updated: updated ? serialize_document(updated) : undefined,
    };
  } catch (error) {
    console.error("Error updating schedule:", error);
    return { status: 500, message: "Internal Server Error" };
  }
}

export async function deleteScheduleData(
  schedule_id: string
): Promise<{ status: number; message: string }> {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const _id = new ObjectId(schedule_id);

    const res = await db.collection("schedules").deleteOne({ _id });
    if (res.deletedCount === 0) {
      return { status: 404, message: `Schedule with ID ${schedule_id} doesn't exist` };
    }
    return { status: 200, message: `Schedule with ID ${schedule_id} deleted successfully` };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { status: 500, message: "Database error" };
  }
}


export async function getTodayScheduleData(date: string, user: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const filteredSchedules = await db
      .collection("schedules")
      .find({ date: date.replace(/%20/g, " "), teacher_name: user })
      // .find({ date, teacher_name: user })
      .sort({ time: 1 })
      .toArray(); // Convert to array (MongoDB cursor)

    console.log(filteredSchedules);
    const parsedSchedule = filteredSchedules.map((schedule) => ({
      room_name: schedule.room_name,
      student_name: schedule.student_name,
      time: schedule.time,
      time_range: `${schedule.time - 12}pm ~ ${schedule.time - 11}pm`,
    }));

    return parsedSchedule;
  } catch (error) {
    console.error("Error fetching one day one teacher schedule:", error);
    throw new Error("Database error");
  }
}

export async function saveManyScheduleData(schedule: any) {
  try {
    const { dates, time, duration, teacher_name, student_name } = schedule;
    const allSavedRooms = [];

    for (const date of dates) {
      const availableRooms = await getRoomData(date, time);

      if (availableRooms.length === 0) {
        return { status_code: 400, error: "No available rooms" };
      }

      const room_name = availableRooms[0];
      const each_schedule = {
        room_name,
        date,
        time,
        duration,
        teacher_name,
        student_name,
      };
      await saveScheduleData(each_schedule);
      allSavedRooms.push(room_name);
    }

    return {
      status_code: 200,
      all_dates: dates,
      all_rooms: allSavedRooms,
      time,
    };
  } catch (error) {
    console.error("Error saving schedules:", error);
    throw new Error("Database error");
  }
}

export async function getUserData(
  username: string
): Promise<Student | Teacher | null> {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Search in "teachers" collection first
    const teacher = await db
      .collection("teachers")
      .findOne({ phoneNumber: username });
    if (teacher) return teacher as unknown as Teacher;

    // If not found, search in "students" collection
    const student = await db
      .collection("students")
      .findOne({ phoneNumber: username });
    if (student) return student as unknown as Student;

    // No user found
    return null;
  } catch (error) {
    console.error("Error fetching user data from MongoDB:", error);

    // Ensure a value is always returned, even if an error occurs
    return null;
  }
}

export async function saveDiaryData(
  diaryData: any,
  diary_correction: any,
  corrected_diary: string,
  diary_expressions: string,
  diary_summary: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    const modified_diary = {
      student_name: diaryData.student_name,
      class_date: diaryData.class_date,
      date: diaryData.date,
      level: diaryData.level,
      original_text: diaryData.original_text,
      diary_correction: diary_correction,
      corrected_diary: corrected_diary,
      diary_expressions: diary_expressions,
      diary_summary: diary_summary,
    };

    const result = await db.collection("diary").insertOne(modified_diary);

    return {
      status_code: 200,
      id: result.insertedId.toString(),
      student_name: diaryData.student_name,
      date: diaryData.date,
      message: modified_diary,
    };
  } catch (error) {
    console.error("Error saving diary:", error);
    throw new Error("Database error");
  }
}

export async function saveQuizletData(
  quizlet: any,
  kor_quizlet: string[],
  eng_quizlet: string[],
  homework: string,
  nextClass: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    const modified_quizlet = {
      student_name: quizlet.student_name,
      class_date: quizlet.class_date,
      date: quizlet.date,
      original_text: quizlet.original_text,
      homework: homework,
      nextClass: nextClass,
      eng_quizlet,
      kor_quizlet,
    };

    const result = await db.collection("quizlet").insertOne(modified_quizlet);

    return {
      status_code: 200,
      id: result.insertedId.toString(),
      student_name: quizlet.student_name,
      date: quizlet.date,
      eng_quizlet,
      kor_quizlet,
    };
  } catch (error) {
    console.error("Error saving quizlet:", error);
    throw new Error("Database error");
  }
}

// lib/data.ts
export const saveTempClassNote = async (student_name: string, original_text: string) => {
  const client = await clientPromise;
  const db = client.db("room_allocation_db");
  return db.collection("quizlet_temp").updateOne(
    { student_name },
    { $set: { original_text, updatedAt: new Date() } },
    { upsert: true }
  );
};

export const getTempClassNote = async (student_name: string) => {
  const client = await clientPromise;
  const db = client.db("room_allocation_db");
  return db.collection("quizlet_temp").findOne({ student_name });
};


export async function saveCurriculumData(
  curriculum: any
) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    const modified_curriculum = {
      student_name: curriculum.student_name,
      class_date: curriculum.class_date,
      date: curriculum.date,
      original_text: curriculum.original_text,
    };

    const result = await db.collection("curriculum").insertOne(modified_curriculum);

    return {
      status_code: 200,
      id: result.insertedId.toString(),
      student_name: curriculum.student_name,
      date: curriculum.date,
      curriculum: curriculum.original_text,
    };
  } catch (error) {
    console.error("Error saving quizlet:", error);
    throw new Error("Database error");
  }
}

export async function getTeacherStatus(teacherName: string) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");

    // Find all students that have the teacherName in their teacher field
    const students = await db
      .collection("students")
      .find({ teacher: teacherName })
      .toArray();

    if (!students.length) {
      return null; // Return null if no students are found
    }

    // Serialize the documents before returning (optional, but generally recommended)
    return students.map(serialize_document);
  } catch (error) {
    console.error("Error fetching students for teacher:", error);
    return null;
  }
}

// Function to get student's schedule
export const getQuizletNoteData = async (_id: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");
    const objectId = new ObjectId(_id);

    const quizletNote = await db
      .collection("quizlet")
      .find({ _id: objectId })
      .toArray(); // Convert to array (MongoDB cursor)
    console.log(quizletNote);
    return quizletNote; // Serialize and return
  } catch (error) {
    console.error("Error fetching Quizlet Note:", error);
    throw new Error("Database error");
  }
};

export async function updateFavoriteFlags(quizlet_id: string, favorite_flags: string[]) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db"); // your DB name
    const objectId = new ObjectId(quizlet_id);

    const result = await db.collection("quizlet").updateOne(
      { _id: objectId },
      { $set: { favorite_flags } }
    );

    if (result.modifiedCount === 0) {
      return null;
    }

    return { quizlet_id, favorite_flags };
  } catch (error) {
    console.error("DB error in updateFavoriteFlags:", error);
    throw new Error("Failed to update favorite flags");
  }
}

export async function markQuizletAsDeleted(quizlet_id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");
    const objectId = new ObjectId(quizlet_id);

    const result = await db.collection("quizlet").updateOne(
      { _id: objectId },
      { $set: { deleted: true } }
    );

    if (result.modifiedCount === 0) {
      return null;
    }

    return { quizlet_id, deleted: true };
  } catch (error) {
    console.error("DB error in markQuizletAsDeleted:", error);
    throw new Error("Failed to mark quizlet as deleted");
  }
}

export async function updateQuizletNoteData(quizlet_id: string, original_text: string) {
  try {
    const client = await clientPromise; // Ensure the MongoDB client is connected
    const db = client.db("room_allocation_db"); // Use the correct database

    // Convert the quizlet_id to an ObjectId
    const objectId = new ObjectId(quizlet_id);

    // Update the document in the "quizlet" collection
    const result = await db.collection("quizlet").updateOne(
      { _id: objectId }, // Match the document by its ObjectId
      { $set: { original_text } } // Update the `original_text` field
    );

    if (result.modifiedCount === 0) {
      return null; // No document was updated
    }

    // Return the updated data
    return { quizlet_id, original_text };
  } catch (error) {
    console.error("Error updating quizlet note data:", error);
    throw new Error("Failed to update quizlet note data");
  }
}

export const getCurriculumNoteData = async (_id: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const objectId = new ObjectId(_id);

    const curriculumNote = await db
      .collection("curriculum")
      .find({ _id: objectId })
      .toArray(); // Convert to array (MongoDB cursor)
    console.log(curriculumNote);
    return curriculumNote; // Serialize and return
  } catch (error) {
    console.error("Error fetching Curriculum Note:", error);
    throw new Error("Database error");
  }
};

// Function to get student's schedule
export const getDiaryNoteData = async (_id: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");
    const objectId = new ObjectId(_id);

    const diaryNote = await db
      .collection("diary")
      .find({ _id: objectId })
      .toArray(); // Convert to array (MongoDB cursor)
    console.log(diaryNote);
    return diaryNote; // Serialize and return
  } catch (error) {
    console.error("Error fetching Quizlet Note:", error);
    throw new Error("Database error");
  }
};

// Save or update temp diary
export async function saveTempDiary(student_name: string, original_text: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    await db.collection("diary_temp").updateOne(
      { student_name },
      { $set: { original_text, updated_at: new Date() } },
      { upsert: true }
    );

    return { message: "Temp diary saved" };
  } catch (error) {
    console.error("DB error in saveTempDiary:", error);
    throw new Error("Failed to save temp diary");
  }
}

// Fetch temp diary by student
export async function getTempDiary(student_name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("room_allocation_db");

    return await db.collection("diary_temp").findOne({ student_name });
  } catch (error) {
    console.error("DB error in getTempDiary:", error);
    throw new Error("Failed to fetch temp diary");
  }
}

export async function updatePaymentStatus(orderId: string, payment: any) {
  try {
    const client = await clientPromise;
    const db = client.db("school_management");
    const result = await db.collection("students").updateOne(
      { orderId },
      {
        $set: {
          paymentId: payment.paymentKey,
          paymentStatus: payment.status === 'DONE' ? 'COMPLETED' : 'FAILED',
          paymentHistory: `${new Date().toISOString()}: ${payment.method} ${payment.totalAmount}`,
        },
      }
    );
    return result;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Database error");
  }
}

/**
 * Saves the initial state of a payment transaction before the user is
 * sent to Toss Payments. This marks the transaction as 'PENDING'.
 * @param student_name The name of the student making the payment.
 * @param orderId The unique order ID for this transaction.
 * @param amount The amount of the payment.
 */
export async function saveInitialPayment(student_name: string, orderId: string, amount: number) {
  try {
    
    const client = await clientPromise;
    const db = client.db("school_management");
    // Updates the 'students' collection with the pending transaction details.
    const result = await db.collection("students").updateOne(
      { name: student_name },
      {
        $set: {
          orderId,
          paymentStatus: 'PENDING',
        },
      }
    );
    return result;
  } catch (error) {
    console.error("Error saving initial payment:", error, amount);
    throw new Error("Database error");
  }
}
