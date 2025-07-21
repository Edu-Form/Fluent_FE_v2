// app/api/test/route.ts
import { NextResponse } from 'next/server';
import {
  getTestData,
  saveOrUpdateTestData,
} from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const student = searchParams.get('student_name');
  const title = searchParams.get('title');

  if (!student || !title) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const data = await getTestData(student, title);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { student_name, title, text } = body;
  console.log(body)
  if (!student_name || !title || !text) {
    return NextResponse.json({ error: 'Missing body data' }, { status: 400 });
  }

  const result = await saveOrUpdateTestData(student_name, title, text);
  return NextResponse.json(result);
}
