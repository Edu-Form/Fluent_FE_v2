import { NextResponse } from "next/server";
import { getStudentQuizletData } from "@/lib/data"; // Import the function from data.ts

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const student_name = decodeURIComponent(url.pathname.split('/').pop() ?? ''); // Extract the student_name from the URL
    console.log(student_name)
    if (!student_name) {
      return NextResponse.json({ error: "Student name not provided" }, { status: 400 });
    }
    // Call the function from data.ts to get the student's diary data
    const quizlets = await getStudentQuizletData(student_name);
    console.log(quizlets);
    if (!quizlets) {
      return NextResponse.json({ error: "Quizlets not found" }, { status: 404 });
    }
    // Get the last quizlet
    const lastQuizlet = quizlets[quizlets.length - 1];

    return NextResponse.json(lastQuizlet);
  } catch (error) {
    console.error("Error fetching student homework data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


