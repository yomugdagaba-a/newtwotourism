"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../../services/audit.service';
import { AuditLogEntry } from '../../../../types/audit';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useRouter } from 'next/navigation';

const SecurityEventsPage = () => {
  const [securityLogs, setSecurityLogs] = useState<AuditLogEntry[]>([]);
  const [highSeverityLogs, setHighSeverityLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [activeTab, setActiveTab] = useState<'security' | 'high-severity'>('security');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadSecurityEvents();
  }, [isAuthenticated, role, timeRange]);

  const loadSecurityEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [securityResponse, highSeverityResponse] = await Promise.all([
        AuditService.getRecentSecurityLogs(timeRange),
        AuditService.getHighSeverityLogs(timeRange)
      ]);

      setSecurityLogs(securityResponse || []);
      setHighSeverityLogs(highSeverityResponse || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security events');
      console.error('Error loading security events:', err);
    } finally {
      setLoading(false);
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
      default: return '';
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

  const currentLogs = activeTab === 'security' ? securityLogs : highSeverityLogs;
  
  // Pagination logic
  const totalPages = Math.ceil(currentLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = currentLogs.slice(startIndex, endIndex);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
        <h1 className="text-lg font-black text-gray-900 mb-0.5">Security Events</h1>
        <p className="text-gray-600 text-sm">Monitor authentication, authorization, and security-related activities</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-black text-gray-800">Time Range:</label>
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

        <button
          onClick={loadSecurityEvents}
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-black border-2 border-blue-300"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-black text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security Events ({securityLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('high-severity')}
            className={`py-2 px-1 border-b-2 font-black text-sm ${
              activeTab === 'high-severity'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            High Severity ({highSeverityLogs.length})
          </button>
        </nav>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-bold">Loading security events...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-bold">
            <p>Error: {error}</p>
            <button
              onClick={loadSecurityEvents}
              className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-black border-2 border-blue-300"
            >
              Retry
            </button>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-700 font-bold">
            <p>No {activeTab === 'security' ? 'security events' : 'high severity events'} found in the selected time range</p>
          </div>
        ) : (
          <>
            {/* Pagination Info */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700 font-bold">
                Showing <span className="font-black text-gray-900">{startIndex + 1}</span> to <span className="font-black text-gray-900">{Math.min(endIndex, currentLogs.length)}</span> of <span className="font-black text-gray-900">{currentLogs.length}</span> events
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm font-bold"
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
              {paginatedLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getActionIcon(log.action)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-black text-gray-900">
                            {log.action.replace(/_/g, ' ')}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-black rounded-full border ${getSeverityBadgeClass(log.severity)}`}>
                            {log.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-bold mb-2">
                          {log.description || `${log.action} event`}
                        </p>
                        <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600 font-semibold">
                          <span className="flex items-center">
                            <span className="mr-1">{getCategoryIcon(log.category)}</span>
                            {log.category}
                          </span>
                          {(log.username || log.user?.username) && (
                            <span>👤 {log.username || log.user?.username}</span>
                          )}
                          <span>🌐 {log.ipAddress}</span>
                          {log.entityType && (
                            <span>📋 {log.entityType}{log.entityId ? `:${log.entityId}` : ''}</span>
                          )}
                        </div>
                        {log.changes && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                            <details>
                              <summary className="cursor-pointer text-sm font-black text-gray-700">
                                Event Details
                              </summary>
                              <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap font-semibold">
                                {log.changes}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-gray-600 font-bold">{formatTimestamp(log.createdAt)}</p>
                      <p className="text-xs text-gray-500 font-semibold">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-2 border-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-2 border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
            <h4 className="text-sm font-black text-blue-900">Total Security Events</h4>
            <p className="text-2xl font-black text-blue-600">{securityLogs.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
            <h4 className="text-sm font-black text-red-900">High Severity Events</h4>
            <p className="text-2xl font-black text-red-600">{highSeverityLogs.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
            <h4 className="text-sm font-black text-yellow-900">Critical Events</h4>
            <p className="text-2xl font-black text-yellow-600">
              {currentLogs.filter(log => log.severity === 'CRITICAL').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityEventsPage;