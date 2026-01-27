"use client";

import { Suspense } from "react";
import AdminBillingSidebar from "@/components/AdminBillingSidebar";

export default function AdminBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ✅ Sidebar만 Suspense */}
      <Suspense fallback={<div className="w-60 bg-white" />}>
        <AdminBillingSidebar />
      </Suspense>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
