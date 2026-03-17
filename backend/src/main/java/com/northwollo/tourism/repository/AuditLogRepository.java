package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntry, Long>, JpaSpecificationExecutor<AuditLogEntry> {

    /**
     * Find audit logs by user ID
     */
    Page<AuditLogEntry> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    /**
     * Find audit logs by username
     */
    Page<AuditLogEntry> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);

    /**
     * Find audit logs by action
     */
    Page<AuditLogEntry> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    /**
     * Find audit logs by resource type
     */
    Page<AuditLogEntry> findByResourceTypeOrderByTimestampDesc(String resourceType, Pageable pageable);

    /**
     * Find audit logs by resource type and ID
     */
    Page<AuditLogEntry> findByResourceTypeAndResourceIdOrderByTimestampDesc(String resourceType, String resourceId, Pageable pageable);

    /**
     * Find audit logs by category
     */
    Page<AuditLogEntry> findByCategoryOrderByTimestampDesc(String category, Pageable pageable);

    /**
     * Find audit logs by severity
     */
    Page<AuditLogEntry> findBySeverityOrderByTimestampDesc(String severity, Pageable pageable);

    /**
     * Find audit logs by IP address
     */
    Page<AuditLogEntry> findByIpAddressOrderByTimestampDesc(String ipAddress, Pageable pageable);

    /**
     * Find audit logs within a time range
     */
    Page<AuditLogEntry> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    // Note: findByMultipleCriteria removed - use JpaSpecificationExecutor.findAll(Specification, Pageable) instead
    // This avoids PostgreSQL parameter type inference issues with nullable parameters

    /**
     * Count audit logs by user within a time period
     */
    @Query("SELECT COUNT(ale) FROM AuditLogEntry ale WHERE ale.userId = :userId AND ale.timestamp >= :since")
    long countByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Count audit logs by action within a time period
     */
    @Query("SELECT COUNT(ale) FROM AuditLogEntry ale WHERE ale.action = :action AND ale.timestamp >= :since")
    long countByActionSince(@Param("action") String action, @Param("since") LocalDateTime since);

    /**
     * Count audit logs by IP address within a time period
     */
    @Query("SELECT COUNT(ale) FROM AuditLogEntry ale WHERE ale.ipAddress = :ipAddress AND ale.timestamp >= :since")
    long countByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Find recent security-related audit logs
     */
    @Query("SELECT ale FROM AuditLogEntry ale WHERE ale.category IN ('SECURITY', 'AUTHENTICATION', 'AUTHORIZATION') AND ale.timestamp >= :since ORDER BY ale.timestamp DESC")
    List<AuditLogEntry> findRecentSecurityLogs(@Param("since") LocalDateTime since);

    /**
     * Find audit logs with high severity
     */
    @Query("SELECT ale FROM AuditLogEntry ale WHERE ale.severity IN ('ERROR', 'CRITICAL') AND ale.timestamp >= :since ORDER BY ale.timestamp DESC")
    List<AuditLogEntry> findHighSeverityLogs(@Param("since") LocalDateTime since);

    /**
     * Get audit statistics by action
     */
    @Query("SELECT ale.action, COUNT(ale) FROM AuditLogEntry ale WHERE ale.timestamp >= :since GROUP BY ale.action ORDER BY COUNT(ale) DESC")
    List<Object[]> getActionStatistics(@Param("since") LocalDateTime since);

    /**
     * Get audit statistics by resource type
     */
    @Query("SELECT ale.resourceType, COUNT(ale) FROM AuditLogEntry ale WHERE ale.timestamp >= :since GROUP BY ale.resourceType ORDER BY COUNT(ale) DESC")
    List<Object[]> getResourceTypeStatistics(@Param("since") LocalDateTime since);

    /**
     * Get most active users
     */
    @Query("SELECT ale.username, COUNT(ale) FROM AuditLogEntry ale WHERE ale.username IS NOT NULL AND ale.timestamp >= :since GROUP BY ale.username ORDER BY COUNT(ale) DESC")
    List<Object[]> getMostActiveUsers(@Param("since") LocalDateTime since);

    /**
     * Find suspicious activity patterns
     */
    @Query("SELECT ale.ipAddress, COUNT(DISTINCT ale.userId) as userCount, COUNT(ale) as actionCount FROM AuditLogEntry ale WHERE ale.timestamp >= :since GROUP BY ale.ipAddress HAVING COUNT(DISTINCT ale.userId) > :userThreshold OR COUNT(ale) > :actionThreshold ORDER BY actionCount DESC")
    List<Object[]> findSuspiciousIpActivity(@Param("since") LocalDateTime since, @Param("userThreshold") long userThreshold, @Param("actionThreshold") long actionThreshold);

    /**
     * Archive old audit logs (for cleanup)
     */
    @Query("SELECT ale FROM AuditLogEntry ale WHERE ale.timestamp < :cutoffTime ORDER BY ale.timestamp ASC")
    List<AuditLogEntry> findLogsForArchival(@Param("cutoffTime") LocalDateTime cutoffTime, Pageable pageable);

    /**
     * Delete old audit logs (cleanup job)
     */
    @Query("DELETE FROM AuditLogEntry ale WHERE ale.timestamp < :cutoffTime")
    int deleteOldLogs(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Verify audit log integrity
     */
    @Query("SELECT COUNT(ale) FROM AuditLogEntry ale WHERE ale.checksum IS NULL OR ale.checksum = ''")
    long countLogsWithoutChecksum();
}