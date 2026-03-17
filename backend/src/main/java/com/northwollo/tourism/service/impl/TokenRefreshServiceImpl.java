package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.TokenRefreshRequestDto;
import com.northwollo.tourism.dto.response.TokenPairResponseDto;
import com.northwollo.tourism.entity.RefreshToken;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.exception.BadRequestException;
import com.northwollo.tourism.repository.RefreshTokenRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.security.JwtTokenProvider;
import com.northwollo.tourism.service.TokenRefreshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenRefreshServiceImpl implements TokenRefreshService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.jwt.refresh-expiration:604800000}") // 7 days default
    private long refreshTokenExpiration;

    @Value("${app.jwt.expiration:86400000}") // 1 day default
    private long accessTokenExpiration;

    @Value("${app.jwt.max-refresh-tokens-per-user:5}")
    private int maxRefreshTokensPerUser;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String generateRefreshToken(Long userId, String ipAddress, String userAgent, String deviceInfo) {
        // Check if user exists and is active
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.isActive()) {
            throw new BadRequestException("User is inactive");
        }

        // Clean up expired tokens first
        cleanupExpiredTokens();

        // Check if user has too many active refresh tokens
        long activeTokenCount = refreshTokenRepository.countValidTokensByUserId(userId, LocalDateTime.now());
        if (activeTokenCount >= maxRefreshTokensPerUser) {
            // Revoke oldest tokens to make room
            List<RefreshToken> oldestTokens = refreshTokenRepository.findOldestTokensByUserId(userId);
            int tokensToRevoke = (int) (activeTokenCount - maxRefreshTokensPerUser + 1);
            for (int i = 0; i < tokensToRevoke && i < oldestTokens.size(); i++) {
                oldestTokens.get(i).revoke();
                refreshTokenRepository.save(oldestTokens.get(i));
            }
        }

        // Generate secure token
        String token = generateSecureToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000);

        // Create and save refresh token
        RefreshToken refreshToken = new RefreshToken(token, userId, expiresAt);
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setUserAgent(userAgent);
        refreshToken.setDeviceInfo(deviceInfo);
        refreshTokenRepository.save(refreshToken);

        log.info("Refresh token generated for user: {} from IP: {}", userId, ipAddress);
        return token;
    }

    @Override
    @Transactional
    public TokenPairResponseDto refreshToken(TokenRefreshRequestDto request, String ipAddress, String userAgent) {
        String refreshTokenValue = request.getRefreshToken();

        // Find and validate refresh token
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshTokenValue);
        if (tokenOpt.isEmpty()) {
            log.warn("Invalid refresh token used from IP: {}", ipAddress);
            throw new BadRequestException("Invalid refresh token");
        }

        RefreshToken refreshToken = tokenOpt.get();

        // Check if token is valid (not revoked and not expired)
        if (!refreshToken.isValid()) {
            log.warn("Expired or revoked refresh token: {} from IP: {}", refreshTokenValue, ipAddress);
            throw new BadRequestException("Refresh token is expired or revoked");
        }

        // Find user
        Optional<User> userOpt = userRepository.findById(refreshToken.getUserId());
        if (userOpt.isEmpty()) {
            log.error("User not found for refresh token: {}", refreshToken.getUserId());
            throw new BadRequestException("Invalid refresh token");
        }

        User user = userOpt.get();

        // Check if user is still active
        if (!user.isActive()) {
            log.warn("Refresh token used for inactive user: {}", user.getId());
            throw new BadRequestException("User account is inactive");
        }

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateToken(user);

        // Generate new refresh token (token rotation for security)
        String newRefreshToken = generateRefreshToken(user.getId(), ipAddress, userAgent, refreshToken.getDeviceInfo());

        // Revoke the old refresh token
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        log.info("Token refreshed for user: {} from IP: {}", user.getId(), ipAddress);

        return new TokenPairResponseDto(
                newAccessToken,
                newRefreshToken,
                accessTokenExpiration / 1000 // Convert to seconds
        );
    }

    @Override
    @Transactional
    public boolean revokeRefreshToken(String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshToken);
        if (tokenOpt.isPresent()) {
            RefreshToken token = tokenOpt.get();
            token.revoke();
            refreshTokenRepository.save(token);
            log.info("Refresh token revoked for user: {}", token.getUserId());
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public int revokeAllUserTokens(Long userId) {
        int revokedCount = refreshTokenRepository.revokeAllTokensByUserId(userId);
        log.info("Revoked {} refresh tokens for user: {}", revokedCount, userId);
        return revokedCount;
    }

    @Override
    public boolean isValidRefreshToken(String refreshToken) {
        return refreshTokenRepository.existsValidToken(refreshToken, LocalDateTime.now());
    }

    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        int deletedCount = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        if (deletedCount > 0) {
            log.info("Cleaned up {} expired refresh tokens", deletedCount);
        }
        return deletedCount;
    }

    @Override
    public Long getUserIdFromRefreshToken(String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshToken);
        if (tokenOpt.isPresent() && tokenOpt.get().isValid()) {
            return tokenOpt.get().getUserId();
        }
        return null;
    }

    private String generateSecureToken() {
        byte[] tokenBytes = new byte[32]; // 256 bits
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }
}