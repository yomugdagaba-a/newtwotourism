// frontend/src/services/audit.service.ts

import { 
  AuditLogEntry, 
  AuditLogSearchParams, 
  AuditStatistics, 
  ActivityCount, 
  CleanupResult, 
  RepairResult,
  SuspiciousActivity,
  IntegrityStatus
} from "../types/audit";

const API_BASE_URL = "/api";

// Helper to get auth headers
const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// Helper to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Audit API Error ${response.status}:`, errorText);
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = '/auth/login?error=session_expired';
      }
    }
    
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
};

export class AuditService {
  private static getAuthToken(): string {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    return token;
  }

  // Get all audit logs with pagination
  static async getAllAuditLogs(page: number = 0, size: number = 20) {
    const token = this.getAuthToken();
    console.log('📋 Fetching audit logs, page:', page, 'size:', size);
    
    const response = await fetch(
      `${API_BASE_URL}/audit?skip=${page * size}&take=${size}`,
      { headers: getAuthHeaders(token) }
    );
    
    const data = await handleResponse<{
      logs: AuditLogEntry[];
      total: number;
    }>(response);
    
    // Transform to match expected format
    return {
      content: data.logs || [],
      totalElements: data.total || 0,
      totalPages: Math.ceil((data.total || 0) / size),
      size,
      number: page
    };
  }

  // Search audit logs with multiple criteria
  static async searchAuditLogs(params: AuditLogSearchParams) {
    const token = this.getAuthToken();
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    console.log('🔍 Searching audit logs with params:', queryParams.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/search?${queryParams.toString()}`,
      { headers: getAuthHeaders(token) }
    );
    
    return handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>(response);
  }

  // Get audit logs for a specific user by ID
  static async getAuditLogsByUserId(userId: number, page: number = 0, size: number = 20) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/user/${userId}?page=${page}&size=${size}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>(response);
  }

  // Get audit logs for a specific username
  static async getAuditLogsByUsername(username: string, page: number = 0, size: number = 20) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/username/${username}?page=${page}&size=${size}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>(response);
  }

  // Get audit logs for a specific action
  static async getAuditLogsByAction(action: string, page: number = 0, size: number = 20) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/action/${action}?page=${page}&size=${size}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>(response);
  }

  // Get audit logs for a specific resource type
  static async getAuditLogsByResourceType(resourceType: string, resourceId?: string, page: number = 0, size: number = 20) {
    const token = this.getAuthToken();
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (resourceId) {
      queryParams.append('resourceId', resourceId);
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/audit/resource/${resourceType}?${queryParams.toString()}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>(response);
  }

  // Get recent security-related audit logs
  static async getRecentSecurityLogs(hours: number = 24) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/security?hours=${hours}`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
    }>(response);
    
    // Return just the array for compatibility
    return data.content || [];
  }

  // Get high severity audit logs
  static async getHighSeverityLogs(hours: number = 24) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/high-severity?hours=${hours}`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<{
      content: AuditLogEntry[];
      totalElements: number;
    }>(response);
    
    // Return just the array for compatibility with SecurityAlerts component
    return data.content || [];
  }

  // Get audit log statistics
  static async getAuditStatistics(hours: number = 24): Promise<AuditStatistics> {
    const token = this.getAuthToken();
    console.log('📊 Fetching audit statistics for last', hours, 'hours');
    
    try {
      // Fetch statistics
      const statsResponse = await fetch(
        `${API_BASE_URL}/admin/audit/statistics?hours=${hours}`,
        { headers: getAuthHeaders(token) }
      );
      const stats = await handleResponse<{
        actionStatistics: Record<string, number>;
        resourceTypeStatistics: Record<string, number>;
        mostActiveUsers: Record<string, number>;
      }>(statsResponse);
      
      // Fetch security logs count
      const securityResponse = await fetch(
        `${API_BASE_URL}/admin/audit/security?hours=${hours}`,
        { headers: getAuthHeaders(token) }
      );
      const securityLogs = await handleResponse<AuditLogEntry[]>(securityResponse);
      
      // Fetch high severity logs count
      const highSeverityResponse = await fetch(
        `${API_BASE_URL}/admin/audit/high-severity?hours=${hours}`,
        { headers: getAuthHeaders(token) }
      );
      const highSeverityLogs = await handleResponse<AuditLogEntry[]>(highSeverityResponse);
      
      // Fetch integrity status
      const integrityResponse = await fetch(
        `${API_BASE_URL}/admin/audit/integrity/check`,
        { headers: getAuthHeaders(token) }
      );
      const integrityData = await handleResponse<{
        logsWithoutChecksum: number;
        integrityStatus: string;
      }>(integrityResponse);
      
      // Calculate total audit logs from action statistics
      const totalAuditLogs = Object.values(stats.actionStatistics || {}).reduce((sum, count) => sum + count, 0);
      
      return {
        actionStatistics: stats.actionStatistics || {},
        resourceTypeStatistics: stats.resourceTypeStatistics || {},
        mostActiveUsers: stats.mostActiveUsers || {},
        suspiciousActivities: [],
        totalAuditLogs,
        securityEvents: securityLogs?.length || 0,
        highSeverityEvents: highSeverityLogs?.length || 0,
        integrityStatus: {
          totalLogs: totalAuditLogs,
          logsWithoutChecksum: integrityData.logsWithoutChecksum || 0,
          status: integrityData.integrityStatus || 'UNKNOWN',
          integrityPercentage: totalAuditLogs > 0 
            ? Math.round(((totalAuditLogs - (integrityData.logsWithoutChecksum || 0)) / totalAuditLogs) * 100) 
            : 100
        }
      };
    } catch (error) {
      console.error('Failed to fetch audit statistics:', error);
      // Return empty statistics on error
      return {
        actionStatistics: {},
        resourceTypeStatistics: {},
        mostActiveUsers: {},
        suspiciousActivities: [],
        totalAuditLogs: 0,
        securityEvents: 0,
        highSeverityEvents: 0,
        integrityStatus: {
          totalLogs: 0,
          logsWithoutChecksum: 0,
          status: 'UNKNOWN',
          integrityPercentage: 100
        }
      };
    }
  }

  // Find suspicious IP activity
  static async getSuspiciousActivity(hours: number = 24, userThreshold: number = 3, actionThreshold: number = 50) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/suspicious-activity?hours=${hours}&userThreshold=${userThreshold}&actionThreshold=${actionThreshold}`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<SuspiciousActivity[]>(response);
    
    // Return the array directly
    return Array.isArray(data) ? data : [];
  }

  // Check audit log integrity
  static async checkIntegrity(): Promise<IntegrityStatus> {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/integrity/check`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<{
      logsWithoutChecksum: number;
      integrityStatus: string;
    }>(response);
    
    return {
      totalLogs: 0, // Will be calculated separately if needed
      logsWithoutChecksum: data.logsWithoutChecksum,
      status: data.integrityStatus,
      integrityPercentage: 100 // Will be calculated if totalLogs is known
    };
  }

  // Repair missing checksums in audit logs
  static async repairIntegrity(): Promise<RepairResult> {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/integrity/repair`,
      { 
        method: 'POST',
        headers: getAuthHeaders(token) 
      }
    );
    return handleResponse<RepairResult>(response);
  }

  // Export audit logs for archival
  static async exportAuditLogs(days: number = 30, batchSize: number = 1000) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/export?days=${days}&batchSize=${batchSize}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<AuditLogEntry[]>(response);
  }

  // Cleanup old audit logs
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<CleanupResult> {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/cleanup?daysToKeep=${daysToKeep}`,
      { 
        method: 'DELETE',
        headers: getAuthHeaders(token) 
      }
    );
    return handleResponse<CleanupResult>(response);
  }

  // Get user activity count
  static async getUserActivityCount(userId: number, hours: number = 24) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/activity/user/${userId}?hours=${hours}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<ActivityCount>(response);
  }

  // Get IP address activity count
  static async getIpActivityCount(ipAddress: string, hours: number = 24) {
    const token = this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/audit/activity/ip/${encodeURIComponent(ipAddress)}?hours=${hours}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<ActivityCount>(response);
  }

  // Helper method to format audit log entries for display
  static formatAuditLogForDisplay(entry: AuditLogEntry) {
    // Map backend fields to display format
    const timestamp = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Invalid Date';
    const action = entry.action || 'UNKNOWN';
    const category = this.getCategoryFromAction(action);
    const severity = this.getSeverityFromAction(action);
    
    return {
      ...entry,
      timestamp,
      severity,
      category,
      severityColor: this.getSeverityColor(severity),
      categoryIcon: this.getCategoryIcon(category),
      actionDescription: this.getActionDescription(action, entry.entityType),
      username: entry.user?.username || 'System'
    };
  }

  // Helper to determine category from action
  private static getCategoryFromAction(action: string): string {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
      case 'REGISTER':
        return 'AUTHENTICATION';
      case 'PASSWORD_RESET_REQUEST':
      case 'PASSWORD_RESET_CONFIRM':
      case 'EMAIL_VERIFICATION_SEND':
      case 'EMAIL_VERIFICATION_CONFIRM':
      case 'ACCOUNT_LOCKED':
      case 'ACCOUNT_UNLOCKED':
        return 'SECURITY';
      case 'CREATE':
      case 'UPDATE':
      case 'DELETE':
        return 'DATA_CHANGE';
      default:
        return 'SYSTEM';
    }
  }

  // Helper to determine severity from action
  private static getSeverityFromAction(action: string): string {
    switch (action) {
      case 'DELETE':
      case 'ACCOUNT_LOCKED':
        return 'WARN';
      case 'LOGIN':
      case 'LOGOUT':
        return 'INFO';
      default:
        return 'INFO';
    }
  }

  // Helper method to get severity color for UI
  private static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'INFO': return 'text-blue-600';
      case 'WARN': return 'text-yellow-600';
      case 'ERROR': return 'text-red-600';
      case 'CRITICAL': return 'text-red-800';
      default: return 'text-gray-600';
    }
  }

  // Helper method to get category icon for UI
  private static getCategoryIcon(category: string): string {
    switch (category) {
      case 'AUTHENTICATION': return '🔐';
      case 'AUTHORIZATION': return '🛡️';
      case 'DATA_CHANGE': return '📝';
      case 'SECURITY': return '🚨';
      case 'MAINTENANCE': return '🔧';
      case 'SYSTEM': return '⚙️';
      default: return '📋';
    }
  }

  // Helper method to get human-readable action description
  private static getActionDescription(action: string, entityType?: string): string {
    const resource = entityType ? entityType.toLowerCase() : 'resource';
    
    switch (action) {
      case 'CREATE': return `Created ${resource}`;
      case 'UPDATE': return `Updated ${resource}`;
      case 'DELETE': return `Deleted ${resource}`;
      case 'LOGIN': return 'User logged in';
      case 'LOGOUT': return 'User logged out';
      case 'REGISTER': return 'User registered';
      case 'PASSWORD_RESET_REQUEST': return 'Password reset requested';
      case 'PASSWORD_RESET_CONFIRM': return 'Password reset confirmed';
      case 'EMAIL_VERIFICATION_SEND': return 'Email verification sent';
      case 'EMAIL_VERIFICATION_CONFIRM': return 'Email verified';
      case 'ACCOUNT_LOCKED': return 'Account locked';
      case 'ACCOUNT_UNLOCKED': return 'Account unlocked';
      case 'AUTHORIZATION_CHECK': return 'Permission checked';
      case 'TOKEN_REFRESH': return 'Token refreshed';
      case 'SESSION_EXPIRED': return 'Session expired';
      default: return action.toLowerCase().replace(/_/g, ' ');
    }
  }

  // Helper method to export audit logs as CSV
  static exportToCsv(auditLogs: AuditLogEntry[], filename: string = 'audit-logs.csv') {
    const headers = [
      'ID', 'User ID', 'Username', 'Action', 'Resource Type', 'Resource ID',
      'IP Address', 'Timestamp', 'Severity', 'Category', 'Status', 'Error Message', 'Changes'
    ];

    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => {
        const username = log.username || log.user?.username || '';
        const category = log.category || AuditService.getCategoryFromActionPublic(log.action);
        const severity = log.severity || AuditService.getSeverityFromActionPublic(log.action);
        const timestamp = log.createdAt ? new Date(log.createdAt).toLocaleString() : (log.timestamp || '');
        const changes = log.changes ? `"${log.changes.replace(/"/g, '""')}"` : '';
        const errorMsg = log.errorMessage ? `"${log.errorMessage.replace(/"/g, '""')}"` : '';

        return [
          log.id,
          log.userId || '',
          username,
          log.action,
          log.entityType || '',
          log.entityId || '',
          log.ipAddress || '',
          timestamp,
          severity,
          category,
          log.status || '',
          errorMsg,
          changes,
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Public wrappers for use in exportToCsv
  static getCategoryFromActionPublic(action: string): string {
    return AuditService['getCategoryFromAction'](action);
  }

  static getSeverityFromActionPublic(action: string): string {
    return AuditService['getSeverityFromAction'](action);
  }
}