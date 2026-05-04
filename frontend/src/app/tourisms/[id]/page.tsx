"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchTourismDetail } from "@/services/tourism.service";
import { submitTourismRating, submitHotelRating } from "@/services/rating.service";
import { getHotelsByTourism } from "@/services/hotel.service";
import { getRoadsByTourism } from "@/services/road.service";
import { getHorseServicesByRoad } from "@/services/horse.service";
import { TourismFullDetailDto } from "@/types/tourism";
import { HotelSummaryDto } from "@/types/hotel";
import { RoadInfoDto } from "@/types/road";
import { HorseServiceSummaryDto } from "@/types/horse";
import { LanguageGuiderDto } from "@/types/guider";
import { getGuidersByTourism } from "@/services/guider.service";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import Modal from "@/components/common/Modal";
import TourismRatingModal from "@/components/tourism/TourismRatingModal";
import { useToast } from "@/components/common/Toast";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import TourismImageGallery from "@/components/tourism/TourismImageGallery";
import { API_BASE_URL } from "@/services/api";
import Image from "next/image";
import dynamic from "next/dynamic";
import TourismDetailModal from "@/components/tourism/TourismDetailModal";

const RoadMapModal = dynamic(() => import("@/components/map/RoadMapModal"), { ssr: false });
const TourismMapModal = dynamic(() => import("@/components/map/TourismMapModal"), { ssr: false });

type TabType = 'overview' | 'nearby' | 'hotels' | 'roads' | 'guiders';

// Format visitTime — now stored as plain descriptive text
function formatVisitTime(visitTime: string | number | undefined | null): string {
  if (!visitTime) return "Duration not specified";
  return String(visitTime);
}

// Compute rating summary from raw ratings array if ratingSummary is missing
function computeRatingSummary(detail: TourismFullDetailDto | null) {
  if (!detail) return { avgRating: 0, totalRatings: 0 };
  if (detail.ratingSummary?.totalRatings > 0) return detail.ratingSummary;
  const ratings = (detail as any).ratings as Array<{ rating: number }> | undefined;
  if (!ratings || ratings.length === 0) return { avgRating: 0, totalRatings: 0 };
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { avgRating: Math.round(avg * 10) / 10, totalRatings: ratings.length };
}

export default function TourismDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tourismId = Number(params.id);
  const { isAuthenticated, token, username } = useAuthStore();
  const toast = useToast();

  const [detail, setDetail] = useState<TourismFullDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [roads, setRoads] = useState<RoadInfoDto[]>([]);
  const [roadsLoading, setRoadsLoading] = useState(false);
  const [horseServices, setHorseServices] = useState<Record<number, HorseServiceSummaryDto[]>>({});
  const [expandedHorseServices, setExpandedHorseServices] = useState<Record<number, boolean>>({});
  const [loadingHorseServices, setLoadingHorseServices] = useState<Record<number, boolean>>({});
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<RoadInfoDto | null>(null);
  const [tourismMapOpen, setTourismMapOpen] = useState(false);
  const [hotelMapOpen, setHotelMapOpen] = useState(false);
  const [selectedHotelForMap, setSelectedHotelForMap] = useState<HotelSummaryDto | null>(null);
  const [guiders, setGuiders] = useState<LanguageGuiderDto[]>([]);
  const [guidersLoading, setGuidersLoading] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingsViewOpen, setRatingsViewOpen] = useState(false);
  const [ratingsRefreshKey, setRatingsRefreshKey] = useState(0);
  const [hotelRatingModalOpen, setHotelRatingModalOpen] = useState(false);
  const [hotelRatingsViewOpen, setHotelRatingsViewOpen] = useState(false);
  const [ratingHotelId, setRatingHotelId] = useState<number | null>(null);

  // Detail modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<'description' | 'bestTime' | 'visitTime' | 'safety' | 'languages'>('description');

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchTourismDetail(tourismId, token ?? undefined);
      setDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tourism details");
    } finally {
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      setHotelsLoading(true);
      const data = await getHotelsByTourism(tourismId, token);
      setHotels(data);
    } catch (err) { console.error("Failed to load hotels:", err); }
    finally { setHotelsLoading(false); }
  };

  const loadRoads = async () => {
    try {
      setRoadsLoading(true);
      const data = await getRoadsByTourism(tourismId);
      setRoads(data);
    } catch (err) { console.error("Failed to load roads:", err); }
    finally { setRoadsLoading(false); }
  };

  const loadGuiders = async () => {
    try {
      setGuidersLoading(true);
      const data = await getGuidersByTourism(tourismId);
      setGuiders(data);
    } catch (err) { console.error("Failed to load guiders:", err); }
    finally { setGuidersLoading(false); }
  };

  useEffect(() => { 
    loadDetail(); 
    loadHotels();
    loadRoads();
    loadGuiders();
  }, [tourismId, token]);

  const requireAuth = () => {
    if (!isAuthenticated) { setAuthMode('login'); setAuthModal(true); return false; }
    return true;
  };

  const openDetailModal = (type: 'description' | 'bestTime' | 'visitTime' | 'safety' | 'languages') => {
    setDetailModalType(type);
    setDetailModalOpen(true);
  };

  const handleSubmitTourismRating = async (rating: number, comment: string) => {
    if (!token) return;
    try {
      await submitTourismRating(tourismId, rating, comment || undefined, token);
      setRatingModalOpen(false);
      setRatingsRefreshKey(prev => prev + 1);
      await loadDetail();
      toast.success("Thank you for your review!");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to submit rating"); }
  };

  const handleSubmitHotelRating = async (rating: number, comment: string) => {
    if (!token || !ratingHotelId) return;
    try {
      await submitHotelRating(ratingHotelId, rating, comment || undefined, token);
      setHotelRatingModalOpen(false);
      await loadHotels();
      toast.success("Thank you for your review!");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to submit rating"); }
  };

  const toggleHorseServices = async (roadId: number) => {
    if (expandedHorseServices[roadId]) {
      setExpandedHorseServices(prev => ({ ...prev, [roadId]: false }));
      return;
    }
    if (!horseServices[roadId]) {
      setLoadingHorseServices(prev => ({ ...prev, [roadId]: true }));
      try {
        const services = await getHorseServicesByRoad(roadId);
        setHorseServices(prev => ({ ...prev, [roadId]: services }));
      } catch (err) { setHorseServices(prev => ({ ...prev, [roadId]: [] })); }
      finally { setLoadingHorseServices(prev => ({ ...prev, [roadId]: false })); }
    }
    setExpandedHorseServices(prev => ({ ...prev, [roadId]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-[#111827] font-bold">Loading Destination...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white p-8 rounded-2xl text-center border border-[#E5E7EB] shadow-xl">
          <div className="text-5xl mb-4">—</div>
          <h2 className="text-2xl font-black text-[#111827] mb-3">Destination Not Found</h2>
          <p className="text-gray-500 font-semibold mb-6">{error}</p>
          <button onClick={() => router.push('/tourisms')} className="px-6 py-3 bg-[#2563EB] text-white rounded-xl text-sm font-black hover:bg-[#1D4ED8] shadow-lg transition-all">
            ← Back to Destinations
          </button>
        </div>
      </div>
    );
  }

  const navigation = [
    { id: 'overview', label: 'Overview', icon: '' },
    { id: 'nearby', label: 'Nearby Places', icon: '', count: detail?.nearbyPlaces?.length || 0 },
    { id: 'hotels', label: 'Hotels', icon: '', count: hotels.length },
    { id: 'roads', label: 'Roads & Transport', icon: '', count: roads.length },
    { id: 'guiders', label: 'Language Guiders', icon: '', count: guiders.length },
  ];


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky top bar with hamburger */}
      <div className="sticky top-0 z-30 flex items-center h-12 px-2 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9 flex items-center justify-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button onClick={() => router.back()} className="h-8 w-8 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all ml-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="ml-1 text-gray-900 font-bold text-sm truncate">{detail.name}</span>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl flex flex-col bg-white">
            {/* Purple header — RideShare style */}
            <div className="px-5 py-6" style={{ backgroundColor: '#6d28d9' }}>
              <button onClick={() => router.push('/tourisms')} className="flex items-center gap-2 text-purple-200 hover:text-white text-xs font-bold mb-4 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Destinations
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-lg" style={{ color: '#7c3aed' }}>
                  {detail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-sm truncate">{detail.name}</p>
                  <p className="text-purple-200 text-xs">{detail.wereda}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as TabType); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={activeTab === item.id
                    ? { backgroundColor: '#ede9fe', color: '#6d28d9' }
                    : { color: '#374151' }
                  }
                >
                  <svg style={{ color: activeTab === item.id ? '#6d28d9' : '#6b7280' }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.id === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                    {item.id === 'nearby' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />}
                    {item.id === 'hotels' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                    {item.id === 'roads' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />}
                    {item.id === 'guiders' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                  </svg>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{item.count}</span>
                  )}
                </button>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Actions</p>
                <button onClick={() => { setImageGalleryOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  View Images
                </button>
                <button onClick={() => { requireAuth() && setRatingModalOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  Rate Place
                </button>
                <button onClick={() => { setRatingsViewOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  View Reviews
                </button>
              </div>
            </nav>

            {/* User info + logout */}
            <div className="p-4 border-t border-gray-100 bg-white">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center font-black text-sm" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
                    {username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-xs font-bold truncate">{username}</p>
                    <p className="text-green-600 text-xs">✓ Logged in</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setAuthModal(true); setSidebarOpen(false); }} className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all" style={{ backgroundColor: '#7c3aed' }}>
                  Login to Rate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content — full width */}
      <main className="min-h-screen">
        <div className="relative h-48 md:h-56">
          <Image src={detail.images?.[currentImageIndex]?.imageUrl || detail.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"} alt={detail.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          
          {detail.images && detail.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {detail.images.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{detail.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">{detail.wereda}, {detail.kebele}</span>
              {detail.categories && detail.categories.length > 0 ? (
                detail.categories.map((cat, idx) => (
                  <span key={idx} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">{cat}</span>
                ))
              ) : (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">Tourism Place</span>
              )}
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">{detail.viewersCount.toLocaleString()} views</span>
              {computeRatingSummary(detail).totalRatings > 0 && (
                <span className="bg-[#F59E0B] px-3 py-1 rounded-full text-white font-bold">{computeRatingSummary(detail).avgRating?.toFixed(1)} ★ ({computeRatingSummary(detail).totalRatings})</span>
              )}
            </div>
          </div>
        </div>


        {/* Content Area */}
        <div className="p-4 md:p-6 bg-gray-100 min-h-[calc(100vh-14rem)] shadow-[inset_0_0_80px_rgba(0,0,0,0.12)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5 p-6 rounded-2xl bg-white shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">About This Place</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-3">{detail.description || "A beautiful destination waiting to be explored."}</p>
                  <button
                    onClick={() => openDetailModal('description')}
                    className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>
                
                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Best Time to Visit</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.bestTime || "Year-round destination"}</p>
                  <button
                    onClick={() => openDetailModal('bestTime')}
                    className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Visit Duration</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.visitTime ? formatVisitTime(detail.visitTime) : "Duration not specified"}</p>
                  <button
                    onClick={() => openDetailModal('visitTime')}
                    className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Safety Info</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.peaceInfo || "Safe and welcoming destination"}</p>
                  <button
                    onClick={() => openDetailModal('safety')}
                    className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {detail.languages?.length > 0 ? detail.languages.slice(0, 2).map((lang, i) => (
                      <span key={i} className="px-3 py-1 text-gray-700 font-semibold rounded-full text-xs border border-gray-200">{lang}</span>
                    )) : <span className="text-gray-700 text-sm font-semibold">Local languages spoken</span>}
                    {detail.languages && detail.languages.length > 2 && (
                      <span className="px-3 py-1 text-gray-700 font-semibold rounded-full text-xs border border-gray-200">+{detail.languages.length - 2} more</span>
                    )}
                  </div>
                  <button
                    onClick={() => openDetailModal('languages')}
                    className="w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Rating</h3>
                  <div className="text-4xl font-black text-yellow-500">{computeRatingSummary(detail).avgRating?.toFixed(1) || '0'}/5</div>
                  <p className="text-gray-700 text-xs font-bold">{computeRatingSummary(detail).totalRatings || 0} reviews</p>
                </div>
              </div>

              {/* Gallery */}
              {detail.images && detail.images.length > 1 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-black text-lg">Gallery</h3>
                    <button onClick={() => setImageGalleryOpen(true)} className="px-5 py-2 bg-purple-600 text-white text-sm font-black rounded-lg hover:bg-purple-700 hover:scale-105 transition-all shadow-md">
                      View All Images
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {detail.images.map((img, idx) => (
                      <button key={idx} onClick={() => setZoomedImage(img.imageUrl)} className="relative h-20 md:h-24 rounded-lg overflow-hidden transition-all shadow-md hover:shadow-lg border border-gray-200 hover:border-purple-400 hover:scale-105">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.imageUrl} alt={img.title || `${detail.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Images */}
              {(!detail.images || detail.images.length <= 1) && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-gray-900 font-black">Internal Images</h3>
                        <p className="text-gray-600 text-sm font-semibold">Explore detailed photos of this place</p>
                      </div>
                    </div>
                    <button onClick={() => setImageGalleryOpen(true)}
                      style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,233,254,0.6) 50%,rgba(255,255,255,0.9) 100%)", boxShadow: "0 16px 40px rgba(109,40,217,0.22), 0 4px 12px rgba(109,40,217,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 6px rgba(109,40,217,0.1), inset 1px 0 0 rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(196,181,253,0.6)" }}
                      className="px-6 py-3 text-purple-700 font-black rounded-xl hover:scale-105 hover:-translate-y-0.5 transition-all">
                      View Gallery
                    </button>
                  </div>
                </div>
              )}

              {/* Language Guiders */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                    <div>
                      <h3 className="text-gray-900 font-black">Language Guiders</h3>
                      <p className="text-gray-600 text-sm font-semibold">
                        {guidersLoading ? 'Loading...' : guiders.length > 0 ? `${guiders.length} guide${guiders.length !== 1 ? 's' : ''} available` : 'Find local guides'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('guiders')}
                    style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,233,254,0.6) 50%,rgba(255,255,255,0.9) 100%)", boxShadow: "0 16px 40px rgba(109,40,217,0.22), 0 4px 12px rgba(109,40,217,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 6px rgba(109,40,217,0.1), inset 1px 0 0 rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(196,181,253,0.6)" }}
                    className="px-6 py-3 text-purple-700 font-black rounded-xl hover:scale-105 hover:-translate-y-0.5 transition-all">
                    View Guiders
                  </button>
                </div>
              </div>

              {/* Nearby Places Preview */}
              {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-black text-lg">Nearby Places in {detail.kebele}</h3>
                    <button onClick={() => setActiveTab('nearby')} className="text-purple-600 text-sm font-black hover:text-purple-700 hover:underline transition-all">
                      View All ({detail.nearbyPlaces.length}) →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {detail.nearbyPlaces.slice(0, 3).map((place) => (
                      <div key={place.id} onClick={() => router.push(`/tourisms/${place.id}`)} className="relative h-28 rounded-xl overflow-hidden cursor-pointer group border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all">
                        {place.imageUrl ? (
                          <Image src={place.imageUrl} alt={place.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-sm font-black truncate">{place.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-white rounded-2xl p-6 text-center shadow-md border-2 border-gray-200">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Ready to Explore?</h3>
                <p className="text-gray-600 text-sm font-semibold mb-5">Find accommodations and plan your route to {detail.name}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setTourismMapOpen(true)}
                    style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,233,254,0.6) 50%,rgba(255,255,255,0.9) 100%)", boxShadow: "0 16px 40px rgba(109,40,217,0.22), 0 4px 12px rgba(109,40,217,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 6px rgba(109,40,217,0.1), inset 1px 0 0 rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(196,181,253,0.6)" }}
                    className="text-purple-700 px-6 py-3 rounded-xl font-black hover:scale-105 hover:-translate-y-0.5 transition-all">See on Map</button>
                  <button onClick={() => setActiveTab('hotels')}
                    style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,233,254,0.6) 50%,rgba(255,255,255,0.9) 100%)", boxShadow: "0 16px 40px rgba(109,40,217,0.22), 0 4px 12px rgba(109,40,217,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 6px rgba(109,40,217,0.1), inset 1px 0 0 rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(196,181,253,0.6)" }}
                    className="text-purple-700 px-6 py-3 rounded-xl font-black hover:scale-105 hover:-translate-y-0.5 transition-all">Find Hotels</button>
                  <button onClick={() => setActiveTab('roads')}
                    style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,233,254,0.6) 50%,rgba(255,255,255,0.9) 100%)", boxShadow: "0 16px 40px rgba(109,40,217,0.22), 0 4px 12px rgba(109,40,217,0.12), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 6px rgba(109,40,217,0.1), inset 1px 0 0 rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(196,181,253,0.6)" }}
                    className="text-purple-700 px-6 py-3 rounded-xl font-black hover:scale-105 hover:-translate-y-0.5 transition-all">View Routes</button>
                </div>
              </div>
            </div>
          )}


          {/* Nearby Places Tab */}
          {activeTab === 'nearby' && (
            <div>
              <div className="mb-5">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Nearby Tourism Places</h2>
                <p className="text-gray-600 font-semibold">Explore other destinations in {detail.kebele} kebele</p>
              </div>
              
              {!detail.nearbyPlaces || detail.nearbyPlaces.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Nearby Places Found</h3>
                  <p className="text-gray-600 font-semibold">There are no other tourism places in this kebele yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {detail.nearbyPlaces.map((place) => (
                    <div key={place.id} onClick={() => router.push(`/tourisms/${place.id}`)} className="bg-white rounded-xl overflow-hidden cursor-pointer group shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] transition-all">
                      <div className="relative h-44">
                        {place.imageUrl ? (
                          <Image src={place.imageUrl} alt={place.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-black text-lg truncate">{place.name}</h3>
                          {place.categories && place.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {place.categories.slice(0, 2).map((cat, idx) => (
                                <span key={idx} className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded">{cat}</span>
                              ))}
                              {place.categories.length > 2 && (
                                <span className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded">+{place.categories.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/90 text-sm font-semibold">Tourism Place</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-700 text-sm font-black">Same Kebele</span>
                        <span className="text-purple-600 text-sm font-black hover:text-purple-700">View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div>
              <div className="mb-6 bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                <h2 className="text-2xl font-black text-gray-900 mb-1">Hotels & Accommodations</h2>
                <p className="text-gray-600 font-semibold">Find the perfect place to stay near {detail.name}</p>
              </div>
              
              {hotelsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading hotels...</p>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Hotels Found</h3>
                  <p className="text-gray-600 font-semibold">No accommodations available for this destination yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-2xl overflow-hidden shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
                      <div className="relative h-48">
                        {(() => {
                          // Extract first image URL from images array or use imageUrl
                          let imageUrl = '';
                          if (hotel.images && hotel.images.length > 0) {
                            imageUrl = hotel.images[0].imageUrl;
                          } else if (hotel.imageUrl) {
                            imageUrl = hotel.imageUrl;
                          }
                          
                          return imageUrl ? (
                            <Image src={imageUrl} alt={hotel.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"></div>
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-yellow-400 text-xl font-black drop-shadow-lg">{'★'.repeat(hotel.stars || 3)}{'☆'.repeat(5 - (hotel.stars || 3))}</div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-gray-900 font-black text-xl mb-4">{hotel.name}</h3>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button onClick={() => router.push(`/hotels/${hotel.id}`)} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-purple-700 hover:scale-105 transition-all shadow-md flex items-center justify-center gap-2">
                              View Details
                            </button>
                            <button onClick={() => router.push(`/hotels/${hotel.id}`)} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-purple-700 hover:scale-105 transition-all shadow-md flex items-center justify-center gap-2">
                              Booking
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedHotelForMap(hotel);
                              setHotelMapOpen(true);
                            }}
                            className="w-full bg-purple-50 text-purple-700 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all border border-purple-200">
                            View on Map
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Roads Tab */}
          {activeTab === 'roads' && (
            <div>
              <div className="mb-5 bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                <h2 className="text-2xl font-black text-gray-900 mb-1">Roads & Transport</h2>
                <p className="text-gray-600 font-semibold">Find the best routes to reach {detail.name}</p>
              </div>
              
              {roadsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading routes...</p>
                </div>
              ) : roads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Routes Found</h3>
                  <p className="text-gray-600 font-semibold">Road information for this destination is being prepared.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">{roads.filter(r => r.distanceByCar).length} Drive Routes</span>
                    {roads.filter(r => r.distanceByFoot).length > 0 && (
                      <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">Walking route available</span>
                    )}
                    {roads.filter(r => r.distanceByHorse).length > 0 && (
                      <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">{roads.filter(r => r.distanceByHorse).length} Horse route(s)</span>
                    )}
                  </div>

                  {roads.map((road) => (
                    <div key={road.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                      {/* Compact header row */}
                      <div className="px-4 py-2.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-gray-900 font-black text-sm">From {road.initialPlace}</h3>
                        <div className="flex items-center gap-2">
                          {road.totalDistance && (
                            <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">
                              {road.totalDistance.toFixed(1)} km total
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {road.description && (
                          <p className="text-gray-600 text-xs font-semibold mb-2.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">{road.description}</p>
                        )}

                        {/* Distance pills in one row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {road.distanceByCar && (
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-xs font-bold text-gray-500 uppercase">🚗 Car</span>
                              <span className="text-xs font-black text-gray-900">{road.distanceByCar.toFixed(1)} km</span>
                            </div>
                          )}
                          {road.distanceByFoot && (
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-xs font-bold text-gray-500 uppercase">🚶 Foot</span>
                              <span className="text-xs font-black text-gray-900">{road.distanceByFoot.toFixed(1)} km</span>
                            </div>
                          )}
                          {road.distanceByHorse && (
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-xs font-bold text-gray-500 uppercase">🐎 Horse</span>
                              <span className="text-xs font-black text-gray-900">{road.distanceByHorse.toFixed(1)} km</span>
                            </div>
                          )}
                          {road.distanceByPlane && (
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-xs font-bold text-gray-500 uppercase">✈️ Plane</span>
                              <span className="text-xs font-black text-gray-900">{road.distanceByPlane.toFixed(1)} km</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons — side by side, fixed height */}
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedRoad(road); setMapModalOpen(true); }}
                            className="flex-1 bg-purple-50 text-purple-700 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all border border-purple-200">
                            View on Map
                          </button>
                          <button onClick={() => toggleHorseServices(road.id)} disabled={loadingHorseServices[road.id]}
                            className="flex-1 bg-purple-50 text-purple-700 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all disabled:opacity-50 border border-purple-200 flex items-center justify-center gap-1.5">
                            Horse Services
                            {loadingHorseServices[road.id] ? (
                              <span className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <svg className={`w-3 h-3 transition-transform ${expandedHorseServices[road.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Horse services — expands below the Horse Services button (right half) */}
                        {expandedHorseServices[road.id] && (
                          <div className="flex gap-2 mt-2">
                            {/* Empty left half to align with View on Map button */}
                            <div className="flex-1" />
                            {/* Horse services panel aligned under Horse Services button */}
                            <div className="flex-1 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                              {horseServices[road.id]?.length > 0 ? (
                                <div className="space-y-1.5">
                                  {horseServices[road.id].map((service) => (
                                    <div key={service.id} className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', lineHeight: '1.7' }}>
                                        <span style={{ color: '#6b7280' }}>Name: </span><span style={{ color: '#111827', fontWeight: 800 }}>{service.ownerName}</span><br/>
                                        <span style={{ color: '#6b7280' }}>Initial Place: </span><span style={{ color: '#111827', fontWeight: 800 }}>{service.initialPlace}</span><br/>
                                        <span style={{ color: '#6b7280' }}>Contact: </span><span style={{ color: '#111827', fontWeight: 800 }}>{service.contactInfo}</span>
                                      </div>
                                      {service.cost && (
                                        <div className="mt-1" style={{ fontWeight: 900, fontSize: '13px', color: '#111827' }}>
                                          {service.cost.toLocaleString()} ETB
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-xs font-semibold text-center py-1">No horse services available.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Guiders Tab */}
          {activeTab === 'guiders' && (
            <div>
              <div className="mb-5">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Language Guiders</h2>
                <p className="text-gray-600 font-semibold">Local guides who can help you explore {detail.name}</p>
              </div>
              
              {guidersLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading guiders...</p>
                </div>
              ) : guiders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Guiders Available</h3>
                  <p className="text-gray-600 font-semibold">No language guiders registered for this destination yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1 text-gray-700 rounded-full text-sm font-semibold border border-gray-200">{guiders.length} Guider{guiders.length !== 1 ? 's' : ''}</span>
                    <span className="px-3 py-1 text-gray-700 rounded-full text-sm font-semibold border border-gray-200">{[...new Set(guiders.flatMap(g => g.languages))].length} Languages</span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guiders.map((guider) => (
                      <div key={guider.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="p-5 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
                          <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-black text-lg">{guider.fullName || guider.name}</h3>
                            <p className="text-gray-600 text-sm font-semibold">Language Guide</p>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <div>
                              <p className="text-gray-600 text-xs uppercase font-bold">Contact</p>
                              <p className="text-gray-900 font-bold">{guider.contactInfo}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs uppercase font-bold mb-2">Languages Spoken</p>
                            <div className="flex flex-wrap gap-2">
                              {guider.languages.map((lang, idx) => (
                                <span key={idx} className="px-3 py-1 text-gray-700 rounded-full text-sm font-semibold border border-gray-200">{lang}</span>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <span className={`inline-flex items-center gap-1 text-sm font-bold ${guider.active ? 'text-green-600' : 'text-red-600'}`}>
                              <span className={`w-2 h-2 rounded-full ${guider.active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              {guider.active ? 'Available for hire' : 'Currently unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-black">Hire a Local Guide</h4>
                        <p className="text-gray-600 text-sm font-semibold">Contact any guider above to arrange a tour in your preferred language.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={authModal} onClose={() => setAuthModal(false)}>
        {authMode === 'login' ? (
          <LoginForm onSuccess={() => { setAuthModal(false); router.refresh(); }} onRegisterClick={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onSuccess={() => { setAuthModal(false); }} onLoginClick={() => setAuthMode('login')} />
        )}
      </Modal>

      <TourismRatingModal isOpen={ratingModalOpen} onClose={() => setRatingModalOpen(false)} title={detail?.name} onSubmit={handleSubmitTourismRating} />

      <RatingsViewModal isOpen={ratingsViewOpen} onClose={() => setRatingsViewOpen(false)} fetchUrl={`${API_BASE_URL}/ratings/tourism/${tourismId}`} token={token ?? undefined} title={detail?.name ?? "Tourism Ratings"} refreshKey={ratingsRefreshKey} />

      {ratingHotelId && (
        <>
          <HotelRatingModal isOpen={hotelRatingModalOpen} hotelId={ratingHotelId} hotelName={hotels.find(h => h.id === ratingHotelId)?.name || "Hotel"} onClose={() => setHotelRatingModalOpen(false)} onSubmit={handleSubmitHotelRating} />
          <RatingsViewModal isOpen={hotelRatingsViewOpen} onClose={() => setHotelRatingsViewOpen(false)} fetchUrl={`${API_BASE_URL}/ratings/hotel/${ratingHotelId}`} token={token ?? undefined} title={hotels.find(h => h.id === ratingHotelId)?.name || "Hotel Ratings"} refreshKey={0} />
        </>
      )}

      {selectedRoad && detail && (
        <RoadMapModal 
          key={`${tourismId}-${selectedRoad.id}`}
          isOpen={mapModalOpen} 
          onClose={() => { setMapModalOpen(false); setSelectedRoad(null); }} 
          road={selectedRoad}
          tourismName={detail.name}
          tourismWereda={detail.wereda}
          tourismKebele={detail.kebele}
          tourismLatitude={detail.latitude}
          tourismLongitude={detail.longitude}
        />
      )}

      <TourismMapModal isOpen={tourismMapOpen} onClose={() => setTourismMapOpen(false)} tourismName={detail?.name || "Tourism Place"} tourismWereda={detail?.wereda} tourismKebele={detail?.kebele} />

      {/* Hotel Map Modal — shows hotel location using hotel coordinates or tourism place coordinates */}
      {selectedHotelForMap && detail && (
        <TourismMapModal
          isOpen={hotelMapOpen}
          onClose={() => { setHotelMapOpen(false); setSelectedHotelForMap(null); }}
          tourismName={
            (selectedHotelForMap as any).latitude && (selectedHotelForMap as any).longitude
              ? `${selectedHotelForMap.name}`
              : `${selectedHotelForMap.name} (approximate location — near ${detail.name})`
          }
          tourismWereda={detail.wereda}
          tourismKebele={detail.kebele}
          latitude={(selectedHotelForMap as any).latitude ?? detail.latitude}
          longitude={(selectedHotelForMap as any).longitude ?? detail.longitude}
        />
      )}

      <TourismImageGallery tourismId={tourismId} tourismName={detail?.name || "Tourism Place"} isOpen={imageGalleryOpen} onClose={() => setImageGalleryOpen(false)} preloadedImages={detail?.images} />

      {/* Detail Modals */}
      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'description'}
        onClose={() => setDetailModalOpen(false)}
        title="About This Place"
        icon=""
        content={detail?.description || "A beautiful destination waiting to be explored."}
        type="description"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'bestTime'}
        onClose={() => setDetailModalOpen(false)}
        title="Best Time to Visit"
        icon=""
        content={detail?.bestTime || "Year-round destination"}
        type="bestTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'visitTime'}
        onClose={() => setDetailModalOpen(false)}
        title="Visit Duration"
        icon=""
        content={detail?.visitTime ? formatVisitTime(detail.visitTime) : "Duration not specified"}
        type="visitTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'safety'}
        onClose={() => setDetailModalOpen(false)}
        title="Safety Info"
        icon=""
        content={detail?.peaceInfo || "Safe and welcoming destination"}
        type="safety"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'languages'}
        onClose={() => setDetailModalOpen(false)}
        title="Languages"
        icon=""
        content={detail?.languages || []}
        type="languages"
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 font-black text-lg hover:bg-gray-200 transition-all z-10"
          >
            ✕
          </button>
          <div className="relative w-full mx-4" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomedImage} alt="Zoomed" className="rounded-xl object-contain w-full h-auto" style={{ maxHeight: '90vh' }} />
          </div>
        </div>
      )}
    </div>
  );
}