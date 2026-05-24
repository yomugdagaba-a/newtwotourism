"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import Modal from "@/components/common/Modal";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import ProfileModal from "@/components/common/ProfileModal";
import { useTranslation } from "react-i18next";

interface AvatarDropdownProps {
  onLoginClick?: () => void;
  showShortcuts?: boolean;
}

export default function AvatarDropdown({ onLoginClick, showShortcuts = false }: AvatarDropdownProps) {
  const router = useRouter();
  const { isAuthenticated, username, role, browsingMode, logout, isHydrated, setBrowsingMode } = useAuthStore();
  const [openMenu, setOpenMenu] = useState(false);
  const [modalContent, setModalContent] = useState<"login" | "register" | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpenMenu(false);
    router.push("/");
  };

  const showAuthenticatedUI = mounted && isHydrated && isAuthenticated;

  if (!mounted) return <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse" />;

  return (
    <>
      <div className="flex items-center gap-1 shrink-0" ref={menuRef}>
        {showAuthenticatedUI ? (
          <>
            {/* Owner/Client mode switcher */}
            {showShortcuts && role === "HOTEL_OWNER" && (
              <div className="flex items-center gap-0.5">
                <button onClick={() => setBrowsingMode("OWNER")}
                  className={`px-1.5 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap ${browsingMode === "OWNER" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100 border border-gray-300"}`}>
                  {t("nav.owner")}
                </button>
                <button onClick={() => setBrowsingMode("CLIENT")}
                  className={`px-1.5 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap ${browsingMode === "CLIENT" ? "bg-emerald-500 text-white" : "text-gray-600 hover:bg-gray-100 border border-gray-300"}`}>
                  {t("nav.client")}
                </button>
              </div>
            )}

            {showShortcuts && (role === "CLIENT" || (role === "HOTEL_OWNER" && browsingMode === "CLIENT")) && (
              <Link href="/bookings" className="flex px-1.5 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-all whitespace-nowrap">
                {t("nav.myBookings")}
              </Link>
            )}

            {showShortcuts && role === "HOTEL_OWNER" && browsingMode === "OWNER" && (
              <Link href="/owner/bookings" className="flex px-1.5 py-1 text-[10px] font-semibold text-orange-700 hover:bg-orange-50 rounded-md border border-orange-300 transition-all whitespace-nowrap">
                {t("nav.manage")}
              </Link>
            )}

            {showShortcuts && role === "ADMIN" && (
              <Link href="/admin" className="flex px-1.5 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-50 rounded-md border border-purple-300 transition-all whitespace-nowrap">
                {t("nav.admin")}
              </Link>
            )}

            {/* Avatar + dropdown */}
            <div className="relative">
              <button onClick={() => setOpenMenu(!openMenu)}
                className="flex items-center gap-1 px-1.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-xs font-medium text-gray-900 max-w-[60px] truncate">{username}</span>
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${openMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  {role === "ADMIN" && (
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
        ) : (
          <>
            <button
              onClick={() => onLoginClick ? onLoginClick() : setModalContent("login")}
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-full border border-gray-200 transition-all whitespace-nowrap">
              {t("nav.signIn")}
            </button>
            <button
              onClick={() => setModalContent("register")}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full transition-all whitespace-nowrap">
              {t("nav.join")}
            </button>
          </>
        )}
      </div>

      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} closeOnOutsideClick={false} closeOnEscape={false}>
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
