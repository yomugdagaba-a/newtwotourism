"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import { getHotelDetails } from "@/services/hotel.service";
import { submitHotelRating } from "@/services/rating.service";
import { BookingService, Booking, BookingRequest, BOOKING_STATUS } from "@/services/booking.service";
import { HotelDetailInfoDto } from "@/types/hotel";
import HotelRatingModal from "@/components/hotel/HotelRatingModal";
import RatingsViewModal from "@/components/common/RatingsViewModal";
import Modal from "@/components/common/Modal";
import LoginForm from "@/app/auth/login/page";
import RegisterForm from "@/app/auth/register/page";
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

  // Modal state
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingsViewOpen, setRatingsViewOpen] = useState(false);

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

  // Redirect hotel owner in owner mode to booking management page
  useEffect(() => {
    if (hotel && isInOwnerMode) {
      router.push(`/hotels/${hotelId}/booking`);
    }
  }, [hotel, isInOwnerMode, hotelId, router]);

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
          <div className="text-5xl mb-4">🏨</div>
          <h2 className="text-2xl font-black text-[#111827] mb-3">Hotel Not Found</h2>
          <p className="text-[#6B7280] font-semibold mb-6">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-[#2563EB] text-white rounded-xl text-sm font-black hover:bg-[#1D4ED8] shadow-lg transition-all">
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
    { id: 'details', label: 'Hotel Details', icon: '🏨', color: 'from-emerald-500 to-teal-500' },
    { id: 'booking', label: 'New Booking', icon: '📅', color: 'from-blue-500 to-indigo-500' },
    { id: 'my-bookings', label: 'My Bookings', icon: '📋', color: 'from-purple-500 to-pink-500', count: myBookings.length },
  ];

  // Add owner management link if user is the hotel owner or admin
  const ownerNavigation = (isHotelOwner || isAdmin) ? [
    { id: 'owner-manage', label: 'Manage Bookings', icon: '⚙️', color: 'from-orange-500 to-red-500', isOwnerLink: true },
  ] : [];

  const quickActions = [
    { label: 'Rate Hotel', icon: '⭐', action: () => isAuthenticated ? setRatingModalOpen(true) : setAuthModal(true), color: 'from-amber-400 to-orange-500' },
    { label: 'View Reviews', icon: '📝', action: () => setRatingsViewOpen(true), color: 'from-gray-500 to-gray-700' },
    { label: 'Call Hotel', icon: '📞', action: () => contactInfo && window.open(`tel:${contactInfo}`), color: 'from-green-500 to-emerald-600' },
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
        <div className="flex flex-col h-full">
          {/* Logo/Back */}
          <div className="p-6 border-b border-gray-200">
            <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-900 hover:text-blue-700 rounded-lg transition-all text-xs font-bold w-full mb-3 border-2 border-gray-300 hover:border-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Hotels</span>
            </button>
            <h2 className="text-gray-900 font-black text-base truncate">{hotel.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 text-xs font-medium">🏨 {hotel.name}</span>
              {hotel.starRating && <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">⭐ {hotel.starRating}</span>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            <p className="text-gray-600 text-xs font-bold uppercase px-2 mb-2">Navigation</p>
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

            {/* Owner Management Section */}
            {ownerNavigation.length > 0 && (
              <div className="pt-3 border-t border-gray-200 mt-3">
                <p className="text-gray-600 text-xs font-bold uppercase px-2 mb-2">🔑 Owner Panel</p>
                {ownerNavigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/hotels/${hotelId}/booking`)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400"
                  >
                    <span>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 my-3 pt-3">
              <p className="text-gray-600 text-xs font-bold uppercase px-2 mb-2">Quick Actions</p>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400 mt-2"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* User Info */}
          <div className="p-3 border-t border-gray-200">
            {/* Mode Switcher for HOTEL_OWNER */}
            {role === "HOTEL_OWNER" && (
              <div className="mb-3">
                <ModeSwitcherCompact className="w-full justify-center" />
              </div>
            )}
            
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
                🔐 Login to Book
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        {/* Hero Header */}
        <div className="relative h-48 md:h-56">
          <Image
            src={(() => {
              // Extract imageUrl from images array (handle both string and object formats)
              if (hotel.images && hotel.images.length > 0) {
                const image = hotel.images[currentImageIndex];
                if (typeof image === 'string') {
                  return image;
                } else if (image && typeof image === 'object' && 'imageUrl' in image) {
                  return (image as any).imageUrl;
                }
              }
              return "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800";
            })()}
            alt={hotel.name}
            fill
            className="object-cover"
            priority
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
                  {isHotelOwner ? "🔑 Your Hotel" : "👑 Admin"}
                </span>
              )}
              {contactInfo && (
                <a href={`tel:${contactInfo}`} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium hover:bg-white/30">
                  📞 {contactInfo}
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
                  <div className="text-3xl mb-3">🏨</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-3">{hotel.description || "A wonderful place to stay with excellent amenities and service."}</p>
                  <button
                    onClick={() => openDetailModal('description')}
                    className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                  >
                    See More →
                  </button>
                </div>
                
                {policies && (
                  <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                    <div className="text-3xl mb-3">📋</div>
                    <h3 className="text-gray-900 font-black text-base mb-2">Policies</h3>
                    <p className="text-gray-700 text-sm leading-relaxed font-semibold line-clamp-2">{policies}</p>
                    <button
                      onClick={() => openDetailModal('policies')}
                      className="mt-4 w-full py-2 px-3 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 hover:scale-105 transition-all shadow-md"
                    >
                      See More →
                    </button>
                  </div>
                )}

                <div className="rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 className="text-gray-900 font-black text-base mb-2">Rating</h3>
                  <div className="text-4xl font-black text-yellow-500">{starRating}/5</div>
                  <p className="text-gray-600 text-xs font-bold">Star Rating</p>
                </div>
              </div>

              {/* Image Gallery */}
              {hotel.images && hotel.images.length > 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border-2 border-gray-200">
                  <h3 className="text-gray-900 font-black text-base mb-4">📸 Gallery</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {hotel.images.map((img, idx) => {
                      // Extract imageUrl from image object (handle both string and object formats)
                      const imageUrl = typeof img === 'string' ? img : (img as any)?.imageUrl || '';
                      
                      return imageUrl ? (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative h-20 md:h-24 rounded-lg overflow-hidden transition-all border-3 ${idx === currentImageIndex ? 'border-blue-600 ring-4 ring-blue-300 scale-105' : 'border-gray-300 hover:border-blue-600 hover:scale-105'}`}
                        >
                          <Image src={imageUrl} alt={`${hotel.name} ${idx + 1}`} fill className="object-cover" />
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
                  className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-black hover:bg-gray-300 hover:scale-105 transition-all shadow-md"
                >
                  📅 Book Now
                </button>
              </div>
            </div>
          )}

          {/* Booking Tab */}
          {activeTab === 'booking' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">📅</div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Request a Booking</h2>
                    <p className="text-gray-600 text-sm font-semibold">Fill in your details for review</p>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 border-2 border-red-400 text-red-700 p-4 rounded-xl mb-6 font-black flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleSubmitBooking} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">📅 Check-in Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.checkIn}
                        onChange={(e) => { setFormData({ ...formData, checkIn: e.target.value }); setFormErrors({ ...formErrors, checkIn: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.checkIn ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.checkIn && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.checkIn}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">📅 Check-out Date *</label>
                      <input
                        type="date"
                        required
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        value={formData.checkOut}
                        onChange={(e) => { setFormData({ ...formData, checkOut: e.target.value }); setFormErrors({ ...formErrors, checkOut: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.checkOut ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.checkOut && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.checkOut}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">👥 Guests *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={20}
                        value={formData.numberOfGuests}
                        onChange={(e) => { setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 }); setFormErrors({ ...formErrors, numberOfGuests: '' }); }}
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.numberOfGuests ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.numberOfGuests && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.numberOfGuests}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">🛏️ Rooms</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.numberOfRooms || 1}
                        onChange={(e) => setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">📞 Phone (International)</label>
                      <div className="flex gap-2">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="w-28 bg-white border-2 border-gray-300 rounded-xl px-2 py-3 text-gray-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm"
                        >
                          <option value="+251">🇪🇹 +251</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+39">🇮🇹 +39</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+86">🇨🇳 +86</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+254">🇰🇪 +254</option>
                          <option value="+255">🇹🇿 +255</option>
                          <option value="+256">🇺🇬 +256</option>
                          <option value="+27">🇿🇦 +27</option>
                          <option value="+20">🇪🇬 +20</option>
                          <option value="+234">🇳🇬 +234</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+55">🇧🇷 +55</option>
                        </select>
                        <input
                          type="tel"
                          value={formData.clientPhone}
                          onChange={(e) => { setFormData({ ...formData, clientPhone: e.target.value.replace(/[^\d]/g, '') }); setFormErrors({ ...formErrors, clientPhone: '' }); }}
                          placeholder={phoneCountryCode === '+251' ? "9XXXXXXXX or 7XXXXXXXX" : "Phone number"}
                          className={`flex-1 bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.clientPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                      </div>
                      {formErrors.clientPhone && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.clientPhone}</p>}
                      {phoneCountryCode === '+251' && <p className="text-gray-600 text-xs font-semibold mt-1">Ethiopian: 9 digits starting with 9 (Ethio Telecom) or 7 (Safaricom)</p>}
                    </div>
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-black mb-2">✉️ Email</label>
                      <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => { setFormData({ ...formData, clientEmail: e.target.value }); setFormErrors({ ...formErrors, clientEmail: '' }); }}
                        placeholder="your@email.com"
                        className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 hover:border-gray-400 transition-all shadow-sm ${formErrors.clientEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {formErrors.clientEmail && <p className="text-red-600 text-xs font-bold mt-1">{formErrors.clientEmail}</p>}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-amber-700 text-sm font-black mb-2">📝 Special Requests</label>
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
                      {submitting ? '⏳ Submitting...' : '✓ Submit Booking'}
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
                <div key="loading">
                  <div className="text-center py-16">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-blue-700 font-black text-lg">Loading bookings...</p>
                  </div>
                </div>
              ) : myBookings.length === 0 ? (
                <div key="empty" className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 font-bold mb-6">You haven't made any bookings for this hotel.</p>
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 hover:scale-105 transition-all shadow-md border-2 border-blue-700"
                  >
                    ✨ Create New Booking
                  </button>
                </div>
              ) : (
                <div key="bookings" className="grid lg:grid-cols-3 gap-6">
                  {/* Bookings List */}
                  <div key="bookings-list-container" className="space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 p-4 rounded-2xl shadow-md border-2 border-gray-300">
                    <h3 className="text-gray-900 text-base font-black uppercase mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-black">📋</span>
                      Your Bookings
                      <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">
                        {myBookings.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {myBookings.map((b) => (
                        <button
                          key={`${b.bookingId}-${b.createdAt}`}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left p-4 rounded-xl transition-all border-2 shadow-md hover:shadow-lg ${
                            selectedBooking?.bookingId === b.bookingId
                              ? 'bg-white text-gray-900 border-blue-600 shadow-lg scale-[1.02]'
                              : 'bg-gray-50 text-gray-900 border-gray-300 hover:border-blue-400 hover:bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-lg text-gray-900">
                              #{b.bookingId}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              selectedBooking?.bookingId === b.bookingId 
                                ? BookingService.getStatusColor(b.bookingStatus)
                                : BookingService.getStatusColor(b.bookingStatus)
                            }`}>
                              {BookingService.getStatusLabel(b.bookingStatus)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-700">
                            📅 {b.checkIn} → {b.checkOut}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            👥 {b.numberOfGuests} guests
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div key="booking-details" className="lg:col-span-2">
                    {selectedBooking ? (
                      <div key={`booking-${selectedBooking.bookingId}`} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b-2 border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-black text-gray-900">Booking #{selectedBooking.bookingId}</h3>
                              <p className="text-gray-600 text-sm font-bold">{selectedBooking.hotel.name}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-black border-2 ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                              {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-5">
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-300 hover:border-blue-400 transition-all shadow-sm">
                              <p className="text-gray-600 text-xs uppercase font-black">📅 Check-in</p>
                              <p className="text-gray-900 font-black text-sm">{selectedBooking.checkIn}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-300 hover:border-red-400 transition-all shadow-sm">
                              <p className="text-gray-600 text-xs uppercase font-black">📅 Check-out</p>
                              <p className="text-gray-900 font-black text-sm">{selectedBooking.checkOut}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-300 hover:border-green-400 transition-all shadow-sm">
                              <p className="text-gray-600 text-xs uppercase font-black">👥 Guests</p>
                              <p className="text-gray-900 font-black text-sm">{selectedBooking.numberOfGuests}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-gray-300 hover:border-purple-400 transition-all shadow-sm">
                              <p className="text-gray-600 text-xs uppercase font-black">🛏️ Rooms</p>
                              <p className="text-gray-900 font-black text-sm">{selectedBooking.numberOfRooms || 1}</p>
                            </div>
                          </div>

                          {selectedBooking.totalCost && (
                            <div className="bg-white rounded-xl p-5 text-center shadow-md border-2 border-gray-300">
                              <p className="text-gray-600 text-sm font-black">💰 Total Cost</p>
                              <p className="text-3xl font-black text-blue-600">{selectedBooking.totalCost} ETB</p>
                            </div>
                          )}

                          {/* Status Actions */}
                          {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                            <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md">
                              <h4 className="text-gray-900 font-black text-lg mb-4 flex items-center gap-2">
                                <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">💰</span>
                                Payment Required
                              </h4>
                              <div className="space-y-4">
                                <div className="border-3 border-dashed border-gray-400 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleReceiptFileChange}
                                    className="hidden"
                                    id="receipt-upload-input"
                                  />
                                  <label htmlFor="receipt-upload-input" className="cursor-pointer block">
                                    {receiptFile ? (
                                      <div>
                                        <div className="text-green-600 text-5xl mb-3">✓</div>
                                        <p className="text-gray-900 font-black text-lg">{receiptFile.name}</p>
                                        <p className="text-gray-600 text-sm font-semibold">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="text-gray-400 text-5xl mb-3">📁</div>
                                        <p className="text-gray-900 font-black text-lg">Click to select receipt file</p>
                                        <p className="text-gray-600 text-sm font-semibold">JPG, PNG, GIF, WebP or PDF (max 10MB)</p>
                                      </div>
                                    )}
                                  </label>
                                </div>
                                {receiptPreview && (
                                  <div className="mt-3">
                                    <img src={receiptPreview} alt="Preview" className="max-h-40 rounded-xl mx-auto border-3 border-gray-300 shadow-lg" />
                                  </div>
                                )}
                                <button
                                  onClick={handleUploadReceipt}
                                  disabled={!receiptFile || submitting}
                                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md border-2 border-blue-700"
                                >
                                  {submitting ? '⏳ Uploading...' : '📤 Upload Receipt'}
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                            <div className="bg-white rounded-xl p-6 text-center shadow-md border-2 border-gray-300">
                              <div className="text-5xl mb-3">✓</div>
                              <h4 className="text-gray-900 font-black text-xl">Booking Confirmed!</h4>
                              <p className="text-gray-600 text-sm font-bold">Enjoy your stay!</p>
                            </div>
                          )}

                          {/* Messages */}
                          <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-5 mt-2 border-2 border-blue-300 shadow-md">
                            <h4 className="text-gray-900 font-black text-lg mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-black">💬</span>
                              Messages ({selectedBooking.messages?.length || 0})
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto mb-4 bg-white p-4 rounded-xl shadow-inner border-2 border-blue-200 [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-blue-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-blue-300">
                              {selectedBooking.messages?.length > 0 ? (
                                selectedBooking.messages.map((m) => (
                                  <div key={m.id} className={`p-4 rounded-xl shadow-md border-2 ${m.senderId === userId ? 'bg-blue-100 text-gray-900 border-blue-300 ml-8' : 'bg-gray-100 text-gray-900 border-gray-300 mr-8'}`}>
                                    <div className={`flex justify-between text-xs mb-2 font-black ${m.senderId === userId ? 'text-blue-700' : 'text-gray-700'}`}>
                                      <span>{m.senderName}</span>
                                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{m.message}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-600 text-center py-6 font-bold">No messages yet</p>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white rounded-xl px-4 py-3 text-gray-900 font-bold placeholder-gray-400 focus:ring-2 focus:ring-blue-600 border-2 border-blue-300 transition-all shadow-sm"
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md border-2 border-blue-700 hover:shadow-lg"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key="no-booking-selected" className="bg-white rounded-2xl border-2 border-gray-200 p-16 text-center shadow-lg">
                        <div className="text-5xl mb-4">👆</div>
                        <p className="text-gray-700 font-black text-lg">Select a booking to view details</p>
                      </div>
                    )}
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
                <div className="text-3xl">🏨</div>
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
                <div className="text-3xl">📋</div>
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
            className="mt-6 w-full py-3 px-4 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
