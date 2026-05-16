"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../../services/audit.service';
import { IntegrityStatus, AuditLogEntry } from '../../../../types/audit';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';

const AuditManagementPage = () => {
  const confirm = useConfirm();
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus | null>(null);
  const [securityLogs, setSecurityLogs] = useState<AuditLogEntry[]>([]);
  const [highSeverityLogs, setHighSeverityLogs] = useState<AuditLogEntry[]>([]);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<string | null>(null);
  const [activeSecurityTab, setActiveSecurityTab] = useState<'security' | 'high-severity'>('security');
  const [timeRange, setTimeRange] = useState(24);
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Form states
  const [cleanupDays, setCleanupDays] = useState(90);
  const [exportDays, setExportDays] = useState(30);
  const [exportBatchSize, setExportBatchSize] = useState(1000);

  const { role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadAllData();
  }, [isAuthenticated, role, timeRange]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [integrityResponse, securityResponse, highSeverityResponse, statsResponse, suspiciousResponse] = await Promise.all([
        AuditService.checkIntegrity(),
        AuditService.getRecentSecurityLogs(timeRange),
        AuditService.getHighSeverityLogs(timeRange),
        AuditService.getAuditStatistics(timeRange),
        AuditService.getSuspiciousActivity(timeRange)
      ]);
      
      setIntegrityStatus(integrityResponse);
      setSecurityLogs(securityResponse || []);
      setHighSeverityLogs(highSeverityResponse || []);
      setStatistics(statsResponse || null);
      setSuspiciousActivities(suspiciousResponse || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairIntegrity = async () => {
    try {
      setOperationInProgress('repair');
      setOperationResult(null);
      
      const result = await AuditService.repairIntegrity();
      setOperationResult(`Integrity repair completed. Repaired ${result.repairedCount} entries.`);
      
      await loadAllData();
    } catch (err) {
      setOperationResult(`Repair failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleCleanupLogs = async () => {
    const ok = await confirm({
      message: `Delete audit logs older than ${cleanupDays} days? This cannot be undone.`,
      variant: 'danger',
      title: 'Delete Old Logs',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      setOperationInProgress('cleanup');
      setOperationResult(null);
      
      const result = await AuditService.cleanupOldLogs(cleanupDays);
      setOperationResult(`Deleted ${result.deletedCount} old log entries.`);
    } catch (err) {
      setOperationResult(`Cleanup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleExportLogs = async () => {
    try {
      setOperationInProgress('export');
      setOperationResult(null);
      
      const logs = await AuditService.exportAuditLogs(exportDays, exportBatchSize);
      AuditService.exportToCsv(logs, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      
      setOperationResult(`Exported ${logs.length} log entries.`);
    } catch (err) {
      setOperationResult(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'WARN': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-200 text-red-900 font-bold';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION': return '🔐';
      case 'AUTHORIZATION': return '🛡️';
      case 'SECURITY': return '🚨';
      default: return '⚠️';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔒';
      case 'ACCOUNT_LOCKED': return '🔐';
      case 'ACCOUNT_UNLOCKED': return '🔓';
      case 'PASSWORD_RESET_REQUEST': return '🔑';
      case 'PASSWORD_RESET_CONFIRM': return '✅';
      case 'EMAIL_VERIFICATION_SEND': return '📧';
      case 'EMAIL_VERIFICATION_CONFIRM': return '✅';
      case 'SESSION_EXPIRED': return '⏱️';
      case 'AUTHORIZATION_CHECK': return '🚨';
      default: return '⚠️';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'SESSION_EXPIRED': return { label: 'Session Expired', note: 'Normal — JWT token expired (15 min lifetime)', color: 'text-gray-500' };
      case 'ACCOUNT_LOCKED': return { label: 'Account Locked', note: 'Account locked after repeated failed logins', color: 'text-red-600' };
      case 'AUTHORIZATION_CHECK': return { label: 'Authorization Check', note: 'Tampered token or privilege escalation attempt', color: 'text-red-600' };
      case 'LOGOUT': return { label: 'Logout', note: 'User logged out', color: 'text-gray-500' };
      case 'PASSWORD_RESET_REQUEST': return { label: 'Password Reset', note: 'Password reset requested', color: 'text-yellow-600' };
      default: return { label: action.replace(/_/g, ' '), note: '', color: 'text-gray-700' };
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

  const currentSecurityLogs = activeSecurityTab === 'security' ? securityLogs : highSeverityLogs;
  
  // Pagination logic
  const totalPages = Math.ceil(currentSecurityLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = currentSecurityLogs.slice(startIndex, endIndex);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSecurityTab]);

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Audit Dashboard & Management" 
        showAdminMenu={true}
        actionButtons={
          <div className="flex items-center gap-2 flex-1 justify-end">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              style={{ fontSize: '15px', padding: '2px 4px' }}
              className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer border-0 hover:text-black transition-colors"
            >
              <option value={1}>Last 1h</option>
              <option value={24}>Last 24h</option>
              <option value={168}>Last Week</option>
              <option value={720}>Last Month</option>
            </select>
            <button onClick={loadAllData} className="text-gray-700 hover:text-black font-black text-xl transition-colors">
              ↻
            </button>
          </div>
        }
      />
      <div className="container mx-auto px-4 pt-4 pb-8">

      {/* Operation Result */}
      {operationResult && (
        <div className={`mb-4 p-3 rounded-lg border ${
          operationResult.includes('failed') ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'
        }`}>
          <p className="text-sm font-bold">{operationResult}</p>
          <button onClick={() => setOperationResult(null)} className="mt-1 text-xs underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p className="font-bold">Error: {error}</p>
          <button onClick={loadAllData} className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-bold">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Dashboard Statistics & Security Events - Consolidated */}
          {statistics && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Header with title and action button */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Security Overview</h2>
                {currentSecurityLogs.length > 0 && (
                  <button 
                    onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                    className="text-blue-600 hover:text-blue-700 font-black text-base transition-colors"
                  >
                    {showDetailedLogs ? 'Hide Details' : 'View Detailed Logs'}
                  </button>
                )}
              </div>
              
              {/* Stats and Tabs in compact layout */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Stats in one row */}
                <div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs">Total:</span>
                    <span className="text-base font-bold text-blue-600">{statistics.totalAuditLogs}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs">Security:</span>
                    <span className="text-base font-bold text-yellow-600">{statistics.securityEvents}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs">High Severity:</span>
                    <span className="text-base font-bold text-red-600">{statistics.highSeverityEvents}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs">Suspicious IPs:</span>
                    <span className="text-base font-bold text-orange-600">{suspiciousActivities.length}</span>
                  </div>
                </div>
                
                {/* Tabs on the same row - only show if there are events */}
                {currentSecurityLogs.length > 0 && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveSecurityTab('security')}
                      className={`px-3 py-1 text-sm font-black rounded-lg transition-colors ${
                        activeSecurityTab === 'security' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      Security ({securityLogs.length})
                    </button>
                    <button
                      onClick={() => setActiveSecurityTab('high-severity')}
                      className={`px-3 py-1 text-sm font-black rounded-lg transition-colors ${
                        activeSecurityTab === 'high-severity' 
                          ? 'bg-red-100 text-red-700 border border-red-300' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      High Severity ({highSeverityLogs.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Events message - compact */}
              {currentSecurityLogs.length === 0 && (
                <p className="text-gray-600 text-xs mt-3">No events found in selected time range</p>
              )}
            </div>
          )}

          {/* Detailed Security Events List */}
          {showDetailedLogs && currentSecurityLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Pagination Info */}
              <div className="px-3 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
                <div className="text-xs text-gray-700 font-bold">
                  Showing <span className="font-black text-gray-900">{startIndex + 1}</span>–<span className="font-black text-gray-900">{Math.min(endIndex, currentSecurityLogs.length)}</span> of <span className="font-black text-gray-900">{currentSecurityLogs.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-700">Per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs font-bold"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Events */}
              <div className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => {
                  const actionInfo = getActionLabel(log.action ?? '');
                  const isNormal = log.action === 'SESSION_EXPIRED' || log.action === 'LOGOUT';
                  return (
                  <div key={log.id} className={`p-3 hover:bg-gray-50 ${isNormal ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-lg shrink-0">{getActionIcon(log.action ?? '')}</span>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1 mb-1">
                            <h3 className={`text-sm font-black ${actionInfo.color}`}>
                              {actionInfo.label}
                            </h3>
                            {isNormal ? (
                              <span className="inline-flex px-1.5 py-0.5 text-xs font-black rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                                NORMAL
                              </span>
                            ) : (
                              <span className={`inline-flex px-1.5 py-0.5 text-xs font-black rounded-full border ${getSeverityBadgeClass(log.severity ?? '')}`}>
                                {log.severity}
                              </span>
                            )}
                          </div>
                          {actionInfo.note && (
                            <p className="text-xs text-gray-500 font-medium mb-1 italic">{actionInfo.note}</p>
                          )}
                          <p className="text-xs text-gray-700 font-bold mb-1">
                            {log.description || `${log.action} event`}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 font-semibold">
                            <span>{getCategoryIcon(log.category ?? '')} {log.category}</span>
                            {(log.username || log.user?.username) && (
                              <span>👤 {log.username || log.user?.username}</span>
                            )}
                            <span>🌐 {log.ipAddress}</span>
                            {log.entityType && (
                              <span>📋 {log.entityType}{log.entityId ? `:${log.entityId}` : ''}</span>
                            )}
                          </div>
                          {log.changes && (
                            <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-300">
                              <details>
                                <summary className="cursor-pointer text-xs font-black text-gray-700">Event Details</summary>
                                <pre className="mt-1 text-xs text-gray-700 whitespace-pre-wrap font-semibold overflow-x-auto">
                                  {log.changes}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-600 font-bold whitespace-nowrap">{formatTimestamp(log.createdAt ?? '')}</p>
                        <p className="text-xs text-gray-400 hidden sm:block">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-3 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded font-bold text-xs hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-1 rounded font-bold text-xs transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded font-bold text-xs hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Integrity Status - Responsive wrap layout */}
          {integrityStatus && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base font-bold text-gray-900 mb-2">Audit Log Integrity</h2>
              <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-xs">Total:</span>
                  <span className="font-bold">{integrityStatus.totalLogs}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-xs">Missing Checksums:</span>
                  <span className="font-bold text-red-600">{integrityStatus.logsWithoutChecksum}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-xs">Status:</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    integrityStatus.status === 'GOOD' || integrityStatus.status === 'HEALTHY'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {integrityStatus.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-xs">Integrity:</span>
                  <span className="font-bold text-green-600">{integrityStatus.integrityPercentage.toFixed(1)}%</span>
                </div>
                <button
                  disabled
                  className="text-gray-400 px-3 py-1 rounded-lg cursor-not-allowed font-black text-base border border-gray-200"
                >
                  Repair Integrity
                </button>
              </div>
            </div>
          )}

          {/* Export & Cleanup - Smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
            
            {/* Export */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Export Logs</h2>
              <p className="text-xs text-gray-600 mb-2">Export for archival or analysis</p>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Days</label>
                  <input
                    type="number"
                    value={exportDays}
                    onChange={(e) => setExportDays(Number(e.target.value))}
                    min="1"
                    max="365"
                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Records</label>
                  <input
                    type="number"
                    value={exportBatchSize}
                    onChange={(e) => setExportBatchSize(Number(e.target.value))}
                    min="100"
                    max="10000"
                    step="100"
                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleExportLogs}
                disabled={operationInProgress === 'export'}
                className="text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 disabled:opacity-50 font-black text-base transition-colors"
              >
                {operationInProgress === 'export' ? 'Exporting...' : 'Export to CSV'}
              </button>
            </div>

            {/* Cleanup */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Cleanup Old Logs</h2>
              <p className="text-xs text-red-600 mb-2">⚠️ Permanent deletion. Cannot be undone.</p>

              <div className="mb-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Delete older than (days)</label>
                <input
                  type="number"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(Number(e.target.value))}
                  min="30"
                  max="365"
                  className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Min: 30, Max: 365</p>
              </div>

              <button
                onClick={handleCleanupLogs}
                disabled={operationInProgress === 'cleanup'}
                className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 font-black text-base transition-colors"
              >
                {operationInProgress === 'cleanup' ? 'Cleaning...' : 'Delete Old Logs'}
              </button>
            </div>
          </div>

          {/* Dashboard Analytics - Top Actions & Resource Activity */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Top Actions</h3>
                <div className="space-y-1">
                  {statistics.actionStatistics && Object.entries(statistics.actionStatistics)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">{action}</span>
                        <span className="font-bold">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Resource Activity</h3>
                <div className="space-y-1">
                  {statistics.resourceTypeStatistics && Object.entries(statistics.resourceTypeStatistics)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([resource, count]) => (
                      <div key={resource} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">{resource}</span>
                        <span className="font-bold">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Most Active Users */}
          {statistics && statistics.mostActiveUsers && (() => {
            const raw = statistics.mostActiveUsers as any;
            const entries: [string, number][] = Array.isArray(raw)
              ? raw.map((item: any) => [
                  String(item.username || item.userId || 'Unknown'),
                  Number(item.activityCount ?? item.count ?? 0)
                ])
              : Object.entries(raw).map(([k, v]) => [k, Number(v)]);
            return entries.length > 0 ? (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Most Active Users</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {entries
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 12)
                    .map(([username, count]) => (
                      <div key={username} className="flex justify-between items-center px-2 py-1 bg-gray-50 rounded text-xs border border-gray-200">
                        <span className="font-bold truncate">{username}</span>
                        <span className="text-gray-600 ml-2">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Suspicious Activities */}
          {suspiciousActivities.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Suspicious IP Activity
                <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                  {suspiciousActivities.length}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                IPs with unusually high request counts. Review and take action if needed.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">IP Address</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Users</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Risk</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Investigate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {suspiciousActivities.map((activity, index) => (
                      <tr key={index} className="hover:bg-orange-50">
                        <td className="px-3 py-2 font-bold text-gray-900 font-mono">{activity.ipAddress}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {activity.userCount} user{activity.userCount !== 1 ? 's' : ''}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900">{activity.actionCount}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${
                            activity.riskLevel === 'HIGH'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-orange-100 text-orange-800 border-orange-300'
                          }`}>
                            {activity.riskLevel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <a
                            href={`/admin/audit?ipAddress=${activity.ipAddress}`}
                            className="font-bold text-blue-600 hover:text-blue-800 underline"
                          >
                            View logs →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
      </div>
    </div>
  );
};

export default AuditManagementPage;
