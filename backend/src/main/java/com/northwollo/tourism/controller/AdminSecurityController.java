package com.northwollo.tourism.controller;

import com.northwollo.tourism.entity.AccountLockout;
import com.northwollo.tourism.entity.LoginAttempt;
import com.northwollo.tourism.service.AccountSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityController {

    private final AccountSecurityService accountSecurityService;

    /**
     * Get recent login attempts for a user identifier
     */
    @GetMapping("/login-attempts")
    public ResponseEntity<List<LoginAttempt>> getRecentLoginAttempts(
            @RequestParam String identifier,
            @RequestParam(defaultValue = "24") int hours) {
        
        List<LoginAttempt> attempts = accountSecurityService.getRecentLoginAttempts(identifier, hours);
        return ResponseEntity.ok(attempts);
    }

    /**
     * Get lockout history for a user
     */
    @GetMapping("/lockouts/{userId}")
    public ResponseEntity<List<AccountLockout>> getUserLockoutHistory(@PathVariable Long userId) {
        List<AccountLockout> lockouts = accountSecurityService.getUserLockoutHistory(userId);
        return ResponseEntity.ok(lockouts);
    }

    /**
     * Check if a user is currently locked out
     */
    @GetMapping("/lockout-status/{userId}")
    public ResponseEntity<Map<String, Object>> getLockoutStatus(@PathVariable Long userId) {
        boolean isLockedOut = accountSecurityService.isUserLockedOut(userId);
        AccountLockout activeLockout = accountSecurityService.getActiveLockout(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("lockedOut", isLockedOut);
        
        if (activeLockout != null) {
            response.put("lockout", Map.of(
                "reason", activeLockout.getReason(),
                "lockedAt", activeLockout.getLockedAt(),
                "unlockAt", activeLockout.getUnlockAt(),
                "remainingMinutes", activeLockout.getRemainingLockoutMinutes(),
                "triggerIpAddress", activeLockout.getTriggerIpAddress()
            ));
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Manually unlock a user account
     */
    @PostMapping("/unlock/{userId}")
    public ResponseEntity<Map<String, String>> unlockUserAccount(@PathVariable Long userId) {
        int deactivatedCount = accountSecurityService.unlockUserAccount(userId);
        
        Map<String, String> response = new HashMap<>();
        if (deactivatedCount > 0) {
            response.put("message", String.format("Successfully unlocked user account. Deactivated %d lockouts.", deactivatedCount));
        } else {
            response.put("message", "User account was not locked or already unlocked.");
        }
        
        log.info("Admin manually unlocked user account: {}", userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Manually lock a user account
     */
    @PostMapping("/lock/{userId}")
    public ResponseEntity<Map<String, Object>> lockUserAccount(
            @PathVariable Long userId,
            @RequestParam String reason,
            @RequestParam(defaultValue = "60") int durationMinutes) {
        
        AccountLockout lockout = accountSecurityService.lockUserAccount(userId, reason, "ADMIN", durationMinutes);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User account locked successfully");
        response.put("lockout", Map.of(
            "reason", lockout.getReason(),
            "lockedAt", lockout.getLockedAt(),
            "unlockAt", lockout.getUnlockAt(),
            "lockoutCount", lockout.getLockoutCount()
        ));
        
        log.info("Admin manually locked user account: {} for reason: {}", userId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if an identifier should be blocked
     */
    @GetMapping("/check-block-status")
    public ResponseEntity<Map<String, Object>> checkBlockStatus(
            @RequestParam String identifier,
            @RequestParam String ipAddress) {
        
        boolean identifierBlocked = accountSecurityService.shouldBlockIdentifier(identifier, ipAddress);
        boolean ipBlocked = accountSecurityService.shouldBlockIpAddress(ipAddress);
        int progressiveDelay = accountSecurityService.getProgressiveDelay(identifier, ipAddress);
        boolean suspiciousActivity = accountSecurityService.detectSuspiciousActivity(identifier, ipAddress);
        
        Map<String, Object> response = new HashMap<>();
        response.put("identifierBlocked", identifierBlocked);
        response.put("ipBlocked", ipBlocked);
        response.put("progressiveDelay", progressiveDelay);
        response.put("suspiciousActivity", suspiciousActivity);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Clean up old security records
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupOldRecords(
            @RequestParam(defaultValue = "90") int retentionDays) {
        
        int cleanedUpCount = accountSecurityService.cleanupOldSecurityRecords(retentionDays);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", String.format("Cleaned up %d old security records older than %d days", cleanedUpCount, retentionDays));
        
        log.info("Admin triggered security records cleanup: {} records cleaned", cleanedUpCount);
        return ResponseEntity.ok(response);
    }

    /**
     * Send security alert to a user
     */
    @PostMapping("/send-alert/{userId}")
    public ResponseEntity<Map<String, String>> sendSecurityAlert(
            @PathVariable Long userId,
            @RequestParam String alertType,
            @RequestParam(required = false) String ipAddress) {
        
        accountSecurityService.sendSecurityAlert(userId, alertType, ipAddress != null ? ipAddress : "ADMIN");
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Security alert sent successfully");
        
        log.info("Admin sent security alert to user {}: {}", userId, alertType);
        return ResponseEntity.ok(response);
    }
}