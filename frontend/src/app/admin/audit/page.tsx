"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../services/audit.service';
import { AuditLogEntry, AuditLogSearchParams, AUDIT_CATEGORIES, AUDIT_SEVERITY_LEVELS } from '../../../types/audit';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams, setSearchParams] = useState<AuditLogSearchParams>({});
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const { role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadAuditLogs();
  }, [isAuthenticated, role, currentPage, pageSize]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading audit logs, page:', currentPage, 'size:', pageSize);
      console.log('Search params:', searchParams);
      
      let response;
      // Check if any search params have values
      const hasSearchParams = Object.entries(searchParams).some(([key, value]) => 
        value !== undefined && value !== null && value !== ''
      );
      
      if (hasSearchParams) {
        console.log('Using search endpoint');
        response = await AuditService.searchAuditLogs({
          ...searchParams,
          page: currentPage,
          size: pageSize
        });
      } else {
        console.log('Using getAllAuditLogs endpoint');
        response = await AuditService.getAllAuditLogs(currentPage, pageSize);
      }

      console.log('Response:', response);
      setAuditLogs(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Error loading audit logs:', err);
      setAuditLogs([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadAuditLogs();
  };

  const handleClearSearch = () => {
    setSearchParams({});
    setCurrentPage(0);
    loadAuditLogs();
  };

  const handleExportCsv = async () => {
    try {
      // Export all logs matching current search (up to 1000)
      let allLogs: AuditLogEntry[] = [];
      const hasSearchParams = Object.entries(searchParams).some(([, value]) =>
        value !== undefined && value !== null && value !== ''
      );
      if (hasSearchParams) {
        const res = await AuditService.searchAuditLogs({ ...searchParams, page: 0, size: 1000 });
        allLogs = res?.content || [];
      } else {
        const res = await AuditService.getAllAuditLogs(0, 1000);
        allLogs = res?.content || [];
      }
      AuditService.exportToCsv(allLogs, `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`);
    } catch {
      AuditService.exportToCsv(auditLogs, `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`);
    }
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
      case 'AUTHENTICATION': return '[AUTH]';
      case 'AUTHORIZATION': return '[AUTHZ]';
      case 'DATA_CHANGE': return '[DATA]';
      case 'SECURITY': return '[SEC]';
      case 'MAINTENANCE': return '[MAINT]';
      case 'SYSTEM': return '[SYS]';
      default: return '[LOG]';
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
        <h1 className="text-lg font-black text-gray-900 mb-0.5">Audit Logs</h1>
        <p className="text-gray-600 text-sm">Monitor and review system activities and security events</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-100 rounded-xl shadow-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-gray-900">Search & Filter</h2>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="text-blue-700 hover:text-blue-900 font-black"
          >
            {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Username"
            value={searchParams.username || ''}
            onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
            className="border-2 border-slate-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm"
          />
          <input
            type="text"
            placeholder="Action"
            value={searchParams.action || ''}
            onChange={(e) => setSearchParams({ ...searchParams, action: e.target.value })}
            className="border-2 border-slate-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm"
          />
          <input
            type="text"
            placeholder="IP Address"
            value={searchParams.ipAddress || ''}
            onChange={(e) => setSearchParams({ ...searchParams, ipAddress: e.target.value })}
            className="border-2 border-slate-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm"
          />
        </div>

        {showAdvancedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select
              value={searchParams.category || ''}
              onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
              className="border-2 border-slate-300 rounded-lg px-3 py-2 font-black bg-white shadow-sm"
            >
              <option value="">All Categories</option>
              {Object.values(AUDIT_CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={searchParams.severity || ''}
              onChange={(e) => setSearchParams({ ...searchParams, severity: e.target.value })}
              className="border-2 border-slate-300 rounded-lg px-3 py-2 font-black bg-white shadow-sm"
            >
              <option value="">All Severities</option>
              {Object.values(AUDIT_SEVERITY_LEVELS).map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              placeholder="Start Time"
              value={searchParams.startTime || ''}
              onChange={(e) => setSearchParams({ ...searchParams, startTime: e.target.value })}
              className="border-2 border-slate-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm"
            />
            <input
              type="datetime-local"
              placeholder="End Time"
              value={searchParams.endTime || ''}
              onChange={(e) => setSearchParams({ ...searchParams, endTime: e.target.value })}
              className="border-2 border-slate-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-blue-200 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-300 font-black shadow-md"
          >
            Search
          </button>
          <button
            onClick={handleClearSearch}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-black shadow-md"
          >
            Clear
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-green-200 text-green-800 px-4 py-2 rounded-lg hover:bg-green-300 font-black shadow-md"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-slate-100 rounded-xl shadow-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-900 font-bold">
            Showing {auditLogs.length} of {totalElements} audit logs
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-800 font-black">Page size:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border-2 border-slate-300 rounded-lg px-2 py-1 font-black bg-white shadow-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-100 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-700 font-bold bg-white">
            <p>Error: {error}</p>
            <button
              onClick={loadAuditLogs}
              className="mt-4 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 font-black shadow-md"
            >
              Retry
            </button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-900 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">
                      {log.username || log.user?.username || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {log.entityType ? `${log.entityType}${log.entityId ? `:${log.entityId}` : ''}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">
                      <span className="flex items-center">
                        <span className="mr-2">{getCategoryIcon(log.category)}</span>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-black rounded-full shadow-sm ${getSeverityBadgeClass(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-2 text-sm font-black text-gray-700 bg-white border-2 border-gray-400 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 font-black">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-2 text-sm font-black text-gray-700 bg-white border-2 border-gray-400 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
      </div>
    </div>
  );
};

export default AuditLogsPage;