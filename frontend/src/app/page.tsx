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
        background: "#f1f5f9",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.08)",
        borderBottom: "1px solid #e2e8f0",
      }} className="px-6 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Action row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/tourisms"
                style={{ fontFamily: TNR, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.25)", fontWeight: 700, fontSize: "0.95rem" }}
                className="px-6 py-2.5 text-white rounded-full hover:scale-105 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <span>View All Places</span>
              </Link>
              <button onClick={handleSelectAll}
                style={{ fontFamily: TNR, fontSize: "0.88rem", fontWeight: 700, boxShadow: "0 2px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)", background: "white", border: "1px solid #e2e8f0" }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 rounded-full transition-all hover:-translate-y-0.5">
                {selectedCategories.length === categories.length ? "Clear All" : "Select All"}
              </button>
              {selectedCategories.length > 0 &&
                <span style={{ fontFamily: TNR, fontSize: "0.88rem", fontStyle: "italic", color: "#059669", fontWeight: 600 }}>
                  {selectedCategories.length} selected
                </span>}
            </div>
            <button onClick={handleViewSelected} disabled={!selectedCategories.length}
              style={{
                fontFamily: TNR, fontSize: "0.88rem", fontWeight: 700,
                ...(selectedCategories.length
                  ? { background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 6px 20px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.25)" }
                  : { background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)", border: "1px solid #e2e8f0" }),
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${selectedCategories.length ? "text-white hover:scale-105 hover:-translate-y-0.5" : "text-gray-400 cursor-not-allowed"}`}>
              <span>{!selectedCategories.length ? "Select Categories Below" : `View ${selectedCategories.length} Selected`}</span>
            </button>
          </div>

          <p style={{ fontFamily: TNR, fontSize: "0.85rem", fontStyle: "italic", color: "#475569", fontWeight: 700 }} className="mb-5">
            ✦ Filter by category of interest:
          </p>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ maxWidth: "70%", margin: "0 auto" }}>
            {categories.map((cat) => {
              const sel = selectedCategories.includes(cat.id);
              return (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                  style={{
                    fontFamily: TNR,
                    borderRadius: "22px",
                    border: "none",
                    background: sel
                      ? `linear-gradient(145deg, ${cat.bgSel} 0%, rgba(255,255,255,0.4) 50%, ${cat.bgSel} 100%)`
                      : `linear-gradient(145deg, ${cat.bgNorm} 0%, rgba(255,255,255,0.3) 50%, ${cat.bgNorm} 100%)`,
                    boxShadow: sel
                      ? `0 24px 60px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,1), inset 0 -3px 8px rgba(0,0,0,0.08), inset 1px 0 0 rgba(255,255,255,0.8)`
                      : `0 14px 40px rgba(0,0,0,0.20), 0 5px 15px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 5px rgba(0,0,0,0.05), inset 1px 0 0 rgba(255,255,255,0.7)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.25s ease",
                    minHeight: "110px",
                  }}
                  className="group relative overflow-hidden text-left hover:scale-[1.04] hover:-translate-y-1.5">

                  <div className="p-5 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {/* Icon bubble */}
                        <div style={{
                          background: `${cat.selBorder}18`,
                          border: `1.5px solid ${cat.border}`,
                          borderRadius: "50%",
                        }} className="w-9 h-9 flex items-center justify-center text-lg flex-shrink-0">
                          {cat.icon}
                        </div>
                        <h3 style={{ color: cat.accent, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.03em" }}>
                          {cat.name}
                        </h3>
                      </div>

                      {/* Diamond checkbox */}
                      <div style={{
                        width: "22px", height: "22px", flexShrink: 0,
                        transform: "rotate(45deg)",
                        border: `2px solid ${sel ? cat.selBorder : "#d1d5db"}`,
                        background: sel ? cat.selBorder : "#f9fafb",
                        boxShadow: sel ? `0 0 10px ${cat.selBorder}70` : "0 1px 3px rgba(0,0,0,0.1)",
                        borderRadius: "3px",
                        transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && (
                          <svg style={{ transform: "rotate(-45deg)", width: "11px", height: "11px" }}
                            fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <p style={{ color: "#4b5563", fontSize: "0.79rem", lineHeight: "1.6", fontWeight: 600 }}>
                      {cat.short}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="px-6 py-14" style={{ background: pageBg, borderBottom: "1px solid #b8c4d0" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 style={{ fontFamily: TNR, color: "#1e293b", fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.3 }}
                className="mb-4">
                Discover North Wollo&#39;s Rich Heritage
              </h2>
              <p style={{ fontFamily: TNR, color: "#475569", lineHeight: 1.85, fontSize: "0.92rem" }} className="mb-5">
                North Wollo Tourism is your gateway to exploring one of Ethiopia&#39;s most beautiful regions.
                Home to ancient churches, stunning highlands, mysterious caves, and vibrant cultural traditions.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {["Verified Destinations","Local Expert Guides","Sustainable Tourism","24/7 Support"].map(item => (
                  <div key={item} style={{ fontFamily: TNR, color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}
                    className="flex items-center gap-2">
                    <span style={{ color: "#059669" }}>✦</span> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Vision card — white, clean, matching screenshot */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #dde3ea",
              boxShadow: "0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)",
              borderRadius: "1rem",
            }} className="p-7">
              <h3 style={{ fontFamily: TNR, color: "#1e293b", fontWeight: 700, fontSize: "1.15rem" }} className="mb-3">
                Our Vision
              </h3>
              <p style={{ fontFamily: TNR, color: "#475569", lineHeight: 1.8, fontSize: "0.88rem" }} className="mb-5">
                To make North Wollo a world-renowned tourism destination while empowering local communities.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[["2025","Established"],["100%","Local Team"]].map(([val, lbl]) => (
                  <div key={lbl} style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                  }} className="p-4 text-center">
                    <div style={{ fontFamily: TNR, color: "#2563eb", fontWeight: 700, fontSize: "1.5rem" }}>{val}</div>
                    <div style={{ fontFamily: TNR, color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="px-6 py-14" style={{ background: pageBg, borderBottom: "1px solid #b8c4d0" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: TNR, color: "#1e293b", fontWeight: 700, fontSize: "1.75rem" }} className="mb-1">
              Get in Touch
            </h2>
            <p style={{ fontFamily: TNR, color: "#94a3b8", fontSize: "0.88rem", fontStyle: "italic" }}>
              We&#39;d love to hear from you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[["📍","Visit Us","Woldia, North Wollo Zone"],["📞","Call Us","+251 911 234 567"],["📧","Email Us","info@northwollotourism.com"]].map(([icon,title,info]) => (
              <div key={title} style={{
                background: "#ffffff",
                border: "1px solid #dde3ea",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                borderRadius: "1.2rem 0.4rem 1.2rem 0.4rem",
              }} className="p-6 text-center hover:scale-[1.02] transition-all">
                <span style={{ fontSize: "1.8rem" }} className="mb-3 block">{icon}</span>
                <h3 style={{ fontFamily: TNR, color: "#1e293b", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.03em" }}
                  className="mb-1">{title}</h3>
                <p style={{ fontFamily: TNR, color: "#64748b", fontSize: "0.8rem" }}>{info}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            {[["📘","#1877f2"],["🐦","#0ea5e9"],["📷","#e1306c"],["▶️","#ff0000"],["✈️","#2563eb"]].map(([icon, color], i) => (
              <a key={i} href="#"
                style={{ background: "#dde3ea", border: "1px solid #c5cdd8", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-base hover:scale-110"
                onMouseEnter={e => (e.currentTarget.style.background = color as string)}
                onMouseLeave={e => (e.currentTarget.style.background = "#dde3ea")}>
                {icon}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="px-6 py-7" style={{
        background: "linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#1e40af 100%)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
      }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 style={{ fontFamily: TNR, fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.03em" }}
              className="text-white">Stay Updated</h3>
            <p style={{ fontFamily: TNR, fontSize: "0.78rem", fontStyle: "italic" }} className="text-blue-200 mt-0.5">
              Get the latest news from North Wollo
            </p>
          </div>
          <form className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Enter your email"
              style={{ fontFamily: TNR, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", fontSize: "0.88rem" }}
              className="flex-1 md:w-56 px-4 py-2.5 rounded-full text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40" />
            <button type="submit"
              style={{ fontFamily: TNR, fontWeight: 600, fontSize: "0.88rem", boxShadow: "0 3px 10px rgba(0,0,0,0.18)" }}
              className="px-5 py-2.5 bg-white text-blue-900 rounded-full hover:bg-gray-50 transition-all">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
