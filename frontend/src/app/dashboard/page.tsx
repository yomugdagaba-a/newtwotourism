"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";

export default function DashboardPage() {
  const { role, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    switch (role) {
      case "ADMIN":
        router.replace("/admin");
        break;
      case "HOTEL_OWNER":
        router.replace("/owner/dashboard");
        break;
      default:
        router.replace("/");
        break;
    }
  }, [isAuthenticated, isHydrated, role, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
