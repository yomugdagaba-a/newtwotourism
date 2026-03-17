"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../services/audit.service';
import { AuditLogEntry, AuditLogSearchParams } from '../../types/audit';

interface AuditLogViewerProps {
  userId?: number;
  username?: string;
  resourceType?: string;
  resourceId?: string;
  maxEntries?: number;
  showSearch?: boolean;
  compact?: boolean;
  title?: string;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  userId,
  username,
  resourceType,
  resourceId,
  maxEntries = 10,
  showSearch = false,
  compact = false,
  title = "Recent Activity"
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<AuditLogSearchParams>({
    userId,
    username,
    resourceType,
    resourceId,
    size: maxEntries
  });

  useEffect(() => {
    loadAuditLogs();
  }, [userId, username, resourceType, resourceId, maxEntries]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (userId) {
        response = await AuditService.getAuditLogsByUserId(userId, 0, maxEntries);
      } else if (username) {
        response = await AuditService.getAuditLogsByUsername(username, 0, maxEntries);
      } else if (resourceType) {
        response = await AuditService.getAuditLogsByResourceType(resourceType, resourceId, 0, maxEntries);
      } else {
        response = await AuditService.searchAuditLogs({
          ...searchParams,
          page: 0,
          size: maxEntries
        });
      }

      setAuditLogs(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAuditLogs();
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'WARN': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION': return '🔐';
      case 'AUTHORIZATION': return '🛡️';
      case 'DATA_CHANGE': return '📝';
      case 'SECURITY': return '🚨';
      case 'MAINTENANCE': return '🔧';
      case 'SYSTEM': return '⚙️';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-red-600 text-sm">
          <p>Error: {error}</p>
          <button
            onClick={loadAuditLogs}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={loadAuditLogs}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {showSearch && (
        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchParams.username || ''}
              onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Action"
              value={searchParams.action || ''}
              onChange={(e) => setSearchParams({ ...searchParams, action: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className={`${compact ? 'py-2' : 'py-3'} border-b border-gray-100 last:border-b-0`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getCategoryIcon(log.category)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBadgeClass(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>
                    {log.description || `${log.action} event`}
                  </p>
                  <div className={`flex flex-wrap items-center space-x-3 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    {log.username && (
                      <span>👤 {log.username}</span>
                    )}
                    <span>🌐 {log.ipAddress}</span>
                    {log.resourceType && (
                      <span>📋 {log.resourceType}{log.resourceId ? `:${log.resourceId}` : ''}</span>
                    )}
                    <span>🕒 {formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {auditLogs.length >= maxEntries && (
        <div className="mt-4 text-center">
          <a
            href="/admin/audit"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all audit logs →
          </a>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;