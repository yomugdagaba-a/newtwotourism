package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    /**
     * Find login attempts by identifier (username, email, or IP)
     */
    List<LoginAttempt> findByIdentifierOrderByAttemptTimeDesc(String identifier);

    /**
     * Find login attempts by IP address
     */
    List<LoginAttempt> findByIpAddressOrderByAttemptTimeDesc(String ipAddress);

    /**
     * Find login attempts by user ID
     */
    List<LoginAttempt> findByUserIdOrderByAttemptTimeDesc(Long userId);

    /**
     * Count failed login attempts for an identifier within a time period
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.identifier = :identifier AND la.successful = false AND la.attemptTime > :since")
    long countFailedAttemptsByIdentifierSince(@Param("identifier") String identifier, @Param("since") LocalDateTime since);

    /**
     * Count failed login attempts for an IP address within a time period
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.successful = false AND la.attemptTime > :since")
    long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Count total login attempts for an IP address within a time period
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.attemptTime > :since")
    long countAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Find recent failed attempts for an identifier
     */
    @Query("SELECT la FROM LoginAttempt la WHERE la.identifier = :identifier AND la.successful = false AND la.attemptTime > :since ORDER BY la.attemptTime DESC")
    List<LoginAttempt> findRecentFailedAttemptsByIdentifier(@Param("identifier") String identifier, @Param("since") LocalDateTime since);

    /**
     * Find recent failed attempts for an IP address
     */
    @Query("SELECT la FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.successful = false AND la.attemptTime > :since ORDER BY la.attemptTime DESC")
    List<LoginAttempt> findRecentFailedAttemptsByIp(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Delete old login attempts (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM LoginAttempt la WHERE la.attemptTime < :cutoffTime")
    int deleteOldAttempts(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Find the last successful login for an identifier
     */
    @Query("SELECT la FROM LoginAttempt la WHERE la.identifier = :identifier AND la.successful = true ORDER BY la.attemptTime DESC")
    List<LoginAttempt> findLastSuccessfulLoginByIdentifier(@Param("identifier") String identifier);

    /**
     * Count consecutive failed attempts since last success for an identifier
     */
    @Query(value = """
        SELECT COUNT(*) FROM login_attempts la1 
        WHERE la1.identifier = :identifier 
        AND la1.successful = false 
        AND la1.attempt_time > COALESCE(
            (SELECT MAX(la2.attempt_time) FROM login_attempts la2 
             WHERE la2.identifier = :identifier AND la2.successful = true), 
            '1970-01-01'
        )
        """, nativeQuery = true)
    long countConsecutiveFailedAttempts(@Param("identifier") String identifier);

    /**
     * Find suspicious activity patterns (multiple IPs for same identifier)
     */
    @Query("SELECT DISTINCT la.ipAddress FROM LoginAttempt la WHERE la.identifier = :identifier AND la.attemptTime > :since")
    List<String> findDistinctIpAddressesForIdentifier(@Param("identifier") String identifier, @Param("since") LocalDateTime since);
}