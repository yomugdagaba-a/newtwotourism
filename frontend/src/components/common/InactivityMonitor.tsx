"use client";

import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

/**
 * Component that monitors user inactivity and automatically logs out
 * the user after the configured timeout period.
 * 
 * Place this component in your root layout to enable inactivity monitoring
 * across the entire application.
 * 
 * Configuration is centralized in SecurityConfig.
 * No warning modal - direct logout after inactivity timeout.
 * 
 * @example
 * ```tsx
 * <InactivityMonitor />
 * ```
 */
export default function InactivityMonitor() {
  // Simply use the hook - no UI needed since warning is disabled
  useInactivityTimeout({
    onTimeout: () => {
      console.log('🔒 Session ended due to inactivity');
    },
  });

  // No UI to render
  return null;
}

