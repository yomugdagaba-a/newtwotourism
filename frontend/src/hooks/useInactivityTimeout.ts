"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { SecurityConfig } from '@/config/security.config';

interface UseInactivityTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * Default: from SecurityConfig (7 minutes)
   */
  timeout?: number;
  
  /**
   * Warning time before logout in milliseconds
   * Default: from SecurityConfig (1 minute)
   */
  warningTime?: number;
  
  /**
   * Callback when user is about to be logged out
   */
  onWarning?: () => void;
  
  /**
   * Callback when user is logged out due to inactivity
   */
  onTimeout?: () => void;
}

/**
 * Hook to handle automatic logout after user inactivity
 * 
 * Tracks user activity (mouse, keyboard, touch, scroll) and logs out
 * the user after a specified period of inactivity.
 * 
 * @example
 * ```tsx
 * useInactivityTimeout({
 *   onWarning: () => toast.warning('You will be logged out in 1 minute due to inactivity'),
 *   onTimeout: () => toast.error('Logged out due to inactivity')
 * });
 * ```
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
  const {
    timeout = SecurityConfig.inactivity.timeout,
    warningTime = SecurityConfig.inactivity.warningTime,
    onWarning,
    onTimeout,
  } = options;

  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);

  // Initialize lastActivityRef on mount
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current);
      warningIdRef.current = null;
    }
  }, []);

  // Handle logout due to inactivity
  const handleInactivityLogout = useCallback(async () => {
    console.log('🔒 Logging out due to inactivity');
    
    clearTimers();
    
    // Call custom callback if provided
    if (onTimeout) {
      onTimeout();
    }
    
    // Logout and redirect to login with message
    await logout();
    router.push('/auth/login?reason=inactivity');
  }, [logout, router, onTimeout, clearTimers]);

  // Handle warning before logout
  const handleWarning = useCallback(() => {
    console.log('⚠️ Inactivity warning triggered');
    
    if (onWarning) {
      onWarning();
    }
  }, [onWarning]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Clear existing timers
    clearTimers();
    
    // Only set new timers if user is authenticated
    if (!isAuthenticated) {
      console.log('⏸️ User not authenticated, skipping timer setup');
      return;
    }
    
    // Set warning timer (fires before actual logout)
    if (warningTime > 0 && warningTime < timeout) {
      warningIdRef.current = setTimeout(() => {
        handleWarning();
      }, timeout - warningTime);
      console.log(`⚠️ Warning timer set for ${(timeout - warningTime) / 1000} seconds`);
    }
    
    // Set logout timer
    timeoutIdRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, timeout);
    
    console.log(`⏱️ Inactivity timer reset. Will logout after ${timeout / 1000} seconds (${timeout / 60000} minutes) of inactivity`);
  }, [isAuthenticated, timeout, warningTime, handleWarning, handleInactivityLogout, clearTimers]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    // Throttle: only reset if last activity was more than throttle interval ago
    // This prevents excessive timer resets
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeSinceLastActivity > SecurityConfig.inactivity.throttleInterval) {
      console.log(`🔄 Activity detected after ${Math.round(timeSinceLastActivity / 1000)}s - resetting timer`);
      resetTimer();
    }
  }, [resetTimer]);

  // Setup activity listeners
  useEffect(() => {
    // Only track activity if user is authenticated
    if (!isAuthenticated) {
      console.log('⏸️ User not authenticated, clearing timers');
      clearTimers();
      return;
    }

    console.log('🚀 Inactivity monitor started - tracking user activity');
    console.log(`⏱️ Timeout: ${timeout / 60000} minutes, Warning: ${warningTime / 60000} minutes before`);

    // Get activity events from config
    const events = SecurityConfig.inactivity.activityEvents;

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      console.log('🛑 Inactivity monitor stopped');
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [isAuthenticated, handleActivity, resetTimer, clearTimers]);

  // Return utility functions
  return {
    /**
     * Manually reset the inactivity timer
     */
    resetTimer,
    
    /**
     * Get time since last activity in milliseconds
     */
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
    
    /**
     * Get remaining time before logout in milliseconds
     */
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    },
  };
}
