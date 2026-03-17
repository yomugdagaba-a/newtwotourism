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
import LoginForm from "@/app/auth/login/page";
import RegisterForm from "@/app/auth/register/page";
import Modal from "@/components/common/Modal";
import TourismRatingModal from "@/components/tourism/TourismRatingModal";
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

export default function TourismDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tourismId = Number(params.id);
  const { isAuthenticated, token, username } = useAuthStore();

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
  const [guiders, setGuiders] = useState<LanguageGuiderDto[]>([]);
  const [guidersLoading, setGuidersLoading] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);

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
      alert("Thank you for your review!");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to submit rating"); }
  };

  const handleSubmitHotelRating = async (rating: number, comment: string) => {
    if (!token || !ratingHotelId) return;
    try {
      await submitHotelRating(ratingHotelId, rating, comment || undefined, token);
      setHotelRatingModalOpen(false);
      await loadHotels();
      alert("Thank you for your review!");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to submit rating"); }
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
          <div className="text-5xl mb-4">🏞️</div>
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
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'nearby', label: 'Nearby Places', icon: '📍', count: detail?.nearbyPlaces?.length || 0 },
    { id: 'hotels', label: 'Hotels', icon: '🏨', count: hotels.length },
    { id: 'roads', label: 'Roads & Transport', icon: '🛣️', count: roads.length },
    { id: 'guiders', label: 'Language Guiders', icon: '🗣️', count: guiders.length },
  ];


  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.12)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 md:hidden bg-gray-900 p-2.5 rounded-xl shadow-lg text-white text-sm font-black hover:bg-gray-800 transition-all"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <button onClick={() => router.push('/tourisms')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-900 hover:text-blue-700 rounded-lg transition-all text-xs font-bold w-full mb-3 border-2 border-gray-300 hover:border-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Destinations</span>
            </button>
            <h2 className="text-gray-900 font-black text-base truncate">{detail.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 text-xs font-medium">📍 {detail.wereda}</span>
              {detail.ratingSummary && <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">⭐ {detail.ratingSummary.avgRating?.toFixed(1) || 0}</span>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            <p className="text-gray-600 text-xs font-bold uppercase px-2 mb-2">Navigation</p>
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as TabType); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === item.id ? 'bg-white/20' : 'bg-gray-200'}`}>{item.count}</span>
                )}
              </button>
            ))}

            <div className="border-t border-gray-200 my-3 pt-3">
              <p className="text-gray-600 text-xs font-bold uppercase px-2 mb-2">Quick Actions</p>
              <button onClick={() => setImageGalleryOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400">
                <span>📸</span><span>View Images</span>
              </button>
              <button onClick={() => requireAuth() && setRatingModalOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400 mt-2">
                <span>⭐</span><span>Rate Place</span>
              </button>
              <button onClick={() => setRatingsViewOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400 mt-2">
                <span>📝</span><span>View Reviews</span>
              </button>
            </div>
          </nav>

          {/* User Info */}
          <div className="p-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-xs font-bold truncate">{username}</p>
                  <p className="text-green-600 text-xs">✓ Logged in</p>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); setAuthModal(true); }} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all border-2 border-blue-700">
                🔐 Login to Rate
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        {/* Hero Header */}
        <div className="relative h-48 md:h-56">
          <Image src={detail.images?.[currentImageIndex]?.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"} alt={detail.name} fill className="object-cover" priority />
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
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">📍 {detail.wereda}, {detail.kebele}</span>
              {detail.categories && detail.categories.length > 0 ? (
                detail.categories.map((cat, idx) => (
                  <span key={idx} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">🏷️ {cat}</span>
                ))
              ) : (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">🏷️ Tourism Place</span>
              )}
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">👁️ {detail.viewersCount.toLocaleString()} views</span>
              {detail.ratingSummary && (
                <span className="bg-[#F59E0B] px-3 py-1 rounded-full text-white font-bold">⭐ {detail.ratingSummary.avgRating?.toFixed(1) || 0} ({detail.ratingSummary.totalRatings})</span>
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
                  <div className="text-3xl mb-3">🏞️</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">About This Place</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-3">{detail.description || "A beautiful destination waiting to be explored."}</p>
                  <button
                    onClick={() => openDetailModal('description')}
                    className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>
                
                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">🕐</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Best Time to Visit</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.bestTime || "Year-round destination"}</p>
                  <button
                    onClick={() => openDetailModal('bestTime')}
                    className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">⏱️</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Visit Duration</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.visitTime || "2-3 hours recommended"}</p>
                  <button
                    onClick={() => openDetailModal('visitTime')}
                    className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">🛡️</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Safety Info</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{detail.peaceInfo || "Safe and welcoming destination"}</p>
                  <button
                    onClick={() => openDetailModal('safety')}
                    className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">🗣️</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {detail.languages?.length > 0 ? detail.languages.slice(0, 2).map((lang, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-200 text-gray-800 font-bold rounded-lg text-xs shadow-md">{lang}</span>
                    )) : <span className="text-gray-700 text-sm font-semibold">Local languages spoken</span>}
                    {detail.languages && detail.languages.length > 2 && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 font-bold rounded-lg text-xs shadow-md">+{detail.languages.length - 2} more</span>
                    )}
                  </div>
                  <button
                    onClick={() => openDetailModal('languages')}
                    className="w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Rating</h3>
                  <div className="text-4xl font-black text-yellow-500">{detail.ratingSummary?.avgRating?.toFixed(1) || '0'}/5</div>
                  <p className="text-gray-700 text-xs font-bold">{detail.ratingSummary?.totalRatings || 0} reviews</p>
                </div>
              </div>

              {/* Gallery */}
              {detail.images && detail.images.length > 1 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-black text-lg">📸 Gallery</h3>
                    <button onClick={() => setImageGalleryOpen(true)} className="px-5 py-2 bg-blue-600 text-white text-sm font-black rounded-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-md">
                      View All Images
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {detail.images.map((img, idx) => (
                      <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative h-20 md:h-24 rounded-lg overflow-hidden transition-all shadow-md hover:shadow-lg border-2 ${idx === currentImageIndex ? 'border-blue-500 ring-4 ring-blue-300 scale-105' : 'border-gray-300 hover:border-gray-400 hover:scale-105'}`}>
                        <Image src={img.imageUrl} alt={img.title || `${detail.name} ${idx + 1}`} fill className="object-cover" />
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
                      <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-2xl shadow-md">📸</div>
                      <div>
                        <h3 className="text-gray-900 font-black">Internal Images</h3>
                        <p className="text-gray-600 text-sm font-semibold">Explore detailed photos of this place</p>
                      </div>
                    </div>
                    <button onClick={() => setImageGalleryOpen(true)} className="px-6 py-3 bg-gray-200 text-gray-800 font-black rounded-xl hover:bg-gray-300 hover:scale-105 transition-all shadow-md">
                      View Gallery
                    </button>
                  </div>
                </div>
              )}

              {/* Language Guiders */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-2xl shadow-md">🗣️</div>
                    <div>
                      <h3 className="text-gray-900 font-black">Language Guiders</h3>
                      <p className="text-gray-600 text-sm font-semibold">
                        {guidersLoading ? 'Loading...' : guiders.length > 0 ? `${guiders.length} guide${guiders.length !== 1 ? 's' : ''} available` : 'Find local guides'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('guiders')} className="px-6 py-3 bg-gray-200 text-gray-800 font-black rounded-xl hover:bg-gray-300 hover:scale-105 transition-all shadow-md flex items-center gap-2">
                    {guiders.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{guiders.length}</span>}
                    View Guiders
                  </button>
                </div>
              </div>

              {/* Nearby Places Preview */}
              {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-black text-lg">📍 Nearby Places in {detail.kebele}</h3>
                    <button onClick={() => setActiveTab('nearby')} className="text-blue-600 text-sm font-black hover:text-blue-700 hover:underline transition-all">
                      View All ({detail.nearbyPlaces.length}) →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {detail.nearbyPlaces.slice(0, 3).map((place) => (
                      <div key={place.id} onClick={() => router.push(`/tourisms/${place.id}`)} className="relative h-28 rounded-xl overflow-hidden cursor-pointer group border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all">
                        {place.imageUrl ? (
                          <Image src={place.imageUrl} alt={place.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><span className="text-4xl">🏞️</span></div>
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
                  <button onClick={() => setTourismMapOpen(true)} className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-black hover:bg-gray-300 hover:scale-105 transition-all shadow-md">🗺️ See on Map</button>
                  <button onClick={() => setActiveTab('hotels')} className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-black hover:bg-gray-300 hover:scale-105 transition-all shadow-md">🏨 Find Hotels</button>
                  <button onClick={() => setActiveTab('roads')} className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-black hover:bg-gray-300 hover:scale-105 transition-all shadow-md">🗺️ View Routes</button>
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
                  <div className="text-6xl mb-4">📍</div>
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
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><span className="text-6xl">🏞️</span></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-black text-lg truncate">{place.name}</h3>
                          {place.categories && place.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {place.categories.slice(0, 2).map((cat, idx) => (
                                <span key={idx} className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded">🏷️ {cat}</span>
                              ))}
                              {place.categories.length > 2 && (
                                <span className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded">+{place.categories.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/90 text-sm font-semibold">🏷️ Tourism Place</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-700 text-sm font-black">📍 Same Kebele</span>
                        <span className="text-blue-600 text-sm font-black hover:text-blue-700">View Details →</span>
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
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading hotels...</p>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <div className="text-6xl mb-4">🏨</div>
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
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><span className="text-7xl">🏨</span></div>
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-yellow-400 text-xl font-black drop-shadow-lg">{'★'.repeat(hotel.stars || 3)}{'☆'.repeat(5 - (hotel.stars || 3))}</div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-gray-900 font-black text-xl mb-4">{hotel.name}</h3>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <button onClick={() => router.push(`/hotels/${hotel.id}`)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-black hover:bg-blue-700 hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                              🔍 View Details
                            </button>
                            <button onClick={() => router.push(`/hotels/${hotel.id}?book=true`)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-black hover:bg-blue-700 hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                              📅 Booking
                            </button>
                          </div>
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
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading routes...</p>
                </div>
              ) : roads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <div className="text-6xl mb-4">🛣️</div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Routes Found</h3>
                  <p className="text-gray-600 font-semibold">Road information for this destination is being prepared.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">🚗 {roads.filter(r => r.distanceByCar).length} Drive Routes</span>
                    {roads.filter(r => r.distanceByFoot).length > 0 && (
                      <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">🚶 There is a walking route</span>
                    )}
                    {roads.filter(r => r.distanceByHorse).length > 0 && (
                      <span className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-black shadow-md border-2 border-gray-300">🐎 {roads.filter(r => r.distanceByHorse).length} Horser</span>
                    )}
                  </div>

                  {roads.map((road) => (
                    <div key={road.id} className="bg-white rounded-2xl overflow-hidden shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                      <div className="p-5 border-b-2 border-gray-200 flex justify-between items-start bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-2xl shadow-md">
                            {road.roadType === 'CAR' ? '🚗' : road.roadType === 'FOOT' ? '🚶' : road.roadType === 'HORSE' ? '🐎' : '✈️'}
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-black text-lg">{road.roadType} Route</h3>
                            <p className="text-gray-600 text-sm font-semibold">From {road.initialPlace}</p>
                          </div>
                        </div>
                        <div className="text-right bg-gray-100 px-4 py-2 rounded-xl border-2 border-gray-300 shadow-md">
                          <div className="text-3xl font-black text-gray-900">{road.totalDistance?.toFixed(1) || '—'}</div>
                          <div className="text-xs text-gray-600 font-bold">km total</div>
                        </div>
                      </div>

                      <div className="p-5">
                        {road.description && <p className="text-gray-700 text-sm mb-4 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-200">{road.description}</p>}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {road.distanceByCar && (
                            <div className="bg-gray-100 p-4 rounded-xl text-center border-2 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all shadow-md cursor-pointer">
                              <div className="text-2xl mb-2">🚗</div>
                              <div className="text-2xl font-black text-gray-800">{road.distanceByCar.toFixed(1)}</div>
                              <div className="text-xs text-gray-600 font-bold">km by car</div>
                            </div>
                          )}
                          {road.distanceByFoot && (
                            <div className="bg-gray-100 p-4 rounded-xl text-center border-2 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all shadow-md cursor-pointer">
                              <div className="text-2xl mb-2">🚶</div>
                              <div className="text-2xl font-black text-gray-800">{road.distanceByFoot.toFixed(1)}</div>
                              <div className="text-xs text-gray-600 font-bold">km on foot</div>
                            </div>
                          )}
                          {road.distanceByHorse && (
                            <div className="bg-gray-100 p-4 rounded-xl text-center border-2 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all shadow-md cursor-pointer">
                              <div className="text-2xl mb-2">🐎</div>
                              <div className="text-2xl font-black text-gray-800">{road.distanceByHorse.toFixed(1)}</div>
                              <div className="text-xs text-gray-600 font-bold">km by horse</div>
                            </div>
                          )}
                          {road.distanceByPlane && (
                            <div className="bg-gray-100 p-4 rounded-xl text-center border-2 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all shadow-md cursor-pointer">
                              <div className="text-2xl mb-2">✈️</div>
                              <div className="text-2xl font-black text-gray-800">{road.distanceByPlane.toFixed(1)}</div>
                              <div className="text-xs text-gray-600 font-bold">km by plane</div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => { setSelectedRoad(road); setMapModalOpen(true); }} className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-xl text-sm font-black hover:bg-gray-400 hover:scale-[1.02] transition-all shadow-lg">
                            🗺️ View on Map
                          </button>
                          <button onClick={() => toggleHorseServices(road.id)} disabled={loadingHorseServices[road.id]} className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-xl text-sm font-black hover:bg-gray-400 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                            🐎 Horse Services
                            {loadingHorseServices[road.id] ? (
                              <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <svg className={`w-4 h-4 transition-transform ${expandedHorseServices[road.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {expandedHorseServices[road.id] && (
                          <div className="mt-4 p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <h4 className="text-gray-900 font-black text-base mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">🐎</span>
                              Available Horse Services
                            </h4>
                            {horseServices[road.id]?.length > 0 ? (
                              <div className="space-y-3">
                                {horseServices[road.id].map((service) => (
                                  <div key={service.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="text-gray-900 font-black">{service.ownerName}</h5>
                                        <p className="text-gray-600 text-sm font-semibold">📍 {service.initialPlace}</p>
                                        <p className="text-gray-600 text-sm font-semibold">📞 {service.contactInfo}</p>
                                      </div>
                                      <div className="text-right bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                                        <div className="text-xl font-black text-gray-900">{service.cost ? service.cost.toLocaleString() : 'N/A'}</div>
                                        <div className="text-xs text-gray-600 font-bold">ETB</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-white rounded-xl border-2 border-gray-200">
                                <div className="text-4xl mb-2">🐎</div>
                                <p className="text-gray-600 text-sm font-semibold">No horse services available for this route.</p>
                              </div>
                            )}
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
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">Loading guiders...</p>
                </div>
              ) : guiders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <div className="text-6xl mb-4">🗣️</div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No Guiders Available</h3>
                  <p className="text-gray-600 font-semibold">No language guiders registered for this destination yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-bold">🗣️ {guiders.length} Guider{guiders.length !== 1 ? 's' : ''}</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-bold">🌍 {[...new Set(guiders.flatMap(g => g.languages))].length} Languages</span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guiders.map((guider) => (
                      <div key={guider.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="p-5 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
                          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-md">
                            {(guider.fullName || guider.name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-black text-lg">{guider.fullName || guider.name}</h3>
                            <p className="text-gray-600 text-sm font-semibold">Language Guide</p>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">📞</span>
                            <div>
                              <p className="text-gray-600 text-xs uppercase font-bold">Contact</p>
                              <p className="text-gray-900 font-bold">{guider.contactInfo}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs uppercase font-bold mb-2">Languages Spoken</p>
                            <div className="flex flex-wrap gap-2">
                              {guider.languages.map((lang, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-bold">{lang}</span>
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

                  <div className="bg-blue-600 rounded-xl p-5 shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">💡</div>
                      <div>
                        <h4 className="text-white font-black">Hire a Local Guide</h4>
                        <p className="text-blue-100 text-sm font-semibold">Contact any guider above to arrange a tour in your preferred language.</p>
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

      <TourismImageGallery tourismId={tourismId} tourismName={detail?.name || "Tourism Place"} isOpen={imageGalleryOpen} onClose={() => setImageGalleryOpen(false)} preloadedImages={detail?.images} />

      {/* Detail Modals */}
      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'description'}
        onClose={() => setDetailModalOpen(false)}
        title="About This Place"
        icon="🏞️"
        content={detail?.description || "A beautiful destination waiting to be explored."}
        type="description"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'bestTime'}
        onClose={() => setDetailModalOpen(false)}
        title="Best Time to Visit"
        icon="🕐"
        content={detail?.bestTime || "Year-round destination"}
        type="bestTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'visitTime'}
        onClose={() => setDetailModalOpen(false)}
        title="Visit Duration"
        icon="⏱️"
        content={detail?.visitTime || "2-3 hours recommended"}
        type="visitTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'safety'}
        onClose={() => setDetailModalOpen(false)}
        title="Safety Info"
        icon="🛡️"
        content={detail?.peaceInfo || "Safe and welcoming destination"}
        type="safety"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'languages'}
        onClose={() => setDetailModalOpen(false)}
        title="Languages"
        icon="🗣️"
        content={detail?.languages || []}
        type="languages"
      />
    </div>
  );
}