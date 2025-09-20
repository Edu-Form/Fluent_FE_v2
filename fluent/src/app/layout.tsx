"use client";

// import Alert from "@/components/Alert";
// import Navigation from "@/components/navigation";
import "./globals.css";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTeacherPath = pathname?.startsWith("/teacher");

  return (
    <html lang="en">
      <body>
        <Script src="https://js.tosspayments.com/v1" strategy="beforeInteractive" />
        <div className="flex flex-col  bg-[#F6F7FB]">
          {isTeacherPath ? (
            <div>{children}</div>
          ) : (
            <div className="flex flex-col">
              <div>{children}</div>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
