"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmDialog";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "button" | "link";
  showConfirmation?: boolean;
}

export default function LogoutButton({ 
  className = "", 
  children, 
  variant = "button",
  showConfirmation = true 
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { logout, username } = useAuthStore();
  const router = useRouter();
  const confirm = useConfirm();

  const handleLogout = async () => {
    if (showConfirmation) {
      const ok = await confirm({
        title: "Log Out",
        message: "Are you sure you want to log out?",
        variant: "warning",
        confirmLabel: "Log Out",
        cancelLabel: "Stay",
      });
      if (!ok) return;
    }

    setLoading(true);
    
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API fails, we still redirect since local state is cleared
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const defaultButtonClass = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
  const defaultLinkClass = "text-red-600 hover:text-red-800 font-medium transition-colors duration-200";

  const baseClass = variant === "button" ? defaultButtonClass : defaultLinkClass;
  const finalClass = className || baseClass;

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={finalClass}
      title={`Sign out ${username ? `(${username})` : ""}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children || (loading ? "Signing out..." : "Sign Out")}
    </button>
  );
}