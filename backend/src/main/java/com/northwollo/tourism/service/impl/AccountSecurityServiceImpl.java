package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.entity.AccountLockout;
import com.northwollo.tourism.entity.LoginAttempt;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.repository.AccountLockoutRepository;
import com.northwollo.tourism.repository.LoginAttemptRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.AccountSecurityService;
import com.northwollo.tourism.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountSecurityServiceImpl implements AccountSecurityService {

    private final LoginAttemptRepository loginAttemptRepository;
    private final AccountLockoutRepository accountLockoutRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Configuration values
    @Value("${app.security.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    @Value("${app.security.max-ip-attempts-per-hour:10}")
    private int maxIpAttemptsPerHour;

    @Value("${app.security.progressive-delay-enabled:true}")
    private boolean progressiveDelayEnabled;

    @Value("${app.security.suspicious-activity-threshold:3}")
    private int suspiciousActivityThreshold;

    @Value("${app.security.security-alerts-enabled:true}")
    private boolean securityAlertsEnabled;

    @Override
    @Transactional
    public void recordLoginAttempt(String identifier, boolean successful, String ipAddress, String userAgent, Long userId, String failureReason) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setIdentifier(identifier);
        attempt.setSuccessful(successful);
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent);
        attempt.setUserId(userId);
        attempt.setFailureReason(failureReason);
        attempt.setAttemptTime(LocalDateTime.now());
        attempt.setAttemptType("LOGIN");

        loginAttemptRepository.save(attempt);

        if (successful) {
            log.info("Successful login recorded for identifier: {} from IP: {}", identifier, ipAddress);
        } else {
            log.warn("Failed login attempt recorded for identifier: {} from IP: {} - Reason: {}", identifier, ipAddress, failureReason);
            
            // Check if account should be locked after this failed attempt
            if (userId != null) {
                checkAndLockAccount(userId, identifier, ipAddress);
            }
        }
    }

    @Override
    public boolean shouldBlockIdentifier(String identifier, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // Check consecutive failed attempts
        long consecutiveFailures = loginAttemptRepository.countConsecutiveFailedAttempts(identifier);
        if (consecutiveFailures >= maxFailedAttempts) {
            log.warn("Identifier {} blocked due to {} consecutive failed attempts", identifier, consecutiveFailures);
            return true;
        }

        // Check recent failed attempts within the hour
        long recentFailures = loginAttemptRepository.countFailedAttemptsByIdentifierSince(identifier, oneHourAgo);
        if (recentFailures >= maxFailedAttempts) {
            log.warn("Identifier {} blocked due to {} failed attempts in the last hour", identifier, recentFailures);
            return true;
        }

        return false;
    }

    @Override
    public boolean shouldBlockIpAddress(String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        long recentAttempts = loginAttemptRepository.countAttemptsByIpSince(ipAddress, oneHourAgo);
        if (recentAttempts >= maxIpAttemptsPerHour) {
            log.warn("IP address {} blocked due to {} attempts in the last hour", ipAddress, recentAttempts);
            return true;
        }

        return false;
    }

    @Override
    public int getProgressiveDelay(String identifier, String ipAddress) {
        if (!progressiveDelayEnabled) {
            return 0;
        }

        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentFailures = loginAttemptRepository.countFailedAttemptsByIdentifierSince(identifier, oneHourAgo);

        // Progressive delay: 1s, 2s, 4s, 8s, 16s, 30s (max)
        if (recentFailures <= 1) return 0;
        if (recentFailures == 2) return 1;
        if (recentFailures == 3) return 2;
        if (recentFailures == 4) return 4;
        if (recentFailures == 5) return 8;
        if (recentFailures == 6) return 16;
        return 30; // Maximum delay
    }

    @Override
    @Transactional
    public AccountLockout lockUserAccount(Long userId, String reason, String triggerIpAddress, int lockoutDurationMinutes) {
        // Check if user is already locked
        if (isUserLockedOut(userId)) {
            log.info("User {} is already locked out", userId);
            return getActiveLockout(userId);
        }

        LocalDateTime unlockAt = LocalDateTime.now().plusMinutes(lockoutDurationMinutes);
        AccountLockout lockout = new AccountLockout(userId, unlockAt, reason, triggerIpAddress);
        
        // Set lockout count based on previous lockouts
        long previousLockouts = accountLockoutRepository.countByUserId(userId);
        lockout.setLockoutCount((int) previousLockouts + 1);

        AccountLockout savedLockout = accountLockoutRepository.save(lockout);
        
        log.warn("User {} locked out until {} - Reason: {} - Triggered by IP: {}", 
                userId, unlockAt, reason, triggerIpAddress);

        // Send security alert
        if (securityAlertsEnabled) {
            sendSecurityAlert(userId, "ACCOUNT_LOCKED", triggerIpAddress);
        }

        return savedLockout;
    }

    @Override
    public boolean isUserLockedOut(Long userId) {
        return accountLockoutRepository.isUserLockedOut(userId, LocalDateTime.now());
    }

    @Override
    public AccountLockout getActiveLockout(Long userId) {
        return accountLockoutRepository.findActiveLockoutByUserId(userId, LocalDateTime.now()).orElse(null);
    }

    @Override
    @Transactional
    public int unlockUserAccount(Long userId) {
        int deactivatedCount = accountLockoutRepository.deactivateAllUserLockouts(userId);
        if (deactivatedCount > 0) {
            log.info("Manually unlocked user {} - Deactivated {} lockouts", userId, deactivatedCount);
            
            // Send security alert
            if (securityAlertsEnabled) {
                sendSecurityAlert(userId, "ACCOUNT_UNLOCKED", "ADMIN");
            }
        }
        return deactivatedCount;
    }

    @Override
    public List<LoginAttempt> getRecentLoginAttempts(String identifier, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return loginAttemptRepository.findRecentFailedAttemptsByIdentifier(identifier, since);
    }

    @Override
    public List<AccountLockout> getUserLockoutHistory(Long userId) {
        return accountLockoutRepository.findByUserIdOrderByLockedAtDesc(userId);
    }

    @Override
    @Transactional
    public int cleanupOldSecurityRecords(int retentionDays) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retentionDays);
        
        // Clean up old login attempts
        int deletedAttempts = loginAttemptRepository.deleteOldAttempts(cutoffTime);
        
        // Clean up old inactive lockouts
        int deletedLockouts = accountLockoutRepository.deleteOldInactiveLockouts(cutoffTime);
        
        // Deactivate expired lockouts
        int deactivatedLockouts = accountLockoutRepository.deactivateExpiredLockouts(LocalDateTime.now());
        
        log.info("Security cleanup completed: {} login attempts deleted, {} lockouts deleted, {} lockouts deactivated", 
                deletedAttempts, deletedLockouts, deactivatedLockouts);
        
        return deletedAttempts + deletedLockouts;
    }

    @Override
    public boolean detectSuspiciousActivity(String identifier, String ipAddress) {
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        
        // Check for multiple IP addresses used by same identifier
        List<String> distinctIps = loginAttemptRepository.findDistinctIpAddressesForIdentifier(identifier, twentyFourHoursAgo);
        if (distinctIps.size() >= suspiciousActivityThreshold) {
            log.warn("Suspicious activity detected for identifier {}: {} different IP addresses in 24 hours", 
                    identifier, distinctIps.size());
            return true;
        }

        // Check for rapid-fire attempts
        List<LoginAttempt> recentAttempts = loginAttemptRepository.findRecentFailedAttemptsByIdentifier(identifier, 
                LocalDateTime.now().minusMinutes(5));
        if (recentAttempts.size() >= 5) {
            log.warn("Suspicious activity detected for identifier {}: {} attempts in 5 minutes", 
                    identifier, recentAttempts.size());
            return true;
        }

        return false;
    }

    @Override
    public void sendSecurityAlert(Long userId, String alertType, String ipAddress) {
        if (!securityAlertsEnabled) {
            return;
        }

        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String message = buildSecurityAlertMessage(alertType, ipAddress);
                emailService.sendAccountLockoutEmail(user.getEmail(), message);
                log.info("Security alert sent to user {}: {}", userId, alertType);
            }
        } catch (Exception e) {
            log.error("Failed to send security alert to user {}: {}", userId, e.getMessage());
        }
    }

    private void checkAndLockAccount(Long userId, String identifier, String ipAddress) {
        // Don't lock if already locked
        if (isUserLockedOut(userId)) {
            return;
        }

        long consecutiveFailures = loginAttemptRepository.countConsecutiveFailedAttempts(identifier);
        if (consecutiveFailures >= maxFailedAttempts) {
            String reason = String.format("Account locked due to %d consecutive failed login attempts", consecutiveFailures);
            lockUserAccount(userId, reason, ipAddress, lockoutDurationMinutes);
        }
    }

    private String buildSecurityAlertMessage(String alertType, String ipAddress) {
        return switch (alertType) {
            case "ACCOUNT_LOCKED" -> String.format("Your account has been temporarily locked due to multiple failed login attempts from IP: %s. It will be automatically unlocked in %d minutes.", ipAddress, lockoutDurationMinutes);
            case "ACCOUNT_UNLOCKED" -> "Your account has been unlocked by an administrator.";
            case "SUSPICIOUS_ACTIVITY" -> String.format("Suspicious login activity detected on your account from IP: %s. If this wasn't you, please change your password immediately.", ipAddress);
            default -> String.format("Security alert: %s from IP: %s", alertType, ipAddress);
        };
    }
}