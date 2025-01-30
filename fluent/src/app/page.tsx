"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserData } from "@/lib/data";

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
          const url = `/home?user=${user.name}&type=student&id=${user.phoneNumber}`;
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
    <div className="h-full w-screen bg-white flex items-center justify-center">
      <Card className="w-[90%] max-w-[400px]">
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
        <div className="flex justify-center mb-10">
          <input
            id="username"
            placeholder="전화번호를 적으세요"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            className="w-[80%] text-sm placeholder-gray-400 placeholder-opacity-70 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
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
