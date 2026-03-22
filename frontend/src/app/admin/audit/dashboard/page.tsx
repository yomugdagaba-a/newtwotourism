"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../../services/audit.service';
import { AuditStatistics, SuspiciousActivity, IntegrityStatus } from '../../../../types/audit';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useRouter } from 'next/navigation';

const AuditDashboardPage = () => {
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [repairingIntegrity, setRepairingIntegrity] = useState(false);

  const { role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, role, timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, suspiciousResponse, integrityResponse] = await Promise.all([
        AuditService.getAuditStatistics(timeRange),
        AuditService.getSuspiciousActivity(timeRange),
        AuditService.checkIntegrity()
      ]);

      setStatistics(statsResponse || null);
      setSuspiciousActivities(suspiciousResponse || []);
      setIntegrityStatus(integrityResponse || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairIntegrity = async () => {
    try {
      setRepairingIntegrity(true);
      const result = await AuditService.repairIntegrity();
      alert(`Integrity repair completed. Repaired ${result.repairedCount} entries.`);
      // Reload integrity status
      const integrityResponse = await AuditService.checkIntegrity();
      setIntegrityStatus(integrityResponse);
    } catch (err) {
      alert('Failed to repair integrity: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRepairingIntegrity(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white container mx-auto px-4 pt-4 pb-8 admin-page">
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
        <h1 className="text-lg font-black text-gray-900 mb-0.5">Audit Dashboard</h1>
        <p className="text-gray-600 text-sm">System activity overview and security monitoring</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <label className="block text-sm font-black text-gray-800 mb-2">Time Range</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="border-2 border-gray-400 rounded-lg px-3 py-2 font-bold"
        >
          <option value={1}>Last Hour</option>
          <option value={24}>Last 24 Hours</option>
          <option value={168}>Last Week</option>
          <option value={720}>Last Month</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-bold">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 font-bold">
          <p>Error: {error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-black border-2 border-blue-300"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Total Events</h3>
                <p className="text-2xl font-black text-blue-600">{statistics.totalAuditLogs}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Security Events</h3>
                <p className="text-2xl font-black text-yellow-600">{statistics.securityEvents}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1">High Severity</h3>
                <p className="text-2xl font-black text-red-600">{statistics.highSeverityEvents}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Suspicious IPs</h3>
                <p className="text-2xl font-black text-orange-600">{suspiciousActivities.length}</p>
              </div>
            </div>
          )}

          {/* Integrity Status */}
          {integrityStatus && (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-gray-900">Audit Log Integrity</h3>
                {integrityStatus.status !== 'GOOD' && (
                  <button
                    onClick={handleRepairIntegrity}
                    disabled={repairingIntegrity}
                    className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 disabled:opacity-50 font-black border border-yellow-400 text-sm"
                  >
                    {repairingIntegrity ? 'Repairing...' : 'Repair Integrity'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-bold">Total Logs</p>
                  <p className="text-xl font-black">{integrityStatus.totalLogs}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">Missing Checksums</p>
                  <p className="text-xl font-black text-red-600">{integrityStatus.logsWithoutChecksum}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">Integrity Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-black rounded-full border ${getIntegrityStatusColor(integrityStatus.status)}`}>
                    {integrityStatus.status}
                  </span>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-1.5">
                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${integrityStatus.integrityPercentage}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 font-bold mt-1">{integrityStatus.integrityPercentage.toFixed(1)}% integrity</p>
            </div>
          )}

          {/* Action Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-sm font-black text-gray-900 mb-2">Top Actions</h3>
                <div className="space-y-1.5">
                  {statistics.actionStatistics && Object.entries(statistics.actionStatistics)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-bold">{action}</span>
                        <span className="text-xs font-black">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-sm font-black text-gray-900 mb-2">Resource Activity</h3>
                <div className="space-y-1.5">
                  {statistics.resourceTypeStatistics && Object.entries(statistics.resourceTypeStatistics)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([resource, count]) => (
                      <div key={resource} className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-bold">{resource}</span>
                        <span className="text-xs font-black">{count}</span>
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
              ? raw.map((item: any) => [String(item.userId ?? item.username ?? 'Unknown'), Number(item.activityCount ?? item.count ?? 0)])
              : Object.entries(raw).map(([k, v]) => [k, Number(v)]);
            return entries.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-sm font-black text-gray-900 mb-2">Most Active Users</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {entries
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 9)
                    .map(([username, count]) => (
                      <div key={username} className="flex justify-between items-center px-2 py-1.5 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-black">{username}</span>
                        <span className="text-xs text-gray-600 font-bold">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Suspicious Activities */}
          {suspiciousActivities.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h3 className="text-sm font-black text-gray-900 mb-2">Suspicious Activities</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-black text-gray-600 uppercase">IP Address</th>
                      <th className="px-4 py-2 text-left text-xs font-black text-gray-600 uppercase">Users</th>
                      <th className="px-4 py-2 text-left text-xs font-black text-gray-600 uppercase">Actions</th>
                      <th className="px-4 py-2 text-left text-xs font-black text-gray-600 uppercase">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {suspiciousActivities.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-xs font-black text-gray-900">{activity.ipAddress}</td>
                        <td className="px-4 py-2 text-xs text-gray-700 font-bold">{activity.userCount}</td>
                        <td className="px-4 py-2 text-xs text-gray-700 font-bold">{activity.actionCount}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-black rounded-full border ${getRiskLevelColor(activity.riskLevel)}`}>
                            {activity.riskLevel}
                          </span>
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
  );
};

export default AuditDashboardPage;