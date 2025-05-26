"use client";
/**
 * Main login page for the Fluent Learning Platform
 * 
 * This is the entry point of the application where users (students and teachers)
 * can log in using their phone number. After successful authentication, 
 * users are redirected to their respective dashboards based on their role.
 * 
 * @module Pages/Login
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Login Page Component
 * 
 * Provides a simple phone number-based authentication system that 
 * redirects users to either student or teacher dashboard based on their role.
 * 
 * @returns {JSX.Element} The login page component
 */
export default function Page() {
  // State to store the user's phone number input
  const [username, setUsername] = useState("");
  const router = useRouter();

  /**
   * Handles the login process:
   * 1. Fetches user data from the API based on phone number
   * 2. Determines if the user is a student or teacher
   * 3. Redirects to the appropriate dashboard with query parameters
   */
  async function Login() {
    const url = `api/user/${username}`;
    console.log(url);
    const response = await fetch(url);
    if (response.ok) {
      const user = await response.json();
      console.log(user);
      if (user) {
        // Type guard: Check if user is a Student (has 'level' property)
        if ("level" in user) {
          const url = `/student/home?user=${user.name}&type=student&id=${user.phoneNumber}`;
          router.push(url);
        } else {
          const url = `/teacher/home?user=${user.name}&type=teacher&id=${user.phoneNumber}`;
          router.push(url);
        }
      }
    } else {
      router.push("/"); // Redirect to home or show an error page if no user found
    }
  }

  return (
    <div className="w-screen h-[80vh]  bg-white flex items-center justify-center">
      <Card className="w-[90%] max-w-[400px]">
        {/* Login illustration image */}
        <Image
          src={"/images/Login.svg"}
          alt="image"
          width={0}
          height={0}
          className="w-full h-auto rounded-t-xl"
        />
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold mt-6 mb-3">
            Login
          </CardTitle>
        </CardHeader>
        {/* Phone number input field */}
        <div className="flex justify-center mb-10">
          <input
            id="username"
            placeholder="전화번호를 적으세요"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            className="w-[80%] bg-white text-sm placeholder-gray-400 placeholder-opacity-70 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        {/* Login button */}
        <CardFooter className="flex justify-center">
          <Button
            className="w-[90%] rounded-[0.5rem] text-xl text-white py-2 my-20 bg-[#171861] hover:text-[#171861] hover:bg-[#cecee5]"
            onClick={Login}
          >
            Log in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
