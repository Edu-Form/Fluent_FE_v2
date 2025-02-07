import Alert from "@/components/Alert";
import Navigation from "@/components/navigation";
import "./globals.css";

export const metadata = {
  title: "Fluent",
  description: "학원 서비스 폼",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F6F7FB]">
        <div className="min-h-screen flex flex-col">
          {/* Alert Section */}
          <div className="flex-none p-4">
            <Alert />
          </div>

          {/* Main Content Section */}
          <div className="flex-1 px-4">{children}</div>

          {/* Navigation Section - Fixed at bottom */}
          <div className="flex-1 h-20">
            <Navigation />
          </div>
        </div>
      </body>
    </html>
  );
}
