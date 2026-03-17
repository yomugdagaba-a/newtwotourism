package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find a refresh token by token string
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Find all tokens for a specific user
     */
    List<RefreshToken> findByUserId(Long userId);

    /**
     * Find all valid (not revoked and not expired) tokens for a user
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count valid tokens for a user (for limiting active sessions)
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    long countValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Delete all expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Revoke all tokens for a specific user
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userId = :userId AND rt.revoked = false")
    int revokeAllTokensByUserId(@Param("userId") Long userId);

    /**
     * Revoke all tokens except the current one for a user
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userId = :userId AND rt.token != :currentToken AND rt.revoked = false")
    int revokeAllTokensExceptCurrent(@Param("userId") Long userId, @Param("currentToken") String currentToken);

    /**
     * Delete all tokens for a specific user
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.userId = :userId")
    int deleteAllTokensByUserId(@Param("userId") Long userId);

    /**
     * Find tokens created within a time range for rate limiting by IP
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.ipAddress = :ipAddress AND rt.createdAt > :since")
    long countTokensByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Check if a token exists and is valid
     */
    @Query("SELECT CASE WHEN COUNT(rt) > 0 THEN true ELSE false END FROM RefreshToken rt WHERE rt.token = :token AND rt.revoked = false AND rt.expiresAt > :now")
    boolean existsValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Find oldest tokens for a user (for cleanup when limit exceeded)
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false ORDER BY rt.createdAt ASC")
    List<RefreshToken> findOldestTokensByUserId(@Param("userId") Long userId);
}