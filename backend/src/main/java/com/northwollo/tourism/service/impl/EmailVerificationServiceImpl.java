package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.EmailVerificationRequestDto;
import com.northwollo.tourism.dto.response.EmailVerificationResponseDto;
import com.northwollo.tourism.entity.EmailVerificationToken;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.repository.EmailVerificationTokenRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.EmailService;
import com.northwollo.tourism.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.email-verification.otp-expiry-minutes:15}")
    private int otpExpiryMinutes;

    @Value("${app.email-verification.max-attempts-per-otp:3}")
    private int maxAttemptsPerOtp;

    @Value("${app.email-verification.max-otps-per-email-per-hour:3}")
    private int maxOtpsPerEmailPerHour;

    @Value("${app.email-verification.max-otps-per-ip-per-hour:5}")
    private int maxOtpsPerIpPerHour;

    @Value("${app.email-verification.cooldown-seconds:60}")
    private int cooldownSeconds;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public EmailVerificationResponseDto sendVerificationEmail(EmailVerificationRequestDto request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("Email verification requested for non-existent email: {}", email);
            return EmailVerificationResponseDto.error("Email address not found.");
        }

        User user = userOpt.get();
        
        // Check if user is active
        if (!user.isActive()) {
            log.warn("Email verification requested for inactive user: {}", email);
            return EmailVerificationResponseDto.error("Account is inactive. Please contact support.");
        }

        // Check if email is already verified
        if (user.isEmailVerified()) {
            log.info("Email verification requested for already verified email: {}", email);
            return EmailVerificationResponseDto.success("Email is already verified.");
        }

        // Check cooldown - prevent spam
        Optional<EmailVerificationToken> lastToken = emailVerificationTokenRepository.findLatestByEmail(email);
        if (lastToken.isPresent()) {
            long secondsSinceLastRequest = ChronoUnit.SECONDS.between(lastToken.get().getCreatedAt(), LocalDateTime.now());
            if (secondsSinceLastRequest < cooldownSeconds) {
                long waitTime = cooldownSeconds - secondsSinceLastRequest;
                log.warn("Cooldown active for email: {}. Wait {} seconds", email, waitTime);
                return EmailVerificationResponseDto.error("Please wait " + waitTime + " seconds before requesting another OTP.");
            }
        }

        // Rate limiting checks
        if (!checkRateLimits(email, ipAddress)) {
            log.warn("Rate limit exceeded for email verification. Email: {}, IP: {}", email, ipAddress);
            return EmailVerificationResponseDto.error("Too many verification requests. Please try again in 1 hour.");
        }

        // Invalidate any existing unused OTPs for this email
        emailVerificationTokenRepository.markAllTokensAsVerifiedByEmail(email);

        // Generate 6-digit OTP
        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

        // Create and save verification OTP
        EmailVerificationToken verificationToken = new EmailVerificationToken(otp, user.getId(), email, expiresAt);
        verificationToken.setIpAddress(ipAddress);
        verificationToken.setUserAgent(userAgent);
        emailVerificationTokenRepository.save(verificationToken);

        // Send verification OTP email
        boolean emailSent = emailService.sendEmailVerificationOtpEmail(email, otp, otpExpiryMinutes);

        if (!emailSent) {
            log.error("Failed to send email verification OTP to: {}", email);
            return EmailVerificationResponseDto.error("Failed to send verification OTP. Please try again.");
        }

        log.info("Email verification OTP generated for user: {} from IP: {}", user.getId(), ipAddress);
        return EmailVerificationResponseDto.builder()
                .success(true)
                .message("A 6-digit OTP has been sent to your email. It expires in " + otpExpiryMinutes + " minutes.")
                .expiresInMinutes(otpExpiryMinutes)
                .build();
    }

    @Override
    @Transactional
    public EmailVerificationResponseDto verifyEmail(String otp, String ipAddress, String userAgent) {
        // Validate OTP format
        if (!isValidOtpFormat(otp)) {
            log.warn("Invalid OTP format attempted from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("Invalid OTP format. Please enter a 6-digit code.");
        }

        // Find and validate OTP
        Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository.findByToken(otp.trim());
        if (tokenOpt.isEmpty()) {
            log.warn("Invalid email verification OTP used from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("Invalid or expired OTP.");
        }

        EmailVerificationToken verificationToken = tokenOpt.get();
        
        // Check if OTP is valid (not verified and not expired)
        if (!verificationToken.isValid()) {
            log.warn("Expired or used email verification OTP from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("OTP has expired. Please request a new one.");
        }

        // Check attempt count
        if (verificationToken.getAttemptCount() >= maxAttemptsPerOtp) {
            verificationToken.markAsVerified();
            emailVerificationTokenRepository.save(verificationToken);
            log.warn("Max OTP attempts exceeded for token from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("Too many failed attempts. Please request a new OTP.");
        }

        // Increment attempt count
        verificationToken.incrementAttemptCount();
        emailVerificationTokenRepository.save(verificationToken);

        // Find user
        Optional<User> userOpt = userRepository.findById(verificationToken.getUserId());
        if (userOpt.isEmpty()) {
            log.error("User not found for email verification OTP: {}", verificationToken.getUserId());
            return EmailVerificationResponseDto.error("Invalid OTP.");
        }

        User user = userOpt.get();

        // Update user email verification status
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark OTP as verified
        verificationToken.markAsVerified();
        emailVerificationTokenRepository.save(verificationToken);

        // Mark all other OTPs for this email as verified
        emailVerificationTokenRepository.markAllTokensAsVerifiedByEmail(user.getEmail());

        log.info("Email successfully verified for user: {} from IP: {}", user.getId(), ipAddress);
        return EmailVerificationResponseDto.success("Email has been verified successfully!");
    }

    @Override
    @Transactional
    public EmailVerificationResponseDto verifyEmailWithEmail(String email, String otp, String ipAddress, String userAgent) {
        // Validate OTP format
        if (!isValidOtpFormat(otp)) {
            log.warn("Invalid OTP format attempted from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("Invalid OTP format. Please enter a 6-digit code.");
        }

        String normalizedEmail = email.toLowerCase().trim();

        // Find and validate OTP for this specific email
        Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository.findByTokenAndEmail(otp.trim(), normalizedEmail);
        if (tokenOpt.isEmpty()) {
            log.warn("Invalid email verification OTP for email {} from IP: {}", normalizedEmail, ipAddress);
            return EmailVerificationResponseDto.error("Invalid or expired OTP.");
        }

        EmailVerificationToken verificationToken = tokenOpt.get();
        
        // Check if OTP is valid (not verified and not expired)
        if (!verificationToken.isValid()) {
            log.warn("Expired or used email verification OTP from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("OTP has expired. Please request a new one.");
        }

        // Check attempt count
        if (verificationToken.getAttemptCount() >= maxAttemptsPerOtp) {
            verificationToken.markAsVerified();
            emailVerificationTokenRepository.save(verificationToken);
            log.warn("Max OTP attempts exceeded for token from IP: {}", ipAddress);
            return EmailVerificationResponseDto.error("Too many failed attempts. Please request a new OTP.");
        }

        // Increment attempt count
        verificationToken.incrementAttemptCount();
        emailVerificationTokenRepository.save(verificationToken);

        // Find user
        Optional<User> userOpt = userRepository.findById(verificationToken.getUserId());
        if (userOpt.isEmpty()) {
            log.error("User not found for email verification OTP: {}", verificationToken.getUserId());
            return EmailVerificationResponseDto.error("Invalid OTP.");
        }

        User user = userOpt.get();

        // Update user email verification status
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark OTP as verified
        verificationToken.markAsVerified();
        emailVerificationTokenRepository.save(verificationToken);

        log.info("Email successfully verified for user: {} from IP: {}", user.getId(), ipAddress);
        return EmailVerificationResponseDto.success("Email has been verified successfully!");
    }

    @Override
    @Transactional
    public EmailVerificationResponseDto resendVerificationEmail(Long userId, String ipAddress, String userAgent) {
        // Find user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("Resend verification requested for non-existent user: {}", userId);
            return EmailVerificationResponseDto.error("User not found.");
        }

        User user = userOpt.get();
        
        // Check if user is active
        if (!user.isActive()) {
            log.warn("Resend verification requested for inactive user: {}", userId);
            return EmailVerificationResponseDto.error("Account is inactive. Please contact support.");
        }

        // Check if email is already verified
        if (user.isEmailVerified()) {
            log.info("Resend verification requested for already verified user: {}", userId);
            return EmailVerificationResponseDto.success("Email is already verified.");
        }

        // Create request DTO and delegate to sendVerificationEmail
        EmailVerificationRequestDto request = new EmailVerificationRequestDto(user.getEmail());
        return sendVerificationEmail(request, ipAddress, userAgent);
    }

    @Override
    public boolean isEmailVerified(String email) {
        return emailVerificationTokenRepository.isEmailVerified(email.toLowerCase().trim());
    }

    @Override
    public boolean isUserEmailVerified(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(User::isEmailVerified).orElse(false);
    }

    @Override
    public boolean isValidVerificationToken(String token) {
        if (!isValidOtpFormat(token)) {
            return false;
        }
        return emailVerificationTokenRepository.existsValidToken(token, LocalDateTime.now());
    }

    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        int deletedCount = emailVerificationTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up {} expired email verification OTPs", deletedCount);
        return deletedCount;
    }

    private boolean checkRateLimits(String email, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // Check email-based rate limit
        long emailOtpCount = emailVerificationTokenRepository.countTokensByEmailSince(email, oneHourAgo);
        if (emailOtpCount >= maxOtpsPerEmailPerHour) {
            log.warn("Email rate limit exceeded: {} OTPs in last hour for email {}", emailOtpCount, email);
            return false;
        }

        // Check IP-based rate limit
        long ipOtpCount = emailVerificationTokenRepository.countTokensByIpAddressSince(ipAddress, oneHourAgo);
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
        return otp != null && otp.trim().matches("^\\d{6}$");
    }
}