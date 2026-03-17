"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import TopBar from "@/components/layout/TopBar";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { API_BASE_URL } from "@/services/api";

export default function ClientBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId, username } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [problemReport, setProblemReport] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    loadBookings();
  }, [isAuthenticated]);

  const loadBookings = async () => {
    if (!token || !userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await BookingService.getMyBookings(token, userId);
      setBookings(data);
      if (data.length > 0 && !selectedBooking) {
        setSelectedBooking(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!token || !userId || !selectedBooking || !receiptFile) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.uploadReceiptFile(token, selectedBooking.bookingId, receiptFile, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setReceiptFile(null);
      setReceiptPreview(null);
      setShowReceiptModal(false);
      alert("Receipt uploaded successfully! The hotel owner will review it.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload receipt");
    } finally {
      setActionLoading(false);
    }
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
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setNewMessage("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const handleReportProblem = async () => {
    if (!token || !userId || !selectedBooking || !problemReport.trim()) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.reportProblem(token, selectedBooking.bookingId, problemReport, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setProblemReport("");
      setShowProblemModal(false);
      alert("Problem reported to admin. They will contact you soon.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to report problem");
    } finally {
      setActionLoading(false);
    }
  };

  const updateBookingInList = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus);
    if (filter === "APPROVED") return b.bookingStatus === BOOKING_STATUS.APPROVED;
    if (filter === "COMPLETED") return [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus);
    return b.bookingStatus === filter;
  });

  // Stats
  const activeCount = bookings.filter(b => [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus)).length;
  const approvedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length;
  const needsPayment = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.COST_PROPOSED).length;

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-bold">Back to Home</span>
            </button>
            <h1 className="text-3xl font-black text-gray-900">📋 My Bookings</h1>
            <p className="text-gray-700 mt-1 font-semibold">Track and manage your hotel reservations</p>
          </div>
          <button onClick={loadBookings} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 font-bold border-2 border-gray-900">
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 p-4 rounded-lg mb-6 font-bold">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-3xl font-black text-gray-900">{bookings.length}</div>
            <div className="text-gray-600 text-sm font-extrabold uppercase tracking-wide">Total Bookings</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-3xl font-black text-gray-900">{activeCount}</div>
            <div className="text-gray-600 text-sm font-extrabold uppercase tracking-wide">In Progress</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-3xl font-black text-gray-900">{needsPayment}</div>
            <div className="text-gray-600 text-sm font-extrabold uppercase tracking-wide">Awaiting Payment</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-3xl font-black text-gray-900">{approvedCount}</div>
            <div className="text-gray-600 text-sm font-extrabold uppercase tracking-wide">Approved</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["ALL", "ACTIVE", "APPROVED", "COMPLETED"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-bold transition border-2 ${
                filter === f ? "bg-gray-800 text-white border-gray-900" : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-300 shadow-lg">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-700 mb-6 font-semibold">Start exploring hotels and make your first reservation!</p>
            <button
              onClick={() => router.push('/tourisms')}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-black hover:bg-gray-900 border-2 border-gray-900"
            >
              🏨 Browse Hotels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List */}
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
              <h2 className="font-black text-gray-800 sticky top-0 bg-gray-100 py-2">
                Bookings ({filteredBookings.length})
              </h2>
              {filteredBookings.map(b => (
                <div
                  key={b.bookingId}
                  onClick={() => setSelectedBooking(b)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] shadow-md border border-gray-200 ${
                    selectedBooking?.bookingId === b.bookingId ? "bg-gray-50 shadow-lg ring-2 ring-gray-400" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-black text-lg text-gray-900">#{b.bookingId}</span>
                      {b.problemReported && <span className="ml-2 text-red-500">⚠️</span>}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black ${BookingService.getStatusColor(b.bookingStatus)}`}>
                      {BookingService.getStatusLabel(b.bookingStatus)}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-black text-gray-900 text-base">🏨 {b.hotel.name}</div>
                    <div className="font-bold text-gray-700">📅 {b.checkIn} → {b.checkOut}</div>
                    <div className="font-bold text-gray-700">👥 {b.numberOfGuests} guests {b.numberOfRooms && `• ${b.numberOfRooms} rooms`}</div>
                    {b.totalCost && <div className="text-green-700 font-black text-base">💰 {b.totalCost} ETB</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Booking Details */}
            <div className="lg:col-span-2">
              {selectedBooking ? (
                <div className="bg-white rounded-xl shadow-2xl">
                  {/* Header */}
                  <div className="p-6 bg-white rounded-t-xl border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900">Booking #{selectedBooking.bookingId}</h2>
                        <p className="text-gray-700 font-extrabold text-lg">{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={`px-5 py-2.5 rounded-full text-sm font-black shadow-md ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Status Progress */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <h3 className="font-black text-gray-900 mb-4 text-lg">📊 Booking Progress</h3>
                    <div className="flex items-center justify-between">
                      {[
                        { status: 'REQUESTED', label: 'Requested', icon: '📝' },
                        { status: 'OWNER_ACCEPTED', label: 'Accepted', icon: '✓' },
                        { status: 'COST_PROPOSED', label: 'Cost Sent', icon: '💰' },
                        { status: 'PAID', label: 'Paid', icon: '🧾' },
                        { status: 'APPROVED', label: 'Approved', icon: '✅' },
                      ].map((step, idx) => {
                        const statusOrder = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID', 'APPROVED'];
                        const currentIdx = statusOrder.indexOf(selectedBooking.bookingStatus);
                        const stepIdx = statusOrder.indexOf(step.status);
                        const isCompleted = stepIdx <= currentIdx;
                        const isCurrent = step.status === selectedBooking.bookingStatus;
                        
                        return (
                          <div key={step.status} className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              isCompleted ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {step.icon}
                            </div>
                            <span className={`text-xs mt-1 ${isCompleted || isCurrent ? 'text-gray-900 font-bold' : 'text-gray-500 font-semibold'}`}>
                              {step.label}
                            </span>
                            {idx < 4 && (
                              <div className={`h-0.5 w-full mt-5 absolute ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} style={{ display: 'none' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-800 text-sm font-black border border-red-200">
                        ❌ This booking was rejected. Reason: {selectedBooking.rejectionReason || 'Not specified'}
                      </div>
                    )}
                  </div>

                  {/* Hotel Info */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <h3 className="font-black text-gray-900 mb-4 text-lg">🏨 Hotel Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200"><span className="text-gray-600 font-bold">Hotel:</span> <strong className="font-black text-gray-900">{selectedBooking.hotel.name}</strong></div>
                      <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200"><span className="text-gray-600 font-bold">Contact:</span> <strong className="font-black text-gray-900">{selectedBooking.hotel.contactInfo || 'N/A'}</strong></div>
                      <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200"><span className="text-gray-600 font-bold">Owner:</span> <strong className="font-black text-gray-900">{selectedBooking.hotel.ownerName || 'N/A'}</strong></div>
                      <div className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200"><span className="text-gray-600 font-bold">Status:</span> 
                        <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-black ${selectedBooking.hotel.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedBooking.hotel.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <h3 className="font-black text-gray-900 mb-4 text-lg">📋 Booking Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-xs font-extrabold uppercase tracking-wide">Check-in</div>
                        <div className="font-black text-gray-900 text-lg">{selectedBooking.checkIn}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-xs font-extrabold uppercase tracking-wide">Check-out</div>
                        <div className="font-black text-gray-900 text-lg">{selectedBooking.checkOut}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-xs font-extrabold uppercase tracking-wide">Guests</div>
                        <div className="font-black text-gray-900 text-2xl">{selectedBooking.numberOfGuests}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-xs font-extrabold uppercase tracking-wide">Rooms</div>
                        <div className="font-black text-gray-900 text-2xl">{selectedBooking.numberOfRooms || 1}</div>
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-sm font-extrabold uppercase tracking-wide">Special Requests:</div>
                        <div className="text-gray-900 font-bold mt-1">{selectedBooking.specialRequests}</div>
                      </div>
                    )}
                  </div>

                  {/* Cost & Payment Section */}
                  {selectedBooking.totalCost && (
                    <div className="p-6 bg-white border-b border-gray-200">
                      <h3 className="font-black text-gray-900 mb-4 text-lg">💰 Payment Information</h3>
                      <div className="text-center mb-4 bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-gray-700 text-sm font-extrabold uppercase tracking-wide">Total Cost</div>
                        <div className="text-5xl font-black text-gray-900">{selectedBooking.totalCost} ETB</div>
                      </div>
                      
                      {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                        <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                          <p className="text-gray-800 mb-4 font-extrabold text-base">
                            💳 The hotel owner has proposed a cost. Please upload your payment receipt to proceed.
                          </p>
                          <button
                            onClick={() => setShowReceiptModal(true)}
                            className="w-full bg-gray-800 text-white py-4 rounded-xl font-black text-lg hover:bg-gray-900 shadow-md hover:shadow-lg transition-all"
                          >
                            📤 Upload Payment Receipt
                          </button>
                        </div>
                      )}
                      
                      {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                        <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                          <p className="text-gray-800 font-extrabold text-base">
                            ⏳ Your payment receipt has been uploaded. Waiting for hotel owner to verify and approve.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Receipt Image - Only show until checkout date */}
                  {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                    <div className="p-6 bg-white border-b border-gray-200">
                      <h3 className="font-black text-gray-900 mb-4 text-lg">🧾 Your Payment Receipt</h3>
                      <img src={selectedBooking.receiptImageUrl} alt="Receipt" className="max-w-md rounded-xl shadow-md border border-gray-200" />
                      <p className="text-xs text-gray-600 mt-2 font-semibold">
                        📅 Receipt visible until checkout date: {selectedBooking.checkOut}
                      </p>
                    </div>
                  )}

                  {/* Approved Status */}
                  {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                    <div className="p-8 bg-white border-b border-gray-200">
                      <div className="text-center">
                        <div className="text-7xl mb-4">✅</div>
                        <h3 className="text-3xl font-black text-gray-900 mb-3">Booking Approved!</h3>
                        <p className="text-gray-800 font-extrabold text-lg">
                          Your reservation is confirmed from {selectedBooking.checkIn} to {selectedBooking.checkOut}
                        </p>
                        <p className="text-gray-700 mt-3 font-bold text-base">
                          Contact the hotel at: <span className="font-black">{selectedBooking.hotel.contactInfo}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && selectedBooking.problemReport && (
                    <div className="p-6 bg-red-50 border-b border-red-200">
                      <h3 className="font-black text-red-800 mb-3 text-lg">⚠️ Problem Reported</h3>
                      <p className="text-red-900 font-extrabold">{selectedBooking.problemReport}</p>
                      <p className="text-sm text-red-700 mt-2 font-bold">Admin has been notified and will contact you.</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <h3 className="font-black text-gray-900 mb-4 text-lg">⚡ Actions</h3>
                    <div className="flex flex-wrap gap-4">
                      {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                        <button
                          onClick={() => setShowReceiptModal(true)}
                          className="bg-gray-800 text-white px-5 py-3 rounded-xl font-black hover:bg-gray-900 shadow-md hover:shadow-lg transition-all"
                        >
                          📤 Upload Receipt
                        </button>
                      )}
                      {!selectedBooking.problemReported && selectedBooking.bookingStatus !== BOOKING_STATUS.REJECTED && (
                        <button
                          onClick={() => setShowProblemModal(true)}
                          className="bg-red-600 text-white px-5 py-3 rounded-xl font-black hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                        >
                          ⚠️ Report Problem
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/hotels/${selectedBooking.hotel.id}`)}
                        className="bg-gray-800 text-white px-5 py-3 rounded-xl font-black hover:bg-gray-900 shadow-md hover:shadow-lg transition-all"
                      >
                        🏨 View Hotel
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-8 bg-gray-50 rounded-b-xl border-t-4 border-gray-300">
                    <h3 className="font-black text-gray-900 mb-6 text-xl">💬 Conversation ({selectedBooking.messages?.length || 0})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 bg-white p-6 rounded-2xl shadow-lg border-4 border-gray-300 [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-400">
                      {selectedBooking.messages?.length === 0 ? (
                        <p className="text-gray-600 text-center py-8 font-bold text-lg">No messages yet</p>
                      ) : (
                        selectedBooking.messages?.map(m => (
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
                        placeholder="Type a message to the hotel owner..."
                        className="flex-1 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-500 font-bold bg-white border-2 border-gray-300"
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

                  {/* Timestamps */}
                  <div className="p-4 bg-gray-100 text-sm text-gray-700 flex justify-between font-bold rounded-b-xl border-t border-gray-200">
                    <span>Created: {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedBooking.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-12 text-center text-gray-700 shadow-lg">
                  <div className="text-7xl mb-4">📋</div>
                  <p className="font-black text-lg">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
            <div className="p-5 bg-gray-800 rounded-t-xl">
              <h3 className="text-2xl font-black text-white">📤 Upload Payment Receipt</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-800 mb-4 font-bold">
                Select your payment receipt image or PDF file from your device.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-black text-gray-900 mb-2">Receipt File</label>
                <div className="border-3 border-dashed border-gray-400 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-gray-500 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptFileChange}
                    className="hidden"
                    id="receipt-file-input"
                  />
                  <label htmlFor="receipt-file-input" className="cursor-pointer block">
                    {receiptFile ? (
                      <div>
                        <div className="text-gray-600 text-5xl mb-3">✓</div>
                        <p className="text-gray-900 font-black text-lg">{receiptFile.name}</p>
                        <p className="text-gray-600 text-sm font-semibold">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-5xl mb-3">📁</div>
                        <p className="text-gray-800 font-bold text-lg">Click to select file</p>
                        <p className="text-gray-500 text-sm font-semibold">JPG, PNG, GIF, WebP or PDF (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
                {receiptPreview && (
                  <div className="mt-4">
                    <img src={receiptPreview} alt="Preview" className="max-h-48 rounded-xl mx-auto border-2 border-gray-300 shadow-md" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 bg-gray-100 rounded-b-xl border-t border-gray-200">
              <button 
                onClick={() => { setShowReceiptModal(false); setReceiptFile(null); setReceiptPreview(null); }} 
                className="px-5 py-3 text-gray-800 hover:bg-gray-200 rounded-xl font-black bg-gray-100 border-2 border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadReceipt}
                disabled={!receiptFile || actionLoading}
                className="bg-gray-800 text-white px-5 py-3 rounded-xl font-black hover:bg-gray-900 disabled:opacity-50 shadow-md"
              >
                {actionLoading ? "Uploading..." : "Upload Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showProblemModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
            <div className="p-5 bg-red-600 rounded-t-xl">
              <h3 className="text-2xl font-black text-white">⚠️ Report a Problem</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-800 mb-4 font-bold">
                Describe the issue you're experiencing. The admin will be notified and will contact both you and the hotel owner.
              </p>
              <div className="mb-4">
                <textarea
                  value={problemReport}
                  onChange={(e) => setProblemReport(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 font-bold border border-gray-300"
                  rows={4}
                  placeholder="Describe your problem..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 bg-gray-100 rounded-b-xl border-t border-gray-200">
              <button onClick={() => setShowProblemModal(false)} className="px-5 py-3 text-gray-800 hover:bg-gray-200 rounded-xl font-black bg-gray-100 border-2 border-gray-300">
                Cancel
              </button>
              <button
                onClick={handleReportProblem}
                disabled={!problemReport.trim() || actionLoading}
                className="bg-red-600 text-white px-5 py-3 rounded-xl font-black hover:bg-red-700 disabled:opacity-50 shadow-md"
              >
                {actionLoading ? "Reporting..." : "Report Problem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
