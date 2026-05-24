"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES, LanguageCode } from "@/i18n/config";

interface Props {
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only render language-specific content after hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("i18n_language", code);
    const isRTL = RTL_LANGUAGES.includes(code);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  };

  // Render a stable placeholder until client hydration is complete
  if (!mounted) {
    return (
      <div className="relative shrink-0">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-gray-100 bg-gray-50 text-xs font-semibold text-gray-700 w-16 h-7 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        title={t("common.selectLanguage")}
        className={`flex items-center gap-1 px-1.5 py-1 rounded-md border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-700 ${
          open ? "bg-blue-50 border-blue-200 text-blue-700" : ""
        }`}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        {!compact && (
          <span className="hidden sm:inline max-w-[48px] truncate">
            {currentLang.code.toUpperCase()}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ minWidth: "200px", maxHeight: "360px", overflowY: "auto" }}
        >
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {t("common.selectLanguage")}
            </p>
          </div>

          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code as LanguageCode)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg leading-none w-6 text-center flex-shrink-0">
                    {lang.flag}
                  </span>
                  <span className="flex-1 text-left">{lang.nativeName}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{lang.name}</span>
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
