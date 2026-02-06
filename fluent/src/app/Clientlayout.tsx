"use client";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-white flex flex-col">
      {children}
    </div>
  );
}
