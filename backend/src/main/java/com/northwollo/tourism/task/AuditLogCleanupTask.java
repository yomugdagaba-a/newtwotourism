package com.northwollo.tourism.task;

import com.northwollo.tourism.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.audit.cleanup-enabled", havingValue = "true", matchIfMissing = true)
public class AuditLogCleanupTask {

    private final AuditLogService auditLogService;

    @Value("${app.audit.retention-days:90}")
    private int retentionDays;

    /**
     * Cleanup old audit logs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldAuditLogs() {
        try {
            log.info("Starting audit log cleanup task");
            
            LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retentionDays);
            int deletedCount = auditLogService.deleteOldLogs(cutoffTime);
            
            log.info("Audit log cleanup completed. Deleted {} old audit log entries older than {}",
                    deletedCount, cutoffTime);
            
            // Log the cleanup action itself
            auditLogService.logSecurityAudit(null, "system", "AUDIT_LOG_CLEANUP", "MAINTENANCE", "INFO",
                    "localhost", "system", 
                    String.format("Cleaned up %d audit log entries older than %d days", deletedCount, retentionDays));
            
        } catch (Exception e) {
            log.error("Failed to cleanup old audit logs", e);
            
            // Log the failure
            auditLogService.logSecurityAudit(null, "system", "AUDIT_LOG_CLEANUP_FAILED", "MAINTENANCE", "ERROR",
                    "localhost", "system", 
                    String.format("Audit log cleanup failed: %s", e.getMessage()));
        }
    }

    /**
     * Check and repair audit log integrity weekly on Sunday at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * SUN")
    public void checkAndRepairIntegrity() {
        try {
            log.info("Starting audit log integrity check");
            
            long logsWithoutChecksum = auditLogService.countLogsWithoutChecksum();
            
            if (logsWithoutChecksum > 0) {
                log.warn("Found {} audit log entries without checksum. Starting repair...", logsWithoutChecksum);
                
                int repairedCount = auditLogService.repairMissingChecksums();
                
                log.info("Audit log integrity repair completed. Repaired {} entries", repairedCount);
                
                // Log the repair action
                auditLogService.logSecurityAudit(null, "system", "AUDIT_LOG_INTEGRITY_REPAIR", "MAINTENANCE", "INFO",
                        "localhost", "system", 
                        String.format("Repaired checksums for %d audit log entries", repairedCount));
            } else {
                log.info("Audit log integrity check completed. All entries have valid checksums");
                
                // Log the successful check
                auditLogService.logSecurityAudit(null, "system", "AUDIT_LOG_INTEGRITY_CHECK", "MAINTENANCE", "INFO",
                        "localhost", "system", "Audit log integrity check passed - all entries have valid checksums");
            }
            
        } catch (Exception e) {
            log.error("Failed to check/repair audit log integrity", e);
            
            // Log the failure
            auditLogService.logSecurityAudit(null, "system", "AUDIT_LOG_INTEGRITY_CHECK_FAILED", "MAINTENANCE", "ERROR",
                    "localhost", "system", 
                    String.format("Audit log integrity check failed: %s", e.getMessage()));
        }
    }

    /**
     * Generate audit statistics report monthly on the 1st at 4 AM
     */
    @Scheduled(cron = "0 0 4 1 * ?")
    public void generateMonthlyAuditReport() {
        try {
            log.info("Generating monthly audit statistics report");
            
            LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
            
            var actionStats = auditLogService.getActionStatistics(lastMonth);
            var resourceStats = auditLogService.getResourceTypeStatistics(lastMonth);
            var activeUsers = auditLogService.getMostActiveUsers(lastMonth);
            var suspiciousActivity = auditLogService.findSuspiciousIpActivity(lastMonth, 3, 50);
            
            log.info("Monthly audit report generated:");
            log.info("- Action statistics: {}", actionStats);
            log.info("- Resource statistics: {}", resourceStats);
            log.info("- Most active users: {}", activeUsers);
            log.info("- Suspicious activities found: {}", suspiciousActivity.size());
            
            // Log the report generation
            auditLogService.logSecurityAudit(null, "system", "AUDIT_MONTHLY_REPORT", "MAINTENANCE", "INFO",
                    "localhost", "system", 
                    String.format("Generated monthly audit report - Actions: %d types, Resources: %d types, Active users: %d, Suspicious activities: %d",
                            actionStats.size(), resourceStats.size(), activeUsers.size(), suspiciousActivity.size()));
            
        } catch (Exception e) {
            log.error("Failed to generate monthly audit report", e);
            
            // Log the failure
            auditLogService.logSecurityAudit(null, "system", "AUDIT_MONTHLY_REPORT_FAILED", "MAINTENANCE", "ERROR",
                    "localhost", "system", 
                    String.format("Monthly audit report generation failed: %s", e.getMessage()));
        }
    }
}