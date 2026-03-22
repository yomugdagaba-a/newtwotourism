// frontend/src/components/layout/Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileMenu from "./MobileMenu";
import { useAuthStore } from "@/store/useAuthStore";

const Navbar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, username, role, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const getDashboardLink = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'HOTEL_OWNER':
        return '/hotel-owner';
      default:
        return '/profile';
    }
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-green-700">
          North Wollo Tourism
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link href="/" className="hover:text-green-700">Home</Link>
          <Link href="/tourisms" className="hover:text-green-700">Tourism</Link>
          <Link href="/hotels" className="hover:text-green-700">Hotels</Link>
          <Link href="/map" className="hover:text-green-700">Map</Link>
          <Link href="/about" className="hover:text-green-700">About</Link>
          <Link href="/contact" className="hover:text-green-700">Contact</Link>
          
          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors"
              >
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="text-sm font-medium text-gray-700">{username}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{username}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                  <Link
                    href={getDashboardLink()}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    {role === 'ADMIN' ? 'Admin Dashboard' : role === 'HOTEL_OWNER' ? 'My Hotels' : 'Profile'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-green-700"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col justify-between h-6 w-6 focus:outline-none"
          onClick={() => setIsMobileOpen(true)}
        >
          <span className="block h-0.5 w-full bg-gray-700 rounded" />
          <span className="block h-0.5 w-full bg-gray-700 rounded" />
          <span className="block h-0.5 w-full bg-gray-700 rounded" />
        </button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </header>
  );
};

export default Navbar;
