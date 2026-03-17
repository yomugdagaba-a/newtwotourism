// frontend/src/types/audit.ts

export interface AuditLogEntry {
  id: number;
  userId?: number;
  username?: string;
  user?: { id: number; username: string; email?: string };
  action: string;
  entityType: string;
  entityId?: number;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  status?: string;
  errorMessage?: string;
  // Computed fields for display
  timestamp?: string;
  severity?: string;
  category?: string;
  description?: string;
  integrityVerified?: boolean;
}

export interface AuditLogSearchParams {
  userId?: number;
  username?: string;
  action?: string;
  resourceType?: string;
  category?: string;
  severity?: string;
  ipAddress?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

export interface AuditStatistics {
  actionStatistics: Record<string, number>;
  resourceTypeStatistics: Record<string, number>;
  mostActiveUsers: Record<string, number>;
  suspiciousActivities: SuspiciousActivity[];
  totalAuditLogs: number;
  securityEvents: number;
  highSeverityEvents: number;
  integrityStatus: IntegrityStatus;
}

export interface SuspiciousActivity {
  ipAddress: string;
  userCount: number;
  actionCount: number;
  riskLevel: string;
}

export interface IntegrityStatus {
  totalLogs: number;
  logsWithoutChecksum: number;
  status: string;
  integrityPercentage: number;
}

export interface ActivityCount {
  userId?: number;
  ipAddress?: string;
  activityCount: number;
  timeRange: string;
}

export interface CleanupResult {
  deletedCount: number;
  cutoffTime: string;
  status: string;
}

export interface RepairResult {
  repairedCount: number;
  status: string;
}

// Constants for audit logging
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_CONFIRM: 'PASSWORD_RESET_CONFIRM',
  EMAIL_VERIFICATION_SEND: 'EMAIL_VERIFICATION_SEND',
  EMAIL_VERIFICATION_CONFIRM: 'EMAIL_VERIFICATION_CONFIRM',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  AUTHORIZATION_CHECK: 'AUTHORIZATION_CHECK',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const;

export const AUDIT_RESOURCE_TYPES = {
  USER: 'USER',
  HOTEL: 'HOTEL',
  TOURISM: 'TOURISM',
  BOOKING: 'BOOKING',
  GUIDER: 'GUIDER',
  MAP_POINT: 'MAP_POINT',
  PERMISSION: 'PERMISSION',
  ROLE: 'ROLE',
  SESSION: 'SESSION',
  TOKEN: 'TOKEN'
} as const;

export const AUDIT_CATEGORIES = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  DATA_CHANGE: 'DATA_CHANGE',
  SECURITY: 'SECURITY',
  MAINTENANCE: 'MAINTENANCE',
  SYSTEM: 'SYSTEM'
} as const;

export const AUDIT_SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
} as const;

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;
export type AuditResourceType = keyof typeof AUDIT_RESOURCE_TYPES;
export type AuditCategory = keyof typeof AUDIT_CATEGORIES;
export type AuditSeverity = keyof typeof AUDIT_SEVERITY_LEVELS;
export type RiskLevel = keyof typeof RISK_LEVELS;