"use client";

// import Alert from "@/components/Alert";
// import Navigation from "@/components/navigation";
import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTeacherPath = pathname?.startsWith("/teacher");

  return (
    <html lang="en">
      <body className="flex flex-col  bg-[#F6F7FB]">
        {isTeacherPath ? (
          <div>{children}</div>
        ) : (
          <div className="flex flex-col">
            <div>{children}</div>
          </div>
        )}
      </body>
    </html>
  );
}
