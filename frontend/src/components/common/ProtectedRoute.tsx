"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isHydrated, token } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait a tick for hydration to complete
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete and checking is done
    if (!isChecking && isHydrated && !isAuthenticated && !token) {
      console.log('🔒 Not authenticated, redirecting to login');
      router.push("/auth/login");
    }
  }, [isChecking, isHydrated, isAuthenticated, token, router]);

  // Show loading while hydrating or checking auth state
  if (!isHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, if not authenticated and no token, show nothing (will redirect)
  if (!isAuthenticated && !token) {
    return null;
  }

  return <>{children}</>;
}
