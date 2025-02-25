// src/app/api/user/[username]/route.ts
import { NextResponse } from "next/server";
import { getUserData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    console.log(url.pathname)
    const username = url.pathname.split('/').pop(); // Extract the username from the URL

    if (!username) {
      return NextResponse.json({ error: "Username not provided" }, { status: 400 });
    }

    const user = await getUserData(username);


    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

