"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ STEP 2: Auto redirect if user exists
  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (stored) {
      try {
        const user = JSON.parse(stored);

        if (user?.type && user?.phone) {
          router.replace(
            `/${user.type}/home?user=${user.name}&type=${user.type}&id=${user.phone}`
          );
          return;
        }
      } catch {
        console.error("Invalid stored user");
      }
    }

    // no user → show login page
    setLoading(false);
  }, [router]);

  async function Login() {
    const url = `api/user/${username}`;
    const response = await fetch(url);

    if (response.ok) {
      const user = await response.json();

      if (user) {
        const type = "level" in user ? "student" : "teacher";

        // ✅ store user info
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: user.name,
            type,
            phone: user.phoneNumber,
          })
        );

        // ✅ redirect
        router.push(
          `/${type}/home?user=${user.name}&type=${type}&id=${user.phoneNumber}`
        );
      }
    } else {
      router.push("/");
    }
  }

  // ✅ prevent flicker while checking localStorage
  if (loading) return null;

  return (
    <div className="w-full flex-1 flex items-center justify-center px-4">
      <Card className="w-full max-w-[400px] h-full overflow-hidden">
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