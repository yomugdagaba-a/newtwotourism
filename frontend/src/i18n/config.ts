import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import am from "./locales/am.json";
import zh from "./locales/zh.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import hi from "./locales/hi.json";
import it from "./locales/it.json";
import tr from "./locales/tr.json";
import sw from "./locales/sw.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English",    nativeName: "English",       flag: "🇬🇧", dir: "ltr" },
  { code: "am", name: "Amharic",    nativeName: "አማርኛ",          flag: "🇪🇹", dir: "ltr" },
  { code: "de", name: "German",     nativeName: "Deutsch",        flag: "🇩🇪", dir: "ltr" },
  { code: "fr", name: "French",     nativeName: "Français",       flag: "🇫🇷", dir: "ltr" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",        flag: "🇸🇦", dir: "rtl" },
  { code: "zh", name: "Chinese",    nativeName: "中文",            flag: "🇨🇳", dir: "ltr" },
  { code: "es", name: "Spanish",    nativeName: "Español",        flag: "🇪🇸", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português",      flag: "🇧🇷", dir: "ltr" },
  { code: "ru", name: "Russian",    nativeName: "Русский",        flag: "🇷🇺", dir: "ltr" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",          flag: "🇯🇵", dir: "ltr" },
  { code: "ko", name: "Korean",     nativeName: "한국어",          flag: "🇰🇷", dir: "ltr" },
  { code: "hi", name: "Hindi",      nativeName: "हिन्दी",         flag: "🇮🇳", dir: "ltr" },
  { code: "it", name: "Italian",    nativeName: "Italiano",       flag: "🇮🇹", dir: "ltr" },
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",         flag: "🇹🇷", dir: "ltr" },
  { code: "sw", name: "Swahili",    nativeName: "Kiswahili",      flag: "🇰🇪", dir: "ltr" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

export const RTL_LANGUAGES: LanguageCode[] = ["ar"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      ar: { translation: ar },
      am: { translation: am },
      zh: { translation: zh },
      es: { translation: es },
      pt: { translation: pt },
      ru: { translation: ru },
      ja: { translation: ja },
      ko: { translation: ko },
      hi: { translation: hi },
      it: { translation: it },
      tr: { translation: tr },
      sw: { translation: sw },
    },
    lng: typeof window !== "undefined"
      ? localStorage.getItem("i18n_language") || "en"
      : "en",
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18n_language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
