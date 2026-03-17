"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '../store/useAuthStore';

interface UseAuthGuardOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

interface AuthGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardResult {
  const { requiredRole, redirectTo = '/auth/login' } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        // No token, redirect to login
        router.push(redirectTo);
        setIsLoading(false);
        setIsAuthorized(false);
        return;
      }

      // Token exists, wait a bit for auth store to hydrate
      setTimeout(() => {
        const currentAuth = useAuthStore.getState();
        
        if (!currentAuth.isAuthenticated) {
          router.push(redirectTo);
          setIsLoading(false);
          setIsAuthorized(false);
          return;
        }

        // Check role if required
        if (requiredRole) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!currentAuth.role || !roles.includes(currentAuth.role)) {
            router.push(redirectTo);
            setIsLoading(false);
            setIsAuthorized(false);
            return;
          }
        }

        setIsAuthorized(true);
        setIsLoading(false);
      }, 100);
    };

    checkAuth();
  }, [requiredRole, redirectTo, router]);

  // Also react to auth state changes
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        setIsAuthorized(false);
      } else if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!role || !roles.includes(role)) {
          router.push(redirectTo);
          setIsAuthorized(false);
        }
      }
    }
  }, [isAuthenticated, role, isLoading, requiredRole, redirectTo, router]);

  return { isLoading, isAuthorized };
}

// Loading component for auth guard
export function AuthGuardLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
