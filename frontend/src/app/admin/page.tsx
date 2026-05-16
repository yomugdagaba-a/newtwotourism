"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
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
    { name: 'Users',          href: '/admin/users',            description: 'Manage user accounts' },
    { name: 'Hotels',         href: '/admin/hotels',           description: 'Manage hotel listings' },
    { name: 'Tourism Places', href: '/admin/tourisms',         description: 'Manage destinations' },
    { name: 'Bookings',       href: '/admin/bookings',         description: 'Monitor bookings' },
    { name: 'Roads',          href: '/admin/roads',            description: 'Manage road routes' },
    { name: 'Horse Services', href: '/admin/horseservices',    description: 'Manage horse services' },
    { name: 'Guiders',        href: '/admin/guiders',          description: 'Manage tour guiders' },
    { name: 'Hero Images',    href: '/admin/hero-images',      description: 'Manage hero images' },
    { name: 'Audit',          href: '/admin/audit/management', description: 'Audit logs & security' },
    { name: 'Audit Logs',     href: '/admin/audit',            description: 'View audit logs' },
  ];

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-page relative overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.08)]">
      <TopBar showCategories={false} showBackButton={false} pageTitle="Admin Dashboard" showAdminMenu={true} />
      {/* Light background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-100/30 via-transparent to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 pt-3 pb-6">

      {/* System Status Cards - compact */}
      {loading ? (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded p-2 animate-pulse border border-gray-200">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-700">
          Failed to load dashboard data.
          <button onClick={loadDashboardData} className="ml-2 underline font-semibold">Retry</button>
        </div>
      ) : auditStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold leading-tight">Total Events (24h)</p>
            <p className="text-lg sm:text-xl font-black text-gray-900">{auditStats.totalAuditLogs}</p>
          </div>
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold leading-tight">Security Events</p>
            <p className="text-lg sm:text-xl font-black text-gray-900">{auditStats.securityEvents}</p>
          </div>
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold leading-tight">High Severity</p>
            <p className="text-lg sm:text-xl font-black text-gray-900">{auditStats.highSeverityEvents}</p>
          </div>
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold leading-tight">System Status</p>
            <p className="text-sm font-black text-green-700">Operational</p>
          </div>
        </div>
      )}

      {/* Quick Actions - responsive grid */}
      <div className="mb-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white rounded-lg border border-gray-300 px-2 py-2 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md active:scale-95 transition-all text-center shadow-sm"
            >
              <span className="text-xs font-semibold text-blue-600">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Summary */}
      {auditStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Actions */}
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
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
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 border border-purple-200">
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
                className="text-blue-600 hover:text-blue-800 text-xs font-black"
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
      <div className="mt-4 bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
        <h3 className="text-base font-black text-green-900 mb-3">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm font-black text-gray-900">Database</p>
            <p className="text-xs text-green-700 font-bold">Connected</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm font-black text-gray-900">Audit Logging</p>
            <p className="text-xs text-green-700 font-bold">Active</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-lg border border-gray-200">
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
