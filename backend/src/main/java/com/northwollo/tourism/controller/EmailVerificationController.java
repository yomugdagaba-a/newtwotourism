package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.EmailVerificationRequestDto;
import com.northwollo.tourism.dto.response.EmailVerificationResponseDto;
import com.northwollo.tourism.service.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    /**
     * Send email verification OTP
     */
    @PostMapping("/send-verification")
    public ResponseEntity<EmailVerificationResponseDto> sendVerificationEmail(
            @Valid @RequestBody EmailVerificationRequestDto request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Email verification OTP requested for email: {} from IP: {}", request.getEmail(), ipAddress);
        
        EmailVerificationResponseDto response = emailVerificationService.sendVerificationEmail(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify email with OTP (legacy - OTP only)
     */
    @PostMapping("/verify-email")
    public ResponseEntity<EmailVerificationResponseDto> verifyEmail(
            @RequestParam String token,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Email verification OTP attempted from IP: {}", ipAddress);
        
        EmailVerificationResponseDto response = emailVerificationService.verifyEmail(token, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify email with OTP and email address (recommended)
     */
    @PostMapping("/verify-email-otp")
    public ResponseEntity<EmailVerificationResponseDto> verifyEmailWithOtp(
            @RequestParam String email,
            @RequestParam String otp,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Email verification OTP attempted for {} from IP: {}", email, ipAddress);
        
        EmailVerificationResponseDto response = emailVerificationService.verifyEmailWithEmail(email, otp, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend verification OTP for authenticated user
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<EmailVerificationResponseDto> resendVerificationEmail(
            @RequestParam Long userId,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Resend verification OTP requested for user: {} from IP: {}", userId, ipAddress);
        
        EmailVerificationResponseDto response = emailVerificationService.resendVerificationEmail(userId, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Validate verification OTP (for frontend validation)
     */
    @GetMapping("/verify-email/validate")
    public ResponseEntity<EmailVerificationResponseDto> validateVerificationToken(@RequestParam String token) {
        boolean isValid = emailVerificationService.isValidVerificationToken(token);
        
        if (isValid) {
            return ResponseEntity.ok(EmailVerificationResponseDto.success("OTP is valid"));
        } else {
            return ResponseEntity.ok(EmailVerificationResponseDto.error("Invalid or expired OTP"));
        }
    }

    /**
     * Check if email is verified
     */
    @GetMapping("/email-verified")
    public ResponseEntity<EmailVerificationResponseDto> checkEmailVerified(@RequestParam String email) {
        boolean isVerified = emailVerificationService.isEmailVerified(email);
        
        if (isVerified) {
            return ResponseEntity.ok(EmailVerificationResponseDto.success("Email is verified"));
        } else {
            return ResponseEntity.ok(EmailVerificationResponseDto.error("Email is not verified"));
        }
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in case of multiple proxies
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}