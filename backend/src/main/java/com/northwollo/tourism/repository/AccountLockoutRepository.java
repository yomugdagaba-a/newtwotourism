package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.AccountLockout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountLockoutRepository extends JpaRepository<AccountLockout, Long> {

    /**
     * Find active lockout for a user
     */
    @Query("SELECT al FROM AccountLockout al WHERE al.userId = :userId AND al.active = true AND al.unlockAt > :now ORDER BY al.lockedAt DESC")
    Optional<AccountLockout> findActiveLockoutByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Find all lockouts for a user
     */
    List<AccountLockout> findByUserIdOrderByLockedAtDesc(Long userId);

    /**
     * Count total lockouts for a user
     */
    long countByUserId(Long userId);

    /**
     * Count active lockouts for a user
     */
    @Query("SELECT COUNT(al) FROM AccountLockout al WHERE al.userId = :userId AND al.active = true AND al.unlockAt > :now")
    long countActiveLockoutsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Find expired but still active lockouts (for cleanup)
     */
    @Query("SELECT al FROM AccountLockout al WHERE al.active = true AND al.unlockAt <= :now")
    List<AccountLockout> findExpiredActiveLockouts(@Param("now") LocalDateTime now);

    /**
     * Deactivate expired lockouts
     */
    @Modifying
    @Query("UPDATE AccountLockout al SET al.active = false WHERE al.active = true AND al.unlockAt <= :now")
    int deactivateExpiredLockouts(@Param("now") LocalDateTime now);

    /**
     * Deactivate all lockouts for a user (manual unlock)
     */
    @Modifying
    @Query("UPDATE AccountLockout al SET al.active = false WHERE al.userId = :userId AND al.active = true")
    int deactivateAllUserLockouts(@Param("userId") Long userId);

    /**
     * Find lockouts by IP address (for pattern analysis)
     */
    List<AccountLockout> findByTriggerIpAddressOrderByLockedAtDesc(String triggerIpAddress);

    /**
     * Count lockouts triggered by an IP address within a time period
     */
    @Query("SELECT COUNT(al) FROM AccountLockout al WHERE al.triggerIpAddress = :ipAddress AND al.lockedAt > :since")
    long countLockoutsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Find users with multiple lockouts (frequent offenders)
     */
    @Query("SELECT al.userId, COUNT(al) as lockoutCount FROM AccountLockout al WHERE al.lockedAt > :since GROUP BY al.userId HAVING COUNT(al) >= :minCount ORDER BY lockoutCount DESC")
    List<Object[]> findFrequentlyLockedUsers(@Param("since") LocalDateTime since, @Param("minCount") long minCount);

    /**
     * Delete old lockout records (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM AccountLockout al WHERE al.lockedAt < :cutoffTime AND al.active = false")
    int deleteOldInactiveLockouts(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Check if user is currently locked out
     */
    @Query("SELECT CASE WHEN COUNT(al) > 0 THEN true ELSE false END FROM AccountLockout al WHERE al.userId = :userId AND al.active = true AND al.unlockAt > :now")
    boolean isUserLockedOut(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}