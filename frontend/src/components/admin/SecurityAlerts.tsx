"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../services/audit.service';
import { AuditLogEntry, SuspiciousActivity } from '../../types/audit';

interface SecurityAlertsProps {
  timeRange?: number; // hours
  maxAlerts?: number;
  showSuspiciousActivity?: boolean;
}

const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  timeRange = 24,
  maxAlerts = 5,
  showSuspiciousActivity = true
}) => {
  const [highSeverityLogs, setHighSeverityLogs] = useState<AuditLogEntry[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises: Promise<any[]>[] = [
        AuditService.getHighSeverityLogs(timeRange)
      ];

      if (showSuspiciousActivity) {
        promises.push(AuditService.getSuspiciousActivity(timeRange, 3, 50));
      }

      const results = await Promise.all(promises);
      
      // results[0] is already an array of AuditLogEntry
      const highSeverityData = Array.isArray(results[0]) ? results[0] : [];
      setHighSeverityLogs(highSeverityData.slice(0, maxAlerts));
      
      if (showSuspiciousActivity && results[1]) {
        // results[1] is already an array of SuspiciousActivity
        const suspiciousData = Array.isArray(results[1]) ? results[1] : [];
        setSuspiciousActivities(suspiciousData.slice(0, maxAlerts));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
      console.error('Error loading security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-800 bg-red-100 border-red-200';
      case 'ERROR': return 'text-red-700 bg-red-50 border-red-200';
      case 'WARN': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-800 bg-red-100';
      case 'HIGH': return 'text-orange-800 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-800 bg-yellow-100';
      case 'LOW': return 'text-green-800 bg-green-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Alerts</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-md p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Alerts</h3>
        <div className="text-red-600 text-sm">
          <p>Error: {error}</p>
          <button
            onClick={loadSecurityData}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAlerts = highSeverityLogs.length > 0 || suspiciousActivities.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-gray-900">Security Alerts</h3>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            hasAlerts ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {hasAlerts ? `${highSeverityLogs.length + suspiciousActivities.length} alerts` : 'All clear'}
          </span>
          <button
            onClick={loadSecurityData}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {!hasAlerts ? (
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm">No security alerts in the last {timeRange} hours</p>
          <p className="text-xs text-gray-500 mt-1">System is operating normally</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* High Severity Events */}
          {highSeverityLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">High Severity Events</h4>
              <div className="space-y-2">
                {highSeverityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border rounded-md p-3 ${getSeverityColor(log.severity ?? '')}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50">
                            {log.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-2">
                          {log.description || `${log.action} event`}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          {(log.username || log.user?.username) && <span>User: {log.username || log.user?.username}</span>}
                          <span>IP: {log.ipAddress}</span>
                          <span>{formatTimestamp(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious Activities */}
          {showSuspiciousActivity && suspiciousActivities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Suspicious Activities</h4>
              <div className="space-y-2">
                {suspiciousActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="border border-orange-200 rounded-md p-3 bg-orange-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm text-orange-900">
                            Suspicious IP Activity
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(activity.riskLevel)}`}>
                            {activity.riskLevel}
                          </span>
                        </div>
                        <p className="text-sm text-orange-800 mb-2">
                          IP {activity.ipAddress} accessed {activity.userCount} different user accounts 
                          with {activity.actionCount} total actions
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-orange-700">
                          <span>{activity.ipAddress}</span>
                          <span>{activity.userCount} users</span>
                          <span>{activity.actionCount} actions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex space-x-4 text-sm">
              <a
                href="/admin/audit/management"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View all security events →
              </a>
              <a
                href="/admin/audit/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Security dashboard →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAlerts;