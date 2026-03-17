package com.northwollo.tourism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditStatisticsResponse {
    private Map<String, Long> actionStatistics;
    private Map<String, Long> resourceTypeStatistics;
    private Map<String, Long> mostActiveUsers;
    private List<SuspiciousActivityResponse> suspiciousActivities;
    private long totalAuditLogs;
    private long securityEvents;
    private long highSeverityEvents;
    private IntegrityStatusResponse integrityStatus;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuspiciousActivityResponse {
        private String ipAddress;
        private long userCount;
        private long actionCount;
        private String riskLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntegrityStatusResponse {
        private long totalLogs;
        private long logsWithoutChecksum;
        private String status;
        private double integrityPercentage;
    }
}