"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import AvatarDropdown from "@/components/common/AvatarDropdown";
import { fetchTourismDetail, incrementTourismView } from "@/services/tourism.service";
import { submitTourismRating, submitHotelRating } from "@/services/rating.service";
import { getHotelsByTourism } from "@/services/hotel.service";
import { getRoadsByTourism } from "@/services/road.service";
import { TourismFullDetailDto } from "@/types/tourism";
import { HotelSummaryDto } from "@/types/hotel";
import { RoadInfoDto } from "@/types/road";
import { LanguageGuiderDto } from "@/types/guider";
import { getGuidersByTourism } from "@/services/guider.service";
import { getImageUrl } from "@/utils/imageUrl";
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
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

const RoadMapModal = dynamic(() => import("@/components/map/RoadMapModal"), { ssr: false });
const TourismMapModal = dynamic(() => import("@/components/map/TourismMapModal"), { ssr: false });

type TabType = 'overview' | 'nearby' | 'hotels' | 'roads' | 'guiders';

// Generate or retrieve session ID from localStorage
function getOrCreateSessionId(): string {
  const SESSION_KEY = 'tourism_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate a unique session ID using browser fingerprint
    const nav = navigator;
    const screen = window.screen;
    const fingerprint = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ].join('|');
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    sessionId = `session_${Math.abs(hash)}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

// Check if this place was recently viewed
function wasRecentlyViewed(tourismId: number): boolean {
  const VIEWED_KEY = 'tourism_viewed_places';
  const EXPIRY_HOURS = 24;
  
  try {
    const viewedData = localStorage.getItem(VIEWED_KEY);
    if (!viewedData) return false;
    
    const viewed = JSON.parse(viewedData) as Record<string, number>;
    const lastViewTime = viewed[tourismId.toString()];
    
    if (!lastViewTime) return false;
    
    const hoursSinceView = (Date.now() - lastViewTime) / (1000 * 60 * 60);
    return hoursSinceView < EXPIRY_HOURS;
  } catch {
    return false;
  }
}

// Mark place as viewed
function markAsViewed(tourismId: number): void {
  const VIEWED_KEY = 'tourism_viewed_places';
  
  try {
    const viewedData = localStorage.getItem(VIEWED_KEY);
    const viewed = viewedData ? JSON.parse(viewedData) : {};
    viewed[tourismId.toString()] = Date.now();
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewed));
  } catch (err) {
    console.error('Failed to mark as viewed:', err);
  }
}

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
  const { t } = useTranslation();

  const [detail, setDetail] = useState<TourismFullDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Translate dynamic DB content — placed after state declarations
  const translatedName = useTranslateText(detail?.name);
  const translatedDescription = useTranslateText(detail?.description);
  const translatedBestTime = useTranslateText(detail?.bestTime);
  const translatedVisitTime = useTranslateText(detail?.visitTime ? formatVisitTime(detail.visitTime) : null);
  const translatedSafety = useTranslateText((detail as any)?.peaceInfo);
  const translatedLanguages = useTranslateText((detail as any)?.languages?.join(', '));

  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [roads, setRoads] = useState<RoadInfoDto[]>([]);
  const [roadsLoading, setRoadsLoading] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<RoadInfoDto | null>(null);
  const [tourismMapOpen, setTourismMapOpen] = useState(false);
  const [hotelMapOpen, setHotelMapOpen] = useState(false);
  const [selectedHotelForMap, setSelectedHotelForMap] = useState<HotelSummaryDto | null>(null);
  const [guiders, setGuiders] = useState<LanguageGuiderDto[]>([]);
  const [guidersLoading, setGuidersLoading] = useState(false);
  const [guiderLangFilter, setGuiderLangFilter] = useState('');
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [showGuiderPhoneModal, setShowGuiderPhoneModal] = useState<{ show: boolean; phone: string; guiderId: number; name: string }>({ 
    show: false, 
    phone: '', 
    guiderId: 0,
    name: ''
  });
  const [copiedGuiderId, setCopiedGuiderId] = useState<number | null>(null);

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

  const trackView = async () => {
    // Only track if not recently viewed
    if (wasRecentlyViewed(tourismId)) {
      console.log('View already tracked within 24 hours');
      return;
    }

    try {
      const sessionId = getOrCreateSessionId();
      const result = await incrementTourismView(
        tourismId,
        sessionId,
        undefined, // IP will be captured by backend
        navigator.userAgent
      );
      
      if (result.counted) {
        console.log('View counted successfully');
        markAsViewed(tourismId);
        // Update the view count in the detail
        setDetail(prev => prev ? { ...prev, viewersCount: result.viewCount } : null);
      } else {
        console.log('View not counted (duplicate within 24h)');
      }
    } catch (err) {
      console.error('Failed to track view:', err);
      // Don't show error to user - view tracking is non-critical
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

  // Track view after detail is loaded
  useEffect(() => {
    if (detail) {
      trackView();
    }
  }, [detail?.id]); // Only run when detail ID changes

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

  const handleGuiderCallClick = (guiderId: number, phoneNumber: string, name: string) => {
    setShowGuiderPhoneModal({ show: true, phone: phoneNumber, guiderId, name });
  };

  const handleGuiderCopy = (guiderId: number, phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedGuiderId(guiderId);
    setTimeout(() => setCopiedGuiderId(null), 2000);
  };

  const closeGuiderPhoneModal = () => {
    setShowGuiderPhoneModal({ show: false, phone: '', guiderId: 0, name: '' });
    setCopiedGuiderId(null);
  };

  // Keyboard navigation for the image lightbox
  useEffect(() => {
    if (zoomedImageIndex === null || !detail?.images?.length) return;
    const total = detail.images.length;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setZoomedImageIndex(i => i !== null ? (i - 1 + total) % total : null);
      if (e.key === 'ArrowRight') setZoomedImageIndex(i => i !== null ? (i + 1) % total : null);
      if (e.key === 'Escape') setZoomedImageIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomedImageIndex, detail?.images?.length]);

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
    { id: 'overview', label: t("tourism.description"), icon: '' },
    { id: 'nearby', label: t("tourism.nearbyPlaces"), icon: '', count: detail?.nearbyPlaces?.length || 0 },
    { id: 'hotels', label: t("nav.hotels"), icon: '', count: hotels.length },
    { id: 'roads', label: t("road.roads"), icon: '', count: roads.length },
    { id: 'guiders', label: t("guider.languageGuiders"), icon: '', count: guiders.length },
  ];


  return (
    <div className="min-h-screen bg-white">
      {/* Sticky top bar with hamburger + action buttons */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center h-12 px-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 flex-shrink-0 flex items-center justify-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button onClick={() => router.back()} className="h-8 w-8 flex-shrink-0 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="ml-1 text-gray-900 font-bold text-sm flex-shrink-0 max-w-[60px] truncate hidden sm:block">{detail.name}</span>
          {/* Spacer — pushes buttons to right */}
          <div className="flex-1 min-w-0" />
          {/* Scrollable action buttons — scrollbar fully hidden */}
          <div
            className="flex items-center gap-0 shrink-0 max-w-[calc(100vw-155px)] sm:max-w-none"
            style={{ overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button onClick={() => setTourismMapOpen(true)} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("map.interactiveMap")}</button>
            <button onClick={() => setActiveTab('hotels')} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("nav.hotels")}</button>
            <button onClick={() => setActiveTab('roads')} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("road.roads")} &amp; {t("horse.horseServices")}</button>
            <button onClick={() => setActiveTab('guiders')} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("guider.languageGuiders")}</button>
            <button onClick={() => setActiveTab('nearby')} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("tourism.nearbyPlaces")}</button>
            <button onClick={() => { if (requireAuth()) setRatingModalOpen(true); }} className="flex-shrink-0 px-2 text-gray-900 text-sm font-black hover:text-black transition-all whitespace-nowrap">{t("tourism.writeReview")}</button>
          </div>
          {/* Avatar — top right */}
          <div className="flex-shrink-0 ml-1">
            <AvatarDropdown onLoginClick={() => { setAuthMode('login'); setAuthModal(true); }} />
          </div>
        </div>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl flex flex-col bg-white">
            {/* White header */}
            <div className="px-4 py-3 bg-white border-b border-gray-200">
              <button onClick={() => router.push('/tourisms')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-xs font-bold mb-2 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t("common.back")}
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-black text-base text-gray-700">
                  {detail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-xs truncate">{detail.name}</p>
                  <p className="text-gray-500 text-xs">{detail.wereda}</p>
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
                    ? { backgroundColor: '#dbeafe', color: '#1d4ed8' }
                    : { color: '#374151' }
                  }
                >
                  <svg style={{ color: activeTab === item.id ? '#1d4ed8' : '#6b7280' }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              <div>
                <button onClick={() => { setTourismMapOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t("map.interactiveMap")}
                </button>
                <button onClick={() => { setImageGalleryOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {t("tourism.images")}
                </button>
                <button onClick={() => { requireAuth() && setRatingModalOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  {t("tourism.writeReview")}
                </button>
                <button onClick={() => { setRatingsViewOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {t("tourism.ratings")}
                </button>
              </div>
            </nav>

            {/* User info + logout */}
            <div className="p-4 border-t border-gray-100 bg-white">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center font-black text-sm text-gray-700">
                    {username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-xs font-bold truncate">{username}</p>
                    <p className="text-green-600 text-xs">✓ {t("common.success")}</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setAuthModal(true); setSidebarOpen(false); }} className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all">
                  {t("auth.login")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content — full width */}
      <main className="min-h-screen">
        <div className="relative h-48 md:h-56">
          <Image src={getImageUrl(detail.images?.[currentImageIndex]?.imageUrl || detail.imageUrl, "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800")} alt={detail.name} fill className="object-cover" priority />
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
        <div className="p-4 md:p-6 bg-white min-h-[calc(100vh-14rem)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-1.5">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">

                {/* Card 1 — About This Place */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("tourism.description")}:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4 pr-0">{translatedDescription || t("tourism.noDescription")}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('description')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("common.seeMore")} →
                      </button>
                    </span>
                  </div>
                </div>

                {/* Card 2 — Best Time to Visit */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("tourism.bestTime")}:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{translatedBestTime || "Year-round destination"}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('bestTime')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("common.seeMore")} →
                      </button>
                    </span>
                  </div>
                </div>

                {/* Card 3 — Visit Duration */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("tourism.visitDuration")}:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{translatedVisitTime || t("common.loading")}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('visitTime')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("common.seeMore")} →
                      </button>
                    </span>
                  </div>
                </div>

                {/* Card 4 — Safety Info */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("tourism.safetyInfo")}:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{translatedSafety || detail.peaceInfo || t("tourism.noDescription")}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('safety')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("common.seeMore")} →
                      </button>
                    </span>
                  </div>
                </div>

                {/* Card 5 — Languages */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("guider.languages")}:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">
                      {detail.languages?.length > 0 ? detail.languages.join(', ') : t("guider.languages")}
                    </p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('languages')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("common.seeMore")} →
                      </button>
                    </span>
                  </div>
                </div>

                {/* Card 6 — Average Rating */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">{t("tourism.ratings")}:</h3>
                  <div className="relative">
                    <div className="text-lg font-black text-yellow-500 leading-tight">{computeRatingSummary(detail).avgRating?.toFixed(1) || '0'}/5</div>
                    <p className="text-gray-500 text-xs font-medium mt-0.5 line-clamp-2">{computeRatingSummary(detail).totalRatings || 0} {t("tourism.ratings")}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => setRatingsViewOpen(true)} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        {t("tourism.ratings")} →
                      </button>
                    </span>
                  </div>
                </div>

              </div>

              {/* Gallery — grid layout like hotels */}
              {detail.images && detail.images.length > 1 && (
                <div className="bg-white rounded-2xl px-4 py-4 border border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-3">{t("tourism.images")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {detail.images.map((img, idx) => (
                      <button key={idx} onClick={() => setZoomedImageIndex(idx)} className="relative h-32 rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-all">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(img.imageUrl)} alt={img.title || `${detail.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => setImageGalleryOpen(true)} className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">
                      {t("tourism.images")}
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Images — no images case */}
              {(!detail.images || detail.images.length <= 1) && (
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-900 font-black">{t("tourism.images")}</h3>
                    <button onClick={() => setImageGalleryOpen(true)}
                      className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">
                      {t("tourism.images")}
                    </button>
                  </div>
                </div>
              )}

              {/* Nearby Places Preview */}
              {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-black text-lg">{t("tourism.nearbyPlaces")} — {detail.kebele}</h3>
                    <button onClick={() => setActiveTab('nearby')} className="text-blue-600 text-sm font-black hover:text-blue-700 hover:underline transition-all">
                      {t("home.viewAllPlaces")} ({detail.nearbyPlaces.length}) →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {detail.nearbyPlaces.slice(0, 3).map((place) => (
                      <div key={place.id} onClick={() => router.push(`/tourisms/${place.id}`)} className="relative h-28 rounded-xl overflow-hidden cursor-pointer group border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all">
                        {place.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getImageUrl(place.imageUrl)} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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

            </div>
          )}


          {/* Nearby Places Tab */}
          {activeTab === 'nearby' && (
            <div>
              <div className="mb-5">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{t("tourism.nearbyPlaces")}</h2>
                <p className="text-gray-600 font-semibold">{t("tourism.explore")} {detail.kebele}</p>
              </div>
              
              {!detail.nearbyPlaces || detail.nearbyPlaces.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                  <h3 className="text-xl font-black text-gray-900 mb-2">{t("common.noResults")}</h3>
                  <p className="text-gray-600 font-semibold">{t("tourism.noDescription")}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {detail.nearbyPlaces.map((place) => (
                    <div key={place.id} onClick={() => router.push(`/tourisms/${place.id}`)} className="bg-white rounded-xl overflow-hidden cursor-pointer group shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] transition-all">
                      <div className="relative h-44">
                        {place.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getImageUrl(place.imageUrl)} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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
                        <span className="text-gray-700 text-sm font-black">{t("tourism.location")}</span>
                        <span className="text-blue-600 text-sm font-black hover:text-blue-700">{t("hotel.viewDetails")} →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="space-y-1.5">
              {/* Header — borderless, tight top margin */}
              <div className="bg-white px-1 pt-0 pb-2 flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Hotels & Accommodations</h2>
                <span className="text-gray-300">·</span>
                <p className="text-gray-400 text-sm font-medium">{t("hotel.description")} {detail.name}</p>
              </div>

              {hotelsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">{t("hotel.loading")}</p>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-1">{t("common.noResults")}</h3>
                  <p className="text-gray-500 text-sm font-semibold">{t("hotel.notFound")}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col">
                      {/* Shorter image height */}
                      <div className="relative w-full h-40">
                        {(() => {
                          let rawUrl = '';
                          if (hotel.images && hotel.images.length > 0) {
                            rawUrl = hotel.images[0].imageUrl;
                          } else if (hotel.imageUrl) {
                            rawUrl = hotel.imageUrl;
                          }
                          const imageUrl = getImageUrl(rawUrl);
                          return imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 text-yellow-400 text-sm font-black drop-shadow-lg">
                          {'★'.repeat(hotel.stars || 3)}{'☆'.repeat(5 - (hotel.stars || 3))}
                        </div>
                      </div>
                      {/* Info + buttons with minimal padding */}
                      <div className="px-3 py-2.5 flex flex-col gap-2 flex-1">
                        <h3 className="text-gray-900 font-black text-sm leading-tight truncate">{hotel.name}</h3>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => router.push(`/hotels/${hotel.id}`)}
                            className="flex-1 bg-white text-blue-700 py-2 px-0.5 rounded-xl text-sm font-black border border-blue-100 hover:bg-blue-50 hover:scale-105 transition-all shadow-sm"
                          >
                            {t("hotel.viewDetails")}
                          </button>
                          <button
                            onClick={() => router.push(`/hotels/${hotel.id}`)}
                            className="flex-1 bg-white text-blue-700 py-2 px-0.5 rounded-xl text-sm font-black border border-blue-100 hover:bg-blue-50 hover:scale-105 transition-all shadow-sm"
                          >
                            {t("hotel.bookNow")}
                          </button>
                          <button
                            onClick={() => { setSelectedHotelForMap(hotel); setHotelMapOpen(true); }}
                            className="flex-1 bg-white text-blue-700 py-2 px-0.5 rounded-xl text-sm font-black border border-blue-100 hover:bg-blue-50 hover:scale-105 transition-all shadow-sm"
                          >
                            {t("road.viewMap")}
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
              {/* Header + stats in one row */}
              <div className="flex items-center gap-2 px-1 pt-0 pb-2 flex-wrap">
                <h2 className="text-lg font-black text-gray-900 flex-shrink-0">{t("road.roads")}</h2>
                <span className="text-gray-300 flex-shrink-0">·</span>
                <p className="text-gray-400 text-sm font-medium flex-shrink-0">{t("road.roadInfo")} {detail.name}</p>
                <div className="ml-auto flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200">{roads.filter(r => r.distanceByCar).length} {t("road.roads")}</span>
                  {roads.filter(r => r.distanceByFoot).length > 0 && (
                    <span className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200">{t("road.distance")}</span>
                  )}
                  {roads.filter(r => r.distanceByHorse).length > 0 && (
                    <span className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200">{roads.filter(r => r.distanceByHorse).length} {t("horse.horseServices")}</span>
                  )}
                </div>
              </div>

              {roadsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">{t("road.loading")}</p>
                </div>
              ) : roads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-black text-gray-900 mb-2">{t("common.noResults")}</h3>
                  <p className="text-gray-600 font-semibold">{t("road.roadInfo")}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roads.map((road) => (
                    <div key={road.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col">
                      {/* Card header */}
                      <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-gray-900 font-black text-sm">{t("road.from")} {road.initialPlace}</h3>
                      </div>

                      <div className="px-4 py-3 flex flex-col gap-3 flex-1">
                        {road.description && (
                          <p className="text-gray-500 text-xs leading-relaxed">{road.description}</p>
                        )}

                        {/* Road Supports — column format */}
                        <div>
                          <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1.5">{t("road.roadInfo")}</p>
                          <div className="space-y-1">
                            {road.distanceByCar && (
                              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-600">{t("road.byCar")}</span>
                                <span className="text-sm font-black text-gray-900">{road.distanceByCar.toFixed(1)} km</span>
                              </div>
                            )}
                            {road.distanceByFoot && (
                              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-600">{t("road.byFoot")}</span>
                                <span className="text-sm font-black text-gray-900">{road.distanceByFoot.toFixed(1)} km</span>
                              </div>
                            )}
                            {road.distanceByHorse && (
                              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-600">{t("road.byHorse")}</span>
                                <span className="text-sm font-black text-gray-900">{road.distanceByHorse.toFixed(1)} km</span>
                              </div>
                            )}
                            {road.distanceByPlane && (
                              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-600">{t("road.byPlane")}</span>
                                <span className="text-sm font-black text-gray-900">{road.distanceByPlane.toFixed(1)} km</span>
                              </div>
                            )}
                            {road.totalDistance && (
                              <div className="flex items-center justify-between py-1">
                                <span className="text-sm font-black text-gray-900">{t("road.total")}</span>
                                <span className="text-sm font-black text-gray-900">{road.totalDistance.toFixed(1)} km</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons — pushed to bottom */}
                        <div className="flex flex-col gap-1.5 mt-auto pt-1">
                          <button onClick={() => { setSelectedRoad(road); setMapModalOpen(true); }}
                            className="w-full bg-white text-blue-700 py-2 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-50 transition-all">
                            {t("road.viewMap")}
                          </button>
                          <button onClick={() => router.push(`/horsers?roadId=${road.id}`)}
                            className="w-full bg-white text-blue-700 py-2 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-50 transition-all">
                            {t("horse.horseServices")}
                          </button>
                        </div>
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
              {/* Header row with language search on the right */}
              <div className="flex items-center gap-2 px-1 pt-0 pb-2 flex-wrap">
                <h2 className="text-lg font-black text-gray-900 flex-shrink-0">{t("guider.languageGuiders")}</h2>
                <span className="text-gray-300 flex-shrink-0">·</span>
                <p className="text-gray-400 text-sm font-medium flex-shrink-0">{t("guider.languageGuiders")} {detail.name}</p>
                {guiders.length > 0 && (
                  <>
                    <span className="text-gray-300 flex-shrink-0">·</span>
                    <span className="text-gray-500 text-sm font-semibold flex-shrink-0">
                      {guiders.filter(g => !guiderLangFilter.trim() || g.languages.some(l => l.toLowerCase().includes(guiderLangFilter.toLowerCase()))).length} {t("guider.languageGuiders")}
                    </span>
                  </>
                )}
                {/* Language search */}
                <div className="ml-auto flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={guiderLangFilter}
                    onChange={e => setGuiderLangFilter(e.target.value)}
                    placeholder={t("common.search")}
                    className="text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent w-36"
                  />
                  {guiderLangFilter && (
                    <button onClick={() => setGuiderLangFilter('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {guidersLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-700 font-black">{t("common.loading")}</p>
                </div>
              ) : guiders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-black text-gray-900 mb-2">{t("common.noResults")}</h3>
                  <p className="text-gray-600 font-semibold">{t("guider.languageGuiders")}</p>
                </div>
              ) : (() => {
                const filtered = guiderLangFilter.trim()
                  ? guiders.filter(g => g.languages.some(l => l.toLowerCase().includes(guiderLangFilter.toLowerCase())))
                  : guiders;
                return filtered.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-500 font-semibold">No guiders found for "<span className="font-black text-gray-700">{guiderLangFilter}</span>"</p>
                    <button onClick={() => setGuiderLangFilter('')} className="mt-2 text-blue-600 text-sm font-bold hover:underline">Clear filter</button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((guider) => (
                      <div key={guider.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col">
                        {/* Card header */}
                        <div className="px-4 py-2.5 flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-gray-900 truncate">{guider.fullName || guider.name}</h3>
                            <p className="text-xs text-gray-400">{t("guider.languageGuiders")}</p>
                          </div>
                        </div>

                        <div className="px-4 pb-3 flex flex-col gap-3 flex-1">
                          {/* Info column */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm font-semibold text-gray-600">{t("common.contactUs")}</span>
                              <span className="text-sm font-black text-gray-900">{guider.contactInfo}</span>
                            </div>
                            <div className="flex items-start justify-between py-1">
                              <span className="text-sm font-semibold text-gray-600 flex-shrink-0">{t("guider.languages")}</span>
                              <span className="text-sm font-black text-gray-900 text-right ml-2">
                                {guider.languages.map((lang, idx) => (
                                  <span key={idx}>
                                    <span className={guiderLangFilter && lang.toLowerCase().includes(guiderLangFilter.toLowerCase()) ? 'text-blue-700 underline' : ''}>
                                      {lang}
                                    </span>
                                    {idx < guider.languages.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm font-semibold text-gray-600">{t("guider.available")}</span>
                              <span className={`text-sm font-black flex items-center gap-1 ${guider.active ? 'text-green-600' : 'text-red-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${guider.active ? 'bg-green-600' : 'bg-red-500'}`}></span>
                                {guider.active ? t("guider.available") : t("horse.unavailable")}
                              </span>
                            </div>
                          </div>

                          {/* Buttons pushed to bottom */}
                          <div className="flex gap-2 mt-auto pt-1">
                            <button
                              onClick={() => handleGuiderCallClick(guider.id, guider.contactInfo, guider.fullName || guider.name || 'Guide')}
                              className="flex-1 bg-white text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors border border-blue-200"
                            >
                              {t("common.contactUs")}
                            </button>
                            <button
                              disabled
                              className="flex-1 bg-white text-gray-400 py-2 rounded-lg font-normal text-sm cursor-not-allowed border border-gray-200"
                            >
                              {t("guider.bookGuider")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={authModal} onClose={() => setAuthModal(false)} closeOnOutsideClick={false} closeOnEscape={false}>
        {authMode === 'login' ? (
          <LoginForm onSuccess={() => { setAuthModal(false); router.refresh(); }} onRegisterClick={() => setAuthMode('register')} onCancel={() => setAuthModal(false)} />
        ) : (
          <RegisterForm onSuccess={() => { setAuthModal(false); }} onLoginClick={() => setAuthMode('login')} onCancel={() => setAuthModal(false)} />
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

      {/* Guider Phone Number Modal */}
      {showGuiderPhoneModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t("common.contactUs")} {showGuiderPhoneModal.name}</h3>
              <button
                onClick={closeGuiderPhoneModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 flex-1">{showGuiderPhoneModal.phone}</span>
                <button
                  onClick={() => handleGuiderCopy(showGuiderPhoneModal.guiderId, showGuiderPhoneModal.phone)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  {copiedGuiderId === showGuiderPhoneModal.guiderId ? '✓ ' + t("common.ok") : t("common.ok")}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center mb-4">
              {t("common.contactUs")}
            </p>

            <button
              onClick={closeGuiderPhoneModal}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
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

      {/* Image Zoom Modal with Navigation */}
      {zoomedImageIndex !== null && detail?.images && detail.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setZoomedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-bold z-10">
            {zoomedImageIndex + 1} / {detail.images.length}
          </div>

          {/* Previous button */}
          {detail.images.length > 1 && (
            <button
              onClick={() => setZoomedImageIndex(i => i !== null ? (i - 1 + detail.images.length) % detail.images.length : null)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(detail.images[zoomedImageIndex].imageUrl)}
              alt={detail.images[zoomedImageIndex].title || `${detail.name} ${zoomedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Next button */}
          {detail.images.length > 1 && (
            <button
              onClick={() => setZoomedImageIndex(i => i !== null ? (i + 1) % detail.images.length : null)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image dots indicator */}
          {detail.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {detail.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setZoomedImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition ${idx === zoomedImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TourismImageGallery tourismId={tourismId} tourismName={detail?.name || "Tourism Place"} isOpen={imageGalleryOpen} onClose={() => setImageGalleryOpen(false)} preloadedImages={detail?.images} />

      {/* Detail Modals */}
      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'description'}
        onClose={() => setDetailModalOpen(false)}
        title={t("tourism.description")}
        icon=""
        content={detail?.description || t("tourism.noDescription")}
        type="description"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'bestTime'}
        onClose={() => setDetailModalOpen(false)}
        title={t("tourism.bestTime")}
        icon=""
        content={detail?.bestTime || t("tourism.noDescription")}
        type="bestTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'visitTime'}
        onClose={() => setDetailModalOpen(false)}
        title={t("tourism.bestTime")}
        icon=""
        content={detail?.visitTime ? formatVisitTime(detail.visitTime) : t("tourism.noDescription")}
        type="visitTime"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'safety'}
        onClose={() => setDetailModalOpen(false)}
        title={t("common.info")}
        icon=""
        content={detail?.peaceInfo || t("tourism.noDescription")}
        type="safety"
      />

      <TourismDetailModal
        isOpen={detailModalOpen && detailModalType === 'languages'}
        onClose={() => setDetailModalOpen(false)}
        title={t("guider.languages")}
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