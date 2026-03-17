// frontend/src/services/security.service.ts - Admin Security Service

import { API_BASE_URL } from "./api";

// ========================
// Helper Functions
// ========================
const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
};

// ========================
// Types
// ========================
export interface LoginAttempt {
  id: number;
  identifier: string;
  ipAddress: string;
  successful: boolean;
  failureReason?: string;
  attemptTime: string;
  userAgent?: string;
}

export interface AccountLockout {
  id: number;
  userId: number;
  reason: string;
  lockedAt: string;
  unlockAt: string;
  triggerIpAddress: string;
  lockoutCount: number;
  active: boolean;
}

export interface LockoutStatus {
  lockedOut: boolean;
  lockout?: {
    reason: string;
    lockedAt: string;
    unlockAt: string;
    remainingMinutes: number;
    triggerIpAddress: string;
  };
}

export interface BlockStatus {
  identifierBlocked: boolean;
  ipBlocked: boolean;
  progressiveDelay: number;
  suspiciousActivity: boolean;
}

// ========================
// ADMIN SECURITY SERVICE
// ========================
export class AdminSecurityService {
  // Get recent login attempts for a user identifier
  static async getRecentLoginAttempts(token: string, identifier: string, hours: number = 24): Promise<LoginAttempt[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/login-attempts?identifier=${encodeURIComponent(identifier)}&hours=${hours}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<LoginAttempt[]>(response);
  }

  // Get lockout history for a user
  static async getUserLockoutHistory(token: string, userId: number): Promise<AccountLockout[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/lockouts/${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<AccountLockout[]>(response);
  }

  // Check if a user is currently locked out
  static async getLockoutStatus(token: string, userId: number): Promise<LockoutStatus> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/lockout-status/${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<LockoutStatus>(response);
  }

  // Manually unlock a user account
  static async unlockUserAccount(token: string, userId: number): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/unlock/${userId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<{ message: string }>(response);
  }

  // Manually lock a user account
  static async lockUserAccount(
    token: string, 
    userId: number, 
    reason: string, 
    durationMinutes: number = 60
  ): Promise<{ message: string; lockout: AccountLockout }> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/lock/${userId}?reason=${encodeURIComponent(reason)}&durationMinutes=${durationMinutes}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<{ message: string; lockout: AccountLockout }>(response);
  }

  // Check if an identifier should be blocked
  static async checkBlockStatus(token: string, identifier: string, ipAddress: string): Promise<BlockStatus> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/check-block-status?identifier=${encodeURIComponent(identifier)}&ipAddress=${encodeURIComponent(ipAddress)}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<BlockStatus>(response);
  }

  // Clean up old security records
  static async cleanupOldRecords(token: string, retentionDays: number = 90): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/admin/security/cleanup?retentionDays=${retentionDays}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<{ message: string }>(response);
  }

  // Send security alert to a user
  static async sendSecurityAlert(
    token: string, 
    userId: number, 
    alertType: string, 
    ipAddress?: string
  ): Promise<{ message: string }> {
    let url = `${API_BASE_URL}/admin/security/send-alert/${userId}?alertType=${encodeURIComponent(alertType)}`;
    if (ipAddress) {
      url += `&ipAddress=${encodeURIComponent(ipAddress)}`;
    }
    const response = await fetch(url, { method: "POST", headers: getAuthHeaders(token) });
    return handleResponse<{ message: string }>(response);
  }
}
