"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// In-memory cache: "text|targetLang" -> translated string
const translationCache = new Map<string, string>();

/**
 * Translates arbitrary dynamic text (from DB) using MyMemory free API.
 * Falls back to original text on error or when language is English.
 *
 * Usage:
 *   const translated = useTranslateText(tourism.description);
 */
export function useTranslateText(text: string | null | undefined): string {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [translated, setTranslated] = useState<string>(text || "");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!text) {
      setTranslated("");
      return;
    }

    // No translation needed for English or empty
    if (!currentLang || currentLang === "en" || currentLang.startsWith("en-")) {
      setTranslated(text);
      return;
    }

    const cacheKey = `${text}|${currentLang}`;

    // Return cached result immediately
    if (translationCache.has(cacheKey)) {
      setTranslated(translationCache.get(cacheKey)!);
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    // Show original while translating
    setTranslated(text);

    const controller = abortRef.current;

    // MyMemory free API — 5000 chars/day per IP, no key needed
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|${currentLang}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const result: string =
          data?.responseData?.translatedText || text;
        translationCache.set(cacheKey, result);
        setTranslated(result);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          // Silently fall back to original
          setTranslated(text);
        }
      });

    return () => {
      controller.abort();
    };
  }, [text, currentLang]);

  return translated;
}

/**
 * Translates multiple texts at once.
 * Returns array in same order as input.
 */
export function useTranslateTexts(texts: (string | null | undefined)[]): string[] {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [results, setResults] = useState<string[]>(texts.map((t) => t || ""));

  useEffect(() => {
    if (!currentLang || currentLang === "en" || currentLang.startsWith("en-")) {
      setResults(texts.map((t) => t || ""));
      return;
    }

    const translate = async () => {
      const translated = await Promise.all(
        texts.map(async (text) => {
          if (!text) return "";
          const cacheKey = `${text}|${currentLang}`;
          if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey)!;
          }
          try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|${currentLang}`;
            const res = await fetch(url);
            const data = await res.json();
            const result: string = data?.responseData?.translatedText || text;
            translationCache.set(cacheKey, result);
            return result;
          } catch {
            return text;
          }
        })
      );
      setResults(translated);
    };

    translate();
  }, [JSON.stringify(texts), currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  return results;
}
