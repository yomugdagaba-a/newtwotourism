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

  const getIntegrityStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return 'text-green-600 bg-green-100';
      case 'NEEDS_REPAIR': return 'text-yellow-600 bg-yellow-100';
      case 'COMPROMISED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIntegrityIcon = (status: string) => {
    switch (status) {
      case 'GOOD': return '✅';
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
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Audit Management</h1>
        <p className="text-gray-700 font-semibold">Manage audit log integrity, cleanup, and export operations</p>
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
        <div className="space-y-8">
          {/* Integrity Status */}
          {integrityStatus && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900">Audit Log Integrity</h2>
                <button
                  onClick={loadIntegrityStatus}
                  className="text-blue-700 hover:text-blue-800 text-sm font-bold"
                >
                  Refresh Status
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="text-3xl mb-2">{getIntegrityIcon(integrityStatus.status)}</div>
                  <p className="text-sm text-gray-700 font-semibold">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-black rounded-full border-2 ${getIntegrityStatusColor(integrityStatus.status)}`}>
                    {integrityStatus.status}
                  </span>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <p className="text-2xl font-black text-gray-900">{integrityStatus.totalLogs}</p>
                  <p className="text-sm text-gray-700 font-semibold">Total Logs</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <p className="text-2xl font-black text-red-600">{integrityStatus.logsWithoutChecksum}</p>
                  <p className="text-sm text-gray-700 font-semibold">Missing Checksums</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <p className="text-2xl font-black text-green-600">{integrityStatus.integrityPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-700 font-semibold">Integrity</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${integrityStatus.integrityPercentage}%` }}
                  ></div>
                </div>
              </div>

              {integrityStatus.status !== 'GOOD' && (
                <div className="bg-yellow-100 border-2 border-yellow-300 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-black text-yellow-800">
                        Integrity Issues Detected
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 font-semibold">
                        <p>
                          {integrityStatus.logsWithoutChecksum} audit log entries are missing checksums.
                          This may indicate data corruption or incomplete logging.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRepairIntegrity}
                disabled={operationInProgress === 'repair'}
                className="bg-yellow-100 text-yellow-700 border-2 border-yellow-300 px-6 py-2 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
              >
                {operationInProgress === 'repair' ? 'Repairing...' : 'Repair Integrity'}
              </button>
            </div>
          )}

          {/* Data Export */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
            <h2 className="text-xl font-black text-gray-900 mb-6">Export Audit Logs</h2>
            <p className="text-gray-700 font-semibold mb-6">
              Export audit logs for archival, compliance, or analysis purposes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Export logs from last (days)
                </label>
                <input
                  type="number"
                  value={exportDays}
                  onChange={(e) => setExportDays(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="border-2 border-gray-400 rounded-md px-3 py-2 w-full font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Batch size (max records)
                </label>
                <input
                  type="number"
                  value={exportBatchSize}
                  onChange={(e) => setExportBatchSize(Number(e.target.value))}
                  min="100"
                  max="10000"
                  step="100"
                  className="border-2 border-gray-400 rounded-md px-3 py-2 w-full font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleExportLogs}
              disabled={operationInProgress === 'export'}
              className="bg-green-100 text-green-700 border-2 border-green-300 px-6 py-2 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
            >
              {operationInProgress === 'export' ? 'Exporting...' : 'Export to CSV'}
            </button>
          </div>

          {/* Data Cleanup */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
            <h2 className="text-xl font-black text-gray-900 mb-6">Cleanup Old Logs</h2>
            <div className="bg-red-100 border-2 border-red-300 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-600">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-black text-red-800">
                    Warning: Permanent Data Deletion
                  </h3>
                  <div className="mt-2 text-sm text-red-700 font-semibold">
                    <p>
                      This operation will permanently delete audit logs older than the specified number of days.
                      This action cannot be undone. Consider exporting logs before cleanup.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Delete logs older than (days)
              </label>
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Number(e.target.value))}
                min="30"
                max="365"
                className="border-2 border-gray-400 rounded-md px-3 py-2 w-full md:w-64 font-semibold"
              />
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Minimum: 30 days, Maximum: 365 days
              </p>
            </div>

            <button
              onClick={handleCleanupLogs}
              disabled={operationInProgress === 'cleanup'}
              className="bg-red-100 text-red-700 border-2 border-red-300 px-6 py-2 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-black"
            >
              {operationInProgress === 'cleanup' ? 'Cleaning up...' : 'Delete Old Logs'}
            </button>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
            <h2 className="text-xl font-black text-gray-900 mb-6">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Audit Logging Status</h3>
                <p className="text-sm text-gray-700 font-semibold">✅ Enabled and operational</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Automatic Cleanup</h3>
                <p className="text-sm text-gray-700 font-semibold">🔄 Scheduled daily at 2:00 AM</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Integrity Checks</h3>
                <p className="text-sm text-gray-700 font-semibold">🔍 Weekly verification on Sundays</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Monthly Reports</h3>
                <p className="text-sm text-gray-700 font-semibold">📊 Generated on 1st of each month</p>
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