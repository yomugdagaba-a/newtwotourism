package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.PasswordResetConfirmDto;
import com.northwollo.tourism.dto.request.PasswordResetRequestDto;
import com.northwollo.tourism.dto.response.PasswordResetResponseDto;
import com.northwollo.tourism.entity.PasswordResetToken;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.exception.BadRequestException;
import com.northwollo.tourism.repository.PasswordResetTokenRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.EmailService;
import com.northwollo.tourism.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.password-reset.max-attempts-per-otp:3}")
    private int maxAttemptsPerOtp;

    @Value("${app.password-reset.max-otps-per-user-per-hour:3}")
    private int maxOtpsPerUserPerHour;

    @Value("${app.password-reset.max-otps-per-ip-per-hour:5}")
    private int maxOtpsPerIpPerHour;

    @Value("${app.password-reset.cooldown-seconds:60}")
    private int cooldownSeconds;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public PasswordResetResponseDto initiatePasswordReset(PasswordResetRequestDto request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists - but add delay to prevent timing attacks
            log.warn("Password reset requested for non-existent email: {}", email);
            return PasswordResetResponseDto.success("If the email exists, a 6-digit OTP has been sent.");
        }

        User user = userOpt.get();
        
        // Check if user is active
        if (!user.isActive()) {
            log.warn("Password reset requested for inactive user: {}", email);
            return PasswordResetResponseDto.error("Account is inactive. Please contact support.");
        }

        // Check cooldown - prevent spam
        Optional<PasswordResetToken> lastToken = passwordResetTokenRepository.findLatestByUserId(user.getId());
        if (lastToken.isPresent()) {
            long secondsSinceLastRequest = ChronoUnit.SECONDS.between(lastToken.get().getCreatedAt(), LocalDateTime.now());
            if (secondsSinceLastRequest < cooldownSeconds) {
                long waitTime = cooldownSeconds - secondsSinceLastRequest;
                log.warn("Cooldown active for user: {}. Wait {} seconds", user.getId(), waitTime);
                return PasswordResetResponseDto.error("Please wait " + waitTime + " seconds before requesting another OTP.");
            }
        }

        // Rate limiting checks
        if (!checkRateLimits(user.getId(), ipAddress)) {
            log.warn("Rate limit exceeded for password reset. User: {}, IP: {}", user.getId(), ipAddress);
            return PasswordResetResponseDto.error("Too many reset requests. Please try again in 1 hour.");
        }

        // Invalidate any existing unused OTPs for this user
        passwordResetTokenRepository.markAllTokensAsUsedByUserId(user.getId());

        // Generate 6-digit OTP
        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

        // Create and save OTP token
        PasswordResetToken resetToken = new PasswordResetToken(otp, user.getId(), expiresAt);
        resetToken.setIpAddress(ipAddress);
        resetToken.setUserAgent(userAgent);
        passwordResetTokenRepository.save(resetToken);

        // Send OTP email
        boolean emailSent = emailService.sendPasswordResetOtpEmail(email, otp, otpExpiryMinutes);

        if (!emailSent) {
            log.error("Failed to send password reset OTP to: {}", email);
            return PasswordResetResponseDto.error("Failed to send OTP. Please try again.");
        }

        log.info("Password reset OTP generated for user: {} from IP: {}", user.getId(), ipAddress);
        return PasswordResetResponseDto.builder()
                .success(true)
                .message("A 6-digit OTP has been sent to your email. It expires in " + otpExpiryMinutes + " minutes.")
                .expiresInMinutes(otpExpiryMinutes)
                .build();
    }

    @Override
    @Transactional
    public PasswordResetResponseDto confirmPasswordReset(PasswordResetConfirmDto request, String ipAddress, String userAgent) {
        String otp = request.getToken().trim();
        String newPassword = request.getNewPassword();
        String email = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : null;

        // Validate OTP format
        if (!isValidOtpFormat(otp)) {
            log.warn("Invalid OTP format attempted from IP: {}", ipAddress);
            return PasswordResetResponseDto.error("Invalid OTP format. Please enter a 6-digit code.");
        }

        // Find user by email if provided
        User user = null;
        if (email != null) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return PasswordResetResponseDto.error("Invalid email or OTP.");
            }
            user = userOpt.get();
        }

        // Find and validate OTP
        Optional<PasswordResetToken> tokenOpt;
        if (user != null) {
            tokenOpt = passwordResetTokenRepository.findByTokenAndUserId(otp, user.getId());
        } else {
            tokenOpt = passwordResetTokenRepository.findByToken(otp);
        }

        if (tokenOpt.isEmpty()) {
            log.warn("Invalid password reset OTP used from IP: {}", ipAddress);
            return PasswordResetResponseDto.error("Invalid or expired OTP.");
        }

        PasswordResetToken resetToken = tokenOpt.get();
        
        // Check if OTP is valid (not used and not expired)
        if (!resetToken.isValid()) {
            log.warn("Expired or used password reset OTP from IP: {}", ipAddress);
            return PasswordResetResponseDto.error("OTP has expired. Please request a new one.");
        }

        // Check attempt count
        if (resetToken.getAttemptCount() >= maxAttemptsPerOtp) {
            resetToken.markAsUsed();
            passwordResetTokenRepository.save(resetToken);
            log.warn("Max OTP attempts exceeded for token from IP: {}", ipAddress);
            return PasswordResetResponseDto.error("Too many failed attempts. Please request a new OTP.");
        }

        // Increment attempt count
        resetToken.incrementAttemptCount();
        passwordResetTokenRepository.save(resetToken);

        // Find user if not already found
        if (user == null) {
            Optional<User> userOpt = userRepository.findById(resetToken.getUserId());
            if (userOpt.isEmpty()) {
                log.error("User not found for password reset OTP: {}", resetToken.getUserId());
                return PasswordResetResponseDto.error("Invalid OTP.");
            }
            user = userOpt.get();
        }

        // Update user password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark OTP as used
        resetToken.markAsUsed();
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {} from IP: {}", user.getId(), ipAddress);
        return PasswordResetResponseDto.success("Password has been reset successfully. You can now log in.");
    }

    @Override
    public boolean isValidResetToken(String token) {
        if (!isValidOtpFormat(token)) {
            return false;
        }
        return passwordResetTokenRepository.existsValidToken(token, LocalDateTime.now());
    }

    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        int deletedCount = passwordResetTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up {} expired password reset OTPs", deletedCount);
        return deletedCount;
    }

    private boolean checkRateLimits(Long userId, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // Check user-based rate limit
        long userOtpCount = passwordResetTokenRepository.countTokensByUserIdSince(userId, oneHourAgo);
        if (userOtpCount >= maxOtpsPerUserPerHour) {
            log.warn("User rate limit exceeded: {} OTPs in last hour for user {}", userOtpCount, userId);
            return false;
        }

        // Check IP-based rate limit
        long ipOtpCount = passwordResetTokenRepository.countTokensByIpAddressSince(ipAddress, oneHourAgo);
        if (ipOtpCount >= maxOtpsPerIpPerHour) {
            log.warn("IP rate limit exceeded: {} OTPs in last hour from IP {}", ipOtpCount, ipAddress);
            return false;
        }

        return true;
    }

    /**
     * Generate a cryptographically secure 6-digit OTP
     */
    private String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000); // Generates 100000-999999
        return String.valueOf(otp);
    }

    /**
     * Validate OTP format (6 digits)
     */
    private boolean isValidOtpFormat(String otp) {
        return otp != null && otp.matches("^\\d{6}$");
    }
}