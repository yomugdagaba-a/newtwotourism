package com.northwollo.tourism.service;

import com.northwollo.tourism.entity.AccountLockout;
import com.northwollo.tourism.entity.LoginAttempt;

import java.util.List;

public interface AccountSecurityService {

    /**
     * Record a login attempt
     * @param identifier Username, email, or IP address
     * @param successful Whether the login was successful
     * @param ipAddress Client IP address
     * @param userAgent Client user agent
     * @param userId User ID if user was found (null if not found)
     * @param failureReason Reason for failure if unsuccessful
     */
    void recordLoginAttempt(String identifier, boolean successful, String ipAddress, String userAgent, Long userId, String failureReason);

    /**
     * Check if an identifier (username/email) should be blocked due to failed attempts
     * @param identifier Username or email
     * @param ipAddress Client IP address
     * @return true if should be blocked
     */
    boolean shouldBlockIdentifier(String identifier, String ipAddress);

    /**
     * Check if an IP address should be blocked due to excessive attempts
     * @param ipAddress Client IP address
     * @return true if should be blocked
     */
    boolean shouldBlockIpAddress(String ipAddress);

    /**
     * Get the delay (in seconds) that should be applied before next attempt
     * @param identifier Username or email
     * @param ipAddress Client IP address
     * @return Delay in seconds (0 if no delay needed)
     */
    int getProgressiveDelay(String identifier, String ipAddress);

    /**
     * Lock a user account
     * @param userId User ID to lock
     * @param reason Reason for lockout
     * @param triggerIpAddress IP address that triggered the lockout
     * @param lockoutDurationMinutes Duration of lockout in minutes
     * @return The created AccountLockout
     */
    AccountLockout lockUserAccount(Long userId, String reason, String triggerIpAddress, int lockoutDurationMinutes);

    /**
     * Check if a user is currently locked out
     * @param userId User ID to check
     * @return true if user is locked out
     */
    boolean isUserLockedOut(Long userId);

    /**
     * Get active lockout for a user
     * @param userId User ID
     * @return Active lockout if exists, null otherwise
     */
    AccountLockout getActiveLockout(Long userId);

    /**
     * Manually unlock a user account (admin action)
     * @param userId User ID to unlock
     * @return Number of lockouts deactivated
     */
    int unlockUserAccount(Long userId);

    /**
     * Get recent login attempts for an identifier
     * @param identifier Username or email
     * @param hours Number of hours to look back
     * @return List of recent login attempts
     */
    List<LoginAttempt> getRecentLoginAttempts(String identifier, int hours);

    /**
     * Get lockout history for a user
     * @param userId User ID
     * @return List of lockouts for the user
     */
    List<AccountLockout> getUserLockoutHistory(Long userId);

    /**
     * Clean up old security records (scheduled job)
     * @param retentionDays Number of days to retain records
     * @return Number of records cleaned up
     */
    int cleanupOldSecurityRecords(int retentionDays);

    /**
     * Detect suspicious activity patterns
     * @param identifier Username or email
     * @param ipAddress Client IP address
     * @return true if suspicious activity detected
     */
    boolean detectSuspiciousActivity(String identifier, String ipAddress);

    /**
     * Send security alert email to user
     * @param userId User ID
     * @param alertType Type of security alert
     * @param ipAddress IP address involved
     */
    void sendSecurityAlert(Long userId, String alertType, String ipAddress);
}