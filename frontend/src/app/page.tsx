"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import { API_BASE_URL } from "@/services/api";

const TNR = "'Times New Roman', Times, serif";

interface HeroImage { id: number; imageUrl: string; title?: string; description?: string; }

export default function HomePage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);

  // Fetch hero images from DB
  useEffect(() => {
    fetch(`${API_BASE_URL}/tourisms/public/hero-images`)
      .then(r => r.ok ? r.json() : [])
      .then((data: HeroImage[]) => { if (data.length) setHeroImages(data); })
      .catch(() => {});
  }, []);

  const categories = [
    { id: "HERITAGE", name: "Heritage",  icon: "🏛️", short: "Historic sites, ancient churches & archaeological remains.", accent: "#92400e", border: "#fbbf24", selBorder: "#d97706", bgNorm: "#fffbeb", bgSel: "#fef3c7" },
    { id: "HIGHLAND", name: "Highland",  icon: "⛰️", short: "Mountain landscapes, plateaus & scenic highland environments.", accent: "#065f46", border: "#6ee7b7", selBorder: "#059669", bgNorm: "#f0fdf4", bgSel: "#d1fae5" },
    { id: "CAVERN",   name: "Cavern",    icon: "🕳️", short: "Natural caves, underground formations & geological wonders.", accent: "#3b0764", border: "#c4b5fd", selBorder: "#7c3aed", bgNorm: "#faf5ff", bgSel: "#ede9fe" },
    { id: "AQUATICS", name: "Aquatics",  icon: "💧", short: "Lakes, rivers, waterfalls & water-based natural attractions.", accent: "#0c4a6e", border: "#7dd3fc", selBorder: "#0284c7", bgNorm: "#f0f9ff", bgSel: "#e0f2fe" },
    { id: "CULTURE",  name: "Culture",   icon: "🎭", short: "Festivals, local customs, crafts & cultural experiences.", accent: "#881337", border: "#fda4af", selBorder: "#e11d48", bgNorm: "#fff1f2", bgSel: "#ffe4e6" },
    { id: "MODERN",   name: "Modern",    icon: "🏙️", short: "Cities, landmarks, museums, parks & contemporary attractions.", accent: "#1e3a5f", border: "#94a3b8", selBorder: "#475569", bgNorm: "#f8fafc", bgSel: "#e2e8f0" },
  ];

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleViewSelected = () => {
    if (!selectedCategories.length) return;
    router.push(`/tourisms?categories=${selectedCategories.join(",")}&sortBy=viewersCount&sortDir=desc`);
  };

  const handleSelectAll = () =>
    setSelectedCategories(prev => prev.length === categories.length ? [] : categories.map(c => c.id));

  // Page-wide background: soft blue-gray matching the screenshot
  const pageBg = "#cfd8e3";

  return (
    <div className="min-h-screen" style={{ background: pageBg, fontFamily: TNR }}>
      <TopBar showCategories={false} />

      {/* ── Hero ── */}
      <section className="px-6 py-4" style={{ background: pageBg }}>
        <div className="relative w-full h-[360px] overflow-hidden rounded-2xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>

          {/* Dark overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.45) 100%)" }} />

          {/* Scrolling strip */}
          {heroImages.length > 0 ? (
            <div className="absolute inset-0 flex items-stretch"
              style={{
                display: 'flex',
                width: 'max-content',
                animation: `heroScroll ${heroImages.length * 6}s linear infinite`,
              }}>
              {/* Duplicate for seamless loop */}
              {[...heroImages, ...heroImages].map((img, i) => (
                <img key={i} src={img.imageUrl} alt={img.title || 'Hero'}
                  style={{ height: '360px', width: 'auto', flexShrink: 0, display: 'block' }} />
              ))}
            </div>
          ) : (
            <img src="/images/hero.jpg" alt="North Wollo" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Text overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-4">
            <h1 style={{ fontFamily: TNR, textShadow: "0 3px 18px rgba(0,0,0,0.65)", letterSpacing: "0.03em", fontWeight: 700 }}
              className="text-4xl md:text-5xl mb-3 leading-tight text-center">
              Explore North Wollo
            </h1>
            <p style={{ fontFamily: TNR, textShadow: "0 2px 8px rgba(0,0,0,0.55)", fontStyle: "italic", fontSize: "1.05rem" }}
              className="text-gray-100 text-center">
              Discover heritage, highlands &amp; hidden wonders of Ethiopia
            </p>
          </div>
        </div>
      </section>
      <section style={{
        background: "#dde4ed",
        boxShadow: "0 8px 40px rgba(0,0,0,0.28), inset 0 2px 12px rgba(0,0,0,0.10)",
        borderBottom: "1px solid #c5cfd9",
      }} className="px-6 py-5">
        <div className="max-w-6xl mx-auto">

          {/* Row 1: View All Places | Select All | ✦ Filter text | → Select Categories Below */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link href="/tourisms"
              style={{ fontFamily: TNR, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 20px rgba(37,99,235,0.45)", fontWeight: 700, fontSize: "0.88rem" }}
              className="px-5 py-2 text-white rounded-full hover:scale-105 transition-all flex-shrink-0">
              View All Places
            </Link>
            <button onClick={handleSelectAll}
              style={{ fontFamily: TNR, fontSize: "0.82rem", fontWeight: 700, background: "white", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              className="px-3 py-1.5 text-blue-600 hover:text-blue-800 rounded-full transition-all flex-shrink-0">
              {selectedCategories.length === categories.length ? "Clear All" : "Select All"}
            </button>
            {/* Filter label inline */}
            <span style={{ fontFamily: TNR, fontSize: "0.85rem", color: "#1e293b", fontWeight: 800 }} className="flex-shrink-0">
              ✦ Filter by category of interest:
            </span>
            {selectedCategories.length > 0 &&
              <span style={{ fontFamily: TNR, fontSize: "0.78rem", fontStyle: "italic", color: "#059669", fontWeight: 600 }} className="flex-shrink-0">
                {selectedCategories.length} selected
              </span>}
            {/* Push "Select Categories" to far right */}
            <div className="flex-1" />
            <button onClick={handleViewSelected} disabled={!selectedCategories.length}
              style={{
                fontFamily: TNR, fontSize: "0.85rem", fontWeight: 800, flexShrink: 0,
                ...(selectedCategories.length
                  ? { background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 6px 20px rgba(5,150,105,0.4)" }
                  : { background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }),
              }}
              className={`px-4 py-2 rounded-full transition-all ${selectedCategories.length ? "text-white hover:scale-105" : "text-gray-700 cursor-not-allowed"}`}>
              {!selectedCategories.length ? "Select Categories Below" : `View ${selectedCategories.length} Selected`}
            </button>
          </div>

          {/* Row 2: All 6 category buttons in ONE row */}
          <div className="grid grid-cols-6 gap-3" style={{ marginBottom: "48px" }}>
            {categories.map((cat) => {
              const sel = selectedCategories.includes(cat.id);
              return (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                  style={{
                    fontFamily: TNR,
                    borderRadius: "16px",
                    border: "none",
                    minHeight: "115px",
                    background: "#ffffff",
                    boxShadow: sel
                      ? `0 8px 22px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,1)`
                      : `0 4px 14px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,1)`,
                    transition: "all 0.2s ease",
                  }}
                  className="text-left hover:scale-[1.03] hover:-translate-y-1 transition-all">
                  <div className="p-3 flex flex-col gap-2 h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{
                          background: `${cat.selBorder}18`,
                          border: `1.5px solid ${cat.border}`,
                          borderRadius: "50%",
                        }} className="w-8 h-8 flex items-center justify-center text-base flex-shrink-0">
                          {cat.icon}
                        </div>
                        <h3 style={{ color: cat.accent, fontWeight: 900, fontSize: "0.88rem" }}>
                          {cat.name}
                        </h3>
                      </div>
                      {/* Square checkbox */}
                      <div style={{
                        width: "16px", height: "16px", flexShrink: 0,
                        border: `2.5px solid #111827`,
                        background: sel ? "#111827" : "#ffffff",
                        borderRadius: "3px",
                        transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && (
                          <svg style={{ width: "9px", height: "9px" }}
                            fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <p style={{ color: "#374151", fontSize: "12px", lineHeight: "1.5", fontWeight: 700 }}>
                      {cat.short}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Row 3: Minimal stats card below the 6 buttons */}
          <div style={{
            background: "#e8edf3",
            border: "1px solid #d0d8e4",
            borderRadius: "0.75rem",
          }} className="p-3">
            <div className="flex flex-wrap items-center gap-8">
              <div style={{ fontFamily: TNR, color: "#1e293b", fontWeight: 700, fontSize: "0.9rem" }}>
                North Wollo Tourism — Est. 2026
              </div>
              <div className="flex gap-6">
                {[["2026","Established"],["100%","Local Team"],["50+","Destinations"],["21","Woredas Covered"]].map(([val, lbl]) => (
                  <div key={lbl} className="text-center">
                    <div style={{ fontFamily: TNR, color: "#2563eb", fontWeight: 700, fontSize: "1.1rem" }}>{val}</div>
                    <div style={{ fontFamily: TNR, color: "#64748b", fontSize: "12px", fontWeight: 600 }}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1" />
              <div style={{ fontFamily: TNR, color: "#475569", fontSize: "12px", fontWeight: 600, fontStyle: "italic" }}>
                Full details in the footer below ↓
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="px-6 py-7" style={{
        background: pageBg,
        borderTop: "1px solid #b8c4d0",
        borderBottom: "1px solid #b8c4d0",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 style={{ fontFamily: TNR, fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.03em", color: "#1e293b" }}>
              Stay Updated
            </h3>
            <p style={{ fontFamily: TNR, fontSize: "0.78rem", fontStyle: "italic", color: "#64748b" }} className="mt-0.5">
              Get the latest news from North Wollo
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Enter your email"
              style={{ fontFamily: TNR, background: "rgba(255,255,255,0.8)", border: "1px solid #cbd5e1", fontSize: "0.88rem", color: "#1e293b" }}
              className="flex-1 md:w-56 px-4 py-2.5 rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button
              type="button"
              onClick={() => router.push('/auth/register')}
              style={{ fontFamily: TNR, fontWeight: 600, fontSize: "0.88rem", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 3px 10px rgba(37,99,235,0.35)" }}
              className="px-5 py-2.5 text-white rounded-full hover:scale-105 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
