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
    try {
      const response = await fetch(`http://13.54.77.128/api/user/${username}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data[0].type == "teacher") {
            const url = `/teacher/home?user=${data[0].user_name}&type=${data[0].type}&id=${data[0].user_number}`;
            router.push(url);
          } else if (data[0].type == "student") {
            const url = `/home?user=${data[0].user_name}&type=${data[0].type}&id=${data[0].user_number}`;
            router.push(url);
          }
        }
      }
    } catch {
      router.push("/");
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
            className="w-[90%] rounded-[0.5rem] text-xl py-2 my-20 bg-[#171861]"
            onClick={Login}
          >
            Log in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
