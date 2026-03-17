package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.entity.AuditLogEntry;
import com.northwollo.tourism.repository.AuditLogRepository;
import com.northwollo.tourism.repository.specification.AuditLogSpecification;
import com.northwollo.tourism.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void logAudit(Long userId, String username, String action, String resourceType, String resourceId,
                        String ipAddress, String userAgent, String description) {
        logAudit(userId, username, action, resourceType, resourceId, null, ipAddress, userAgent, description);
    }

    @Override
    public void logAudit(Long userId, String username, String action, String resourceType, String resourceId,
                        Map<String, Object> details, String ipAddress, String userAgent, String description) {
        try {
            AuditLogEntry entry = new AuditLogEntry(userId, username, action, resourceType, resourceId,
                    details, ipAddress, userAgent, description);
            
            // Generate checksum for integrity
            entry.setChecksum(generateChecksum(entry));
            
            auditLogRepository.save(entry);
            
            log.debug("Audit log created: action={}, user={}, resource={}:{}", 
                    action, username, resourceType, resourceId);
        } catch (Exception e) {
            log.error("Failed to create audit log entry", e);
            // Don't throw exception to avoid disrupting main business logic
        }
    }

    @Override
    public void logSecurityAudit(Long userId, String username, String action, String category, String severity,
                                String ipAddress, String userAgent, String description) {
        try {
            AuditLogEntry entry = new AuditLogEntry(userId, username, action, null, null, ipAddress, userAgent, description);
            entry.setSecurityAudit(category, severity);
            entry.setChecksum(generateChecksum(entry));
            
            auditLogRepository.save(entry);
            
            log.info("Security audit log created: action={}, user={}, severity={}, category={}", 
                    action, username, severity, category);
        } catch (Exception e) {
            log.error("Failed to create security audit log entry", e);
        }
    }

    @Override
    public void logAuthenticationEvent(Long userId, String username, String action, boolean success,
                                      String ipAddress, String userAgent, String details) {
        Map<String, Object> eventDetails = new HashMap<>();
        eventDetails.put("success", success);
        eventDetails.put("details", details);
        
        String severity = success ? "INFO" : "WARN";
        String description = String.format("Authentication %s: %s", success ? "successful" : "failed", action);
        
        AuditLogEntry entry = new AuditLogEntry(userId, username, action, "USER", userId != null ? userId.toString() : null,
                eventDetails, ipAddress, userAgent, description);
        entry.setSecurityAudit("AUTHENTICATION", severity);
        entry.setChecksum(generateChecksum(entry));
        
        auditLogRepository.save(entry);
    }

    @Override
    public void logAuthorizationEvent(Long userId, String username, String resource, String action, boolean granted,
                                     String ipAddress, String userAgent, String reason) {
        Map<String, Object> eventDetails = new HashMap<>();
        eventDetails.put("granted", granted);
        eventDetails.put("reason", reason);
        eventDetails.put("resource", resource);
        
        String severity = granted ? "INFO" : "WARN";
        String description = String.format("Authorization %s for %s on %s", 
                granted ? "granted" : "denied", action, resource);
        
        AuditLogEntry entry = new AuditLogEntry(userId, username, "AUTHORIZATION_CHECK", "PERMISSION", resource,
                eventDetails, ipAddress, userAgent, description);
        entry.setSecurityAudit("AUTHORIZATION", severity);
        entry.setChecksum(generateChecksum(entry));
        
        auditLogRepository.save(entry);
    }

    @Override
    public void logDataChange(Long userId, String username, String action, String resourceType, String resourceId,
                             Map<String, Object> oldValues, Map<String, Object> newValues,
                             String ipAddress, String userAgent) {
        Map<String, Object> changeDetails = new HashMap<>();
        if (oldValues != null) {
            changeDetails.put("oldValues", oldValues);
        }
        if (newValues != null) {
            changeDetails.put("newValues", newValues);
        }
        
        String description = String.format("Data %s on %s:%s", action.toLowerCase(), resourceType, resourceId);
        
        logAudit(userId, username, action, resourceType, resourceId, changeDetails, ipAddress, userAgent, description);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByResource(String resourceType, String resourceId, Pageable pageable) {
        return auditLogRepository.findByResourceTypeAndResourceIdOrderByTimestampDesc(resourceType, resourceId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByCategory(String category, Pageable pageable) {
        return auditLogRepository.findByCategoryOrderByTimestampDesc(category, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsBySeverity(String severity, Pageable pageable) {
        return auditLogRepository.findBySeverityOrderByTimestampDesc(severity, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByIpAddress(String ipAddress, Pageable pageable) {
        return auditLogRepository.findByIpAddressOrderByTimestampDesc(ipAddress, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> getAuditLogsByTimeRange(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startTime, endTime, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> searchAuditLogs(Long userId, String username, String action, String resourceType,
                                              String category, String severity, String ipAddress,
                                              LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        // Use JPA Specifications to build dynamic query - avoids PostgreSQL parameter type inference issues
        Specification<AuditLogEntry> spec = AuditLogSpecification.buildSearchSpecification(
                userId, username, action, resourceType, category, severity, ipAddress, startTime, endTime);
        
        // Ensure sorting by timestamp descending
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "timestamp"));
        
        return auditLogRepository.findAll(spec, sortedPageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> getRecentSecurityLogs(LocalDateTime since) {
        return auditLogRepository.findRecentSecurityLogs(since);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> getHighSeverityLogs(LocalDateTime since) {
        return auditLogRepository.findHighSeverityLogs(since);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getActionStatistics(LocalDateTime since) {
        List<Object[]> results = auditLogRepository.getActionStatistics(since);
        return results.stream()
                .filter(row -> row[0] != null) // Filter out null keys
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getResourceTypeStatistics(LocalDateTime since) {
        List<Object[]> results = auditLogRepository.getResourceTypeStatistics(since);
        return results.stream()
                .filter(row -> row[0] != null) // Filter out null keys
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getMostActiveUsers(LocalDateTime since) {
        List<Object[]> results = auditLogRepository.getMostActiveUsers(since);
        return results.stream()
                .filter(row -> row[0] != null) // Filter out null keys
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findSuspiciousIpActivity(LocalDateTime since, long userThreshold, long actionThreshold) {
        List<Object[]> results = auditLogRepository.findSuspiciousIpActivity(since, userThreshold, actionThreshold);
        return results.stream()
                .map(row -> {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("ipAddress", row[0]);
                    activity.put("userCount", row[1]);
                    activity.put("actionCount", row[2]);
                    return activity;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countUserActivitySince(Long userId, LocalDateTime since) {
        return auditLogRepository.countByUserIdSince(userId, since);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActionSince(String action, LocalDateTime since) {
        return auditLogRepository.countByActionSince(action, since);
    }

    @Override
    @Transactional(readOnly = true)
    public long countIpActivitySince(String ipAddress, LocalDateTime since) {
        return auditLogRepository.countByIpAddressSince(ipAddress, since);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> getLogsForArchival(LocalDateTime cutoffTime, int batchSize) {
        return auditLogRepository.findLogsForArchival(cutoffTime, PageRequest.of(0, batchSize));
    }

    @Override
    public int deleteOldLogs(LocalDateTime cutoffTime) {
        return auditLogRepository.deleteOldLogs(cutoffTime);
    }

    @Override
    @Transactional(readOnly = true)
    public long countLogsWithoutChecksum() {
        return auditLogRepository.countLogsWithoutChecksum();
    }

    @Override
    public String generateChecksum(AuditLogEntry entry) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            
            StringBuilder data = new StringBuilder();
            data.append(entry.getUserId() != null ? entry.getUserId().toString() : "");
            data.append(entry.getUsername() != null ? entry.getUsername() : "");
            data.append(entry.getAction() != null ? entry.getAction() : "");
            data.append(entry.getResourceType() != null ? entry.getResourceType() : "");
            data.append(entry.getResourceId() != null ? entry.getResourceId() : "");
            data.append(entry.getIpAddress() != null ? entry.getIpAddress() : "");
            data.append(entry.getTimestamp() != null ? entry.getTimestamp().toString() : "");
            data.append(entry.getDescription() != null ? entry.getDescription() : "");
            
            byte[] hash = digest.digest(data.toString().getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate checksum", e);
            return null;
        }
    }

    @Override
    public boolean verifyChecksum(AuditLogEntry entry) {
        if (entry.getChecksum() == null) {
            return false;
        }
        
        String calculatedChecksum = generateChecksum(entry);
        return entry.getChecksum().equals(calculatedChecksum);
    }

    @Override
    public int repairMissingChecksums() {
        List<AuditLogEntry> entriesWithoutChecksum = auditLogRepository.findAll().stream()
                .filter(entry -> entry.getChecksum() == null || entry.getChecksum().isEmpty())
                .collect(Collectors.toList());
        
        for (AuditLogEntry entry : entriesWithoutChecksum) {
            entry.setChecksum(generateChecksum(entry));
            auditLogRepository.save(entry);
        }
        
        log.info("Repaired checksums for {} audit log entries", entriesWithoutChecksum.size());
        return entriesWithoutChecksum.size();
    }
}