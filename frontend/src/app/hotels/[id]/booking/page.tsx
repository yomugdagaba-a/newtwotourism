"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import TopBar from "@/components/layout/TopBar";
import { getHotelDetails } from "@/services/hotel.service";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { HotelDetailInfoDto } from "@/types/hotel";
import { API_BASE_URL } from "@/services/api";

export default function HotelOwnerBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, token, userId, role } = useAuthStore();
  const hotelId = Number(params.id);

  // Hotel state
  const [hotel, setHotel] = useState<HotelDetailInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [proposedCost, setProposedCost] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);

  const loadBookings = useCallback(async (showLoading = false) => {
    if (!token || !userId) return;
    try {
      if (showLoading) setBookingsLoading(true);
      const data = await BookingService.getHotelBookings(token, hotelId, userId);
      setBookings(data);
      // Update selected booking with fresh data (to get new messages)
      if (selectedBooking) {
        const updated = data.find(b => b.bookingId === selectedBooking.bookingId);
        if (updated) setSelectedBooking(updated);
      } else if (data.length > 0) {
        setSelectedBooking(data[0]);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      if (showLoading) setBookingsLoading(false);
    }
  }, [token, userId, hotelId, selectedBooking?.bookingId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    loadHotel();
  }, [hotelId, isAuthenticated]);

  useEffect(() => {
    if (hotel && isAuthenticated && token && userId) {
      // Check if user is the owner of this hotel or admin
      if (role === "ADMIN" || (hotel.ownerId && hotel.ownerId === userId)) {
        // Initial load with loading indicator
        loadBookings(true);
        
        // Auto-refresh every 10 seconds to get new messages from clients
        const interval = setInterval(() => loadBookings(false), 10000);
        return () => clearInterval(interval);
      } else {
        // Not the owner, redirect to hotel detail page
        router.push(`/hotels/${hotelId}`);
      }
    }
  }, [hotel, isAuthenticated, token, userId, role]);

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

  const handleAccept = async (bookingId: number) => {
    if (!token || !userId) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.acceptBookingRequest(token, bookingId, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeCost = async () => {
    if (!token || !userId || !selectedBooking || !proposedCost) return;
    try {
      setActionLoading(true);
      const cost = parseFloat(proposedCost);
      if (isNaN(cost) || cost <= 0) {
        alert("Please enter a valid cost");
        return;
      }
      const updated = await BookingService.proposeCost(token, selectedBooking.bookingId, cost, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setProposedCost("");
      setShowCostModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to propose cost");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (bookingId: number) => {
    if (!token || !userId) return;
    if (!confirm("Approve this booking? The client has uploaded their payment receipt.")) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.approveBooking(token, bookingId, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !userId || !selectedBooking || !rejectReason) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.rejectBooking(token, selectedBooking.bookingId, rejectReason, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setRejectReason("");
      setShowRejectModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage.trim()) return;
    try {
      const updated = await BookingService.ownerSendMessage(token, selectedBooking.bookingId, newMessage, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setNewMessage("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const updateBookingInList = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.bookingId === updated.bookingId ? updated : b)));
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return b.bookingStatus === BOOKING_STATUS.REQUESTED;
    if (filter === "ACTIVE") return [BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus);
    if (filter === "COMPLETED") return [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus);
    if (filter === "PROBLEMS") return b.problemReported;
    return b.bookingStatus === filter;
  });

  const pendingCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length;
  const paidCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length;
  const problemCount = bookings.filter(b => b.problemReported).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-2xl font-bold text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-12 rounded-3xl text-center border-2 border-gray-200 shadow-lg">
          <div className="text-6xl mb-4">🏨</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Hotel Not Found</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button onClick={() => router.back()} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user is authorized (owner or admin)
  const isOwner = hotel.ownerId === userId;
  const isAdmin = role === "ADMIN";
  
  if (!isOwner && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-12 rounded-3xl text-center border-2 border-gray-200 shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">You are not the owner of this hotel.</p>
          <button onClick={() => router.push(`/hotels/${hotelId}`)} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            View Hotel Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/hotels/${hotelId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Hotel</span>
          </button>

          {/* Hotel Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={(() => {
                    // Extract first image URL from images array (handle both string and object formats)
                    if (hotel.images && hotel.images.length > 0) {
                      const image = hotel.images[0];
                      if (typeof image === 'string') {
                        return image;
                      } else if (image && typeof image === 'object' && 'imageUrl' in image) {
                        return (image as any).imageUrl;
                      }
                    }
                    return "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=400";
                  })()}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    hotel.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {hotel.active !== false ? "✓ Active" : "✗ Inactive"}
                  </span>
                </div>
                <div className="text-yellow-500 mb-2">
                  {'★'.repeat(hotel.stars || hotel.starRating || 4)}{'☆'.repeat(5 - (hotel.stars || hotel.starRating || 4))}
                </div>
                <p className="text-gray-600 text-sm mb-2">{hotel.description?.substring(0, 150)}...</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {hotel.contactInfo && <span>📞 {hotel.contactInfo}</span>}
                  {hotel.tourismPlaceName && <span>📍 {hotel.tourismPlaceName}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📋 Booking Management</h2>
              <p className="text-gray-600">Manage booking requests for {hotel.name}</p>
            </div>
            <button onClick={loadBookings} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
            <div className="text-gray-600 text-sm font-semibold">Total</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-gray-600 text-sm font-semibold">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{paidCount}</div>
            <div className="text-gray-600 text-sm font-semibold">Awaiting Approval</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length}</div>
            <div className="text-gray-600 text-sm font-semibold">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{problemCount}</div>
            <div className="text-gray-600 text-sm font-semibold">Problems</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap bg-white p-4 rounded-2xl shadow-md border-2 border-gray-200">
          {["ALL", "PENDING", "ACTIVE", "COMPLETED", "PROBLEMS"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl font-black transition-all text-base border-2 ${
                filter === f 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-800 shadow-lg hover:shadow-xl scale-105" 
                  : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg"
              }`}
            >
              {f} {f === "PENDING" && pendingCount > 0 && `(${pendingCount})`}
              {f === "PROBLEMS" && problemCount > 0 && `(${problemCount})`}
            </button>
          ))}
        </div>

        {bookingsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List */}
          <div className="lg:col-span-1 space-y-2 bg-white p-3 rounded-xl shadow-md border-2 border-gray-200">
            <h3 className="font-black text-gray-900 mb-2 text-base flex items-center gap-2">
              <span className="text-xl">📋</span>
              <span>My Bookings</span>
              <span className="ml-auto bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-black">
                {filteredBookings.length}
              </span>
            </h3>
            {filteredBookings.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 border-2 border-gray-200 shadow-sm">
                <div className="text-3xl mb-1">📋</div>
                <p className="font-semibold text-xs text-gray-600">No bookings found</p>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => setSelectedBooking(b)}
                  className={`rounded-lg p-3 cursor-pointer border-2 transition-all shadow-sm hover:shadow-md ${
                    selectedBooking?.bookingId === b.bookingId 
                      ? "bg-blue-100 text-gray-900 border-blue-600 shadow-md" 
                      : "bg-white text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-black text-base text-gray-900">
                        #{b.bookingId}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      selectedBooking?.bookingId === b.bookingId 
                        ? "bg-blue-600 text-white" 
                        : BookingService.getStatusColor(b.bookingStatus)
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 space-y-0.5">
                    <div className="font-bold truncate">👤 {b.client.fullName}</div>
                    <div className="font-semibold truncate">📅 {b.checkIn} → {b.checkOut}</div>
                    <div className="font-semibold">👥 {b.numberOfGuests} guests {b.numberOfRooms && `• ${b.numberOfRooms} rooms`}</div>
                  </div>
                  {b.problemReported && (
                    <div className="mt-1 text-xs font-black text-red-600">
                      ⚠️ Problem Reported
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

            {/* Booking Details */}
            <div className="lg:col-span-2">
              {selectedBooking ? (
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-200">
                  {/* Header */}
                  <div className="p-4 border-b-2 border-gray-200 bg-white">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h2 className="text-xl font-black text-gray-900">Booking #{selectedBooking.bookingId}</h2>
                        <p className="text-xs text-gray-600 font-semibold">Created: {new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap border-2 ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="p-4 border-b-2 border-gray-200 bg-white">
                    <h3 className="font-black text-gray-900 mb-2 text-sm">👤 Client Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-600 font-semibold">Name:</span> <strong className="text-gray-900 block truncate">{selectedBooking.client.fullName}</strong></div>
                      <div><span className="text-gray-600 font-semibold">Username:</span> <strong className="text-gray-900 block truncate">{selectedBooking.client.username}</strong></div>
                      <div><span className="text-gray-600 font-semibold">Email:</span> <strong className="text-gray-900 block truncate">{selectedBooking.client.email || "N/A"}</strong></div>
                      <div><span className="text-gray-600 font-semibold">Phone:</span> <strong className="text-gray-900 block truncate">{selectedBooking.client.phone || "N/A"}</strong></div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-4 border-b-2 border-gray-200 bg-white">
                    <h3 className="font-black text-gray-900 mb-2 text-sm">📋 Booking Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                      <div className="bg-gray-50 p-2 rounded-lg border-2 border-gray-200">
                        <div className="text-gray-600 font-semibold text-xs">Check-in</div>
                        <div className="font-black text-gray-900 text-xs">{selectedBooking.checkIn}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border-2 border-gray-200">
                        <div className="text-gray-600 font-semibold text-xs">Check-out</div>
                        <div className="font-black text-gray-900 text-xs">{selectedBooking.checkOut}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border-2 border-gray-200">
                        <div className="text-gray-600 font-semibold text-xs">Guests</div>
                        <div className="font-black text-gray-900 text-xs">{selectedBooking.numberOfGuests}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border-2 border-gray-200">
                        <div className="text-gray-600 font-semibold text-xs">Rooms</div>
                        <div className="font-black text-gray-900 text-xs">{selectedBooking.numberOfRooms || 1}</div>
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mb-2 p-2 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="text-gray-600 text-xs font-semibold">Special Requests:</div>
                        <div className="text-gray-900 text-xs">{selectedBooking.specialRequests}</div>
                      </div>
                    )}
                    {selectedBooking.totalCost && (
                      <div className="p-2 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="text-gray-600 text-xs font-semibold">Proposed Cost:</div>
                        <div className="text-lg font-bold text-blue-700">{selectedBooking.totalCost} ETB</div>
                      </div>
                    )}
                  </div>

                  {/* Receipt Image - Only show until checkout date */}
                  {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                    <div className="p-6 border-b">
                      <h3 className="font-semibold text-gray-700 mb-3">🧾 Payment Receipt</h3>
                      <p className="text-xs text-gray-500 mb-2">Visible until checkout: {selectedBooking.checkOut}</p>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <img 
                          src={selectedBooking.receiptImageUrl.startsWith('/uploads') 
                            ? `${API_BASE_URL.replace('/api', '')}${selectedBooking.receiptImageUrl}` 
                            : selectedBooking.receiptImageUrl} 
                          alt="Receipt" 
                          className="max-w-md rounded-lg border shadow" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && selectedBooking.problemReport && (
                    <div className="p-4 border-b-2 border-gray-200 bg-white">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">⚠️ Problem Reported by Client</h3>
                      <p className="text-gray-700 text-xs">{selectedBooking.problemReport}</p>
                      <p className="text-xs text-gray-600 mt-1">This issue has been escalated to the admin.</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && selectedBooking.rejectionReason && (
                    <div className="p-4 border-b-2 border-gray-200 bg-white">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">❌ Rejection Reason</h3>
                      <p className="text-gray-700 text-xs">{selectedBooking.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-4 border-b-2 border-gray-200 bg-white">
                    <h3 className="font-black text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span>Quick Actions</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REQUESTED && (
                        <>
                          <button
                            onClick={() => handleAccept(selectedBooking.bookingId)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            ✓ Accept Request
                          </button>
                          <button
                            onClick={() => setShowCostModal(true)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            💰 Propose Cost
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED && (
                        <>
                          <button
                            onClick={() => setShowCostModal(true)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            💰 Propose Cost
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                        <>
                          <button
                            onClick={() => handleApprove(selectedBooking.bookingId)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            ✓ Approve Booking
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105 transition-all border-2 border-blue-700 text-xs"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                        <div className="text-blue-700 font-black bg-blue-100 px-4 py-2 rounded-lg border-2 border-blue-600 text-xs shadow-md">
                          ✓ Booking approved until {selectedBooking.checkOut}
                        </div>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                        <div className="text-gray-700 font-black bg-gray-100 px-4 py-2 rounded-lg border-2 border-gray-600 text-xs shadow-md">
                          ✗ This booking was rejected
                        </div>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                        <div className="text-blue-700 font-black bg-blue-100 px-4 py-2 rounded-lg border-2 border-blue-600 text-xs shadow-md">
                          ⏳ Waiting for client to upload payment receipt
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 bg-white rounded-b-lg border-t-2 border-gray-200">
                    <h3 className="font-black text-gray-900 mb-2 text-sm">💬 Conversation ({selectedBooking.messages?.length || 0})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3 bg-gray-50 p-3 rounded-lg shadow-inner [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-300">
                      {selectedBooking.messages?.length === 0 ? (
                        <p className="text-gray-600 text-center py-3 font-bold text-xs">No messages yet</p>
                      ) : (
                        selectedBooking.messages?.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2 rounded-lg shadow-sm text-xs ${
                              m.senderId === userId ? "bg-blue-100 ml-6" : "bg-gray-200 mr-6"
                            }`}
                          >
                            <div className="flex justify-between text-xs text-gray-700 mb-0.5">
                              <span className="font-black">{m.senderName}</span>
                              <span className="font-bold">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-gray-900 font-bold">{m.message}</div>
                            {m.messageType !== "GENERAL" && (
                              <span className="text-xs text-gray-700 mt-1 block font-black bg-gray-300 px-1.5 py-0.5 rounded inline-block">[{m.messageType}]</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white rounded-lg px-3 py-2 font-bold text-sm focus:ring-2 focus:ring-blue-600 border-2 border-gray-200"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black hover:bg-blue-700 disabled:opacity-50 shadow-md text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-sm font-semibold text-gray-600">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Propose Cost Modal */}
      {showCostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm mx-4 border-2 border-gray-200 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Propose Cost</h3>
            <p className="text-gray-600 text-sm mb-3">Enter the total cost for this booking:</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Cost (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={proposedCost}
                onChange={(e) => setProposedCost(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                placeholder="Enter amount..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCostModal(false)} className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold border-2 border-gray-200 text-sm">
                Cancel
              </button>
              <button
                onClick={handleProposeCost}
                disabled={!proposedCost || actionLoading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 border-2 border-blue-700 text-sm"
              >
                {actionLoading ? "Sending..." : "Send Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm mx-4 border-2 border-gray-200 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3">❌ Reject Booking</h3>
            <p className="text-gray-600 text-sm mb-3">Please provide a reason for rejection:</p>
            <div className="mb-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                rows={3}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold border-2 border-gray-200 text-sm">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || actionLoading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 border-2 border-blue-700 text-sm"
              >
                {actionLoading ? "Rejecting..." : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
