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

  // Keep Render backend awake (free tier sleeps after 15 min inactivity)
  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourismsystem.onrender.com/api';
    const ping = () => {
      fetch(`${BACKEND_URL}/tourisms/public/hero-images`, { method: 'GET' }).catch(() => {});
    };
    ping(); // ping immediately on load
    const interval = setInterval(ping, 14 * 60 * 1000); // every 14 minutes
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}