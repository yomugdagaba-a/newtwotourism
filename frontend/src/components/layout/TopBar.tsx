"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/common/Modal";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import ProfileModal from "@/components/common/ProfileModal";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface Props {
  keyword?: string;
  onSearch?: (keyword: string) => void;
  showCategories?: boolean;
  transparent?: boolean;
  categories?: string[];
  onCategoryToggle?: (category: string) => void;
  onClearCategories?: () => void;
  liveSearch?: boolean;
  showBackButton?: boolean;
  pageTitle?: string;
  showAdminMenu?: boolean;
  actionButtons?: React.ReactNode;
}

const CATEGORIES = [
  { id: "HERITAGE", label: "Heritage" },
  { id: "HIGHLAND", label: "Highland" },
  { id: "CAVERN", label: "Cavern" },
  { id: "AQUATICS", label: "Aquatics" },
  { id: "CULTURE", label: "Culture" },
  { id: "MODERN", label: "Modern" },
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
  showBackButton = false,
  pageTitle,
  showAdminMenu = false,
  actionButtons,
}: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [modalContent, setModalContent] = useState<"login" | "register" | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchValue, setSearchValue] = useState(keyword);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, username, role, browsingMode, logout, isHydrated, setBrowsingMode } = useAuthStore();
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => { setMounted(true); }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    if (onSearch) onSearch(searchValue);
    else router.push(`/tourisms?keyword=${encodeURIComponent(searchValue)}`);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (!liveSearch && !onSearch && value === "") router.push("/tourisms");
  };

  const handleCategoryClick = (categoryId: string) => {
    setCatDropdownOpen(false);
    router.push(`/tourisms?categories=${categoryId}`);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 ${transparent ? "bg-white/95 backdrop-blur-lg" : "bg-white"} border-b border-gray-200`}>
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center h-12 gap-1">

            {/* Admin hamburger */}
            {showAdminMenu && (
              <button
                onClick={() => { if (typeof window !== 'undefined' && (window as any).__toggleAdminSidebar) (window as any).__toggleAdminSidebar(); }}
                className="flex items-center justify-center w-7 h-7 text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Back button — arrow only */}
            {showBackButton && (
              <button onClick={() => router.push('/')} className="flex items-center justify-center w-7 h-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}

            {/* Page title — hidden on mobile */}
            {pageTitle && (
              <div className="shrink-0 hidden sm:block">
                <span className="text-sm font-bold text-gray-900">{pageTitle}</span>
              </div>
            )}

            {/* Logo — hidden on mobile */}
            {!pageTitle && (
              <Link href="/" className="flex items-center gap-1 group shrink-0">
                <div className="hidden sm:flex w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg items-center justify-center text-white font-bold text-xs shadow group-hover:scale-105 transition-transform">
                  NW
                </div>
              </Link>
            )}

            {/* Spacer — on desktop pushes everything right; on mobile collapses */}
            <div className="flex-1 min-w-0" />

            {/* Categories dropdown button — mobile/tablet (< lg) */}
            {showCategories && (
              <div className="lg:hidden relative shrink-0" ref={catDropdownRef}>
                <button
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className={`flex items-center gap-0.5 px-1.5 py-1 text-xs font-semibold rounded-md border transition-all whitespace-nowrap ${
                    catDropdownOpen || (selectedCategories && selectedCategories.length > 0)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-100'
                  }`}
                >
                  <span>{t("common.exploreCategories")}</span>
                  <svg className={`w-3 h-3 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {catDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories?.includes(cat.id);
                      return (
                        <button key={cat.id}
                          onClick={() => { onCategoryToggle ? onCategoryToggle(cat.id) : handleCategoryClick(cat.id); setCatDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-all ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          <span>{t(`categories.${cat.id}`)}</span>
                        </button>
                      );
                    })}
                    {selectedCategories && selectedCategories.length > 0 && onClearCategories && (
                      <button onClick={() => { onClearCategories(); setCatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 border-t border-gray-100 mt-1">
                        ✕ {t("common.cancel")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category pills — desktop only (lg+) */}
            {showCategories && (
              <div className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide shrink-0">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories?.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryToggle ? onCategoryToggle(cat.id) : handleCategoryClick(cat.id)}
                      className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-full border transition-all whitespace-nowrap ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100"
                      }`}
                    >
                      {t(`categories.${cat.id}`)}
                    </button>
                  );
                })}
                {selectedCategories && selectedCategories.length > 0 && onClearCategories && (
                  <button onClick={onClearCategories} className="px-2.5 py-1.5 text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full border border-red-100 transition-all whitespace-nowrap">
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Search — after categories */}
            {(!showAdminMenu || (showAdminMenu && onSearch)) && (
              <form onSubmit={handleSearch} className="shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={handleSearchInputChange}
                    placeholder={t("common.search")}
                    suppressHydrationWarning
                    className="w-16 sm:w-28 lg:w-40 pl-6 lg:pl-7 pr-1 py-1 lg:py-1.5 bg-gray-50 border border-gray-100 rounded-md lg:rounded-lg focus:ring-1 focus:ring-blue-100 focus:bg-white transition-all text-xs lg:text-sm text-gray-900 placeholder-gray-400 outline-none"
                  />
                  <svg className="absolute left-1.5 lg:left-2 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            )}

            {/* Action Buttons — after search */}
            {actionButtons && (
              <div className="flex items-center gap-1 shrink-0">{actionButtons}</div>
            )}

            {/* Auth shortcuts — Owner/Client switcher + Bookings/Manage/Admin */}
            {showAuthenticatedUI && (
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Owner/Client mode switcher */}
                {role === "HOTEL_OWNER" && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setBrowsingMode("OWNER")}
                      className={`px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-xs font-semibold rounded lg:rounded-md transition-all whitespace-nowrap ${browsingMode === "OWNER" ? "bg-orange-500 text-white border border-orange-400" : "text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>
                      {t("nav.owner")}
                    </button>
                    <button onClick={() => setBrowsingMode("CLIENT")}
                      className={`px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-xs font-semibold rounded lg:rounded-md transition-all whitespace-nowrap ${browsingMode === "CLIENT" ? "bg-emerald-500 text-white border border-emerald-400" : "text-gray-600 hover:bg-gray-100 border border-gray-100"}`}>
                      {t("nav.client")}
                    </button>
                  </div>
                )}

                {/* My Bookings */}
                {(role === "CLIENT" || (role === "HOTEL_OWNER" && browsingMode === "CLIENT")) && (
                  <Link href="/bookings"
                    className="flex items-center px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded lg:rounded-md border border-gray-100 transition-all whitespace-nowrap">
                    {t("nav.myBookings")}
                  </Link>
                )}

                {/* Manage */}
                {role === "HOTEL_OWNER" && browsingMode === "OWNER" && (
                  <Link href="/owner/bookings"
                    className="flex items-center px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-xs font-semibold text-orange-700 hover:bg-orange-50 rounded lg:rounded-md border border-orange-100 transition-all whitespace-nowrap">
                    {t("nav.manage")}
                  </Link>
                )}

                {/* Admin shortcut */}
                {role === "ADMIN" && !showAdminMenu && (
                  <Link href="/admin"
                    className="flex items-center px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-[10px] lg:text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded lg:rounded-md border border-purple-100 transition-all whitespace-nowrap">
                    {t("nav.admin")}
                  </Link>
                )}
              </div>
            )}

            {/* Auth area — avatar always at rightmost */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Language Switcher — always visible */}
              <LanguageSwitcher />

              {showAuthenticatedUI ? (
                <>
                  {/* User avatar + dropdown */}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(!openMenu)}
                      className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-1.5 py-0.5 lg:py-1 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                      <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs lg:text-sm font-bold shrink-0">
                        {username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <svg className={`w-3 h-3 text-gray-400 transition-transform ${openMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {openMenu && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-bold text-gray-900">{username}</p>
                          <p className="text-xs text-gray-500">{role}</p>
                        </div>
                        <button onClick={() => { setShowProfileModal(true); setOpenMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100">{t("nav.myProfile")}</button>
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.home")}</Link>
                        <Link href="/tourisms" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.explore")}</Link>
                        <Link href="/hotels" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.hotels")}</Link>
                        {(role === "CLIENT" || (role === "HOTEL_OWNER" && browsingMode === "CLIENT")) && (
                          <Link href="/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.myBookings")}</Link>
                        )}
                        {role === "HOTEL_OWNER" && browsingMode === "OWNER" && (
                          <Link href="/owner/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.manageBookings")}</Link>
                        )}
                        {role === "ADMIN" && !showAdminMenu && (
                          <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.adminPanel")}</Link>
                        )}
                        {role === "HOTEL_OWNER" && (
                          <Link href="/owner/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setOpenMenu(false)}>{t("nav.ownerDashboard")}</Link>
                        )}
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">{t("nav.logout")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : mounted ? (
                <>
                  <button onClick={() => setModalContent("login")} className="px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-full border border-gray-100 transition-all whitespace-nowrap">
                    {t("nav.signIn")}
                  </button>
                  <button onClick={() => setModalContent("register")} className="px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full border border-blue-400 transition-all whitespace-nowrap">
                    {t("nav.join")}
                  </button>
                </>
              ) : (
                <div className="w-8 h-7 bg-gray-100 rounded-lg animate-pulse" />
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} closeOnOutsideClick={false} closeOnEscape={false} size={modalContent === 'register' ? 'lg' : 'md'}>
        {modalContent === "login" && (
          <LoginForm onSuccess={() => setModalContent(null)} onRegisterClick={() => setModalContent("register")} onCancel={() => setModalContent(null)} />
        )}
        {modalContent === "register" && (
          <RegisterForm onSuccess={() => setModalContent(null)} onLoginClick={() => setModalContent("login")} onCancel={() => setModalContent(null)} />
        )}
      </Modal>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
