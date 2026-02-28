"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function AdminBillingSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = searchParams.get("user") || "";
  const type = searchParams.get("type") || "";
  const id = searchParams.get("id") || "";

  const baseQuery =
    user || type || id
      ? `?user=${encodeURIComponent(user)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`
      : "";

  // 🔐 Admin logic
  const adminUsers = ["Phil", "David", "Inhyung"];
  const isAdmin = adminUsers.includes(user);

  const isDashboard = pathname === "/teacher/admin_billing_1";
  const isOverview = pathname === "/teacher/admin_billing_1/overview";
  const isAdvertisement = pathname.startsWith("/teacher/admin_billing_1/advertisement");
  const isConsulting = pathname.startsWith("/teacher/admin_billing_1/consulting");
  const isTeacherRegistration = pathname.startsWith("/teacher/admin_billing_1/teacher-registration");

  const baseClass =
    "block rounded-md px-3 py-2 text-sm font-medium transition";
  const activeClass = "bg-indigo-50 text-indigo-700";
  const inactiveClass = "text-gray-600 hover:bg-gray-100";

  return (
    <aside className="w-60 shrink-0 border-r bg-white px-4 py-6">
      <div className="mb-6 text-lg font-bold text-indigo-600">
        Admin Panel
      </div>

      <nav className="space-y-1">

        {/* 👑 ADMIN ONLY */}
        {isAdmin && (
          <>
            <Link
              href={`/teacher/admin_billing_1/overview${baseQuery}`}
              className={`${baseClass} ${
                isOverview ? activeClass : inactiveClass
              }`}
            >
              Overview
            </Link>

            <Link
              href={`/teacher/admin_billing_1${baseQuery}`}
              className={`${baseClass} ${
                isDashboard ? activeClass : inactiveClass
              }`}
            >
              전체 학생 매출 현황
            </Link>

            <Link
              href={`/teacher/admin_billing_1/advertisement${baseQuery}`}
              className={`${baseClass} ${
                isAdvertisement ? activeClass : inactiveClass
              }`}
            >
              Popup / Banner 관리
            </Link>
          </>
        )}

        {/* 👨‍🏫 ALL TEACHERS */}
        <Link
          href={`/teacher/admin_billing_1/consulting${baseQuery}`}
          className={`${baseClass} ${
            isConsulting ? activeClass : inactiveClass
          }`}
        >
          상담 관리
        </Link>

        <Link
          href={`/teacher/admin_billing_1/teacher-registration${baseQuery}`}
          className={`${baseClass} ${
            isTeacherRegistration ? activeClass : inactiveClass
          }`}
        >
          Teacher 등록
        </Link>

      </nav>
    </aside>
  );
}