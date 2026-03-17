package com.northwollo.tourism.repository.specification;

import com.northwollo.tourism.entity.AuditLogEntry;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

/**
 * JPA Specifications for dynamic audit log queries.
 * This approach avoids PostgreSQL parameter type inference issues with nullable parameters.
 */
public class AuditLogSpecification {

    public static Specification<AuditLogEntry> withUserId(Long userId) {
        return (root, query, cb) -> userId == null ? cb.conjunction() : cb.equal(root.get("userId"), userId);
    }

    public static Specification<AuditLogEntry> withUsername(String username) {
        return (root, query, cb) -> username == null || username.isBlank() ? cb.conjunction() : cb.equal(root.get("username"), username);
    }

    public static Specification<AuditLogEntry> withAction(String action) {
        return (root, query, cb) -> action == null || action.isBlank() ? cb.conjunction() : cb.equal(root.get("action"), action);
    }

    public static Specification<AuditLogEntry> withResourceType(String resourceType) {
        return (root, query, cb) -> resourceType == null || resourceType.isBlank() ? cb.conjunction() : cb.equal(root.get("resourceType"), resourceType);
    }

    public static Specification<AuditLogEntry> withCategory(String category) {
        return (root, query, cb) -> category == null || category.isBlank() ? cb.conjunction() : cb.equal(root.get("category"), category);
    }

    public static Specification<AuditLogEntry> withSeverity(String severity) {
        return (root, query, cb) -> severity == null || severity.isBlank() ? cb.conjunction() : cb.equal(root.get("severity"), severity);
    }

    public static Specification<AuditLogEntry> withIpAddress(String ipAddress) {
        return (root, query, cb) -> ipAddress == null || ipAddress.isBlank() ? cb.conjunction() : cb.equal(root.get("ipAddress"), ipAddress);
    }

    public static Specification<AuditLogEntry> withStartTime(LocalDateTime startTime) {
        return (root, query, cb) -> startTime == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("timestamp"), startTime);
    }

    public static Specification<AuditLogEntry> withEndTime(LocalDateTime endTime) {
        return (root, query, cb) -> endTime == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("timestamp"), endTime);
    }

    /**
     * Build a combined specification from all criteria
     */
    public static Specification<AuditLogEntry> buildSearchSpecification(
            Long userId, String username, String action, String resourceType,
            String category, String severity, String ipAddress,
            LocalDateTime startTime, LocalDateTime endTime) {
        
        return Specification.where(withUserId(userId))
                .and(withUsername(username))
                .and(withAction(action))
                .and(withResourceType(resourceType))
                .and(withCategory(category))
                .and(withSeverity(severity))
                .and(withIpAddress(ipAddress))
                .and(withStartTime(startTime))
                .and(withEndTime(endTime));
    }
}
