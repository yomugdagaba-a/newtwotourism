package com.northwollo.tourism.service;

import com.northwollo.tourism.entity.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service interface for comprehensive audit logging functionality
 */
public interface AuditLogService {

    /**
     * Log a basic audit entry
     */
    void logAudit(Long userId, String username, String action, String resourceType, String resourceId,
                  String ipAddress, String userAgent, String description);

    /**
     * Log an audit entry with additional details
     */
    void logAudit(Long userId, String username, String action, String resourceType, String resourceId,
                  Map<String, Object> details, String ipAddress, String userAgent, String description);

    /**
     * Log a security-related audit entry
     */
    void logSecurityAudit(Long userId, String username, String action, String category, String severity,
                         String ipAddress, String userAgent, String description);

    /**
     * Log an authentication event
     */
    void logAuthenticationEvent(Long userId, String username, String action, boolean success,
                               String ipAddress, String userAgent, String details);

    /**
     * Log an authorization event
     */
    void logAuthorizationEvent(Long userId, String username, String resource, String action, boolean granted,
                              String ipAddress, String userAgent, String reason);

    /**
     * Log a data change event
     */
    void logDataChange(Long userId, String username, String action, String resourceType, String resourceId,
                      Map<String, Object> oldValues, Map<String, Object> newValues,
                      String ipAddress, String userAgent);

    /**
     * Get audit logs with pagination
     */
    Page<AuditLogEntry> getAuditLogs(Pageable pageable);

    /**
     * Get audit logs by user
     */
    Page<AuditLogEntry> getAuditLogsByUser(Long userId, Pageable pageable);

    /**
     * Get audit logs by username
     */
    Page<AuditLogEntry> getAuditLogsByUsername(String username, Pageable pageable);

    /**
     * Get audit logs by action
     */
    Page<AuditLogEntry> getAuditLogsByAction(String action, Pageable pageable);

    /**
     * Get audit logs by resource
     */
    Page<AuditLogEntry> getAuditLogsByResource(String resourceType, String resourceId, Pageable pageable);

    /**
     * Get audit logs by category
     */
    Page<AuditLogEntry> getAuditLogsByCategory(String category, Pageable pageable);

    /**
     * Get audit logs by severity
     */
    Page<AuditLogEntry> getAuditLogsBySeverity(String severity, Pageable pageable);

    /**
     * Get audit logs by IP address
     */
    Page<AuditLogEntry> getAuditLogsByIpAddress(String ipAddress, Pageable pageable);

    /**
     * Get audit logs within a time range
     */
    Page<AuditLogEntry> getAuditLogsByTimeRange(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * Search audit logs with multiple criteria
     */
    Page<AuditLogEntry> searchAuditLogs(Long userId, String username, String action, String resourceType,
                                       String category, String severity, String ipAddress,
                                       LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * Get recent security logs
     */
    List<AuditLogEntry> getRecentSecurityLogs(LocalDateTime since);

    /**
     * Get high severity logs
     */
    List<AuditLogEntry> getHighSeverityLogs(LocalDateTime since);

    /**
     * Get audit statistics by action
     */
    Map<String, Long> getActionStatistics(LocalDateTime since);

    /**
     * Get audit statistics by resource type
     */
    Map<String, Long> getResourceTypeStatistics(LocalDateTime since);

    /**
     * Get most active users
     */
    Map<String, Long> getMostActiveUsers(LocalDateTime since);

    /**
     * Find suspicious IP activity
     */
    List<Map<String, Object>> findSuspiciousIpActivity(LocalDateTime since, long userThreshold, long actionThreshold);

    /**
     * Count user activity since a specific time
     */
    long countUserActivitySince(Long userId, LocalDateTime since);

    /**
     * Count action occurrences since a specific time
     */
    long countActionSince(String action, LocalDateTime since);

    /**
     * Count IP activity since a specific time
     */
    long countIpActivitySince(String ipAddress, LocalDateTime since);

    /**
     * Archive old audit logs
     */
    List<AuditLogEntry> getLogsForArchival(LocalDateTime cutoffTime, int batchSize);

    /**
     * Delete old audit logs (cleanup)
     */
    int deleteOldLogs(LocalDateTime cutoffTime);

    /**
     * Verify audit log integrity
     */
    long countLogsWithoutChecksum();

    /**
     * Generate checksum for audit log entry
     */
    String generateChecksum(AuditLogEntry entry);

    /**
     * Verify checksum for audit log entry
     */
    boolean verifyChecksum(AuditLogEntry entry);

    /**
     * Repair missing checksums
     */
    int repairMissingChecksums();
}