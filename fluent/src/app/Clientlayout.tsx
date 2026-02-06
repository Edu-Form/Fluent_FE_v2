"use client";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-[#F6F7FB]">
      {children}
    </div>
  );
}
