"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { username, role, logout, isAuthenticated, token } = useAuthStore();

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to login if not authenticated after client-side hydration
  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isClient, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      current: pathname === '/admin'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: '👥',
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Hotels',
      href: '/admin/hotels',
      icon: '🏨',
      current: pathname.startsWith('/admin/hotels')
    },
    {
      name: 'Tourism Places',
      href: '/admin/tourisms',
      icon: '🏞️',
      current: pathname.startsWith('/admin/tourisms')
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: '📅',
      current: pathname.startsWith('/admin/bookings')
    },
    {
      name: 'Guiders',
      href: '/admin/guiders',
      icon: '🗺️',
      current: pathname.startsWith('/admin/guiders')
    },
    {
      name: 'Roads',
      href: '/admin/roads',
      icon: '🛣️',
      current: pathname.startsWith('/admin/roads')
    },
    {
      name: 'Horse Services',
      href: '/admin/horseservices',
      icon: '🐎',
      current: pathname.startsWith('/admin/horseservices')
    }
  ];

  const auditNavigation = [
    {
      name: 'Audit Dashboard',
      href: '/admin/audit/dashboard',
      icon: '📈',
      current: pathname === '/admin/audit/dashboard'
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit',
      icon: '📋',
      current: pathname === '/admin/audit'
    },
    {
      name: 'Security Events',
      href: '/admin/audit/security',
      icon: '🚨',
      current: pathname === '/admin/audit/security'
    },
    {
      name: 'Management',
      href: '/admin/audit/management',
      icon: '⚙️',
      current: pathname === '/admin/audit/management'
    }
  ];

  const NavLink = ({ item }: { item: any }) => (
    <Link
      href={item.href}
      className={`group flex items-center px-3 py-3 text-sm font-black rounded-lg transition-all duration-200 border-2 bg-white ${
        item.current
          ? 'text-blue-600 border-blue-400 shadow-lg hover:shadow-xl'
          : 'text-gray-700 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg'
      }`}
    >
      <span className={`mr-3 text-lg px-2 py-1 rounded ${item.current ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-800 border border-gray-300'}`}>{item.icon}</span>
      <span className="font-black">{item.name}</span>
    </Link>
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need administrator privileges to access this area.</p>
          <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2">
            Login
          </Link>
          <Link href="/" className="inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-page">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white admin-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <span className="text-gray-900 text-xl">×</span>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Panel</h1>
            </div>
            <nav className="mt-6 px-3 space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
              <div className="pt-6 mt-6 border-t-2 border-gray-300">
                <h3 className="px-3 text-xs font-black text-gray-800 uppercase tracking-widest mb-3">
                  🔒 Audit & Security
                </h3>
                <div className="space-y-2">
                  {auditNavigation.map((item) => (
                    <NavLink key={item.name} item={item} />
                  ))}
                </div>
              </div>
              {/* Mobile Logout Button */}
              <div className="pt-6 mt-6 border-t-2 border-gray-300">
                <div className="px-3 py-3 mb-3 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="text-sm font-black text-gray-900">{username}</p>
                  <p className="text-xs font-bold text-gray-600">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-lg border-2 border-red-700 shadow-md hover:shadow-lg transition-all"
                >
                  <span className="mr-3 text-lg">🚪</span>
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white admin-sidebar">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Panel</h1>
            </div>
            <nav className="mt-6 flex-1 px-3 space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
              <div className="pt-6 mt-6 border-t-2 border-gray-300">
                <h3 className="px-3 text-xs font-black text-gray-800 uppercase tracking-widest mb-3">
                  🔒 Audit & Security
                </h3>
                <div className="space-y-2">
                  {auditNavigation.map((item) => (
                    <NavLink key={item.name} item={item} />
                  ))}
                </div>
              </div>
            </nav>
          </div>
          <div className="flex-shrink-0 border-t-2 border-gray-300 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center text-sm font-black shadow-md">
                  {username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-black text-gray-900">{username}</p>
                  <p className="text-xs font-bold text-gray-600">{role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-lg border-2 border-red-700 shadow-md hover:shadow-lg transition-all"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <span className="text-xl">☰</span>
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;