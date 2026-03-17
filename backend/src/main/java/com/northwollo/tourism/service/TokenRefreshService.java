package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.TokenRefreshRequestDto;
import com.northwollo.tourism.dto.response.TokenPairResponseDto;

public interface TokenRefreshService {

    /**
     * Generate a new refresh token for a user
     * @param userId The user ID
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @param deviceInfo Device information for tracking
     * @return The generated refresh token
     */
    String generateRefreshToken(Long userId, String ipAddress, String userAgent, String deviceInfo);

    /**
     * Refresh access token using refresh token
     * @param request Contains the refresh token
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return New token pair (access token + refresh token)
     */
    TokenPairResponseDto refreshToken(TokenRefreshRequestDto request, String ipAddress, String userAgent);

    /**
     * Revoke a refresh token
     * @param refreshToken The refresh token to revoke
     * @return true if token was revoked successfully
     */
    boolean revokeRefreshToken(String refreshToken);

    /**
     * Revoke all refresh tokens for a user
     * @param userId The user ID
     * @return Number of tokens revoked
     */
    int revokeAllUserTokens(Long userId);

    /**
     * Validate if a refresh token is valid
     * @param refreshToken The refresh token to validate
     * @return true if token is valid and not expired
     */
    boolean isValidRefreshToken(String refreshToken);

    /**
     * Clean up expired tokens (scheduled job)
     * @return Number of tokens cleaned up
     */
    int cleanupExpiredTokens();

    /**
     * Get user ID from refresh token
     * @param refreshToken The refresh token
     * @return User ID if token is valid, null otherwise
     */
    Long getUserIdFromRefreshToken(String refreshToken);
}