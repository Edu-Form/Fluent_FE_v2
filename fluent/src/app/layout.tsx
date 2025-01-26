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
    <html lang="en">
      <body className="w-full  h-screen flex flex-col bg-[#F6F7FB]">
        {/* 전체 화면 높이를 기준으로 분할 */}
        <div className="flex flex-col flex-1 overflow-hidden h-full gap-[1vh] p-[2vh]">
          {/* Alert (10% Height) */}
          <div className="flex justify-center items-center h-[10%] overflow-hidden">
            <Alert />
          </div>

          {/* Main Content (80% Height) */}
          <div className="flex flex-1 justify-center item-center overflow-y-hidden">
            {children}
          </div>

          {/* Navigation (10% Height) */}
          <div className="flex justify-center items-center h-[10%] overflow-hidden">
            <Navigation />
          </div>
        </div>
      </body>
    </html>
  );
}
