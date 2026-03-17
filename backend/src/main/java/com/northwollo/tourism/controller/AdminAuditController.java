package com.northwollo.tourism.controller;

import com.northwollo.tourism.entity.AuditLogEntry;
import com.northwollo.tourism.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@Tag(name = "Admin Audit Management", description = "Admin endpoints for audit log management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Get all audit logs with pagination")
    public ResponseEntity<Page<AuditLogEntry>> getAllAuditLogs(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        // Use sorting by timestamp descending
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogEntry> auditLogs = auditLogService.getAuditLogs(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/search")
    @Operation(summary = "Search audit logs with multiple criteria")
    public ResponseEntity<Page<AuditLogEntry>> searchAuditLogs(
            @Parameter(description = "User ID filter") @RequestParam(required = false) Long userId,
            @Parameter(description = "Username filter") @RequestParam(required = false) String username,
            @Parameter(description = "Action filter") @RequestParam(required = false) String action,
            @Parameter(description = "Resource type filter") @RequestParam(required = false) String resourceType,
            @Parameter(description = "Category filter") @RequestParam(required = false) String category,
            @Parameter(description = "Severity filter") @RequestParam(required = false) String severity,
            @Parameter(description = "IP address filter") @RequestParam(required = false) String ipAddress,
            @Parameter(description = "Start time filter") @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "End time filter") @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntry> auditLogs = auditLogService.searchAuditLogs(
                userId, username, action, resourceType, category, severity, ipAddress,
                startTime, endTime, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get audit logs for a specific user")
    public ResponseEntity<Page<AuditLogEntry>> getAuditLogsByUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntry> auditLogs = auditLogService.getAuditLogsByUser(userId, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "Get audit logs for a specific username")
    public ResponseEntity<Page<AuditLogEntry>> getAuditLogsByUsername(
            @Parameter(description = "Username") @PathVariable String username,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntry> auditLogs = auditLogService.getAuditLogsByUsername(username, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/action/{action}")
    @Operation(summary = "Get audit logs for a specific action")
    public ResponseEntity<Page<AuditLogEntry>> getAuditLogsByAction(
            @Parameter(description = "Action type") @PathVariable String action,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntry> auditLogs = auditLogService.getAuditLogsByAction(action, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/resource/{resourceType}")
    @Operation(summary = "Get audit logs for a specific resource type")
    public ResponseEntity<Page<AuditLogEntry>> getAuditLogsByResourceType(
            @Parameter(description = "Resource type") @PathVariable String resourceType,
            @Parameter(description = "Resource ID (optional)") @RequestParam(required = false) String resourceId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogEntry> auditLogs;
        
        if (resourceId != null) {
            auditLogs = auditLogService.getAuditLogsByResource(resourceType, resourceId, pageable);
        } else {
            auditLogs = auditLogService.getAuditLogsByCategory(resourceType, pageable);
        }
        
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/security")
    @Operation(summary = "Get recent security-related audit logs")
    public ResponseEntity<List<AuditLogEntry>> getRecentSecurityLogs(
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<AuditLogEntry> securityLogs = auditLogService.getRecentSecurityLogs(since);
        return ResponseEntity.ok(securityLogs);
    }

    @GetMapping("/high-severity")
    @Operation(summary = "Get high severity audit logs")
    public ResponseEntity<List<AuditLogEntry>> getHighSeverityLogs(
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<AuditLogEntry> highSeverityLogs = auditLogService.getHighSeverityLogs(since);
        return ResponseEntity.ok(highSeverityLogs);
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get audit log statistics")
    public ResponseEntity<Map<String, Object>> getAuditStatistics(
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("actionStatistics", auditLogService.getActionStatistics(since));
        statistics.put("resourceTypeStatistics", auditLogService.getResourceTypeStatistics(since));
        statistics.put("mostActiveUsers", auditLogService.getMostActiveUsers(since));
        
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/suspicious-activity")
    @Operation(summary = "Find suspicious IP activity")
    public ResponseEntity<List<Map<String, Object>>> getSuspiciousActivity(
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours,
            @Parameter(description = "User threshold") @RequestParam(defaultValue = "3") long userThreshold,
            @Parameter(description = "Action threshold") @RequestParam(defaultValue = "50") long actionThreshold) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Map<String, Object>> suspiciousActivity = auditLogService.findSuspiciousIpActivity(
                since, userThreshold, actionThreshold);
        return ResponseEntity.ok(suspiciousActivity);
    }

    @GetMapping("/integrity/check")
    @Operation(summary = "Check audit log integrity")
    public ResponseEntity<Map<String, Object>> checkIntegrity() {
        long logsWithoutChecksum = auditLogService.countLogsWithoutChecksum();
        
        Map<String, Object> integrityReport = new HashMap<>();
        integrityReport.put("logsWithoutChecksum", logsWithoutChecksum);
        integrityReport.put("integrityStatus", logsWithoutChecksum == 0 ? "GOOD" : "NEEDS_REPAIR");
        
        return ResponseEntity.ok(integrityReport);
    }

    @PostMapping("/integrity/repair")
    @Operation(summary = "Repair missing checksums in audit logs")
    public ResponseEntity<Map<String, Object>> repairIntegrity() {
        int repairedCount = auditLogService.repairMissingChecksums();
        
        Map<String, Object> repairResult = new HashMap<>();
        repairResult.put("repairedCount", repairedCount);
        repairResult.put("status", "COMPLETED");
        
        return ResponseEntity.ok(repairResult);
    }

    @GetMapping("/export")
    @Operation(summary = "Export audit logs (for archival)")
    public ResponseEntity<List<AuditLogEntry>> exportAuditLogs(
            @Parameter(description = "Days to look back") @RequestParam(defaultValue = "30") int days,
            @Parameter(description = "Batch size") @RequestParam(defaultValue = "1000") int batchSize) {
        
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(days);
        List<AuditLogEntry> logsForArchival = auditLogService.getLogsForArchival(cutoffTime, batchSize);
        return ResponseEntity.ok(logsForArchival);
    }

    @DeleteMapping("/cleanup")
    @Operation(summary = "Delete old audit logs (cleanup)")
    public ResponseEntity<Map<String, Object>> cleanupOldLogs(
            @Parameter(description = "Days to keep") @RequestParam(defaultValue = "90") int daysToKeep) {
        
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(daysToKeep);
        int deletedCount = auditLogService.deleteOldLogs(cutoffTime);
        
        Map<String, Object> cleanupResult = new HashMap<>();
        cleanupResult.put("deletedCount", deletedCount);
        cleanupResult.put("cutoffTime", cutoffTime);
        cleanupResult.put("status", "COMPLETED");
        
        return ResponseEntity.ok(cleanupResult);
    }

    @GetMapping("/activity/user/{userId}")
    @Operation(summary = "Get user activity count")
    public ResponseEntity<Map<String, Object>> getUserActivityCount(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        long activityCount = auditLogService.countUserActivitySince(userId, since);
        
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("activityCount", activityCount);
        result.put("timeRange", hours + " hours");
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/activity/ip/{ipAddress}")
    @Operation(summary = "Get IP address activity count")
    public ResponseEntity<Map<String, Object>> getIpActivityCount(
            @Parameter(description = "IP address") @PathVariable String ipAddress,
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        long activityCount = auditLogService.countIpActivitySince(ipAddress, since);
        
        Map<String, Object> result = new HashMap<>();
        result.put("ipAddress", ipAddress);
        result.put("activityCount", activityCount);
        result.put("timeRange", hours + " hours");
        
        return ResponseEntity.ok(result);
    }
}