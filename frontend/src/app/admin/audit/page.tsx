"use client";

import React, { useState, useEffect } from 'react';
import { AuditService } from '../../../services/audit.service';
import { AuditLogEntry, AuditLogSearchParams, AUDIT_CATEGORIES, AUDIT_SEVERITY_LEVELS } from '../../../types/audit';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';

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
  const [exportLoading, setExportLoading] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  const { role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    // Pre-fill IP filter from URL query param (e.g. from suspicious activity dashboard link)
    const params = new URLSearchParams(window.location.search);
    const ipFromUrl = params.get('ipAddress');
    if (ipFromUrl) {
      setSearchParams(prev => ({ ...prev, ipAddress: ipFromUrl }));
    }
  }, [isAuthenticated, role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.options-dropdown-container')) {
        setShowOptionsDropdown(false);
      }
    };
    
    if (showOptionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsDropdown]);

  // Reload when page/size changes
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      loadAuditLogs();
    }
  }, [currentPage, pageSize]);

  // Auto-search when searchParams are set from URL (e.g. IP pre-fill from dashboard)
  useEffect(() => {
    const hasParams = Object.values(searchParams).some(v => v !== undefined && v !== null && v !== '');
    if (hasParams && isAuthenticated && role === 'ADMIN') {
      loadAuditLogs();
    }
  }, [searchParams]);

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

  const handleClear = () => {
    setSearchParams({});
    setCurrentPage(0);
    // Remove URL params
    window.history.replaceState({}, '', window.location.pathname);
    loadAuditLogs();
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
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
    } finally {
      setExportLoading(false);
    }
  };

  const getCategoryFromAction = (action: string): string => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
      case 'REGISTER':
      case 'TOKEN_REFRESH':
      case 'SESSION_EXPIRED':
        return 'AUTHENTICATION';
      case 'AUTHORIZATION_CHECK':
      case 'ACCOUNT_LOCKED':
      case 'ACCOUNT_UNLOCKED':
        return 'SECURITY';
      case 'PASSWORD_RESET_REQUEST':
      case 'PASSWORD_RESET_CONFIRM':
      case 'EMAIL_VERIFICATION_SEND':
      case 'EMAIL_VERIFICATION_CONFIRM':
        return 'AUTHENTICATION';
      case 'CREATE':
      case 'UPDATE':
      case 'DELETE':
      case 'IMPORT':
      case 'EXPORT':
        return 'DATA_CHANGE';
      default:
        return 'SYSTEM';
    }
  };

  const getSeverityFromAction = (action: string, status?: number): string => {
    if (status && status >= 400) return 'WARN';
    switch (action) {
      case 'ACCOUNT_LOCKED':
      case 'AUTHORIZATION_CHECK':
      case 'SESSION_EXPIRED':
        return 'WARN';
      case 'DELETE':
        return 'WARN';
      default:
        return 'INFO';
    }
  };

  const getCategoryBadgeClass = (category: string): string => {
    switch (category) {
      case 'AUTHENTICATION': return 'bg-blue-100 text-blue-800';
      case 'SECURITY': return 'bg-red-100 text-red-800';
      case 'DATA_CHANGE': return 'bg-purple-100 text-purple-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Audit Logs" 
        showAdminMenu={true}
        actionButtons={
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            {/* Search filters — visible on desktop, pushed right */}
            <div className="hidden md:flex items-center gap-2">
              <input
                type="text"
                placeholder="Username"
                value={searchParams.username || ''}
                onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ fontSize: '13px' }}
                className="rounded px-2 py-1 w-20 lg:w-24 bg-gray-50 border border-transparent hover:border-gray-300 focus:border-gray-400 focus:bg-white outline-none transition-colors"
              />
              <select
                value={searchParams.action || ''}
                onChange={(e) => setSearchParams({ ...searchParams, action: e.target.value })}
                style={{ fontSize: '13px', padding: '4px 2px' }}
                className="bg-gray-50 text-gray-900 font-medium outline-none cursor-pointer w-24 lg:w-28 rounded border border-transparent hover:border-gray-300 focus:border-gray-400 transition-colors"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="REGISTER">REGISTER</option>
                <option value="TOKEN_REFRESH">TOKEN_REFRESH</option>
                <option value="PASSWORD_RESET_REQUEST">PASSWORD_RESET_REQUEST</option>
                <option value="PASSWORD_RESET_CONFIRM">PASSWORD_RESET_CONFIRM</option>
                <option value="EMAIL_VERIFICATION_SEND">EMAIL_VERIFICATION_SEND</option>
                <option value="EMAIL_VERIFICATION_CONFIRM">EMAIL_VERIFICATION_CONFIRM</option>
                <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
                <option value="ACCOUNT_UNLOCKED">ACCOUNT_UNLOCKED</option>
                <option value="AUTHORIZATION_CHECK">AUTHORIZATION_CHECK</option>
                <option value="SESSION_EXPIRED">SESSION_EXPIRED</option>
              </select>
              <input
                type="text"
                placeholder="IP Address"
                value={searchParams.ipAddress || ''}
                onChange={(e) => setSearchParams({ ...searchParams, ipAddress: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ fontSize: '13px' }}
                className="rounded px-2 py-1 w-20 lg:w-24 bg-gray-50 border border-transparent hover:border-gray-300 focus:border-gray-400 focus:bg-white outline-none transition-colors"
              />
              <button 
                onClick={handleSearch} 
                style={{ fontSize: '13px' }} 
                className="text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded whitespace-nowrap transition-colors"
              >
                Search
              </button>
            </div>

            {/* Options Dropdown (Advanced, Hide, Clear) + Export CSV */}
            <div className="relative options-dropdown-container">
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{ fontSize: '14px' }}
                className="shrink-0 text-gray-700 hover:text-gray-900 px-2 py-1 rounded whitespace-nowrap transition-colors flex items-center gap-1"
              >
                Options
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showOptionsDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      setShowAdvancedSearch(!showAdvancedSearch);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {showAdvancedSearch ? 'Hide Advanced' : 'Show Advanced'}
                  </button>
                  <button
                    onClick={() => {
                      handleClear();
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleExportCsv}
              disabled={exportLoading}
              style={{ fontSize: '14px' }}
              className="shrink-0 text-green-600 hover:text-green-800 px-2.5 py-1 rounded whitespace-nowrap transition-colors disabled:opacity-40 font-black"
            >
              {exportLoading ? '...' : 'Export CSV'}
            </button>
          </div>
        }
      />
      <div className="container mx-auto px-4 pt-4 pb-8">

      {/* Compact Search Filters — mobile only (desktop filters are in TopBar) */}
      <div className="mb-2 md:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Username"
            value={searchParams.username || ''}
            onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs w-24 sm:w-32"
          />
          <select
            value={searchParams.action || ''}
            onChange={(e) => setSearchParams({ ...searchParams, action: e.target.value })}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs flex-1 min-w-0"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="REGISTER">REGISTER</option>
            <option value="TOKEN_REFRESH">TOKEN_REFRESH</option>
            <option value="PASSWORD_RESET_REQUEST">PASSWORD_RESET_REQUEST</option>
            <option value="PASSWORD_RESET_CONFIRM">PASSWORD_RESET_CONFIRM</option>
            <option value="EMAIL_VERIFICATION_SEND">EMAIL_VERIFICATION_SEND</option>
            <option value="EMAIL_VERIFICATION_CONFIRM">EMAIL_VERIFICATION_CONFIRM</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
            <option value="ACCOUNT_UNLOCKED">ACCOUNT_UNLOCKED</option>
            <option value="AUTHORIZATION_CHECK">AUTHORIZATION_CHECK</option>
            <option value="SESSION_EXPIRED">SESSION_EXPIRED</option>
          </select>
          <input
            type="text"
            placeholder="IP Address"
            value={searchParams.ipAddress || ''}
            onChange={(e) => setSearchParams({ ...searchParams, ipAddress: e.target.value })}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs w-24 sm:w-32"
          />
          <button onClick={handleSearch} className="text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg transition-colors text-xs">Search</button>
        </div>
      </div>

      {/* Advanced Search Panel — shown on ALL screen sizes when toggled */}
      {showAdvancedSearch && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select value={searchParams.category || ''} onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Categories</option>
            {Object.values(AUDIT_CATEGORIES).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={searchParams.severity || ''} onChange={(e) => setSearchParams({ ...searchParams, severity: e.target.value })}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Severities</option>
            {Object.values(AUDIT_SEVERITY_LEVELS).map(severity => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
          <input 
            type="datetime-local" 
            value={searchParams.startTime || ''} 
            onChange={(e) => setSearchParams({ ...searchParams, startTime: e.target.value })}
            placeholder="Start date and time"
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs" 
          />
          <input 
            type="datetime-local" 
            value={searchParams.endTime || ''} 
            onChange={(e) => setSearchParams({ ...searchParams, endTime: e.target.value })}
            placeholder="End date and time"
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs" 
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <span className="text-gray-700 font-medium text-sm">
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
                {auditLogs.map((log) => {
                  const changes = log.changes ? (() => { try { return JSON.parse(log.changes as string); } catch { return null; } })() : null;
                  const derivedCategory = getCategoryFromAction(log.action);
                  const derivedSeverity = getSeverityFromAction(log.action, changes?.status);
                  // Resolve username: from relation, from stored changes.username, or fallback
                  const displayUser = log.user?.username
                    || changes?.username
                    || (log.userId ? `User#${log.userId}` : 'System');
                  return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold">
                      {displayUser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                      {log.entityType ? `${log.entityType}${log.entityId ? `:${log.entityId}` : ''}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryBadgeClass(derivedCategory)}`}>
                        {derivedCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                        derivedSeverity === 'WARN' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {derivedSeverity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                      {log.ipAddress}
                    </td>
                  </tr>
                  );
                })}
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