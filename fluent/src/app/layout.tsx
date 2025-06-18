"use client";

// import Alert from "@/components/Alert";
// import Navigation from "@/components/navigation";
import "./globals.css";
import { usePathname } from "next/navigation";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTeacherPath = pathname?.startsWith("/teacher");

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  if (!GOOGLE_CLIENT_ID) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined.");
    // You might want to render a more user-friendly error message or fallback UI here
  }

  return (
    <html lang="en">
      <body className="flex flex-col  bg-[#F6F7FB]">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {isTeacherPath ? (
            <div>{children}</div>
          ) : (
            <div className="flex flex-col">
              <div>{children}</div>
            </div>
          )}
        </GoogleOAuthProvider>
        <Script
          src="https://apis.google.com/js/api.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log('Google gapi script loaded.');
            // You might want to call window.gapi.load('client:auth2') here
            // or handle it in the useGoogleCalendar hook once gapi is available.
          }}
          onError={(e) => console.error('Error loading Google gapi script:', e)}
        />
      </body>
    </html>
  );
}
