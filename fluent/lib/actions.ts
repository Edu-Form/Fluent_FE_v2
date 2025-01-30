"use server";

import { revalidatePath } from "next/cache";
import {
  addStudent as addStudentToDB,
  updateStudent as updateStudentInDB,
} from "./data";
import {
  addTeacher as addTeacherToDB,
  updateTeacher as updateTeacherInDB,
} from "./data";
import type { Student } from "./definitions";
import type { Teacher } from "./definitions";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Phone } from "lucide-react"

export async function updateStudent(
  id: string,
  update: Partial<Student>
): Promise<Student> {
  try {
    const updatedStudent = await updateStudentInDB(id, update);
    revalidatePath("/student-registration");
    revalidatePath("/payments");
    return updatedStudent;
  } catch (error) {
    console.error("Failed to update student:", error);
    throw new Error("Failed to update student. Please try again.");
  }
}

const koreanDate = toZonedTime(new Date(), "Asia/Seoul");

export async function addStudent(formData: FormData): Promise<Student> {
  try {
    const newStudent = {
      name: formData.get("name") as string,
      age: Number(formData.get("age")),
      job: formData.get("job") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      selfPerceivedLevel: Number(formData.get("selfPerceivedLevel")),
      englishGoal: Number(formData.get("englishGoal")),
      reasonForStudying: formData.get("reasonForStudying") as string,
      englishBackground: formData.get("englishBackground") as string,
      expectedDuration: formData.get("expectedDuration") as string,
      homeworkHours: formData.get("homeworkHours") as string,
      consentForRecording: formData.get("consentForRecording") as "Yes" | "No",
      commonQuestion1: formData.get("commonQuestion1") as string,
      commonQuestion2: formData.get("commonQuestion2") as string,
      translation1: formData.get("translation1") as string,
      translation2: formData.get("translation2") as string,
      translation3: formData.get("translation3") as string,
      translation4: formData.get("translation4") as string,
      translation5: formData.get("translation5") as string,
      translation6: formData.get("translation6") as string,
      translation7: formData.get("translation7") as string,
      translation8: formData.get("translation8") as string,
      translation9: formData.get("translation9") as string,
      translation10: formData.get("translation10") as string,
      translation11: formData.get("translation11") as string,
      translation12: formData.get("translation12") as string,
      translation13: formData.get("translation13") as string,
      translation14: formData.get("translation14") as string,
      translation15: formData.get("translation15") as string,
      translation16: formData.get("translation16") as string,
      translation17: formData.get("translation17") as string,
      translation18: formData.get("translation18") as string,
      translation19: formData.get("translation19") as string,
      translation20: formData.get("translation20") as string,
      level: Number(formData.get("level")),
      levelDescription: formData.get("levelDescription") as string,
      curriculum: formData.get("curriculum") as string,
      classSchedule: formData.get("classSchedule") as string,
      finalizedNotes: formData.get("finalizedNotes") as string,
      signedUp: formData.get("signedUp") === "Yes",
      status: formData.get("status") as Student["status"],
      teacher: formData.get("teacher") as string,
      paymentNotes: formData.get("paymentNotes") as string,
      createdAt: format(koreanDate, "yyyy-MM-dd"),
      credits: Number(formData.get("credits")),
      paymentHistory: formData.get("paymentHistory") as string,
    };
    const addedStudent = await addStudentToDB(newStudent);
    revalidatePath("/student-registration");
    return addedStudent;
  } catch (error) {
    console.error("Failed to add student:", error);
    throw new Error("Failed to add student. Please try again.");
  }
}

export async function addTeacher(formData: FormData): Promise<Teacher> {
    try {
      const newTeacher = {
        name: formData.get("name") as string,
        experience: formData.get("experience") as string,
        notes: formData.get("notes") as string,
        createdAt: new Date().toISOString(),
        phoneNumber: formData.get("PhoneNumber") as string,
      }
      const addedTeacher = await addTeacherToDB(newTeacher)
      revalidatePath("/teacher-information")
      return addedTeacher
    } catch (error) {
      console.error("Failed to add teacher:", error)
      throw new Error("Failed to add teacher. Please try again.")
    }
  }
  
  export async function updateTeacher(id: string, update: Partial<Teacher>): Promise<Teacher> {
    try {
      const updatedTeacher = await updateTeacherInDB(id, update)
      revalidatePath("/teacher-information")
      return updatedTeacher
    } catch (error) {
      console.error("Failed to update teacher:", error)
      throw new Error("Failed to update teacher. Please try again.")
    }
  }