/**
 * Security Configuration
 * 
 * Centralized configuration for authentication and session management.
 * This implements a hybrid approach combining JWT expiration with inactivity timeout.
 */

export const SecurityConfig = {
  /**
   * JWT Configuration (Backend)
   * These values should match your backend .env settings
   */
  jwt: {
    /**
     * Access token expiration time
     * Backend setting: JWT_EXPIRATION=30m
     * Short-lived for security, refreshed automatically
     */
    accessTokenExpiration: 30 * 60 * 1000, // 30 minutes in milliseconds
    
    /**
     * Refresh token expiration time
     * Backend setting: JWT_REFRESH_EXPIRATION=7h
     * Maximum session duration - user must re-login after this
     */
    refreshTokenExpiration: 7 * 60 * 60 * 1000, // 7 hours in milliseconds
    
    /**
     * Time before expiration to trigger auto-refresh
     * Refresh when less than 5 minutes remaining
     */
    refreshThreshold: 5 * 60 * 1000, // 5 minutes in milliseconds
  },

  /**
   * Inactivity Timeout Configuration (Frontend)
   * Logs out user after period of inactivity
   * THIS IS THE PRIMARY SECURITY MECHANISM
   */
  inactivity: {
    /**
     * Inactivity timeout duration
     * User will be logged out after this period of no activity
     * Timer resets on ANY user interaction
     */
    timeout: 7 * 60 * 1000, // 7 minutes in milliseconds
    
    /**
     * Warning time before logout
     * Set to 0 to disable warning (direct logout)
     */
    warningTime: 0, // No warning - direct logout
    
    /**
     * Activity throttle interval
     * Minimum time between activity event processing (prevents excessive timer resets)
     */
    throttleInterval: 1000, // 1 second in milliseconds
    
    /**
     * Events that count as user activity
     */
    activityEvents: [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ] as const,
  },

  /**
   * Session Management
   */
  session: {
    /**
     * Maximum session duration (enforced by refresh token expiration)
     */
    maxDuration: 7 * 60 * 60 * 1000, // 7 hours in milliseconds
    
    /**
     * Enable session persistence across browser tabs
     */
    persistAcrossTabs: true,
    
    /**
     * Enable "Remember Me" functionality
     */
    rememberMeEnabled: false,
  },
} as const;

/**
 * Helper functions for working with security config
 */
export const SecurityHelpers = {
  /**
   * Convert milliseconds to human-readable format
   */
  formatDuration: (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  },

  /**
   * Get inactivity timeout in minutes
   */
  getInactivityTimeoutMinutes: (): number => {
    return SecurityConfig.inactivity.timeout / (60 * 1000);
  },

  /**
   * Get warning time in minutes
   */
  getWarningTimeMinutes: (): number => {
    return SecurityConfig.inactivity.warningTime / (60 * 1000);
  },

  /**
   * Get JWT expiration in minutes
   */
  getJwtExpirationMinutes: (): number => {
    return SecurityConfig.jwt.accessTokenExpiration / (60 * 1000);
  },
};

/**
 * Type exports for TypeScript
 */
export type ActivityEvent = typeof SecurityConfig.inactivity.activityEvents[number];
