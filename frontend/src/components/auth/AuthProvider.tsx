"use client";

import { useEffect } from "react";
import { useHydrateAuth, useAutoRefresh } from "@/store/useAuthStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // Initialize authentication from localStorage
  useHydrateAuth();
  
  // Enable automatic token refresh
  useAutoRefresh();

  return <>{children}</>;
}