"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { username, role, logout, isAuthenticated, isHydrated } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => { setIsClient(true); }, []);

  // Close sidebar automatically on every route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isClient || !isHydrated) return; // Wait for client mount and store hydration
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isClient, isHydrated, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Make sidebar toggle available globally for TopBar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__toggleAdminSidebar = () => setSidebarOpen(prev => !prev);
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__toggleAdminSidebar;
      }
    };
  }, []);

  const navigation = [
    { name: 'Dashboard',       href: '/admin',               current: pathname === '/admin' },
    { name: 'Users',           href: '/admin/users',         current: pathname.startsWith('/admin/users') },
    { name: 'Hotels',          href: '/admin/hotels',        current: pathname.startsWith('/admin/hotels') },
    { name: 'Tourism Places',  href: '/admin/tourisms',      current: pathname.startsWith('/admin/tourisms') },
    { name: 'Bookings',        href: '/admin/bookings',      current: pathname.startsWith('/admin/bookings') },
    { name: 'Guiders',         href: '/admin/guiders',       current: pathname.startsWith('/admin/guiders') },
    { name: 'Roads',           href: '/admin/roads',         current: pathname.startsWith('/admin/roads') },
    { name: 'Horse Services',  href: '/admin/horseservices', current: pathname.startsWith('/admin/horseservices') },
  ];

  const auditNavigation = [
    { name: 'Audit Dashboard', href: '/admin/audit/management', current: pathname === '/admin/audit/management' },
    { name: 'Audit Logs',      href: '/admin/audit',            current: pathname === '/admin/audit' },
  ];

  // Nav icons (simple SVG paths matching RideSystem style)
  const navIcons: Record<string, React.ReactNode> = {
    Dashboard:      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    Users:          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Hotels:         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    'Tourism Places':<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Bookings:       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Guiders:        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Roads:          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
    'Horse Services':<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
    'Audit Dashboard':<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    'Audit Logs':   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    'Security Events':<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    Management:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  };

  const NavLink = ({ item }: { item: { name: string; href: string; current: boolean } }) => (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        item.current ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className={item.current ? 'text-purple-600' : 'text-gray-500'}>{navIcons[item.name]}</span>
      <span>{item.name}</span>
    </Link>
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need administrator privileges to access this area.</p>
          <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2">Login</Link>
          <Link href="/" className="inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-page bg-gray-50">
      {/* Sidebar overlay — starts below the TopBar (top-12 = 48px) */}
      {sidebarOpen && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40 flex">
          <div className="fixed inset-x-0 bottom-0 top-12 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[60vw] sm:w-64 z-50 shadow-2xl border-t border-gray-200 flex flex-col bg-white">
            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto bg-white">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Audit & Security</p>
                <div className="space-y-1">
                  {auditNavigation.map((item) => (
                    <NavLink key={item.name} item={item} />
                  ))}
                </div>
              </div>
            </nav>
            {/* Logout */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all w-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

