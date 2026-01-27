"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ❌ searchParams 제거

  const isDashboard = pathname === "/teacher/admin_billing_1";
  const isOverview = pathname === "/teacher/admin_billing_1/overview";
  const isPopup = pathname.startsWith("/teacher/admin_billing_1/advertisement");

  const baseClass =
    "block rounded-md px-3 py-2 text-sm font-medium transition";
  const activeClass = "bg-indigo-50 text-indigo-700";
  const inactiveClass = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 shrink-0 border-r bg-white px-4 py-6">
        <div className="mb-6 text-lg font-bold text-indigo-600">
          Admin Panel
        </div>

        <nav className="space-y-1">
          <Link
            href={`/teacher/admin_billing_1/overview`}
            className={`${baseClass} ${
              isOverview ? activeClass : inactiveClass
            }`}
          >
            Overview
          </Link>

          <Link
            href={`/teacher/admin_billing_1`}
            className={`${baseClass} ${
              isDashboard ? activeClass : inactiveClass
            }`}
          >
            전체 학생 매출 현황
          </Link>

          <Link
            href={`/teacher/admin_billing_1/advertisement`}
            className={`${baseClass} ${
              isPopup ? activeClass : inactiveClass
            }`}
          >
            Popup / Banner 관리
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
