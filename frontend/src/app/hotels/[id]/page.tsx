"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import { getHotelDetails } from "@/services/hotel.service";
import { submitHotelRating } from "@/services/rating.service";
import { BookingService, Booking, BookingRequest, BOOKING_STATUS } from "@/services/booking.service";
import { COUNTRIES } from "@/components/common/PhoneInput";
import { HotelDetailInfoDto } from "@/types/hotel";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import Modal from "@/components/common/Modal";
import LoginForm from "@/components/auth/LoginFormModal";
import RegisterForm from "@/components/auth/RegisterFormModal";
import { API_BASE_URL } from "@/services/api";
import { ModeSwitcherCompact } from "@/components/common/ModeSwitcher";

type TabType = 'details' | 'booking' | 'my-bookings';

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated, userId, username, role, browsingMode } = useAuthStore();
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Detail modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<'description' | 'policies'>('description');

  useEffect(() => {
    loadHotel();
  }, [hotelId, token]);

  useEffect(() => {
    if (activeTab === 'my-bookings' && isAuthenticated) {
      loadMyBookings();
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
    
    // Phone validation based on country code
    if (formData.clientPhone) {
      const phoneDigits = formData.clientPhone.replace(/\D/g, '');
      
      if (phoneCountryCode === '+251') {
        // Ethiopian phone: must start with 9 or 7, total 9 digits (e.g., 953816705)
        if (phoneDigits.length !== 9) {
          errors.clientPhone = 'Ethiopian phone must be 9 digits (e.g., 9XXXXXXXX)';
        } else if (!/^[97]/.test(phoneDigits)) {
          errors.clientPhone = 'Ethiopian phone must start with 9 or 7';
        }
      } else {
        // Other countries: general validation (6-15 digits)
        if (phoneDigits.length < 6 || phoneDigits.length > 15) {
          errors.clientPhone = 'Invalid phone number';
        }
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
        clientPhone: formData.clientPhone ? `${phoneCountryCode}${formData.clientPhone.replace(/^0+/, '')}` : ''
      };
      const newBooking = await BookingService.createBooking(token, userId, bookingData);
      setMyBookings([newBooking, ...myBookings]);
      setSelectedBooking(newBooking);
      setActiveTab('my-bookings');
      setFormData({ ...formData, checkIn: '', checkOut: '', specialRequests: '', clientPhone: '', clientEmail: '' });
      setFormErrors({});
      alert('Booking request submitted successfully!');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!token || !userId || !selectedBooking || !receiptFile) return;
    try {
      setSubmitting(true);
      const updated = await BookingService.uploadReceiptFile(token, selectedBooking.bookingId, receiptFile, userId);
      setSelectedBooking(updated);
      setMyBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
      setReceiptFile(null);
      setReceiptPreview(null);
      alert('Receipt uploaded successfully!');
    } catch (err) { alert('Failed to upload receipt'); }
    finally { setSubmitting(false); }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select an image file (JPG, PNG, GIF, WebP) or PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
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
    } catch (err) { alert('Failed to send message'); }
  };

  const handleReportProblem = async () => {
    if (!token || !userId || !selectedBooking || !problemReport.trim()) return;
    try {
      const updated = await BookingService.reportProblem(token, selectedBooking.bookingId, problemReport, userId);
      setSelectedBooking(updated);
      setMyBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
      setProblemReport('');
      alert('Problem reported to admin');
    } catch (err) { alert('Failed to report problem'); }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!token) return;
    try {
      await submitHotelRating(hotelId, rating, comment || undefined, token);
      setRatingModalOpen(false);
      alert("Thank you for your review!");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to submit rating"); }
  };

  const openDetailModal = (type: 'description' | 'policies') => {
    setDetailModalType(type);
    setDetailModalOpen(true);
  };

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
      {/* Purple header — RideShare style */}
      <div className="px-5 py-6" style={{ backgroundColor: '#6d28d9' }}>
        <button onClick={() => hotel.tourismPlaceId ? router.push(`/tourisms/${hotel.tourismPlaceId}`) : router.push('/hotels')} className="flex items-center gap-2 text-purple-200 hover:text-white text-xs font-bold mb-4 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {hotel.tourismPlaceId ? 'Back to Tourism' : 'Back to Hotels'}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-lg" style={{ color: '#7c3aed' }}>
            {hotel.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-sm truncate">{hotel.name}</p>
            {hotel.starRating && <p className="text-purple-200 text-xs">{'★'.repeat(hotel.starRating)} {hotel.starRating} stars</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto bg-white">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if ((item.id === 'booking' || item.id === 'my-bookings') && !isAuthenticated) {
                setAuthModal(true);
              } else {
                setActiveTab(item.id as TabType);
                setSidebarOpen(false);
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === item.id
              ? { backgroundColor: '#ede9fe', color: '#6d28d9' }
              : { color: '#374151' }
            }
          >
            <svg style={{ color: activeTab === item.id ? '#6d28d9' : '#6b7280' }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Actions</p>
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
              <div className="w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center font-black text-sm" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
                {username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-xs font-bold truncate">{username}</p>
                <p className="text-green-600 text-xs">✓ Logged in</p>
              </div>
            </div>
          </>
        ) : (
          <button onClick={() => { setAuthMode('login'); setAuthModal(true); }} className="w-full mb-3 py-2.5 rounded-lg text-sm font-bold text-white transition-all" style={{ backgroundColor: '#7c3aed' }}>
            Login to Book
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Hamburger — flush left, full-width background strip */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-2 left-1 z-30 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-white shadow-[2px_0_8px_rgba(0,0,0,0.2)] transition-all hover:opacity-90"
        style={{ backgroundColor: '#16a34a', borderRadius: '8px' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

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
                if (raw.startsWith('http')) return raw;
                if (raw) return `${API_BASE_URL.replace('/api', '')}/${raw.replace(/^\//, '')}`;
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
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pl-12 md:pl-6">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{hotel.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                {'★'.repeat(starRating)}{'☆'.repeat(5 - starRating)}
              </span>
              <span className={`px-3 py-1 rounded-full font-bold ${hotel.active !== false ? "bg-[#16A34A] text-white" : "bg-[#DC2626] text-white"}`}>
                {hotel.active !== false ? "✓ Active" : "✗ Inactive"}
              </span>
              {(isHotelOwner || isAdmin) && (
                <span className="bg-[#F59E0B] px-3 py-1 rounded-full text-white font-bold">
                  {isHotelOwner ? "Your Hotel" : "Admin"}
                </span>
              )}
              {contactInfo && (
                <a href={`tel:${contactInfo}`} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium hover:bg-white/30">
                  {contactInfo}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 bg-gray-100 min-h-[calc(100vh-14rem)] shadow-[inset_0_0_80px_rgba(0,0,0,0.12)]">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Info Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-3">{hotel.description || "A wonderful place to stay with excellent amenities and service."}</p>
                  <button
                    onClick={() => openDetailModal('description')}
                    className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>
                
                {policies && (
                  <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                    <h3 className="text-gray-900 font-black text-base mb-2">Policies</h3>
                    <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{policies}</p>
                    <button
                      onClick={() => openDetailModal('policies')}
                      className="mt-4 w-full py-2 px-3 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                    >
                      See More →
                    </button>
                  </div>
                )}

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-2">Rating</h3>
                  <div className="text-4xl font-black text-yellow-500">{starRating}/5</div>
                  <p className="text-gray-600 text-xs font-bold">Star Rating</p>
                </div>
              </div>

              {/* Image Gallery */}
              {hotel.images && hotel.images.length > 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-4">Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {hotel.images.map((img, idx) => {
                      const raw = typeof img === 'string' ? img : (img as any)?.imageUrl || '';
                      const imageUrl = raw.startsWith('http') ? raw : raw ? `${API_BASE_URL.replace('/api', '')}/${raw.replace(/^\//, '')}` : '';
                      
                      return imageUrl ? (
                        <button
                          key={idx}
                          onClick={() => setZoomedImage(imageUrl)}
                          className="relative h-20 md:h-24 rounded-lg overflow-hidden transition-all border border-gray-200 hover:border-purple-400 hover:scale-105 shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={`${hotel.name} ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=400'; }} />
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border-2 border-gray-200 text-center">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Ready to Book?</h3>
                <p className="text-gray-600 text-sm font-semibold mb-5">Experience luxury and comfort at {hotel.name}</p>
                <button
                  onClick={() => isAuthenticated ? setActiveTab('booking') : setAuthModal(true)}
                  className="bg-purple-100 text-purple-700 px-8 py-3 rounded-xl font-black hover:bg-purple-200 hover:scale-105 transition-all shadow-md"
                >
                  Book Now
                </button>
              </div>
            </div>
          )}

          {/* Booking Tab */}
          {activeTab === 'booking' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Request a Booking</h2>
                    <p className="text-gray-600 text-sm font-semibold">Fill in your details for review</p>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 border-2 border-red-400 text-red-700 p-4 rounded-xl mb-6 font-black flex items-center gap-3">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleSubmitBooking} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2"> Check-in Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.checkIn}
                        onChange={(e) => { setFormData({ ...formData, checkIn: e.target.value }); setFormErrors({ ...formErrors, checkIn: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.checkIn ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.checkIn && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.checkIn}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2"> Check-out Date *</label>
                      <input
                        type="date"
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        value={formData.checkOut}
                        onChange={(e) => { setFormData({ ...formData, checkOut: e.target.value }); setFormErrors({ ...formErrors, checkOut: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.checkOut ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.checkOut && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.checkOut}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">Guests *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={20}
                        value={formData.numberOfGuests}
                        onChange={(e) => { setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 }); setFormErrors({ ...formErrors, numberOfGuests: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.numberOfGuests ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.numberOfGuests && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.numberOfGuests}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">Rooms</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.numberOfRooms || 1}
                        onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">Phone (International)</label>
                      <div className="flex gap-2">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="w-32 bg-white border-2 border-gray-300 rounded-xl px-2 py-3 text-gray-900 font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={formData.clientPhone}
                          onChange={(e) => { setFormData({ ...formData, clientPhone: e.target.value.replace(/[^\d]/g, '') }); setFormErrors({ ...formErrors, clientPhone: '' }); }}
                          placeholder={phoneCountryCode === '+251' ? "9XXXXXXXX or 7XXXXXXXX" : "Phone number"}
                          className={`flex-1 bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.clientPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                      </div>
                      {formErrors.clientPhone && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.clientPhone}</p>}
                      {phoneCountryCode === '+251' && <p className="text-gray-600 text-xs font-semibold mt-1">Ethiopian: 9 digits starting with 9 (Ethio Telecom) or 7 (Safaricom)</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => { setFormData({ ...formData, clientEmail: e.target.value }); setFormErrors({ ...formErrors, clientEmail: '' }); }}
                        placeholder="your@email.com"
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.clientEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.clientEmail && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.clientEmail}</p>}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-amber-700 text-sm font-black mb-2"> Special Requests</label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      placeholder="Any special requirements..."
                      rows={3}
                      className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 text-amber-800 font-bold placeholder-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200 hover:border-amber-400 transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-black text-lg hover:bg-gray-300 transition-all shadow-md border-2 border-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] disabled:opacity-50 transition-all shadow-xl"
                    >
                      {submitting ? 'Submitting...' : '✓ Submit Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === 'my-bookings' && (
            <div key="my-bookings-tab">
              {bookingsLoading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-purple-700 font-black text-lg">Loading bookings...</p>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 font-bold mb-6">You haven't made any bookings for this hotel.</p>
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black hover:bg-purple-700 hover:scale-105 transition-all shadow-md border-2 border-purple-700"
                  >
                    Create New Booking
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status Filter Buttons */}
                  {(() => {
                    const statuses = [
                      { key: 'ALL', label: 'All' },
                      { key: 'REQUESTED', label: 'Requested' },
                      { key: 'ACCEPTED', label: 'Accepted' },
                      { key: 'COST_PROPOSED', label: 'Cost Proposed' },
                      { key: 'PAID', label: 'Paid' },
                      { key: 'APPROVED', label: 'Approved' },
                      { key: 'REJECTED', label: 'Rejected' },
                      { key: 'CANCELLED', label: 'Cancelled' },
                    ];
                    return (
                      <div className="flex flex-wrap gap-2">
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
                              style={{
                                background: isActive
                                  ? 'linear-gradient(145deg, #ede9fe 0%, #ddd6fe 100%)'
                                  : '#ffffff',
                                boxShadow: '0 14px 40px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 4px rgba(0,0,0,0.04)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.7)',
                                borderRadius: '12px',
                                color: '#6d28d9',
                              }}
                              className="px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 hover:scale-[1.03] hover:-translate-y-0.5"
                            >
                              {s.label}
                              <span style={{ background: 'rgba(109,40,217,0.12)', color: '#6d28d9' }} className="px-1.5 py-0.5 rounded-full text-xs">{count}</span>
                            </button>
                          );
                        })}
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
                  <div className="space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 p-4 rounded-2xl shadow-md border border-gray-200">
                    <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">B</span>
                      Bookings
                      <span className="ml-auto bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">{filtered.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {filtered.map((b) => (
                        <button
                          key={b.bookingId}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left p-3.5 rounded-xl transition-all shadow-sm hover:shadow-md ${
                            selectedBooking?.bookingId === b.bookingId
                              ? 'bg-white border border-purple-400 shadow-md scale-[1.01]'
                              : 'bg-white/60 border border-gray-200 hover:border-purple-300 hover:bg-white'
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
                      <div key={`booking-${selectedBooking.bookingId}`} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 border-b border-gray-200">
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
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Check-in</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.checkIn}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Check-out</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.checkOut}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Guests</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.numberOfGuests}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Rooms</p>
                              <p className="text-gray-800 font-medium text-sm">{selectedBooking.numberOfRooms || 1}</p>
                            </div>
                          </div>

                          {selectedBooking.totalCost && (
                            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                              <p className="text-gray-500 text-xs font-medium mb-1">Total Cost</p>
                              <p className="text-2xl font-bold text-purple-600">{selectedBooking.totalCost} ETB</p>
                            </div>
                          )}

                          {/* Status Actions */}
                          {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                              <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs">$</span>
                                Payment Required
                              </h4>
                              <div className="space-y-3">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 hover:border-purple-400 transition-all cursor-pointer">
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
                                {receiptPreview && <img src={receiptPreview} alt="Preview" className="max-h-32 rounded-lg mx-auto border border-gray-200 shadow-sm" />}
                                <button
                                  onClick={handleUploadReceipt}
                                  disabled={!receiptFile || submitting}
                                  className="w-full bg-purple-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm"
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
                          <div style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.90) 100%)',
                            boxShadow: '0 0 0 2px #7c3aed, 0 8px 32px rgba(109,40,217,0.10), inset 0 1px 0 rgba(255,255,255,1)',
                            borderRadius: '16px',
                          }} className="p-4">
                            <h4 className="text-purple-700 font-bold text-sm mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">M</span>
                              Messages ({selectedBooking.messages?.length || 0})
                            </h4>
                            <div className="space-y-2 max-h-52 overflow-y-auto mb-3 p-3 rounded-xl bg-white/60 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                              {selectedBooking.messages?.length > 0 ? (
                                selectedBooking.messages.map((m) => (
                                  <div
                                    key={m.id}
                                    style={m.senderId === userId ? {
                                      background: 'linear-gradient(145deg, rgba(237,233,254,0.95) 0%, rgba(221,214,254,0.85) 100%)',
                                      boxShadow: '0 4px 14px rgba(109,40,217,0.13), inset 0 1px 0 rgba(255,255,255,0.9)',
                                      border: '1px solid rgba(167,139,250,0.4)',
                                      marginLeft: '2.5rem',
                                      marginRight: '0',
                                    } : {
                                      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.90) 100%)',
                                      boxShadow: '0 4px 14px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)',
                                      border: '1px solid rgba(226,232,240,0.8)',
                                      marginRight: '2.5rem',
                                      marginLeft: '0',
                                    }}
                                    className="p-3 rounded-xl"
                                  >
                                    <div className={`flex justify-between text-xs mb-1.5 ${m.senderId === userId ? 'text-purple-600' : 'text-gray-400'}`}>
                                      <span className="font-semibold">{m.senderName}</span>
                                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className={`text-sm font-medium ${m.senderId === userId ? 'text-purple-900' : 'text-gray-700'}`}>{m.message}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-400 text-center py-5 text-sm">No messages yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 border border-purple-200 transition-all"
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
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
      <Modal isOpen={authModal} onClose={() => setAuthModal(false)}>
        {authMode === 'login' ? (
          <LoginForm onSuccess={() => { setAuthModal(false); router.refresh(); }} onRegisterClick={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onSuccess={() => { setAuthModal(false); }} onLoginClick={() => setAuthMode('login')} />
        )}
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

      {/* Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <div className="bg-white rounded-2xl p-8 max-w-2xl">
          {detailModalType === 'description' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-black text-gray-900">About This Hotel</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 text-base leading-relaxed font-semibold whitespace-pre-wrap">
                  {hotel?.description || "A wonderful place to stay with excellent amenities and service."}
                </p>
              </div>
            </div>
          )}

          {detailModalType === 'policies' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-black text-gray-900">Hotel Policies</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 text-base leading-relaxed font-semibold whitespace-pre-wrap">
                  {policies || "No policies available"}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setDetailModalOpen(false)}
            className="mt-6 w-full py-3 px-4 bg-purple-600 text-white font-black rounded-lg hover:bg-purple-700 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>

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
            <img src={zoomedImage} alt="Zoomed" referrerPolicy="no-referrer" className="rounded-xl object-contain w-full h-auto" style={{ maxHeight: '90vh' }} />
          </div>
        </div>
      )}
    </div>
  );
}
