"use client";

// import Alert from "@/components/Alert";
// import Navigation from "@/components/navigation";
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "David's English Academy",
  description: "The English learning app for David's English Academy",
  manifest: "/manifest.json",
  themeColor: "#000000",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Script src="https://js.tosspayments.com/v1" strategy="beforeInteractive" />
        <div className="flex flex-col bg-[#F6F7FB]">
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
