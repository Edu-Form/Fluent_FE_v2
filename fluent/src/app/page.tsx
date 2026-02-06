"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [username, setUsername] = useState("");
  const router = useRouter();

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
    <div className="w-full flex-1 flex items-center justify-center px-4">
      <Card className="w-full max-w-[400px] overflow-hidden">
        <Image
          src="/images/Login.svg"
          alt="image"
          width={0}
          height={0}
          className="w-full h-auto"
        />

        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold mt-6 mb-3">
            Login
          </CardTitle>
        </CardHeader>

        <div className="flex justify-center mb-6">
          <input
            placeholder="전화번호를 적으세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-[85%] bg-white text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <CardFooter className="flex justify-center pb-6">
          <Button
            className="w-[90%] rounded-xl text-lg text-white py-3 bg-[#171861]"
            onClick={Login}
          >
            Log in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

}
