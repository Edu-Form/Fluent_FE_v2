import { NextResponse } from "next/server"
import { getStudents } from "@/lib/data" 

export async function GET() {
  try {
    const students = await getStudents()
    return NextResponse.json(students)
  } catch {
    return NextResponse.json({ status: 500 })
  }
}

