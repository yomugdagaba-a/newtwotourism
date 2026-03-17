package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    /**
     * Find an email verification token by token string (OTP)
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Find an email verification token by token and email
     */
    @Query("SELECT evt FROM EmailVerificationToken evt WHERE evt.token = :token AND evt.email = :email")
    Optional<EmailVerificationToken> findByTokenAndEmail(@Param("token") String token, @Param("email") String email);

    /**
     * Find all tokens for a specific user
     */
    List<EmailVerificationToken> findByUserId(Long userId);

    /**
     * Find all tokens for a specific email
     */
    List<EmailVerificationToken> findByEmail(String email);

    /**
     * Find the latest token for an email (for cooldown check)
     */
    @Query("SELECT evt FROM EmailVerificationToken evt WHERE evt.email = :email ORDER BY evt.createdAt DESC LIMIT 1")
    Optional<EmailVerificationToken> findLatestByEmail(@Param("email") String email);

    /**
     * Find all valid (unverified and not expired) tokens for a user
     */
    @Query("SELECT evt FROM EmailVerificationToken evt WHERE evt.userId = :userId AND evt.verified = false AND evt.expiresAt > :now")
    List<EmailVerificationToken> findValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Find all valid tokens for an email address
     */
    @Query("SELECT evt FROM EmailVerificationToken evt WHERE evt.email = :email AND evt.verified = false AND evt.expiresAt > :now")
    List<EmailVerificationToken> findValidTokensByEmail(@Param("email") String email, @Param("now") LocalDateTime now);

    /**
     * Count valid tokens for a user (for rate limiting)
     */
    @Query("SELECT COUNT(evt) FROM EmailVerificationToken evt WHERE evt.userId = :userId AND evt.verified = false AND evt.expiresAt > :now")
    long countValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count valid tokens for an email (for rate limiting)
     */
    @Query("SELECT COUNT(evt) FROM EmailVerificationToken evt WHERE evt.email = :email AND evt.verified = false AND evt.expiresAt > :now")
    long countValidTokensByEmail(@Param("email") String email, @Param("now") LocalDateTime now);

    /**
     * Count tokens created by email since a time (for rate limiting)
     */
    @Query("SELECT COUNT(evt) FROM EmailVerificationToken evt WHERE evt.email = :email AND evt.createdAt > :since")
    long countTokensByEmailSince(@Param("email") String email, @Param("since") LocalDateTime since);

    /**
     * Delete all expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Delete all tokens for a specific user
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.userId = :userId")
    int deleteAllTokensByUserId(@Param("userId") Long userId);

    /**
     * Delete all tokens for a specific email
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.email = :email")
    int deleteAllTokensByEmail(@Param("email") String email);

    /**
     * Mark all tokens as verified for a specific user
     */
    @Modifying
    @Query("UPDATE EmailVerificationToken evt SET evt.verified = true WHERE evt.userId = :userId AND evt.verified = false")
    int markAllTokensAsVerifiedByUserId(@Param("userId") Long userId);

    /**
     * Mark all tokens as verified for a specific email
     */
    @Modifying
    @Query("UPDATE EmailVerificationToken evt SET evt.verified = true WHERE evt.email = :email AND evt.verified = false")
    int markAllTokensAsVerifiedByEmail(@Param("email") String email);

    /**
     * Find tokens created within a time range for rate limiting by IP
     */
    @Query("SELECT COUNT(evt) FROM EmailVerificationToken evt WHERE evt.ipAddress = :ipAddress AND evt.createdAt > :since")
    long countTokensByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Check if a token exists and is valid
     */
    @Query("SELECT CASE WHEN COUNT(evt) > 0 THEN true ELSE false END FROM EmailVerificationToken evt WHERE evt.token = :token AND evt.verified = false AND evt.expiresAt > :now")
    boolean existsValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Check if an email has been verified (has verified tokens)
     */
    @Query("SELECT CASE WHEN COUNT(evt) > 0 THEN true ELSE false END FROM EmailVerificationToken evt WHERE evt.email = :email AND evt.verified = true")
    boolean isEmailVerified(@Param("email") String email);
}