"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../../services/audit.service';
import { IntegrityStatus, CleanupResult, RepairResult } from '../../../../types/audit';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useRouter } from 'next/navigation';

const AuditManagementPage = () => {
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<string | null>(null);
  
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
    loadIntegrityStatus();
  }, [isAuthenticated, role]);

  const loadIntegrityStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuditService.checkIntegrity();
      setIntegrityStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrity status');
      console.error('Error loading integrity status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairIntegrity = async () => {
    try {
      setOperationInProgress('repair');
      setOperationResult(null);
      
      const result = await AuditService.repairIntegrity();
      setOperationResult(`Integrity repair completed successfully. Repaired ${result.repairedCount} entries.`);
      
      // Reload integrity status
      await loadIntegrityStatus();
    } catch (err) {
      setOperationResult(`Integrity repair failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleCleanupLogs = async () => {
    if (!confirm(`Are you sure you want to delete audit logs older than ${cleanupDays} days? This action cannot be undone.`)) {
      return;
    }

    try {
      setOperationInProgress('cleanup');
      setOperationResult(null);
      
      const result = await AuditService.cleanupOldLogs(cleanupDays);
      setOperationResult(`Cleanup completed successfully. Deleted ${result.deletedCount} old audit log entries.`);
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
      
      // Export as CSV
      AuditService.exportToCsv(logs, `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`);
      
      setOperationResult(`Export completed successfully. Downloaded ${logs.length} audit log entries.`);
    } catch (err) {
      setOperationResult(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(null);
    }
  };

  const isGoodStatus = (status: string) => status === 'GOOD' || status === 'HEALTHY';

  const getIntegrityStatusColor = (status: string) => {
    if (isGoodStatus(status)) return 'text-green-600 bg-green-100';
    switch (status) {
      case 'NEEDS_REPAIR': return 'text-yellow-600 bg-yellow-100';
      case 'COMPROMISED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIntegrityIcon = (status: string) => {
    if (isGoodStatus(status)) return '✅';
    switch (status) {
      case 'NEEDS_REPAIR': return '⚠️';
      case 'COMPROMISED': return '❌';
      default: return '❓';
    }
  };

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <div className="container mx-auto px-4 pt-4 pb-8">
      <div className="mb-8 bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-1 transition-colors font-bold text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold">Back to Dashboard</span>
        </button>
        <h1 className="text-lg font-black text-gray-900 mb-0.5">Audit Management</h1>
        <p className="text-gray-600 text-sm">Manage audit log integrity, cleanup, and export operations</p>
      </div>

      {/* Operation Result */}
      {operationResult && (
        <div className={`mb-6 p-4 rounded-md border-2 ${
          operationResult.includes('failed') ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'
        }`}>
          <p className="font-bold">{operationResult}</p>
          <button
            onClick={() => setOperationResult(null)}
            className="mt-2 text-sm underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading management data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p className="font-bold">Error: {error}</p>
          <button
            onClick={loadIntegrityStatus}
            className="mt-4 bg-blue-100 text-blue-700 border-2 border-blue-300 px-4 py-2 rounded-md hover:bg-blue-200 font-black"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Integrity Status */}
          {integrityStatus && (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-gray-900">Audit Log Integrity</h2>
                <button
                  onClick={loadIntegrityStatus}
                  className="text-blue-700 hover:text-blue-800 text-xs font-bold"
                >
                  Refresh Status
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="text-center p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xl mb-1">{getIntegrityIcon(integrityStatus.status)}</div>
                  <p className="text-xs text-gray-600 font-semibold">Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-black rounded-full ${getIntegrityStatusColor(integrityStatus.status)}`}>
                    {integrityStatus.status}
                  </span>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xl font-black text-gray-900">{integrityStatus.totalLogs}</p>
                  <p className="text-xs text-gray-600 font-semibold">Total Logs</p>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xl font-black text-red-600">{integrityStatus.logsWithoutChecksum}</p>
                  <p className="text-xs text-gray-600 font-semibold">Missing Checksums</p>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xl font-black text-green-600">{integrityStatus.integrityPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600 font-semibold">Integrity</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${integrityStatus.integrityPercentage}%` }}
                  ></div>
                </div>
              </div>

              {!isGoodStatus(integrityStatus.status) && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                  <div className="flex gap-2">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                    <div>
                      <h3 className="text-xs font-black text-yellow-800">Integrity Issues Detected</h3>
                      <p className="text-xs text-yellow-700 font-semibold mt-0.5">
                        {integrityStatus.logsWithoutChecksum} audit log entries are missing checksums.
                        This may indicate data corruption or incomplete logging.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRepairIntegrity}
                disabled={operationInProgress === 'repair'}
                className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-4 py-1.5 rounded text-sm hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
              >
                {operationInProgress === 'repair' ? 'Repairing...' : 'Repair Integrity'}
              </button>
            </div>
          )}

          {/* Data Export */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-black text-gray-900 mb-1">Export Audit Logs</h2>
            <p className="text-xs text-gray-600 font-semibold mb-3">
              Export audit logs for archival, compliance, or analysis purposes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Export logs from last (days)
                </label>
                <input
                  type="number"
                  value={exportDays}
                  onChange={(e) => setExportDays(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Batch size (max records)
                </label>
                <input
                  type="number"
                  value={exportBatchSize}
                  onChange={(e) => setExportBatchSize(Number(e.target.value))}
                  min="100"
                  max="10000"
                  step="100"
                  className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleExportLogs}
              disabled={operationInProgress === 'export'}
              className="bg-green-100 text-green-700 border border-green-300 px-4 py-1.5 rounded text-sm hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
            >
              {operationInProgress === 'export' ? 'Exporting...' : 'Export to CSV'}
            </button>
          </div>

          {/* Data Cleanup */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-black text-gray-900 mb-2">Cleanup Old Logs</h2>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <div className="flex gap-2">
                <span className="text-red-600 text-sm">⚠️</span>
                <div>
                  <h3 className="text-xs font-black text-red-800">Warning: Permanent Data Deletion</h3>
                  <p className="text-xs text-red-700 font-semibold mt-0.5">
                    This operation will permanently delete audit logs older than the specified number of days.
                    This action cannot be undone. Consider exporting logs before cleanup.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Delete logs older than (days)
              </label>
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Number(e.target.value))}
                min="30"
                max="365"
                className="border border-gray-300 rounded px-3 py-1.5 w-full md:w-48 text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 font-semibold mt-1">Minimum: 30 days, Maximum: 365 days</p>
            </div>

            <button
              onClick={handleCleanupLogs}
              disabled={operationInProgress === 'cleanup'}
              className="bg-red-100 text-red-700 border border-red-300 px-4 py-1.5 rounded text-sm hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
            >
              {operationInProgress === 'cleanup' ? 'Cleaning up...' : 'Delete Old Logs'}
            </button>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-black text-gray-900 mb-3">System Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 mb-1">Audit Logging Status</h3>
                <p className="text-xs text-gray-700 font-semibold">Enabled and operational</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 mb-1">Automatic Cleanup</h3>
                <p className="text-xs text-gray-700 font-semibold">Scheduled daily at 2:00 AM</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 mb-1">Integrity Checks</h3>
                <p className="text-xs text-gray-700 font-semibold">Weekly on Sundays</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 mb-1">Monthly Reports</h3>
                <p className="text-xs text-gray-700 font-semibold">Generated on 1st of each month</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AuditManagementPage;