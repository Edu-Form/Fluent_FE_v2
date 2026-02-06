import "./globals.css";
import Script from "next/script";
import ClientLayout from "./Clientlayout";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          src="https://js.tosspayments.com/v1"
          strategy="beforeInteractive"
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
