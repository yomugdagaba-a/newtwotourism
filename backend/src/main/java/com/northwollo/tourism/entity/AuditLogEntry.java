package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "audit_log_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntry extends BaseEntity {

    @Column
    private Long userId; // null for anonymous actions

    @Column(length = 100)
    private String username; // cached for performance

    @NotBlank
    @Column(nullable = false, length = 100)
    private String action; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.

    @Column(length = 50)
    private String resourceType; // USER, HOTEL, TOURISM, BOOKING, etc.

    @Column(length = 100)
    private String resourceId; // ID of the affected resource

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details; // Additional details in JSON format

    @NotBlank
    @Column(nullable = false, length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 100)
    private String sessionId;

    @Column(length = 50)
    private String severity; // INFO, WARN, ERROR, CRITICAL

    @Column(length = 100)
    private String category; // AUTHENTICATION, AUTHORIZATION, DATA_CHANGE, SECURITY, etc.

    @Column(length = 1000)
    private String description; // Human-readable description

    @Column(length = 32)
    private String checksum; // For integrity verification

    // Convenience constructor for basic audit entries
    public AuditLogEntry(Long userId, String username, String action, String resourceType, String resourceId, 
                        String ipAddress, String userAgent, String description) {
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.description = description;
        this.timestamp = LocalDateTime.now();
        this.severity = "INFO";
        this.category = "DATA_CHANGE";
    }

    // Constructor with details
    public AuditLogEntry(Long userId, String username, String action, String resourceType, String resourceId,
                        Map<String, Object> details, String ipAddress, String userAgent, String description) {
        this(userId, username, action, resourceType, resourceId, ipAddress, userAgent, description);
        this.details = details;
    }

    // Helper method to set security-related audit
    public void setSecurityAudit(String category, String severity) {
        this.category = category;
        this.severity = severity;
    }
}