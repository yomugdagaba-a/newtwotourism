"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";
import { RTL_LANGUAGES, LanguageCode } from "@/i18n/config";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Restore saved language on client only
    const saved = localStorage.getItem("i18n_language") as LanguageCode | null;
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
    const lang = (saved || i18n.language) as LanguageCode;
    const isRTL = RTL_LANGUAGES.includes(lang);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    setMounted(true);
  }, []);

  // Always wrap in I18nextProvider so hooks work,
  // but suppress hydration warnings on the wrapper div
  return (
    <I18nextProvider i18n={i18n}>
      <div suppressHydrationWarning>
        {children}
      </div>
    </I18nextProvider>
  );
}
