"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import ProfileModal from "@/components/common/ProfileModal";

interface Props {
  keyword?: string;
  onSearch?: (keyword: string) => void;
  showCategories?: boolean;
  transparent?: boolean;
  categories?: string[];
  onCategoryToggle?: (category: string) => void;
  onClearCategories?: () => void;
  liveSearch?: boolean;
}

const CATEGORIES = [
  { id: "HERITAGE", icon: "🕌", label: "Heritage" },
  { id: "HIGHLAND", icon: "⛰️", label: "Highland" },
  { id: "CAVERN", icon: "🕳️", label: "Cavern" },
  { id: "AQUATICS", icon: "🌊", label: "Aquatics" },
  { id: "CULTURE", icon: "🎭", label: "Culture" },
  { id: "MODERN", icon: "🏛️", label: "Modern" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function TopBar({
  keyword = "",
  onSearch,
  showCategories = true,
  transparent = false,
  categories: selectedCategories,
  onCategoryToggle,
  onClearCategories,
  liveSearch = false,
}: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<"login" | "register" | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchValue, setSearchValue] = useState(keyword);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, username, role, browsingMode, logout, isHydrated, setBrowsingMode } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  const showAuthenticatedUI = mounted && isHydrated && isAuthenticated;
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => { setSearchValue(keyword); }, [keyword]);

  useEffect(() => {
    if (liveSearch && onSearch) onSearch(debouncedSearchValue);
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
    if (!liveSearch && !onSearch && value === "") router.push("/tourisms");
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/tourisms?categories=${categoryId}`);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 ${transparent ? "bg-white/95 backdrop-blur-lg" : "bg-white"} border-b border-gray-200`}
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1px 6px rgba(0,0,0,0.07), inset 0 -1px 0 rgba(255,255,255,0.8)" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                NW
              </div>
              <span className="hidden sm:block font-bold text-gray-900 text-lg">North Wollo</span>
            </Link>

            {/* Hamburger for mobile — shows category menu */}
            <button
              className="md:hidden ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            {/* Category Pills */}
            <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories?.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => (onCategoryToggle ? onCategoryToggle(cat.id) : handleCategoryClick(cat.id))}
                    style={{
                      boxShadow: isSelected
                        ? "0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.3)"
                        : "0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
                      backdropFilter: "blur(8px)",
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:-translate-y-0.5"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
              {selectedCategories && selectedCategories.length > 0 && onClearCategories && (
                <button
                  onClick={onClearCategories}
                  className="ml-1 px-2 py-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full border border-red-200 transition-all whitespace-nowrap"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex shrink-0 w-36">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearchInputChange}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-xs text-gray-900 placeholder-gray-500"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => { setSearchValue(""); if (onSearch) onSearch(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Auth Buttons / User Menu */}
            <div className="flex items-center gap-1 shrink-0">
              {showAuthenticatedUI ? (
                <>
                  {/* Hotel Owner mode buttons */}
                  {role === "HOTEL_OWNER" && (
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        onClick={() => setBrowsingMode("OWNER")}
                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                          browsingMode === "OWNER"
                            ? "bg-orange-500 text-white"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-300"
                        }`}
                      >
                        As Owner
                      </button>
                      <button
                        onClick={() => setBrowsingMode("CLIENT")}
                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                          browsingMode === "CLIENT"
                            ? "bg-emerald-500 text-white"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-300"
                        }`}
                      >
                        As Client
                      </button>
                      {browsingMode === "CLIENT" ? (
                        <Link href="/bookings" className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-all whitespace-nowrap">
                          My Bookings
                        </Link>
                      ) : (
                        <Link href="/owner/dashboard" className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-all whitespace-nowrap">
                          Manage
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Admin link */}
                  {role === "ADMIN" && (
                    <Link href="/admin" className="hidden sm:flex items-center px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      Admin
                    </Link>
                  )}

                  {/* My Bookings for plain CLIENT */}
                  {role === "CLIENT" && (
                    <Link href="/bookings" className="hidden sm:flex items-center px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors whitespace-nowrap">
                      My Bookings
                    </Link>
                  )}

                  {/* User dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(!openMenu)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="hidden sm:block text-xs font-medium text-gray-900 max-w-[80px] truncate">{username}</span>
                      <svg className={`w-3 h-3 text-gray-500 transition-transform ${openMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {openMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        {/* User info */}
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{username}</p>
                          <p className="text-xs text-gray-500">{role}</p>
                        </div>

                        {/* Profile button */}
                        <button
                          onClick={() => { setShowProfileModal(true); setOpenMenu(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                        >
                          My Profile
                        </button>

                        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          Home
                        </Link>
                        <Link href="/tourisms" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          Explore
                        </Link>
                        <Link href="/hotels" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          Hotels
                        </Link>
                        {role === "ADMIN" && (
                          <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden" onClick={() => setOpenMenu(false)}>
                            Admin Panel
                          </Link>
                        )}
                        {role === "HOTEL_OWNER" && (
                          <Link href="/owner/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                            Owner Dashboard
                          </Link>
                        )}
                        <Link href="/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>
                          My Bookings
                        </Link>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            Logout
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
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)" }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-full border border-gray-200 transition-all hover:-translate-y-0.5"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setModalContent("register")}
                    style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full transition-all hover:-translate-y-0.5"
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
      </header>

      {/* Mobile category dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg px-4 py-3">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchInputChange}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm text-gray-900 placeholder-gray-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories?.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => { onCategoryToggle ? onCategoryToggle(cat.id) : handleCategoryClick(cat.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-all ${
                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
            {selectedCategories && selectedCategories.length > 0 && onClearCategories && (
              <button
                onClick={() => { onClearCategories(); setMobileMenuOpen(false); }}
                className="px-3 py-1.5 text-sm font-semibold text-red-500 hover:text-red-700 bg-red-50 rounded-full border border-red-200 transition-all"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
