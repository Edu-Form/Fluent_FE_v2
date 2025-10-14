import { NextResponse } from "next/server"
import { getStudents_Billing } from "@/lib/data" 

export async function GET() {
  try {
    const students = await getStudents_Billing()
    return NextResponse.json(students)
  } catch {
    return NextResponse.json({ status: 500 })
  }
}

