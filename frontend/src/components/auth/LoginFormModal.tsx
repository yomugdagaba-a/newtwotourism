"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { validateForm, hasErrors, schemas, ValidationErrors } from "@/utils/validation";
import BlockedBanner from "@/components/common/BlockedBanner";
import { useTranslation } from "react-i18next";

interface Props {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onCancel?: () => void;
}

export default function LoginFormModal({ onSuccess, onRegisterClick, onCancel }: Props) {
  const [formData, setFormData] = useState({ usernameOrEmail: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  const getDefaultRedirect = (role: string | null) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'HOTEL_OWNER': return '/owner/bookings';
      default: return '/';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const validationErrors = validateForm(formData, schemas.login);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;
    setLoading(true);
    try {
      const res = await login({ username: formData.usernameOrEmail, password: formData.password });
      if (res?.token) {
        auth.login(res.token, res.refreshToken, res.userId);
        if (onSuccess) {
          onSuccess();
        } else {
          const currentAuth = useAuthStore.getState();
          router.push(getDefaultRedirect(currentAuth.role));
        }
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err: any) {
      setServerError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Icon + Title */}
      <div className="flex flex-col items-center pt-1 pb-3">
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-base font-black text-gray-900">{t("auth.signIn")}</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{t("common.northWolloTourism")}</p>
      </div>

      {/* Sign In header row */}
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-100">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="font-black text-gray-900 text-sm">Sign In</span>
      </div>

      {serverError && (
        <div className="mb-2">
          <BlockedBanner message={serverError} onClose={() => setServerError("")} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Username / Email */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-1">
            {t("auth.username")} / {t("auth.email")} <span className="text-red-500">*</span>
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow bg-gray-50 ${errors.usernameOrEmail ? 'ring-1 ring-red-300' : ''}`}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="text"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              placeholder={t("auth.enterEmail")}
              autoComplete="username email"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>
          {errors.usernameOrEmail && <p className="mt-0.5 text-xs text-red-600 font-semibold">{errors.usernameOrEmail}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-1">
            {t("auth.password")} <span className="text-red-500">*</span>
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow bg-gray-50 ${errors.password ? 'ring-1 ring-red-300' : ''}`}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.enterPassword")}
              autoComplete="current-password"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-0.5 text-xs text-red-600 font-semibold">{errors.password}</p>}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link href="/auth/reset-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        {/* Sign In button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !formData.usernameOrEmail.trim() || !formData.password.trim()}
            className="px-10 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("common.loading")}
              </span>
            ) : t("auth.signIn")}
          </button>
        </div>

        {/* Cancel button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : router.push('/')}
            className="px-10 py-2 rounded-xl border border-gray-200 shadow-sm bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>

      {/* Divider + Register */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
        <span className="text-sm text-gray-500 font-medium">{t("auth.noAccount")} </span>
        {onRegisterClick ? (
          <button type="button" onClick={onRegisterClick} className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">
            {t("auth.signUp")}
          </button>
        ) : (
          <Link href="/auth/register" className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">
            {t("auth.signUp")}
          </Link>
        )}
      </div>
    </div>
  );
}
