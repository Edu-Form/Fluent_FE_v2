"use client";

import { Suspense } from "react";
import AdminBillingHomeFancyInner from "@/components/AdminBillingHomeFancyInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading overview…</div>}>
      <AdminBillingHomeFancyInner />
    </Suspense>
  );
}



