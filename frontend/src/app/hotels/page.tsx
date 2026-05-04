"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { getHotelsByTourism, getAllHotels } from "@/services/hotel.service";
import { submitHotelRating } from "@/services/rating.service";
import { HotelSummaryDto } from "@/types/hotel";
import LoginForm from "@/components/auth/LoginFormModal";
import Modal from "@/components/common/Modal";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import { API_BASE_URL } from "@/services/api";
import { useToast } from "@/components/common/Toast";

function HotelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const toast = useToast();

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
      toast.success("Thank you for your review!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit rating";
      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 font-semibold mb-6 text-sm"
            >
              ← Back to Home
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-black text-gray-900 mb-1">Hotels</h1>
              <p className="text-gray-500 font-semibold">
                {tourismId 
                  ? `${filteredHotels.length} accommodations near ${tourismName}`
                  : `${filteredHotels.length} hotels available`
                }
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col md:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search hotels by name..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 font-semibold shadow-sm"
                />
              </div>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [newSortBy, newSortDir] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortDir(newSortDir as 'asc' | 'desc');
                }}
                className="bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-purple-400 shadow-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="stars-desc">Highest Rating</option>
                <option value="stars-asc">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
              </div>
            ) : filteredHotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel) => {
                  const imgUrl = hotel.imageUrl || (hotel.images?.[0] && typeof hotel.images[0] === 'string' ? hotel.images[0] : (hotel.images?.[0] as any)?.imageUrl) || '';
                  return (
                    <div key={hotel.id} onClick={() => handleAction("detail", hotel)} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200 cursor-pointer">
                      <div className="relative h-48 w-full bg-gray-100">
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgUrl} alt={hotel.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{hotel.name}</h3>
                        {hotel.stars && (
                          <div className="flex items-center gap-1 mb-3">
                            <span className="text-yellow-500 font-bold">{'★'.repeat(hotel.stars)}{'☆'.repeat(5 - hotel.stars)}</span>
                            <span className="text-xs text-gray-500 font-semibold">{hotel.stars}/5</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button onClick={(e) => { e.stopPropagation(); handleAction("book", hotel); }} className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition border border-purple-200">
                            Book
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleAction("rate", hotel); }} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition border border-gray-200">
                            Rate
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleAction("view-ratings", hotel); }} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition border border-gray-200">
                            Reviews
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <h2 className="text-xl font-black text-gray-900 mb-2">No hotels found</h2>
                <p className="text-gray-500 font-semibold mb-6">
                  {searchTerm ? "Try a different search term." : "No accommodations available yet."}
                </p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition">
                    Clear Search
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

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <HotelsContent />
    </Suspense>
  );
}
