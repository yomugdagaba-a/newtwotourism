"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
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
  { id: "HERITAGE", icon: "", label: "Heritage" },
  { id: "HIGHLAND", icon: "", label: "Highland" },
  { id: "CAVERN", icon: "", label: "Cavern" },
  { id: "AQUATICS", icon: "", label: "Aquatics" },
  { id: "CULTURE", icon: "", label: "Culture" },
  { id: "MODERN", icon: "", label: "Modern" },
];

function TourismListingContent() {
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

  // Update URL when filters change — use native history API to avoid interfering with navigation
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
    window.history.replaceState(null, "", newUrl);
  }, [categories, currentKeyword, sortBy, sortDir]);

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
        categories={categories}
        onCategoryToggle={handleCategoryToggle}
        onClearCategories={() => setCategories([])}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Back Button */}
        <a
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#374151', fontWeight: 700, marginBottom: '16px', textDecoration: 'none', cursor: 'pointer', zIndex: 50, position: 'relative' }}
        >
          ← Back to Home
        </a>

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
      <Modal isOpen={authModalOpen} onClose={() => { setAuthModalOpen(false); setPendingNavId(null); setAuthModalContent(null); }} closeOnOutsideClick={false} closeOnEscape={false}>
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

export default function TourismListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
      <TourismListingContent />
    </Suspense>
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
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.85) 100%)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 4px rgba(0,0,0,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: "16px",
        transition: "all 0.25s ease",
      }}
      className="group overflow-hidden cursor-pointer hover:scale-[1.03] hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className={`relative h-44 overflow-hidden ${getCategoryBg(tourism.category)}`}>
        <img
          src={tourism.imageUrl}
          alt={tourism.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Category Badge */}
        {tourism.category && (
          <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 text-gray-900 rounded-xl text-xs font-black shadow-md">
            {CATEGORIES.find(c => c.id === tourism.category)?.icon} {tourism.category}
          </span>
        )}

        {/* Loading Overlay */}
        {isNavigating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.6)" }}>
        <h3 className="font-black text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
          {tourism.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          {tourism.wereda && (
            <p className="text-xs text-gray-600 font-bold flex items-center gap-1.5">
              <span className="line-clamp-1">{tourism.wereda}</span>
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {/* Views — now in the white card, not over the image */}
            <span className="text-xs font-black text-gray-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {tourism.viewersCount.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 text-white rounded-md font-black"
              style={{ fontSize: "0.65rem", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 2px 8px rgba(109,40,217,0.4)" }}>
              View →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
