package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.PasswordResetConfirmDto;
import com.northwollo.tourism.dto.request.PasswordResetRequestDto;
import com.northwollo.tourism.dto.response.PasswordResetResponseDto;

public interface PasswordResetService {

    /**
     * Initiate password reset process by sending reset email
     * @param request Contains the email address
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    PasswordResetResponseDto initiatePasswordReset(PasswordResetRequestDto request, String ipAddress, String userAgent);

    /**
     * Confirm password reset with token and new password
     * @param request Contains reset token and new password
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Response indicating success or failure
     */
    PasswordResetResponseDto confirmPasswordReset(PasswordResetConfirmDto request, String ipAddress, String userAgent);

    /**
     * Validate if a reset token is valid
     * @param token The reset token to validate
     * @return true if token is valid and not expired
     */
    boolean isValidResetToken(String token);

    /**
     * Clean up expired tokens (scheduled job)
     * @return Number of tokens cleaned up
     */
    int cleanupExpiredTokens();
}