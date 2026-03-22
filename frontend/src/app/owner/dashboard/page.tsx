"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/owner/bookings");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
}
