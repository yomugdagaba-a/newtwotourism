"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const categories = [
    { id: "HERITAGE", name: "Heritage", desc: "Historic sites, ancient churches, castles, archaeological remains, and places that preserve the history, identity, and legacy of the region.", icon: "🏛️", gradient: "from-amber-500 to-orange-600" },
    { id: "HIGHLAND", name: "Highland", desc: "Mountain landscapes, high-altitude plateaus, scenic viewpoints, cool climates, hiking areas, and natural highland environments.", icon: "⛰️", gradient: "from-emerald-500 to-teal-600" },
    { id: "CAVERN", name: "Cavern", desc: "Natural caves, underground formations, rock tunnels, and hidden geological wonders formed over thousands of years.", icon: "🕳️", gradient: "from-purple-500 to-indigo-600" },
    { id: "AQUATICS", name: "Aquatics", desc: "Lakes, rivers, waterfalls, hot springs, wetlands, and water-based natural attractions ideal for relaxation and sightseeing.", icon: "💧", gradient: "from-cyan-500 to-blue-600" },
    { id: "CULTURE", name: "Culture", desc: "Traditional lifestyles, festivals, local customs, music, dance, crafts, languages, and community-based cultural experiences.", icon: "🎭", gradient: "from-rose-500 to-pink-600" },
    { id: "MODERN", name: "Modern", desc: "Modern cities, landmarks, infrastructure, museums, parks, resorts, entertainment centers, and contemporary attractions.", icon: "🏙️", gradient: "from-slate-600 to-gray-700" },
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleViewSelected = () => {
    if (selectedCategories.length === 0) return;
    router.push(`/tourisms?categories=${selectedCategories.join(",")}&sortBy=viewersCount&sortDir=desc`);
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-5 animate-blob animation-delay-4000" />
      </div>
      <TopBar showCategories={false} />
      <section className="relative w-full h-[450px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
        <img src="/images/hero.jpg" alt="North Wollo" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 leading-tight drop-shadow-2xl">Explore North Wollo</h1>
        </div>
      </section>

      <section className="px-4 py-6 bg-white border-b border-gray-200 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/tourisms" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black rounded-full hover:from-blue-600 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all text-base flex items-center gap-2">
                <span>🌍</span>
                <span>View All Places</span>
              </Link>
              <button onClick={handleSelectAll} className="text-sm font-black text-blue-600 hover:text-blue-700 underline underline-offset-2">
                {selectedCategories.length === categories.length ? "Clear All" : "Select All"}
              </button>
              {selectedCategories.length > 0 && <span className="text-sm text-gray-700 font-black">{selectedCategories.length} selected</span>}
            </div>
            <button onClick={handleViewSelected} disabled={selectedCategories.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 font-black rounded-full text-sm transition-all ${selectedCategories.length > 0 ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              <span>🔍</span>
              <span>{selectedCategories.length === 0 ? "Select Categories Below" : `View ${selectedCategories.length} Selected`}</span>
            </button>
          </div>
          <p className="text-gray-700 text-sm mb-3 font-black">Or filter by category:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const getCategoryBgColor = (categoryId: string) => {
                switch(categoryId) {
                  case 'HERITAGE': return isSelected ? 'bg-amber-100 border-amber-400' : 'bg-amber-50 border-amber-300 hover:bg-amber-100';
                  case 'HIGHLAND': return isSelected ? 'bg-green-100 border-green-400' : 'bg-green-50 border-green-300 hover:bg-green-100';
                  case 'CAVERN': return isSelected ? 'bg-gray-200 border-gray-400' : 'bg-gray-100 border-gray-300 hover:bg-gray-200';
                  case 'AQUATICS': return isSelected ? 'bg-blue-100 border-blue-400' : 'bg-blue-50 border-blue-300 hover:bg-blue-100';
                  case 'CULTURE': return isSelected ? 'bg-pink-100 border-pink-400' : 'bg-pink-50 border-pink-300 hover:bg-pink-100';
                  case 'MODERN': return isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100';
                  default: return 'bg-gray-50 border-gray-300';
                }
              };
              return (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`group relative overflow-hidden rounded-lg transition-all duration-300 text-left border-2 font-bold shadow-md hover:shadow-lg hover:scale-[1.01] ${getCategoryBgColor(cat.id)}`}>
                  <div className="relative p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all flex-shrink-0 ${isSelected ? "bg-white/40" : "bg-white/30"}`}>{cat.icon}</div>
                        <h3 className={`text-base font-black transition-colors ${isSelected ? "text-gray-900" : "text-gray-800"}`}>{cat.name}</h3>
                      </div>
                      <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-white border-gray-400 shadow-sm" : "bg-white/50 border-gray-300 hover:border-gray-400 shadow-sm"}`}>
                        {isSelected && <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed transition-colors font-bold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-12 bg-gray-100 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Discover North Wollo&#39;s Rich Heritage</h2>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed font-bold">North Wollo Tourism is your gateway to exploring one of Ethiopia&#39;s most beautiful regions. Home to ancient churches, stunning highlands, mysterious caves, and vibrant cultural traditions.</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-blue-600">✓</span> Verified Destinations</div>
                <div className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-blue-600">✓</span> Local Expert Guides</div>
                <div className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-blue-600">✓</span> Sustainable Tourism</div>
                <div className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-blue-600">✓</span> 24/7 Support</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 text-gray-900 border border-gray-200 shadow-md">
              <h3 className="text-xl font-black mb-3 text-gray-900">Our Vision</h3>
              <p className="text-sm text-gray-700 mb-4 font-bold">To make North Wollo a world-renowned tourism destination while empowering local communities.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200"><div className="text-2xl font-black text-gray-900">2025</div><div className="text-xs text-gray-600 font-bold">Established</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200"><div className="text-2xl font-black text-gray-900">100%</div><div className="text-xs text-gray-600 font-bold">Local Team</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-12 bg-gray-100 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8"><h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900">Get in Touch</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-5 text-center hover:shadow-md transition-all border border-gray-200 shadow-sm"><span className="text-2xl mb-2 block">📍</span><h3 className="font-black text-sm mb-1 text-gray-900">Visit Us</h3><p className="text-xs text-gray-600 font-bold">Woldia, North Wollo Zone</p></div>
            <div className="bg-white rounded-lg p-5 text-center hover:shadow-md transition-all border border-gray-200 shadow-sm"><span className="text-2xl mb-2 block">📞</span><h3 className="font-black text-sm mb-1 text-gray-900">Call Us</h3><p className="text-xs text-gray-600 font-bold">+251 911 234 567</p></div>
            <div className="bg-white rounded-lg p-5 text-center hover:shadow-md transition-all border border-gray-200 shadow-sm"><span className="text-2xl mb-2 block">📧</span><h3 className="font-black text-sm mb-1 text-gray-900">Email Us</h3><p className="text-xs text-gray-600 font-bold">info@northwollotourism.com</p></div>
          </div>
          <div className="flex justify-center gap-3">
            <a href="#" className="w-10 h-10 bg-gray-300 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors text-base">📘</a>
            <a href="#" className="w-10 h-10 bg-gray-300 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors text-base">🐦</a>
            <a href="#" className="w-10 h-10 bg-gray-300 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors text-base">📷</a>
            <a href="#" className="w-10 h-10 bg-gray-300 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors text-base">▶️</a>
            <a href="#" className="w-10 h-10 bg-gray-300 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors text-base">✈️</a>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 bg-blue-900 border-b border-blue-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white text-center md:text-left"><h3 className="text-lg font-bold">Stay Updated</h3></div>
          <form className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 md:w-56 px-3 py-2 rounded-lg bg-blue-800 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-700" />
            <button type="submit" className="px-5 py-2 bg-white text-blue-900 font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
