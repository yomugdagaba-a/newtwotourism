package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find a password reset token by token string (OTP)
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find a password reset token by token and user ID
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.token = :token AND prt.userId = :userId")
    Optional<PasswordResetToken> findByTokenAndUserId(@Param("token") String token, @Param("userId") Long userId);

    /**
     * Find all tokens for a specific user (for cleanup/security purposes)
     */
    List<PasswordResetToken> findByUserId(Long userId);

    /**
     * Find the latest token for a user (for cooldown check)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.userId = :userId ORDER BY prt.createdAt DESC LIMIT 1")
    Optional<PasswordResetToken> findLatestByUserId(@Param("userId") Long userId);

    /**
     * Find all valid (unused and not expired) tokens for a user
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.userId = :userId AND prt.used = false AND prt.expiresAt > :now")
    List<PasswordResetToken> findValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count valid tokens for a user (for rate limiting)
     */
    @Query("SELECT COUNT(prt) FROM PasswordResetToken prt WHERE prt.userId = :userId AND prt.used = false AND prt.expiresAt > :now")
    long countValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count tokens created by user since a time (for rate limiting)
     */
    @Query("SELECT COUNT(prt) FROM PasswordResetToken prt WHERE prt.userId = :userId AND prt.createdAt > :since")
    long countTokensByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Delete all expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Delete all tokens for a specific user (when password is changed)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.userId = :userId")
    int deleteAllTokensByUserId(@Param("userId") Long userId);

    /**
     * Mark all tokens as used for a specific user
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true WHERE prt.userId = :userId AND prt.used = false")
    int markAllTokensAsUsedByUserId(@Param("userId") Long userId);

    /**
     * Find tokens created within a time range for rate limiting by IP
     */
    @Query("SELECT COUNT(prt) FROM PasswordResetToken prt WHERE prt.ipAddress = :ipAddress AND prt.createdAt > :since")
    long countTokensByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Check if a token exists and is valid
     */
    @Query("SELECT CASE WHEN COUNT(prt) > 0 THEN true ELSE false END FROM PasswordResetToken prt WHERE prt.token = :token AND prt.used = false AND prt.expiresAt > :now")
    boolean existsValidToken(@Param("token") String token, @Param("now") LocalDateTime now);
}