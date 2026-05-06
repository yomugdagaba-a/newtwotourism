"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuditService } from '../../services/audit.service';
import { AuditStatistics } from '../../types/audit';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import SecurityAlerts from '../../components/admin/SecurityAlerts';

const AdminDashboard = () => {
  const [auditStats, setAuditStats] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { role, isAuthenticated, username, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return; // Wait for store to hydrate from localStorage
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, role, isHydrated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load audit statistics for the last 24 hours
      const stats = await AuditService.getAuditStatistics(24);
      setAuditStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'View All Users',   href: '/admin/users',          description: 'Manage user accounts and permissions', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' },
    { name: 'Manage Hotels',    href: '/admin/hotels',         description: 'Add, edit, and manage hotel listings',  iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
    { name: 'Tourism Places',   href: '/admin/tourisms',       description: 'Manage tourism destinations',           iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600' },
    { name: 'View Bookings',    href: '/admin/bookings',       description: 'Monitor and manage bookings',           iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { name: 'Audit Logs',       href: '/admin/audit',          description: 'Review system activity logs',           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { name: 'Security Events',  href: '/admin/audit/security', description: 'Monitor security events',               iconBg: 'bg-rose-100',   iconColor: 'text-rose-600' },
  ];

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-page relative overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.08)]">
      {/* Light background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-100/30 via-transparent to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 pt-4 pb-8">
      {/* Back Button & Welcome Section */}
      <div className="mb-8 bg-white p-3 rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-gray-200">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-1 transition-colors font-bold text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold">Back to Home</span>
        </button>
        <h1 className="text-lg font-black text-gray-900 mb-0.5">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-600 text-sm">
          Here's what's happening with your North Wollo Tourism platform today.
        </p>
      </div>

      {/* System Status Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.12)] p-4 animate-pulse border border-gray-200">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-600 font-black text-lg">✕</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-black text-red-800">
                Failed to load dashboard data
              </h3>
              <div className="mt-2 text-sm text-red-700 font-semibold">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadDashboardData}
                  className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-md hover:bg-red-200 text-sm font-black"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : auditStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
              </div>
              <div className="ml-3">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Total Events (24h)</p>
                <p className="text-2xl font-black text-gray-900">{auditStats.totalAuditLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              </div>
              <div className="ml-3">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Security Events</p>
                <p className="text-2xl font-black text-gray-900">{auditStats.securityEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              </div>
              <div className="ml-3">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">High Severity</p>
                <p className="text-2xl font-black text-gray-900">{auditStats.highSeverityEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              </div>
              <div className="ml-3">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">System Status</p>
                <p className="text-sm font-black text-gray-900">Operational</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-gray-200 p-4 hover:shadow-[0_15px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4"
            >
              <div className={`flex-shrink-0 w-11 h-11 ${action.iconBg} rounded-xl flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${action.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-gray-900">{action.name}</h3>
                <p className="text-xs font-semibold text-gray-500 truncate">{action.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Summary */}
      {auditStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Actions */}
          <div className="bg-blue-50 rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.12)] p-4 hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-shadow border border-blue-200">
            <h3 className="text-base font-black text-blue-900 mb-3">Top Actions (24h)</h3>
            <div className="space-y-2">
              {Object.entries(auditStats.actionStatistics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([action, count]) => (
                  <div key={action} className="flex justify-between items-center bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-xs text-gray-800 font-bold">{action.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{count}</span>
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <Link
                href="/admin/audit"
                className="text-blue-700 hover:text-blue-900 text-xs font-black"
              >
                View all audit logs →
              </Link>
            </div>
          </div>

          {/* Resource Activity */}
          <div className="bg-purple-50 rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.12)] p-4 hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-shadow border border-purple-200">
            <h3 className="text-base font-black text-purple-900 mb-3">Resource Activity (24h)</h3>
            <div className="space-y-2">
              {Object.entries(auditStats.resourceTypeStatistics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([resource, count]) => (
                  <div key={resource} className="flex justify-between items-center bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-xs text-gray-800 font-bold">{resource}</span>
                    <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{count}</span>
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <Link
                href="/admin/audit/dashboard"
                className="text-purple-700 hover:text-purple-900 text-xs font-black"
              >
                View detailed analytics →
              </Link>
            </div>
          </div>

          {/* Security Alerts */}
          <SecurityAlerts timeRange={24} maxAlerts={3} />
        </div>
      )}

      {/* System Health */}
      <div className="mt-6 bg-green-50 rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.12)] p-4 hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-shadow border border-green-200">
        <h3 className="text-base font-black text-green-900 mb-3">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
            <p className="text-sm font-black text-gray-900">Database</p>
            <p className="text-xs text-green-700 font-bold">Connected</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
            <p className="text-sm font-black text-gray-900">Audit Logging</p>
            <p className="text-xs text-green-700 font-bold">Active</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
            <p className="text-sm font-black text-gray-900">Security</p>
            <p className="text-xs text-green-700 font-bold">Monitoring</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
