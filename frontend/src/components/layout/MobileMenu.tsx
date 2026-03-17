// frontend/src/components/layout/MobileMenu.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAuthenticated, username, role, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="bg-white w-64 p-4 h-full shadow-lg overflow-y-auto">
        <button
          onClick={onClose}
          className="text-gray-700 font-bold mb-6 focus:outline-none"
        >
          Close &times;
        </button>
        
        {/* User Info Section */}
        {isAuthenticated && (
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-medium">
                {username?.charAt(0).toUpperCase() || 'U'}
              </span>
              <div>
                <p className="font-medium text-gray-900">{username}</p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex flex-col space-y-3">
          <Link href="/" onClick={onClose} className="hover:text-green-700">Home</Link>
          <Link href="/tourisms" onClick={onClose} className="hover:text-green-700">Tourism Places</Link>
          <Link href="/hotels" onClick={onClose} className="hover:text-green-700">Hotels</Link>
          <Link href="/map" onClick={onClose} className="hover:text-green-700">Map</Link>
          <Link href="/about" onClick={onClose} className="hover:text-green-700">About</Link>
          <Link href="/contact" onClick={onClose} className="hover:text-green-700">Contact</Link>
          
          {/* Auth Section */}
          <div className="pt-4 mt-4 border-t">
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={onClose}
                  className="block py-2 text-green-700 font-medium hover:text-green-800"
                >
                  {role === 'ADMIN' ? '🛠️ Admin Dashboard' : role === 'HOTEL_OWNER' ? '🏨 My Hotels' : '👤 Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-red-600 font-medium hover:text-red-700"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="block py-2 text-gray-700 hover:text-green-700"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={onClose}
                  className="block py-2 text-green-700 font-medium hover:text-green-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};

export default MobileMenu;
