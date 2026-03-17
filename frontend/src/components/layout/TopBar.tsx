"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/common/Modal";
import LoginForm from "@/app/auth/login/page";
import RegisterForm from "@/app/auth/register/page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import ModeSwitcher from "@/components/common/ModeSwitcher";

interface Props {
  keyword?: string;
  onSearch?: (keyword: string) => void;
  showCategories?: boolean;
  transparent?: boolean;
  categories?: string[];
  onCategoryToggle?: (category: string) => void;
  liveSearch?: boolean; // Enable real-time search as you type
}

const CATEGORIES = [
  { id: "HERITAGE", icon: "🕌", label: "Heritage" },
  { id: "HIGHLAND", icon: "⛰️", label: "Highland" },
  { id: "CAVERN", icon: "🕳️", label: "Cavern" },
  { id: "AQUATICS", icon: "🌊", label: "Aquatics" },
  { id: "CULTURE", icon: "🎭", label: "Culture" },
  { id: "MODERN", icon: "🏛️", label: "Modern" },
];

// Debounce hook for live search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function TopBar({ keyword = "", onSearch, showCategories = true, transparent = false, categories: selectedCategories, onCategoryToggle, liveSearch = false }: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [modalContent, setModalContent] = useState<"login" | "register" | null>(null);
  const [searchValue, setSearchValue] = useState(keyword);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, username, role, browsingMode, logout, isHydrated } = useAuthStore();

  // Prevent hydration mismatch by only rendering auth UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use this for conditional rendering to avoid hydration mismatch
  const showAuthenticatedUI = mounted && isHydrated && isAuthenticated;

  // Debounced search value for live search (300ms delay)
  const debouncedSearchValue = useDebounce(searchValue, 300);

  // Update search value when keyword prop changes
  useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  // Live search effect - triggers when debounced value changes
  useEffect(() => {
    if (liveSearch && onSearch) {
      onSearch(debouncedSearchValue);
    }
  }, [debouncedSearchValue, liveSearch, onSearch]);

  const handleLogout = async () => {
    await logout();
    setOpenMenu(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    } else {
      router.push(`/tourisms?keyword=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // If not using live search with onSearch callback, navigate immediately for empty search
    if (!liveSearch && !onSearch && value === '') {
      router.push('/tourisms');
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/tourisms?categories=${categoryId}`);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 ${transparent ? 'bg-white/95 backdrop-blur-lg' : 'bg-white'} shadow-md border-b border-gray-200`}>
        {/* Main Nav */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                NW
              </div>
              <span className="hidden sm:block font-bold text-white text-lg">North Wollo</span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearchInputChange}
                  placeholder="Search destinations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm text-gray-900 placeholder-gray-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue('');
                      if (onSearch) onSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Quick Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/tourisms" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Explore
              </Link>
              <Link href="/hotels" className="px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                <span>🏨</span> Hotels
              </Link>
              <Link href="/roads" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Roads
              </Link>
            </nav>

            {/* Auth Buttons / User Menu */}
            <div className="flex items-center gap-2">
              {showAuthenticatedUI ? (
                <>
                  {/* Mode Switcher for HOTEL_OWNER */}
                  {role === "HOTEL_OWNER" && (
                    <ModeSwitcher className="hidden md:flex" />
                  )}
                  
                  {/* Role-based quick access */}
                  {role === "ADMIN" && (
                    <Link href="/admin" className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <span>⚙️</span> Admin
                    </Link>
                  )}
                  {role === "HOTEL_OWNER" && browsingMode === "OWNER" && (
                    <Link href="/owner/dashboard" className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <span>🏨</span> Owner Dashboard
                    </Link>
                  )}
                  {/* My Bookings link for all authenticated users (clients) */}
                  {(role === "CLIENT" || (role === "HOTEL_OWNER" && browsingMode === "CLIENT")) && (
                    <Link href="/bookings" className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <span>📋</span> My Bookings
                    </Link>
                  )}
                  
                  {/* User dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(!openMenu)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-300"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">{username}</span>
                      <svg className={`w-4 h-4 text-blue-300 transition-transform ${openMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {openMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{username}</p>
                          <p className="text-xs text-gray-500">{role}</p>
                        </div>
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          <span>🏠</span> Home
                        </Link>
                        <Link href="/tourisms" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          <span>🏞️</span> Explore
                        </Link>
                        <Link href="/hotels" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          <span>🏨</span> Hotels
                        </Link>
                        {role === "ADMIN" && (
                          <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden" onClick={() => setOpenMenu(false)}>
                            <span>⚙️</span> Admin Panel
                          </Link>
                        )}
                        {role === "HOTEL_OWNER" && (
                          <Link href="/owner/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                            <span>🏨</span> Owner Dashboard
                          </Link>
                        )}
                        {/* My Bookings for all users */}
                        <Link href="/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          <span>📋</span> My Bookings
                        </Link>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <span>🚪</span> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : mounted ? (
                <>
                  <button
                    onClick={() => setModalContent("login")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setModalContent("register")}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <div className="w-24 h-10 bg-white/10 rounded-lg animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        {showCategories && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-medium text-blue-300 mr-2 whitespace-nowrap">Categories:</span>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories?.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryToggle ? onCategoryToggle(cat.id) : handleCategoryClick(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'text-blue-100 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
                <Link
                  href="/tourisms"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all whitespace-nowrap ml-auto"
                >
                  View All →
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
        {modalContent === "login" && (
          <LoginForm 
            onSuccess={() => setModalContent(null)} 
            onRegisterClick={() => setModalContent("register")}
            onCancel={() => setModalContent(null)}
          />
        )}
        {modalContent === "register" && (
          <RegisterForm 
            onSuccess={() => setModalContent(null)} 
            onLoginClick={() => setModalContent("login")}
            onCancel={() => setModalContent(null)}
          />
        )}
      </Modal>
    </>
  );
}
