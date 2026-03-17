"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import LoginForm from "@/app/auth/login/page";
import RegisterForm from "@/app/auth/register/page";
import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";
import { fetchTourismPlaces } from "@/services/tourism.service";
import { useAuthStore } from "@/store/useAuthStore";

export interface TourismPublicCard {
  id: number;
  name: string;
  imageUrl?: string;
  viewersCount: number;
  category?: string;
  wereda?: string;
  description?: string;
}

const CATEGORIES = [
  { id: "HERITAGE", icon: "🕌", label: "Heritage" },
  { id: "HIGHLAND", icon: "⛰️", label: "Highland" },
  { id: "CAVERN", icon: "🕳️", label: "Cavern" },
  { id: "AQUATICS", icon: "🌊", label: "Aquatics" },
  { id: "CULTURE", icon: "🎭", label: "Culture" },
  { id: "MODERN", icon: "🏛️", label: "Modern" },
];

export default function TourismListingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("categories") || "";
  const keywordParam = searchParams.get("keyword") || "";
  const sortByParam = searchParams.get("sortBy") || "viewersCount";
  const sortDirParam = searchParams.get("sortDir") || "desc";
  const initialCategories = categoryParam ? categoryParam.split(",") : [];

  // States
  const [tourismPlaces, setTourismPlaces] = useState<TourismPublicCard[]>([]);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [currentKeyword, setCurrentKeyword] = useState(keywordParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [sortDir, setSortDir] = useState(sortDirParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Auth state
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalContent, setAuthModalContent] = useState<"login" | "register" | null>(null);
  const [pendingNavId, setPendingNavId] = useState<number | null>(null);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [navError, setNavError] = useState<string | null>(null);

  // Fetch places
  const fetchPlaces = useCallback(async (page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTourismPlaces({ 
        categories, 
        keyword: currentKeyword,
        page,
        size: pageSize,
        sortBy,
        sortDir
      });

      const formattedPlaces = (response?.content || []).map((place: any) => ({
        id: place.id ?? 0,
        name: place.name ?? "Unknown",
        imageUrl: place.imageUrl ?? "/images/placeholder.jpg",
        viewersCount: place.viewersCount ?? 0,
        category: place.category,
        wereda: place.wereda,
        description: place.description,
      }));

      setTourismPlaces(formattedPlaces);
      setCurrentPage(response.number ?? 0);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } catch (err) {
      console.error("Failed to fetch tourism places:", err);
      setError("Failed to load destinations. Please try again.");
      setTourismPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [categories, currentKeyword, pageSize, sortBy, sortDir]);

  useEffect(() => {
    fetchPlaces(0);
  }, [categories.join(","), currentKeyword, pageSize, sortBy, sortDir, fetchPlaces]);

  const handleCategoryToggle = useCallback((category: string) => {
    setCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      return newCategories;
    });
  }, []);

  // Update URL when categories change (separate from state update to avoid React warning)
  useEffect(() => {
    const params = new URLSearchParams();
    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    }
    if (currentKeyword.trim()) {
      params.set("keyword", currentKeyword);
    }
    if (sortBy !== "viewersCount") {
      params.set("sortBy", sortBy);
    }
    if (sortDir !== "desc") {
      params.set("sortDir", sortDir);
    }
    const newUrl = params.toString() ? `/tourisms?${params.toString()}` : "/tourisms";
    router.replace(newUrl, { scroll: false });
  }, [categories, currentKeyword, sortBy, sortDir, router]);

  const handleSearch = useCallback((keyword: string) => {
    setCurrentKeyword(keyword);
    // URL update is handled by the useEffect above
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchPlaces(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchPlaces]);

  // Navigation
  const navigateWithFeedback = async (tourismId: number) => {
    setNavError(null);
    setNavigatingId(tourismId);
    try {
      router.push(`/tourisms/${tourismId}`);
    } catch (err: any) {
      console.error("Navigation failed:", err);
      setNavError("Unable to open details. Please try again.");
    } finally {
      setNavigatingId(null);
    }
  };

  const requireAuthThenNavigate = (tourismId: number) => {
    if (isAuthenticated) {
      navigateWithFeedback(tourismId);
      return;
    }
    setPendingNavId(tourismId);
    setAuthModalContent("login");
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setAuthModalOpen(false);
    if (pendingNavId) {
      const id = pendingNavId;
      setPendingNavId(null);
      setTimeout(() => navigateWithFeedback(id), 500);
    }
  };

  const handleRegisterSuccess = () => {
    setAuthModalOpen(false);
    setAuthModalContent(null);
    if (pendingNavId) {
      const id = pendingNavId;
      setPendingNavId(null);
      setTimeout(() => navigateWithFeedback(id), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-200/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-300/10 via-transparent to-transparent"></div>

      <TopBar 
        keyword={currentKeyword} 
        onSearch={handleSearch}
        showCategories={false}
        liveSearch={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 mb-4 transition-colors font-bold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Category Filter Pills - Top Position with Professional Gray Background */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-black transition-all duration-300 shadow-md hover:scale-105 border-2 ${
                  categories.includes(cat.id)
                    ? "bg-blue-600 text-white shadow-blue-300/40 border-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border-gray-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {categories.includes(cat.id) && (
                  <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ))}
            {categories.length > 0 && (
              <button
                onClick={() => {
                  setCategories([]);
                  router.replace("/tourisms", { scroll: false });
                }}
                className="px-3 py-2 text-sm font-black text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-red-300"
              >
                ✕ Clear
              </button>
            )}
            {/* Sort - Inline */}
            <div className="ml-auto flex items-center gap-2">
              <select 
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [newSortBy, newSortDir] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortDir(newSortDir);
                }}
                className="bg-white text-gray-900 rounded-xl px-3 py-2 text-sm font-black focus:ring-2 focus:ring-blue-500 shadow-md cursor-pointer hover:bg-gray-50 transition-all border-2 border-gray-300"
              >
                <option value="viewersCount-desc">Popular</option>
                <option value="viewersCount-asc">Least Popular</option>
                <option value="name-asc">A-Z</option>
                <option value="name-desc">Z-A</option>
              </select>
              <span className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-black border-2 border-blue-700">
                {totalElements}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between shadow-md">
            <p className="text-xs font-black text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 font-black text-xs px-2 py-1 rounded-lg hover:bg-red-100 transition-all">
              ✕
            </button>
          </div>
        )}

        {/* Tourism Grid - 4 Cards Per Row, Larger */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(pageSize).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl shadow-md overflow-hidden animate-pulse border border-gray-200">
                <div className="h-44 bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tourismPlaces.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border border-gray-200 shadow-md">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No Destinations Found</h2>
            <button
              onClick={() => {
                setCategories([]);
                setCurrentKeyword("");
                router.replace("/tourisms", { scroll: false });
              }}
              className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-md text-sm"
            >
              View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tourismPlaces.map((tourism) => (
              <TourismCard
                key={tourism.id}
                tourism={tourism}
                isNavigating={navigatingId === tourism.id}
                onClick={() => requireAuthThenNavigate(tourism.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination - Compact */}
        {totalElements > 0 && (
          <div className="mt-4 pb-4 bg-white rounded-xl shadow-md p-3 border border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(size) => { setPageSize(size); fetchPlaces(0); }}
              pageSizeOptions={[10, 15, 20, 25, 30]}
            />
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <Modal isOpen={authModalOpen} onClose={() => { setAuthModalOpen(false); setPendingNavId(null); setAuthModalContent(null); }}>
        {authModalContent === "login" && (
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onRegisterClick={() => setAuthModalContent("register")}
            onCancel={() => { setAuthModalOpen(false); setPendingNavId(null); setAuthModalContent(null); }}
          />
        )}
        {authModalContent === "register" && (
          <RegisterForm 
            onSuccess={handleRegisterSuccess} 
            onLoginClick={() => setAuthModalContent("login")}
            onCancel={() => { setAuthModalOpen(false); setPendingNavId(null); setAuthModalContent(null); }}
          />
        )}
      </Modal>

      {navError && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-lg z-50 max-w-sm border-2 border-red-700 font-black">
          {navError}
        </div>
      )}

      {/* CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}

// Tourism Card Component - Larger with Category-Based Background Colors
function TourismCard({ 
  tourism, 
  isNavigating, 
  onClick 
}: { 
  tourism: TourismPublicCard; 
  isNavigating: boolean;
  onClick: () => void;
}) {
  // Category-based gradient backgrounds for image placeholder
  const getCategoryBg = (category?: string) => {
    switch(category) {
      case 'HERITAGE': return 'bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200';
      case 'HIGHLAND': return 'bg-gradient-to-br from-green-100 via-emerald-100 to-green-200';
      case 'CAVERN': return 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400';
      case 'AQUATICS': return 'bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200';
      case 'CULTURE': return 'bg-gradient-to-br from-purple-100 via-violet-100 to-purple-200';
      case 'MODERN': return 'bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200';
      default: return 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-2 border border-gray-200 hover:border-blue-300"
    >
      {/* Image Section - Larger */}
      <div className={`relative h-44 overflow-hidden ${getCategoryBg(tourism.category)}`}>
        <img
          src={tourism.imageUrl}
          alt={tourism.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Category Badge */}
        {tourism.category && (
          <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 text-gray-900 rounded-xl text-xs font-black shadow-md">
            {CATEGORIES.find(c => c.id === tourism.category)?.icon} {tourism.category}
          </span>
        )}
        
        {/* Views Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-900 rounded-xl text-xs font-black shadow-md">
          <span>👁️</span>
          <span>{tourism.viewersCount.toLocaleString()}</span>
        </div>
        
        {/* Loading Overlay */}
        {isNavigating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Hover Action */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md">
            View →
          </span>
        </div>
      </div>
      
      {/* Content Section - White with subtle gray */}
      <div className="p-4 bg-white border-t border-gray-100">
        <h3 className="font-black text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
          {tourism.name}
        </h3>
        {tourism.wereda && (
          <p className="text-xs text-gray-600 font-bold flex items-center gap-1.5">
            <span className="text-gray-700">📍</span> 
            <span className="line-clamp-1">{tourism.wereda}</span>
          </p>
        )}
      </div>
    </div>
  );
}
