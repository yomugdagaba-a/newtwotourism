"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import TopBar from "@/components/layout/TopBar";
import { getHotelsByTourism, getAllHotels } from "@/services/hotel.service";
import { submitHotelRating } from "@/services/rating.service";
import { HotelSummaryDto } from "@/types/hotel";
import LoginForm from "@/app/auth/login/page";
import Modal from "@/components/common/Modal";
import Image from "next/image";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import { API_BASE_URL } from "@/services/api";

export default function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  const tourismIdParam = searchParams.get("tourismId");
  const tourismId = tourismIdParam ? Number(tourismIdParam) : null;
  const tourismName = searchParams.get("tourismName") || "all destinations";

  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modal states
  const [ratingHotelId, setRatingHotelId] = useState<number | null>(null);
  const [ratingHotelName, setRatingHotelName] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingsViewHotelId, setRatingsViewHotelId] = useState<number | null>(null);
  const [ratingsViewOpen, setRatingsViewOpen] = useState(false);
  const [ratingsRefreshKey, setRatingsRefreshKey] = useState(0);

  // Filter and sort hotels
  const filteredHotels = hotels
    .filter(hotel =>
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'stars': aVal = a.stars || 0; bVal = b.stars || 0; break;
        default: aVal = a.name || ''; bVal = b.name || '';
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const loadHotels = async () => {
    try {
      setLoading(true);
      let data: HotelSummaryDto[];
      
      if (tourismId) {
        // Load hotels for specific tourism place
        data = await getHotelsByTourism(tourismId, token);
      } else {
        // Load all hotels when no tourismId is provided
        data = await getAllHotels(token);
      }
      
      setHotels(data);
    } catch (err: unknown) {
      console.error("Failed to load hotels:", err);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [tourismId, token]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      setAuthModal(true);
      return false;
    }
    return true;
  };

  const handleAction = (action: string, hotel?: HotelSummaryDto) => {
    if (!hotel) return;

    switch (action) {
      case "detail":
        router.push(`/hotels/${hotel.id}`);
        break;
      case "book":
        // Go to hotel detail page where clients can book
        router.push(`/hotels/${hotel.id}`);
        break;
      case "rate":
        if (requireAuth()) {
          setRatingHotelId(hotel.id);
          setRatingHotelName(hotel.name);
          setRatingModalOpen(true);
        }
        break;
      case "view-ratings":
        setRatingsViewHotelId(hotel.id);
        setRatingsViewOpen(true);
        break;
    }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!token || !ratingHotelId) return;
    
    try {
      await submitHotelRating(ratingHotelId, rating, comment || undefined, token);
      setRatingModalOpen(false);
      
      if (ratingsViewHotelId === ratingHotelId) {
        setRatingsRefreshKey(prev => prev + 1);
      }
      
      await loadHotels();
      alert("Thank you for your review!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit rating";
      alert(errorMessage);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 relative overflow-hidden">
        {/* Light background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />
        </div>
        
        <TopBar />

        <div className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium mb-8 text-lg"
            >
              ← {tourismId ? `Back to ${tourismName}` : 'Back to Home'}
            </button>

            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4">🏨 Hotels</h1>
              <p className="text-2xl text-slate-400 mb-6">
                {tourismId 
                  ? `${filteredHotels.length} accommodations near ${tourismName}`
                  : `${filteredHotels.length} hotels available`
                }
              </p>
              
              {/* Search Input */}
              <div className="max-w-md mx-auto relative mb-4">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search hotels by name..."
                  className="w-full pl-12 pr-10 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex justify-center items-center gap-2">
                <span className="text-slate-400 font-semibold">Sort:</span>
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDir] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortDir(newSortDir as 'asc' | 'desc');
                  }}
                  className="bg-slate-800/80 border border-slate-600 text-white rounded-xl px-4 py-2 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="stars-desc">Highest Rating</option>
                  <option value="stars-asc">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
              </div>
            ) : filteredHotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredHotels.map((hotel) => (
                  <div key={hotel.id} className="group bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 h-full flex flex-col">
                    {hotel.imageUrl ? (
                      <div className="relative h-80 w-full mb-6 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                        <Image
                          src={hotel.imageUrl}
                          alt={hotel.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="h-80 w-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-6">
                        <span className="text-4xl">🏨</span>
                      </div>
                    )}

                    <div className="px-6 pb-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-8">
                        <div className="flex text-yellow-400 text-2xl">
                          {[...Array(hotel.stars)].map((_, i) => <span key={i}>★</span>)}
                        </div>
                        <span className="text-lg font-semibold text-slate-400">{hotel.stars}/5</span>
                      </div>
                    </div>

                    <div className="px-6 pb-8">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                        <button onClick={() => handleAction("book", hotel)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex-1 hover:scale-105 transition-all shadow">
                          📅 Book
                        </button>
                        <button onClick={() => handleAction("detail", hotel)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex-1 hover:scale-105 transition-all shadow">
                          👁️ Detail
                        </button>
                        <button onClick={() => handleAction("rate", hotel)} className="bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex-1 hover:scale-105 transition-all shadow">
                          ⭐ Rate
                        </button>
                        <button onClick={() => handleAction("view-ratings", hotel)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex-1 hover:scale-105 transition-all shadow">
                          📝 Reviews
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="text-6xl mb-8">🏨</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {searchTerm ? "No hotels match your search" : "No hotels found"}
                </h2>
                <p className="text-xl text-slate-400 mb-8">
                  {searchTerm 
                    ? "Try a different search term." 
                    : "No accommodations available for this destination yet."
                  }
                </p>
                {searchTerm ? (
                  <button onClick={() => setSearchTerm("")} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-lg font-semibold hover:bg-emerald-700 transition">
                    Clear Search
                  </button>
                ) : (
                  <button onClick={() => router.back()} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-lg font-semibold hover:bg-emerald-700 transition">
                    ← Explore Other Destinations
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={authModal} onClose={() => setAuthModal(false)}>
          <LoginForm onSuccess={() => { setAuthModal(false); loadHotels(); }} />
        </Modal>

        {ratingHotelId && ratingHotelName && (
          <HotelRatingModal
            isOpen={ratingModalOpen}
            hotelId={ratingHotelId}
            hotelName={ratingHotelName}
            onClose={() => setRatingModalOpen(false)}
            onSubmit={handleSubmitRating}
          />
        )}

        {ratingsViewHotelId && (
          <RatingsViewModal
            isOpen={ratingsViewOpen}
            onClose={() => setRatingsViewOpen(false)}
            fetchUrl={`${API_BASE_URL}/ratings/hotel/${ratingsViewHotelId}`}
            token={token ?? undefined}
            title={hotels.find(h => h.id === ratingsViewHotelId)?.name || "Hotel Ratings"}
            refreshKey={ratingsRefreshKey}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
