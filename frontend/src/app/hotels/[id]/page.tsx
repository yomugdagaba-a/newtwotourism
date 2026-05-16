"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import AvatarDropdown from "@/components/common/AvatarDropdown";
import { getHotelDetails } from "@/services/hotel.service";
import { submitHotelRating } from "@/services/rating.service";
import { BookingService, Booking, BookingRequest, BOOKING_STATUS } from "@/services/booking.service";
import { COUNTRIES } from "@/components/common/PhoneInput";
import { HotelDetailInfoDto } from "@/types/hotel";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import Modal from "@/components/common/Modal";
import { getImageUrl } from "@/utils/imageUrl";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import { API_BASE_URL } from "@/services/api";
import { ModeSwitcherCompact } from "@/components/common/ModeSwitcher";
import { useToast } from "@/components/common/Toast";
import { sanitizeInternationalPhone, validateInternationalPhone } from "@/utils/formValidation";

type TabType = 'details' | 'booking' | 'my-bookings';

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated, userId, username, role, browsingMode } = useAuthStore();
  const toast = useToast();
  const hotelId = Number(params.id);

  // Hotel state
  const [hotel, setHotel] = useState<HotelDetailInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if current user is the hotel owner (must be after hotel state)
  const isHotelOwner = hotel?.ownerId === userId;
  const isAdmin = role === "ADMIN";
  
  // Check if user is in owner mode and owns this hotel
  const isInOwnerMode = role === "HOTEL_OWNER" && browsingMode === "OWNER" && isHotelOwner;

  // Booking state
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingRequest>({
    hotelId,
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
    numberOfRooms: 1,
    specialRequests: '',
    clientPhone: '',
    clientEmail: '',
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState('+251');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [problemReport, setProblemReport] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');

  // Modal state
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingsViewOpen, setRatingsViewOpen] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Detail modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<'description' | 'policies'>('description');

  useEffect(() => {
    loadHotel();
  }, [hotelId, token]);

  useEffect(() => {
    if (activeTab === 'my-bookings' && isAuthenticated) {
      loadMyBookings();
      // Poll every 15 seconds so client sees cost proposals without manual refresh
      const interval = setInterval(() => loadMyBookings(), 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isAuthenticated]);



  const loadHotel = async () => {
    try {
      setLoading(true);
      const data = await getHotelDetails(hotelId, token);
      setHotel(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load hotel");
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    if (!token || !userId) return;
    try {
      setBookingsLoading(true);
      const bookings = await BookingService.getMyBookings(token, userId);
      const hotelBookings = bookings.filter(b => b.hotel.id === hotelId);
      setMyBookings(hotelBookings);
      if (hotelBookings.length > 0 && !selectedBooking) {
        setSelectedBooking(hotelBookings[0]);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Validate booking form
  const validateBookingForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.checkIn) errors.checkIn = 'Check-in date is required';
    if (!formData.checkOut) errors.checkOut = 'Check-out date is required';
    if (formData.checkIn && formData.checkOut && new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      errors.checkOut = 'Check-out must be after check-in';
    }
    if (!formData.numberOfGuests || formData.numberOfGuests < 1) errors.numberOfGuests = 'At least 1 guest required';
    if (formData.numberOfGuests > 20) errors.numberOfGuests = 'Maximum 20 guests';
    
    // International phone validation - supports all countries
    if (formData.clientPhone) {
      const fullPhone = `${phoneCountryCode}${formData.clientPhone}`;
      const phoneResult = validateInternationalPhone(fullPhone);
      if (!phoneResult.valid) {
        errors.clientPhone = phoneResult.error!;
      }
    }
    
    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.clientEmail = 'Invalid email format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { setAuthModal(true); return; }
    if (!token || !userId) { setBookingError("Please log out and log in again."); return; }
    
    if (!validateBookingForm()) return;

    try {
      setSubmitting(true);
      setBookingError(null);
      const bookingData = {
        ...formData,
        numberOfGuests: formData.numberOfGuests || 1,
        numberOfRooms: formData.numberOfRooms || 1,
        clientPhone: formData.clientPhone ? `${phoneCountryCode}${formData.clientPhone.replace(/^0+/, '')}` : ''
      };
      const newBooking = await BookingService.createBooking(token, userId, bookingData);
      setFormData({ ...formData, checkIn: '', checkOut: '', specialRequests: '', clientPhone: '', clientEmail: '' });
      setFormErrors({});
      setBookingModalOpen(false);
      toast.success('Booking request submitted successfully!');
      router.push('/bookings');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!token || !userId || !selectedBooking || !receiptFile) return;
    // OPTIMISTIC UPDATE: immediately show PAID state
    const optimisticBooking = { ...selectedBooking, bookingStatus: 'PAID' as any };
    setSelectedBooking(optimisticBooking);
    setMyBookings(prev => prev.map(b => b.bookingId === optimisticBooking.bookingId ? optimisticBooking : b));
    setReceiptFile(null);
    setReceiptPreview(null);
    try {
      setSubmitting(true);
      const updated = await BookingService.uploadReceiptFile(token, selectedBooking.bookingId, receiptFile, userId);
      setSelectedBooking(updated);
      setMyBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload receipt";
      await loadMyBookings();
      if (msg !== 'TIMEOUT_RELOAD') toast.error(msg);
    }
    finally { setSubmitting(false); }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.warning('Please select an image file (JPG, PNG, GIF, WebP) or PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('File size must be less than 10MB');
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setReceiptPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage.trim()) return;
    try {
      const updated = await BookingService.sendMessage(token, selectedBooking.bookingId, newMessage, userId);
      setSelectedBooking(updated);
      setMyBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
      setNewMessage('');
    } catch (err) { toast.error('Failed to send message'); }
  };

  const handleReportProblem = async () => {
    if (!token || !userId || !selectedBooking || !problemReport.trim()) return;
    try {
      const updated = await BookingService.reportProblem(token, selectedBooking.bookingId, problemReport, userId);
      setSelectedBooking(updated);
      setMyBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
      setProblemReport('');
      toast.success('Problem reported to admin');
    } catch (err) { toast.error('Failed to report problem'); }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!token) return;
    try {
      await submitHotelRating(hotelId, rating, comment || undefined, token);
      setRatingModalOpen(false);
      toast.success("Thank you for your review!");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to submit rating"); }
  };

  const openDetailModal = (type: 'description' | 'policies') => {
    setDetailModalType(type);
    setDetailModalOpen(true);
  };

  // Keyboard navigation for the image lightbox
  useEffect(() => {
    if (zoomedImageIndex === null || !hotel?.images?.length) return;
    const total = hotel.images.length;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setZoomedImageIndex(i => i !== null ? (i - 1 + total) % total : null);
      if (e.key === 'ArrowRight') setZoomedImageIndex(i => i !== null ? (i + 1) % total : null);
      if (e.key === 'Escape') setZoomedImageIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomedImageIndex, hotel?.images?.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-[#111827] font-bold">Loading Hotel...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white p-8 rounded-2xl text-center border border-[#E5E7EB] shadow-xl">
          <h2 className="text-2xl font-black text-[#111827] mb-3">Hotel Not Found</h2>
          <p className="text-[#6B7280] font-semibold mb-6">{error}</p>
          <button onClick={() => router.push('/hotels')} className="px-6 py-3 bg-[#2563EB] text-white rounded-xl text-sm font-black hover:bg-[#1D4ED8] shadow-lg transition-all">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const starRating = hotel.starRating || hotel.stars || 4;
  const contactInfo = hotel.contactInfo || '';
  const policies = hotel.policies || '';

  const navigation = [
    { id: 'details', label: 'Hotel Details', icon: '', color: 'from-emerald-500 to-teal-500' },
    { id: 'booking', label: 'New Booking', icon: '', color: 'from-blue-500 to-indigo-500' },
    { id: 'my-bookings', label: 'My Bookings', icon: '', color: 'from-purple-500 to-pink-500', count: myBookings.length },
  ];

  // Add owner management link if user is the hotel owner or admin
  const ownerNavigation = (isHotelOwner || isAdmin) ? [
    { id: 'owner-manage', label: 'Manage Bookings', icon: '', color: 'from-orange-500 to-red-500', isOwnerLink: true },
  ] : [];

  const quickActions = [
    { label: 'Rate Hotel', icon: '★', action: () => isAuthenticated ? setRatingModalOpen(true) : setAuthModal(true), color: 'from-amber-400 to-orange-500' },
    { label: 'View Reviews', icon: '', action: () => setRatingsViewOpen(true), color: 'from-gray-500 to-gray-700' },
    { label: 'Call Hotel', icon: '', action: () => contactInfo && window.open(`tel:${contactInfo}`), color: 'from-green-500 to-emerald-600' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* White header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => hotel.tourismPlaceId ? router.push(`/tourisms/${hotel.tourismPlaceId}`) : router.push('/hotels')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-xs font-bold mb-2 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {hotel.tourismPlaceId ? 'Back to Tourism' : 'Back to Hotels'}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-black text-base text-gray-700">
            {hotel.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 font-bold text-xs truncate">{hotel.name}</p>
            {hotel.starRating && <p className="text-gray-500 text-xs">{'★'.repeat(hotel.starRating)} {hotel.starRating} stars</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto bg-white">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'booking') {
                if (!isAuthenticated) {
                  setAuthModal(true);
                } else {
                  setBookingModalOpen(true);
                  setSidebarOpen(false);
                }
              } else if (item.id === 'my-bookings') {
                if (!isAuthenticated) {
                  setAuthModal(true);
                } else {
                  router.push('/bookings');
                }
              } else {
                setActiveTab(item.id as TabType);
                setSidebarOpen(false);
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === item.id
              ? { backgroundColor: '#dbeafe', color: '#1d4ed8' }
              : { color: '#374151' }
            }
          >
            <svg style={{ color: activeTab === item.id ? '#1d4ed8' : '#6b7280' }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.id === 'details' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
              {item.id === 'booking' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              {item.id === 'my-bookings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
            </svg>
            <span className="flex-1 text-left">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{item.count}</span>
            )}
          </button>
        ))}

        {(isHotelOwner || isAdmin) && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Owner Panel</p>
            <button
              onClick={() => router.push(`/hotels/${hotelId}/booking`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="flex-1 text-left">Manage Bookings</span>
            </button>
          </div>
        )}

        <div>
          {activeTab === 'my-bookings' && [
            { key: 'ALL', label: 'All' },
            { key: 'REQUESTED', label: 'Requested' },
            { key: 'OWNER_ACCEPTED', label: 'Accepted' },
            { key: 'COST_PROPOSED', label: 'Cost Proposed' },
            { key: 'PAID', label: 'Paid' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map(s => {
            const count = s.key === 'ALL' ? myBookings.length : myBookings.filter(b => b.bookingStatus === s.key).length;
            const isActive = bookingStatusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setBookingStatusFilter(s.key);
                  const filtered = s.key === 'ALL' ? myBookings : myBookings.filter(b => b.bookingStatus === s.key);
                  if (filtered.length > 0) setSelectedBooking(filtered[0]);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-semibold transition-all mb-0.5"
                style={isActive
                  ? { backgroundColor: '#dbeafe', color: '#1d4ed8' }
                  : { color: '#374151' }
                }
              >
                <span>{s.label}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        <div>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
                {idx === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                {idx === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
              </svg>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {role === "HOTEL_OWNER" && (
          <div className="mb-3">
            <ModeSwitcherCompact className="w-full justify-center" />
          </div>
        )}
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center font-black text-sm text-gray-700">
                {username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-xs font-bold truncate">{username}</p>
                <p className="text-green-600 text-xs">✓ Logged in</p>
              </div>
            </div>
          </>
        ) : (
          <button onClick={() => { setAuthMode('login'); setAuthModal(true); }} className="w-full mb-3 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all">
            Login to Book
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Sticky top bar with hamburger + action buttons in one row */}
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
          <button onClick={() => router.back()} className="h-8 w-8 flex-shrink-0 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-gray-900 font-bold text-sm flex-shrink-0 max-w-[60px] truncate ml-1 hidden sm:block">{hotel.name}</span>
          {/* Spacer — pushes buttons to right */}
          <div className="flex-1 min-w-0" />
          {/* Scrollable action buttons — scrollbar fully hidden */}
          <div
            className="flex items-center gap-0 shrink-0 max-w-[calc(100vw-155px)] sm:max-w-none"
            style={{ overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button onClick={() => isAuthenticated ? setBookingModalOpen(true) : setAuthModal(true)} className="flex-shrink-0 px-2 text-gray-800 text-sm font-black hover:text-black transition-all whitespace-nowrap">New Booking</button>
            <button onClick={() => isAuthenticated ? router.push('/bookings') : setAuthModal(true)} className="flex-shrink-0 px-2 text-gray-800 text-sm font-black hover:text-black transition-all whitespace-nowrap">My Bookings</button>
            <button onClick={() => isAuthenticated ? setRatingModalOpen(true) : setAuthModal(true)} className="flex-shrink-0 px-2 text-gray-800 text-sm font-black hover:text-black transition-all whitespace-nowrap">Rate Hotel</button>
            <button onClick={() => setRatingsViewOpen(true)} className="flex-shrink-0 px-2 text-gray-800 text-sm font-black hover:text-black transition-all whitespace-nowrap">View Reviews</button>
          </div>
          {/* Avatar — top right */}
          <div className="flex-shrink-0 ml-1">
            <AvatarDropdown onLoginClick={() => setAuthModal(true)} />
          </div>
        </div>
      </div>

      {/* Main Content — full width */}
      <main className="min-h-screen">
        {/* Hero Header */}
        <div className="relative h-48 md:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(() => {
              if (hotel.images && hotel.images.length > 0) {
                const image = hotel.images[currentImageIndex];
                const raw = typeof image === 'string' ? image : (image as any)?.imageUrl || '';
                return getImageUrl(raw, "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800");
              }
              return "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800";
            })()}
            alt={hotel.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          
          {/* Image Navigation */}
          {hotel.images && hotel.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {hotel.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}

          {/* Hotel Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1.5">{hotel.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-yellow-300 font-bold tracking-wide">
                {'★'.repeat(starRating)}{'☆'.repeat(5 - starRating)}
              </span>
              <span className={`font-bold ${hotel.active !== false ? "text-green-400" : "text-red-400"}`}>
                {hotel.active !== false ? "✓ Active" : "✗ Inactive"}
              </span>
              {(isHotelOwner || isAdmin) && (
                <span className="text-white/90 font-semibold">
                  {isHotelOwner ? "Your Hotel" : "Admin"}
                </span>
              )}
              {contactInfo && (
                <a href={`tel:${contactInfo}`} className="text-white/80 font-medium hover:text-white transition-colors">
                  {contactInfo}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 pt-0 pb-4 md:px-6 md:pt-0 md:pb-6 bg-white min-h-[calc(100vh-14rem)]">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-1.5">
              {/* Info Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">

                {/* Card 1 — About */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">About:</h3>
                  <div className="relative">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{hotel.description || "A wonderful place to stay with excellent amenities and service."}</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => openDetailModal('description')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        See More →
                      </button>
                    </span>
                  </div>
                </div>
                
                {/* Card 2 — Policies (conditional) */}
                {policies && (
                  <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                    <h3 className="text-gray-900 font-black text-sm mb-1">Policies:</h3>
                    <div className="relative">
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{policies}</p>
                      <span className="absolute bottom-0 right-0 flex items-end">
                        <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                        <button onClick={() => openDetailModal('policies')} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                          See More →
                        </button>
                      </span>
                    </div>
                  </div>
                )}

                {/* Card 3 — Star Rating */}
                <div className="rounded-xl p-3 bg-white border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 font-black text-sm mb-1">⭐ Star Rating:</h3>
                  <div className="relative">
                    <div className="text-2xl font-black text-yellow-500 leading-tight">{starRating}/5</div>
                    <p className="text-gray-500 text-xs font-medium mt-0.5 line-clamp-2">Hotel star rating</p>
                    <span className="absolute bottom-0 right-0 flex items-end">
                      <span className="w-12 h-4 bg-gradient-to-r from-transparent to-white" />
                      <button onClick={() => setRatingsViewOpen(true)} className="bg-white text-blue-600 text-xs font-bold hover:text-blue-800 transition-all whitespace-nowrap leading-relaxed">
                        See Reviews →
                      </button>
                    </span>
                  </div>
                </div>

              </div>

              {/* Image Gallery — grid layout, all images visible */}
              {hotel.images && hotel.images.length > 1 && (
                <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
                  <h3 className="text-gray-900 font-black text-base mb-3">Hotel Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hotel.images.map((img, idx) => {
                      const raw = typeof img === 'string' ? img : (img as any)?.imageUrl || '';
                      const imageUrl = getImageUrl(raw, '');
                      return (
                        <button
                          key={idx}
                          onClick={() => setZoomedImageIndex(idx)}
                          className="relative h-32 w-full rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={`${hotel.name} ${idx + 1}`} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={() => setZoomedImageIndex(0)}
                      className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      Zoom Galleries
                    </button>
                    <button
                      onClick={() => isAuthenticated ? setBookingModalOpen(true) : setAuthModal(true)}
                      className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )}

              {/* No images fallback */}
              {(!hotel.images || hotel.images.length <= 1) && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="text-gray-900 font-black mb-3">Hotel Images</h3>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => hotel.images && hotel.images.length > 0 && setZoomedImageIndex(0)}
                      className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      Zoom Galleries
                    </button>
                    <button
                      onClick={() => isAuthenticated ? setBookingModalOpen(true) : setAuthModal(true)}
                      className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )}

              {/* Spacer so content isn't hidden behind sticky bottom bar */}
              <div className="h-20" />
            </div>
          )}

          {/* Booking Tab */}
          {activeTab === 'booking' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">Request a Booking</h2>
                    <p className="text-gray-500 text-xs font-semibold">Fill in your details for review</p>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm font-semibold">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-black mb-1">Check-in Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.checkIn}
                        onChange={(e) => { setFormData({ ...formData, checkIn: e.target.value }); setFormErrors({ ...formErrors, checkIn: '' }); }}
                        className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.checkIn ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                      />
                      {formErrors.checkIn && <p className="text-red-500 text-xs mt-1">{formErrors.checkIn}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-black mb-1">Check-out Date *</label>
                      <input
                        type="date"
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        value={formData.checkOut}
                        onChange={(e) => { setFormData({ ...formData, checkOut: e.target.value }); setFormErrors({ ...formErrors, checkOut: '' }); }}
                        className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.checkOut ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                      />
                      {formErrors.checkOut && <p className="text-red-500 text-xs mt-1">{formErrors.checkOut}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-black mb-1">Guests *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={20}
                        value={formData.numberOfGuests}
                        onChange={(e) => { setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 }); setFormErrors({ ...formErrors, numberOfGuests: '' }); }}
                        className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.numberOfGuests ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                      />
                      {formErrors.numberOfGuests && <p className="text-red-500 text-xs mt-1">{formErrors.numberOfGuests}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-black mb-1">Rooms</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.numberOfRooms || 1}
                        onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="block text-gray-700 text-xs font-black mb-1">Phone (International)</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="w-28 bg-white border border-gray-100 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => { 
                          const sanitized = sanitizeInternationalPhone(e.target.value);
                          setFormData({ ...formData, clientPhone: sanitized }); 
                          setFormErrors({ ...formErrors, clientPhone: '' }); 
                        }}
                        placeholder="Phone number"
                        className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all ${formErrors.clientPhone ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                      />
                    </div>
                    {formErrors.clientPhone && <p className="text-red-500 text-xs mt-1">{formErrors.clientPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs font-black mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => { setFormData({ ...formData, clientEmail: e.target.value }); setFormErrors({ ...formErrors, clientEmail: '' }); }}
                      placeholder="your@email.com"
                      className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all ${formErrors.clientEmail ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                    />
                    {formErrors.clientEmail && <p className="text-red-500 text-xs mt-1">{formErrors.clientEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs font-black mb-1">Special Requests</label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      placeholder="Any special requirements..."
                      rows={3}
                      className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Submitting...' : '✓ Submit Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'my-bookings' && (
            <div key="my-bookings-tab" className="-mt-0">
              {bookingsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-blue-700 font-black text-lg">Loading bookings...</p>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 font-bold mb-6">You haven't made any bookings for this hotel.</p>
                  <button
                    onClick={() => isAuthenticated ? setBookingModalOpen(true) : setAuthModal(true)}
                    className="bg-white text-blue-700 px-8 py-3 rounded-xl font-black border border-blue-100 hover:bg-blue-50 hover:scale-105 transition-all shadow-sm"
                  >
                    Create New Booking
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Status Filter Buttons */}
                  {(() => {
                    const statuses = [
                      { key: 'ALL', label: 'All' },
                      { key: 'REQUESTED', label: 'Requested' },
                      { key: 'OWNER_ACCEPTED', label: 'Accepted' },
                      { key: 'COST_PROPOSED', label: 'Cost Proposed' },
                      { key: 'PAID', label: 'Paid' },
                      { key: 'APPROVED', label: 'Approved' },
                      { key: 'REJECTED', label: 'Rejected' },
                    ];
                    return (
                      <div className="bg-white rounded-2xl px-4 py-1 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                        {statuses.map(s => {
                          const count = s.key === 'ALL' ? myBookings.length : myBookings.filter(b => b.bookingStatus === s.key).length;
                          const isActive = bookingStatusFilter === s.key;
                          return (
                            <button
                              key={s.key}
                              onClick={() => {
                                setBookingStatusFilter(s.key);
                                const filtered = s.key === 'ALL' ? myBookings : myBookings.filter(b => b.bookingStatus === s.key);
                                if (filtered.length > 0) setSelectedBooking(filtered[0]);
                              }}
                              className={`px-8 py-3 rounded-xl font-black hover:scale-105 transition-all shadow-sm flex items-center gap-2 ${
                                isActive
                                  ? 'bg-white text-blue-700 border border-blue-200'
                                  : 'bg-white text-blue-700 border border-blue-100 hover:bg-blue-50'
                              }`}
                            >
                              {s.label}
                              <span className="bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-bold">{count}</span>
                            </button>
                          );
                        })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filtered list + detail */}
                  {(() => {
                    const filtered = bookingStatusFilter === 'ALL' ? myBookings : myBookings.filter(b => b.bookingStatus === bookingStatusFilter);
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
                          <p className="text-gray-500 font-bold">No bookings with this status.</p>
                        </div>
                      );
                    }
                    return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bookings List */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">B</span>
                      Bookings
                      <span className="ml-auto bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">{filtered.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {filtered.map((b) => (
                        <button
                          key={b.bookingId}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left p-3.5 rounded-xl transition-all shadow-sm hover:shadow-md ${
                            selectedBooking?.bookingId === b.bookingId
                              ? 'bg-white border border-gray-300 shadow-md scale-[1.01]'
                              : 'bg-white border border-gray-100 hover:border-gray-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-semibold text-sm text-gray-800">Booking {b.bookingId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BookingService.getStatusColor(b.bookingStatus)}`}>
                              {BookingService.getStatusLabel(b.bookingStatus)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{b.checkIn} — {b.checkOut}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{b.numberOfGuests} guest{b.numberOfGuests !== 1 ? 's' : ''}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Booking Detail */}
                  <div className="lg:col-span-2">
                    {selectedBooking && filtered.find(b => b.bookingId === selectedBooking.bookingId) ? (
                      <div key={`booking-${selectedBooking.bookingId}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        {/* Header */}
                        <div className="bg-white p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">Booking {selectedBooking.bookingId}</h3>
                              <p className="text-gray-500 text-sm">{selectedBooking.hotel.name}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                              {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Check-in</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.checkIn}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Check-out</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.checkOut}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Guests</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.numberOfGuests}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Rooms</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.numberOfRooms || 1}</p>
                            </div>
                          </div>

                          {selectedBooking.totalCost && (
                            <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                              <p className="text-gray-500 text-xs font-medium mb-1">Total Cost</p>
                              <p className="text-2xl font-bold text-blue-600">{selectedBooking.totalCost} ETB</p>
                            </div>
                          )}

                          {/* Status Actions */}
                          {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                              <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">$</span>
                                Payment Required
                              </h4>
                              <div className="space-y-3">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer">
                                  <input type="file" accept="image/*,.pdf" onChange={handleReceiptFileChange} className="hidden" id="receipt-upload-input" />
                                  <label htmlFor="receipt-upload-input" className="cursor-pointer block">
                                    {receiptFile ? (
                                      <div>
                                        <div className="text-green-600 text-2xl mb-2">✓</div>
                                        <p className="text-gray-800 font-medium text-sm">{receiptFile.name}</p>
                                        <p className="text-gray-500 text-xs">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                      </div>
                                    ) : (
                                      <div>
                                        <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        <p className="text-gray-600 font-medium text-sm">Click to select receipt</p>
                                        <p className="text-gray-400 text-xs mt-1">JPG, PNG, PDF (max 10MB)</p>
                                      </div>
                                    )}
                                  </label>
                                </div>
                                {receiptPreview && <img src={receiptPreview} alt="Preview" className="max-h-32 rounded-lg mx-auto border border-gray-100 shadow-sm" />}
                                <button
                                  onClick={handleUploadReceipt}
                                  disabled={!receiptFile || submitting}
                                  className="w-full bg-white text-blue-700 px-5 py-3 rounded-xl text-sm font-medium border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-all shadow-sm"
                                >
                                  {submitting ? 'Uploading...' : 'Upload Receipt'}
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
                              <div className="text-2xl mb-2 text-green-600">✓</div>
                              <h4 className="text-gray-800 font-semibold text-base">Booking Confirmed</h4>
                              <p className="text-gray-500 text-sm mt-1">Enjoy your stay!</p>
                            </div>
                          )}

                          {/* Messages */}
                          <div className="rounded-2xl overflow-hidden border border-gray-100">
                            {/* Chat Header */}
                            <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-200 bg-white">
                              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</span>
                              <h4 className="text-gray-800 font-semibold text-sm">Messages ({selectedBooking.messages?.length || 0})</h4>
                            </div>
                            {/* Chat Body — light green wallpaper like Telegram */}
                            <div
                              className="px-4 py-4 space-y-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                              style={{ backgroundColor: '#dfe7dc' }}
                            >
                              {selectedBooking.messages?.length > 0 ? (
                                selectedBooking.messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className="flex justify-start"
                                    style={{ paddingLeft: m.senderId === userId ? '16mm' : '2mm' }}
                                  >
                                    <div
                                      className={`max-w-[72%] px-3 py-2 shadow-sm rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-white`}
                                    >
                                      {m.senderId !== userId && (
                                        <p className="text-xs font-semibold mb-0.5 text-blue-600">{m.senderName}</p>
                                      )}
                                      <p className="text-sm leading-relaxed text-gray-900 break-words">{m.message}</p>
                                      <p className="text-xs mt-1 text-gray-400 text-right">
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center py-8 text-sm text-gray-500">No messages yet</p>
                              )}
                            </div>
                            {/* Input Bar */}
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-200">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write a message..."
                                className="flex-1 rounded-full px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none border border-gray-100 bg-gray-50"
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0"
                              >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <p className="text-gray-400 text-sm">Select a booking to view details</p>
                      </div>
                    )}
                  </div>
                </div>
                    );
                  })()}
                </div>
              )}
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

      {/* Booking Modal */}
      <Modal isOpen={bookingModalOpen} onClose={() => { setBookingModalOpen(false); setBookingError(null); }} rounded={false}>
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Request a Booking</h2>
              <p className="text-gray-500 text-xs font-semibold">Fill in your details for review</p>
            </div>
          </div>

          {bookingError && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm font-semibold">
              {bookingError}
            </div>
          )}

          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-xs font-black mb-1">Check-in Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.checkIn}
                  onChange={(e) => { setFormData({ ...formData, checkIn: e.target.value }); setFormErrors({ ...formErrors, checkIn: '' }); }}
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.checkIn ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                />
                {formErrors.checkIn && <p className="text-red-500 text-xs mt-1">{formErrors.checkIn}</p>}
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-black mb-1">Check-out Date *</label>
                <input
                  type="date"
                  required
                  min={formData.checkIn || new Date().toISOString().split('T')[0]}
                  value={formData.checkOut}
                  onChange={(e) => { setFormData({ ...formData, checkOut: e.target.value }); setFormErrors({ ...formErrors, checkOut: '' }); }}
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.checkOut ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                />
                {formErrors.checkOut && <p className="text-red-500 text-xs mt-1">{formErrors.checkOut}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-xs font-black mb-1">Guests *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={formData.numberOfGuests}
                  onChange={(e) => { 
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setFormData({ ...formData, numberOfGuests: value as any }); 
                    setFormErrors({ ...formErrors, numberOfGuests: '' }); 
                  }}
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-none transition-all ${formErrors.numberOfGuests ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                />
                {formErrors.numberOfGuests && <p className="text-red-500 text-xs mt-1">{formErrors.numberOfGuests}</p>}
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-black mb-1">Rooms</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.numberOfRooms || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setFormData({ ...formData, numberOfRooms: value as any });
                  }}
                  className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-gray-700 text-xs font-black mb-1">Phone (International)</label>
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-28 bg-white border border-gray-100 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => { 
                    const sanitized = sanitizeInternationalPhone(e.target.value);
                    setFormData({ ...formData, clientPhone: sanitized }); 
                    setFormErrors({ ...formErrors, clientPhone: '' }); 
                  }}
                  placeholder="Phone number"
                  className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all ${formErrors.clientPhone ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
                />
              </div>
              {formErrors.clientPhone && <p className="text-red-500 text-xs mt-1">{formErrors.clientPhone}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-black mb-1">Email</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => { setFormData({ ...formData, clientEmail: e.target.value }); setFormErrors({ ...formErrors, clientEmail: '' }); }}
                placeholder="your@email.com"
                className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none transition-all ${formErrors.clientEmail ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-300'}`}
              />
              {formErrors.clientEmail && <p className="text-red-500 text-xs mt-1">{formErrors.clientEmail}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-black mb-1">Special Requests</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Any special requirements..."
                rows={3}
                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-gray-200 focus:border-gray-300 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setBookingModalOpen(false); setBookingError(null); }}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all border border-gray-300 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-100 text-blue-700 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-200 hover:scale-105 disabled:opacity-50 transition-all shadow-md"
              >
                {submitting ? 'Submitting...' : '✓ Submit Booking'}
              </button>
            </div>
          </form>
      </Modal>

      <HotelRatingModal
        isOpen={ratingModalOpen}
        hotelId={hotelId}
        hotelName={hotel?.name || "Hotel"}
        onClose={() => setRatingModalOpen(false)}
        onSubmit={handleSubmitRating}
      />

      <RatingsViewModal
        isOpen={ratingsViewOpen}
        onClose={() => setRatingsViewOpen(false)}
        fetchUrl={`${API_BASE_URL}/ratings/hotel/${hotelId}`}
        token={token ?? undefined}
        title={hotel?.name ?? "Hotel Ratings"}
        refreshKey={0}
      />

      {/* Detail Modal — tourism page style */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} size="lg">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-black text-blue-700">
              {detailModalType === 'description' ? '🏨 About This Hotel' : '📋 Hotel Policies'}
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
            {detailModalType === 'description' && (() => {
              const text = hotel?.description || "A wonderful place to stay with excellent amenities and service.";
              const paragraphs = text.split('\n\n').filter(p => p.trim());
              if (paragraphs.length > 1) {
                return (
                  <div className="space-y-4">
                    {paragraphs.map((para, idx) => (
                      <p key={idx} className="text-gray-700 text-sm leading-relaxed">{para}</p>
                    ))}
                  </div>
                );
              }
              const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
              if (sentences.length > 3) {
                return (
                  <div className="space-y-3">
                    {sentences.map((s, idx) => (
                      <p key={idx} className="text-gray-700 text-sm leading-relaxed">{s}</p>
                    ))}
                  </div>
                );
              }
              return <p className="text-gray-700 text-sm leading-relaxed">{text}</p>;
            })()}

            {detailModalType === 'policies' && (() => {
              const text = policies || "No policies available";
              const paragraphs = text.split('\n\n').filter(p => p.trim());
              if (paragraphs.length > 1) {
                return (
                  <div className="space-y-4">
                    {paragraphs.map((para, idx) => (
                      <p key={idx} className="text-gray-700 text-sm leading-relaxed">{para}</p>
                    ))}
                  </div>
                );
              }
              return <p className="text-gray-700 text-sm leading-relaxed">{text}</p>;
            })()}
          </div>

          {/* Hint footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-start gap-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-xs leading-relaxed">
              {detailModalType === 'description'
                ? 'Complete information about this hotel. Contact the hotel for more details.'
                : 'Please review these policies before making a booking.'}
            </p>
          </div>

          {/* Close */}
          <div className="px-6 pb-6 pt-3">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox — full gallery navigation */}
      {zoomedImageIndex !== null && hotel.images && hotel.images.length > 0 && (() => {
        const images = hotel.images;
        const total = images.length;
        const idx = zoomedImageIndex;
        const raw = typeof images[idx] === 'string' ? images[idx] as string : (images[idx] as any)?.imageUrl || '';
        const src = getImageUrl(raw, '');
        const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); setZoomedImageIndex((idx - 1 + total) % total); };
        const goNext = (e: React.MouseEvent) => { e.stopPropagation(); setZoomedImageIndex((idx + 1) % total); };
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
            onClick={() => setZoomedImageIndex(null)}
          >
            {/* Close */}
            <button
              onClick={() => setZoomedImageIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white font-black text-lg transition-all z-10"
            >
              ✕
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full z-10">
              {idx + 1} / {total}
            </div>

            {/* Prev button */}
            {total > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-1 md:left-4 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <div
              className="relative w-full mx-8 md:mx-16 flex items-center justify-center"
              style={{ maxWidth: '900px', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${hotel.name} image ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="rounded-xl object-contain w-full h-auto select-none"
                style={{ maxHeight: '80vh' }}
              />
            </div>

            {/* Next button */}
            {total > 1 && (
              <button
                onClick={goNext}
                className="absolute right-1 md:right-4 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Dot indicators */}
            {total > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setZoomedImageIndex(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

