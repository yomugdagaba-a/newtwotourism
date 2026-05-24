"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.service";
import Link from "next/link";
import BlockedBanner from "@/components/common/BlockedBanner";
import { useTranslation } from "react-i18next";

interface Props {
  onSuccess?: () => void;
  onLoginClick?: () => void;
  onCancel?: () => void;
}

const validateFullName = (v: string) => !v.trim() ? "Required" : v.trim().length < 2 ? "Min 2 chars" : !/^[a-zA-Z\s]+$/.test(v.trim()) ? "Letters only" : null;
const validateUsername = (v: string) => !v.trim() ? "Required" : v.length < 4 ? "Min 4 chars" : !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v) ? "Start with letter" : null;
const validateEmail = (v: string) => !v.trim() ? "Required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email" : null;
const validatePassword = (v: string) => !v ? "Required" : v.length < 8 ? "Min 8 chars" : (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) ? "Need upper, lower & number" : null;
const validateConfirm = (p: string, c: string) => !c ? "Required" : p !== c ? "Passwords don't match" : null;

const getStrength = (p: string) => [p.length >= 8, /[a-z]/.test(p), /[A-Z]/.test(p), /\d/.test(p), /[^a-zA-Z0-9]/.test(p)].filter(Boolean).length;
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

function PasswordInput({ name, value, onChange, placeholder, disabled }: {
  name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; disabled: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg shadow-sm bg-gray-100/20">
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <input type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
      <button type="button" onClick={() => setShow(s => !s)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        {show ? (
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
  );
}

export default function RegisterFormModal({ onSuccess, onLoginClick, onCancel }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError("");
  };

  const validateAll = () => {
    const e: Record<string, string> = {};
    const fn = validateFullName(formData.fullName); if (fn) e.fullName = fn;
    const un = validateUsername(formData.username); if (un) e.username = un;
    const em = validateEmail(formData.email); if (em) e.email = em;
    const pw = validatePassword(formData.password); if (pw) e.password = pw;
    const cp = validateConfirm(formData.password, formData.confirmPassword); if (cp) e.confirmPassword = cp;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateAll()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      if (onSuccess) onSuccess();
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&from=register`);
    } catch (err: any) {
      setServerError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(formData.password);

  return (
    <div className="w-full">
      {/* Icon + Title — compact */}
      <div className="flex flex-col items-center pt-1 pb-2">
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h2 className="text-base font-black text-gray-900">{t("auth.register")}</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{t("common.northWolloTourism")}</p>
      </div>

      {serverError && (
        <div className="mb-2">
          <BlockedBanner message={serverError} onClose={() => setServerError("")} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Full Name + Username — 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-black text-gray-800 mb-1">{t("profile.myProfile")} <span className="text-red-500">*</span></label>
            <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg shadow-sm bg-gray-100/20 ${errors.fullName ? 'ring-1 ring-red-300' : ''}`}>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                placeholder={t("auth.enterUsername")} disabled={loading}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
            </div>
            {errors.fullName && <p className="mt-0.5 text-xs text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-black text-gray-800 mb-1">{t("auth.username")} <span className="text-red-500">*</span></label>
            <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg shadow-sm bg-gray-100/20 ${errors.username ? 'ring-1 ring-red-300' : ''}`}>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                placeholder={t("auth.enterUsername")} disabled={loading}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
            </div>
            {errors.username && <p className="mt-0.5 text-xs text-red-600">{errors.username}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-1">{t("auth.email")} <span className="text-red-500">*</span></label>
          <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg shadow-sm bg-gray-100/20 ${errors.email ? 'ring-1 ring-red-300' : ''}`}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder={t("auth.enterEmail")} disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
          </div>
          {errors.email && <p className="mt-0.5 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Password + Confirm — 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-black text-gray-800 mb-1">{t("auth.password")} <span className="text-red-500">*</span></label>
            <div className={errors.password ? 'ring-1 ring-red-300 rounded-lg' : ''}>
              <PasswordInput name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" disabled={loading} />
            </div>
            {errors.password && <p className="mt-0.5 text-xs text-red-600">{errors.password}</p>}
            {formData.password && (
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : 'bg-gray-200'}`} />
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-black text-gray-800 mb-1">{t("auth.confirmPassword")} <span className="text-red-500">*</span></label>
            <div className={errors.confirmPassword ? 'ring-1 ring-red-300 rounded-lg' : ''}>
              <PasswordInput name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" disabled={loading} />
            </div>
            {errors.confirmPassword && <p className="mt-0.5 text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center font-medium">
          {t("auth.verifyEmail")}
        </p>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => onCancel ? onCancel() : router.push('/')}
            className="flex-1 py-2 border border-gray-200 shadow-sm text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm bg-white">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition-colors text-sm shadow-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("common.loading")}
              </span>
            ) : t("auth.register")}
          </button>
        </div>
      </form>

      {/* Sign In link */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
        <span className="text-sm text-gray-500 font-medium">{t("auth.hasAccount")} </span>
        {onLoginClick ? (
          <button type="button" onClick={onLoginClick} className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">{t("auth.signIn")}</button>
        ) : (
          <Link href="/auth/login" className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">{t("auth.signIn")}</Link>
        )}
      </div>
    </div>
  );
}
