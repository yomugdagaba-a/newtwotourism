"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import TopBar from "@/components/layout/TopBar";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { ModeSwitcherCompact } from "@/components/common/ModeSwitcher";
import { API_BASE_URL } from "@/services/api";

export default function OwnerBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId, role, browsingMode, setBrowsingMode } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Form states
  const [proposedCost, setProposedCost] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Helper function to get receipt URL
  const getReceiptUrl = (receiptImageUrl: string) => {
    // If it starts with /uploads, use it directly (Next.js proxy will handle it)
    // Otherwise, return as-is (external URL)
    return receiptImageUrl;
  };

  // Download function that handles CORS
  const handleDownloadReceipt = async () => {
    if (!selectedBooking?.receiptImageUrl) return;
    try {
      const url = getReceiptUrl(selectedBooking.receiptImageUrl);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = selectedBooking.receiptImageUrl.split('.').pop() || 'jpg';
      link.download = `receipt-booking-${selectedBooking.bookingId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(getReceiptUrl(selectedBooking.receiptImageUrl), '_blank');
    }
  };

  const loadBookings = useCallback(async (showLoading = false) => {
    if (!token || !userId) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await BookingService.getOwnerBookings(token, userId);
      setBookings(data);
      // Update selected booking with fresh data (to get new messages)
      if (selectedBooking) {
        const updated = data.find(b => b.bookingId === selectedBooking.bookingId);
        if (updated) setSelectedBooking(updated);
      } else if (data.length > 0) {
        setSelectedBooking(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token, userId, selectedBooking?.bookingId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOTEL_OWNER" && role !== "ADMIN") {
      router.push("/");
      return;
    }
    // Auto-switch to owner mode when accessing this page
    if (role === "HOTEL_OWNER" && browsingMode !== "OWNER") {
      setBrowsingMode("OWNER");
    }
    
    // Initial load with loading indicator
    loadBookings(true);
    
    // Auto-refresh every 10 seconds to get new messages from clients
    const interval = setInterval(() => loadBookings(false), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, role, token, userId]);

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
    return b.bookingStatus === filter;
  });

  if (!isAuthenticated || (role !== "HOTEL_OWNER" && role !== "ADMIN")) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3 transition-colors font-bold"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl font-black text-gray-900">🏨 My Hotel Bookings</h1>
            <p className="text-gray-700 mt-1 font-semibold">Manage booking requests for your hotels</p>
          </div>
          <div className="flex items-center gap-3">
            {role === "HOTEL_OWNER" && <ModeSwitcherCompact />}
            <button onClick={loadBookings} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 font-black border-2 border-gray-900">
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && <div className="bg-red-100 border-2 border-red-400 text-red-700 p-4 rounded-lg mb-6 font-bold">{error}</div>}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["ALL", "PENDING", "ACTIVE", "COMPLETED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-bold transition border-2 ${
                filter === f ? "bg-gray-800 text-white border-gray-900" : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              {f} ({f === "ALL" ? bookings.length : filteredBookings.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="font-black text-gray-800 mb-2">Bookings ({filteredBookings.length})</h2>
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center text-gray-600 border-2 border-gray-300">No bookings found</div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.bookingId}
                    onClick={() => setSelectedBooking(b)}
                    className={`bg-white rounded-lg p-4 cursor-pointer border-2 transition hover:shadow-md ${
                      selectedBooking?.bookingId === b.bookingId ? "border-gray-400 shadow-md ring-2 ring-gray-300" : "border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-black text-gray-900">#{b.bookingId}</span>
                        <span className="text-gray-600 ml-2 font-semibold">{b.hotel.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-black ${BookingService.getStatusColor(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 font-semibold">
                      <div>👤 {b.client.fullName}</div>
                      <div>📅 {b.checkIn} → {b.checkOut}</div>
                      <div>👥 {b.numberOfGuests} guests {b.numberOfRooms && `• ${b.numberOfRooms} rooms`}</div>
                    </div>
                    {b.problemReported && <div className="mt-2 text-xs text-red-600 font-black">⚠️ Problem Reported</div>}
                  </div>
                ))
              )}
            </div>

            {/* Booking Details */}
            <div className="lg:col-span-2">
              {selectedBooking ? (
                <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Booking #{selectedBooking.bookingId}</h2>
                        <p className="text-gray-700 font-semibold">{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-black ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-black text-gray-900 mb-3">👤 Client Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-600 font-bold">Name:</span> <strong className="text-gray-900">{selectedBooking.client.fullName}</strong></div>
                      <div><span className="text-gray-600 font-bold">Username:</span> <strong className="text-gray-900">{selectedBooking.client.username}</strong></div>
                      <div><span className="text-gray-600 font-bold">Email:</span> <strong className="text-gray-900">{selectedBooking.client.email || "N/A"}</strong></div>
                      <div><span className="text-gray-600 font-bold">Phone:</span> <strong className="text-gray-900">{selectedBooking.client.phone || "N/A"}</strong></div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="font-black text-gray-900 mb-3">📋 Booking Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-bold">Check-in</div>
                        <div className="font-black text-gray-900">{selectedBooking.checkIn}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-bold">Check-out</div>
                        <div className="font-black text-gray-900">{selectedBooking.checkOut}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-bold">Guests</div>
                        <div className="font-black text-gray-900">{selectedBooking.numberOfGuests}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-bold">Rooms</div>
                        <div className="font-black text-gray-900">{selectedBooking.numberOfRooms || 1}</div>
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 text-sm font-bold">Special Requests:</div>
                        <div className="text-gray-900 font-semibold">{selectedBooking.specialRequests}</div>
                      </div>
                    )}
                    {selectedBooking.totalCost && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 text-sm font-bold">Proposed Cost:</div>
                        <div className="text-2xl font-black text-gray-900">{selectedBooking.totalCost} ETB</div>
                      </div>
                    )}
                  </div>

                  {/* Receipt Image - Only show until checkout date */}
                  {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-black text-gray-900">🧾 Payment Receipt</h3>
                          <p className="text-xs text-gray-600 mt-1 font-semibold">Visible until checkout: {selectedBooking.checkOut}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowReceiptModal(true)}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-black border-2 border-gray-900"
                          >
                            🔍 View Full Size
                          </button>
                          <button
                            onClick={handleDownloadReceipt}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-black border-2 border-gray-800"
                          >
                            ⬇️ Download
                          </button>
                        </div>
                      </div>
                      <img 
                        src={getReceiptUrl(selectedBooking.receiptImageUrl)} 
                        alt="Payment Receipt" 
                        className="w-full rounded-lg border-2 border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image failed to load</text></svg>';
                        }}
                      />
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && selectedBooking.problemReport && (
                    <div className="p-6 border-b border-red-200 bg-red-50">
                      <h3 className="font-black text-red-800 mb-2">⚠️ Problem Reported by Client</h3>
                      <p className="text-red-900 font-semibold">{selectedBooking.problemReport}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && selectedBooking.rejectionReason && (
                    <div className="p-6 border-b border-red-200 bg-red-50">
                      <h3 className="font-black text-red-800 mb-2">❌ Rejection Reason</h3>
                      <p className="text-red-900 font-semibold">{selectedBooking.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <h3 className="font-black text-gray-900 mb-3">⚡ Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REQUESTED && (
                        <>
                          <button
                            onClick={() => handleAccept(selectedBooking.bookingId)}
                            disabled={actionLoading}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-black hover:bg-gray-900 disabled:opacity-50 border-2 border-gray-900"
                          >
                            ✓ Accept Request
                          </button>
                          <button
                            onClick={() => setShowCostModal(true)}
                            disabled={actionLoading}
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg font-black hover:bg-gray-800 disabled:opacity-50 border-2 border-gray-800"
                          >
                            💰 Propose Cost
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-black hover:bg-red-700 disabled:opacity-50 border-2 border-red-700"
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
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg font-black hover:bg-gray-800 disabled:opacity-50 border-2 border-gray-800"
                          >
                            💰 Propose Cost
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-black hover:bg-red-700 disabled:opacity-50 border-2 border-red-700"
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
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-black hover:bg-gray-900 disabled:opacity-50 border-2 border-gray-900"
                          >
                            ✓ Approve Booking
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-black hover:bg-red-700 disabled:opacity-50 border-2 border-red-700"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                        <div className="text-gray-900 font-black">✓ This booking is approved and active</div>
                      )}
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                        <div className="text-red-700 font-black">✗ This booking was rejected</div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-8 bg-white rounded-b-lg border-t-4 border-gray-300">
                    <h3 className="font-black text-gray-900 mb-6 text-xl">💬 Messages ({selectedBooking.messages?.length || 0})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 bg-white p-6 rounded-2xl shadow-lg border-4 border-gray-300 [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-400">
                      {selectedBooking.messages?.length === 0 ? (
                        <p className="text-gray-600 text-center py-4 font-bold">No messages yet</p>
                      ) : (
                        selectedBooking.messages?.map((m) => (
                          <div
                            key={m.id}
                            className={`p-4 rounded-xl shadow-md border-2 ${
                              m.senderId === userId ? "bg-blue-50 ml-8 border-blue-200" : "bg-gray-100 mr-8 border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between text-xs text-gray-700 mb-2">
                              <span className={`font-black ${m.senderId === userId ? "text-blue-700" : "text-gray-800"}`}>{m.senderName}</span>
                              <span className="font-bold text-gray-600">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={`font-bold ${m.senderId === userId ? "text-blue-900" : "text-gray-900"}`}>{m.message}</div>
                            {m.messageType !== "GENERAL" && (
                              <span className={`text-xs mt-2 block font-black px-2 py-1 rounded inline-block ${
                                m.senderId === userId ? "bg-blue-200 text-blue-800" : "bg-gray-300 text-gray-800"
                              }`}>[{m.messageType}]</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the client..."
                        className="flex-1 bg-white rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-gray-500 border-2 border-gray-300"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gray-800 text-white px-6 py-3 rounded-xl font-black hover:bg-gray-900 disabled:opacity-50 shadow-md border-2 border-gray-900"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 text-center text-gray-600 border-2 border-gray-300">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="font-black text-gray-900">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Propose Cost Modal */}
      {showCostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border-2 border-gray-300">
            <h3 className="text-xl font-black text-gray-900 mb-4">💰 Propose Cost</h3>
            <p className="text-gray-700 mb-4 font-semibold">Enter the total cost for this booking:</p>
            <div className="mb-4">
              <label className="block text-sm font-black text-gray-900 mb-1">Total Cost (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={proposedCost}
                onChange={(e) => setProposedCost(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 font-bold"
                placeholder="Enter amount..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCostModal(false)} className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg font-black bg-gray-100 border-2 border-gray-300">
                Cancel
              </button>
              <button
                onClick={handleProposeCost}
                disabled={!proposedCost || actionLoading}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg font-black hover:bg-gray-900 disabled:opacity-50 border-2 border-gray-900"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md border-2 border-red-300">
            <h3 className="text-xl font-black text-red-600 mb-4">❌ Reject Booking</h3>
            <p className="text-gray-700 mb-4 font-semibold">Please provide a reason for rejection:</p>
            <div className="mb-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 font-bold"
                rows={3}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg font-black bg-gray-100 border-2 border-gray-300">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || actionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-black hover:bg-red-700 disabled:opacity-50 border-2 border-red-700"
              >
                {actionLoading ? "Rejecting..." : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Modal - Only show until checkout date */}
      {showReceiptModal && selectedBooking?.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div className="relative max-w-4xl w-full">
            <div className="absolute top-0 right-0 -mt-12 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(); }}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-black border-2 border-gray-900"
              >
                ⬇️ Download
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-black border-2 border-red-700"
              >
                ✕ Close
              </button>
            </div>
            <img 
              src={getReceiptUrl(selectedBooking.receiptImageUrl)} 
              alt="Receipt Full Size" 
              className="w-full h-auto max-h-screen object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
