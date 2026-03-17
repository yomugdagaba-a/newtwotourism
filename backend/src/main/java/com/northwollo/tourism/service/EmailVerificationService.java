package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.EmailVerificationRequestDto;
import com.northwollo.tourism.dto.response.EmailVerificationResponseDto;

public interface EmailVerificationService {

    /**
     * Send email verification OTP to user's email
     * @param request Contains the email address
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    EmailVerificationResponseDto sendVerificationEmail(EmailVerificationRequestDto request, String ipAddress, String userAgent);

    /**
     * Verify email with OTP
     * @param otp The 6-digit OTP
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    EmailVerificationResponseDto verifyEmail(String otp, String ipAddress, String userAgent);

    /**
     * Verify email with OTP and email address
     * @param email The email address
     * @param otp The 6-digit OTP
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    EmailVerificationResponseDto verifyEmailWithEmail(String email, String otp, String ipAddress, String userAgent);

    /**
     * Resend verification OTP for a user
     * @param userId The user ID
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    EmailVerificationResponseDto resendVerificationEmail(Long userId, String ipAddress, String userAgent);

    /**
     * Check if an email is verified
     * @param email The email address to check
     * @return true if email is verified
     */
    boolean isEmailVerified(String email);

    /**
     * Check if a user's email is verified
     * @param userId The user ID
     * @return true if user's email is verified
     */
    boolean isUserEmailVerified(Long userId);

    /**
     * Validate if a verification OTP is valid
     * @param otp The OTP to validate
     * @return true if OTP is valid and not expired
     */
    boolean isValidVerificationToken(String otp);

    /**
     * Clean up expired OTPs (scheduled job)
     * @return Number of OTPs cleaned up
     */
    int cleanupExpiredTokens();
}