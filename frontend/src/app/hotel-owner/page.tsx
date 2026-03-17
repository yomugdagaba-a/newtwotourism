"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import TopBar from "@/components/layout/TopBar";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";

export default function HotelOwnerDashboard() {
  const router = useRouter();
  const { isAuthenticated, token, userId, role } = useAuthStore();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [costInput, setCostInput] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOTEL_OWNER" && role !== "ADMIN") {
      router.push("/");
      return;
    }
    loadBookings();
  }, [isAuthenticated, role]);

  const loadBookings = async () => {
    if (!token || !userId) return;
    try {
      setLoading(true);
      const data = await BookingService.getOwnerBookings(token, userId);
      setBookings(data);
      if (data.length > 0 && !selectedBooking) {
        setSelectedBooking(data[0]);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId: number) => {
    if (!token || !userId) return;
    try {
      setSubmitting(true);
      const updated = await BookingService.acceptBookingRequest(token, bookingId, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
    } catch (err) {
      alert("Failed to accept booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeCost = async (bookingId: number) => {
    if (!token || !userId || !costInput) return;
    try {
      setSubmitting(true);
      const updated = await BookingService.proposeCost(token, bookingId, parseFloat(costInput), userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setCostInput("");
    } catch (err) {
      alert("Failed to propose cost");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (bookingId: number) => {
    if (!token || !userId) return;
    try {
      setSubmitting(true);
      const updated = await BookingService.approveBooking(token, bookingId, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
    } catch (err) {
      alert("Failed to approve booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (bookingId: number) => {
    if (!token || !userId || !rejectReason) return;
    try {
      setSubmitting(true);
      const updated = await BookingService.rejectBooking(token, bookingId, rejectReason, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setRejectReason("");
    } catch (err) {
      alert("Failed to reject booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage) return;
    try {
      const updated = await BookingService.ownerSendMessage(token, selectedBooking.bookingId, newMessage, userId);
      updateBookingInList(updated);
      setSelectedBooking(updated);
      setNewMessage("");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const updateBookingInList = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "pending") return b.bookingStatus === BOOKING_STATUS.REQUESTED;
    if (filter === "active") return [BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus);
    if (filter === "approved") return b.bookingStatus === BOOKING_STATUS.APPROVED;
    if (filter === "problems") return b.problemReported;
    return true;
  });

  const pendingCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length;
  const paidCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length;
  const problemCount = bookings.filter(b => b.problemReported).length;

  if (!isAuthenticated || (role !== "HOTEL_OWNER" && role !== "ADMIN")) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 p-6 rounded-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white">🏨 Hotel Owner Dashboard</h1>
              <p className="text-emerald-200 font-semibold mt-1">Manage your hotel bookings</p>
            </div>
            <button onClick={loadBookings} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-black shadow-lg">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-100 p-5 rounded-xl shadow-xl border-l-4 border-gray-600">
            <div className="text-3xl font-black text-gray-900">{bookings.length}</div>
            <div className="text-gray-800 font-black">Total Bookings</div>
          </div>
          <div className="bg-yellow-100 p-5 rounded-xl shadow-xl border-l-4 border-yellow-600">
            <div className="text-3xl font-black text-yellow-700">{pendingCount}</div>
            <div className="text-gray-800 font-black">Pending Review</div>
          </div>
          <div className="bg-indigo-100 p-5 rounded-xl shadow-xl border-l-4 border-indigo-600">
            <div className="text-3xl font-black text-indigo-700">{paidCount}</div>
            <div className="text-gray-800 font-black">Awaiting Approval</div>
          </div>
          <div className="bg-red-100 p-5 rounded-xl shadow-xl border-l-4 border-red-600">
            <div className="text-3xl font-black text-red-700">{problemCount}</div>
            <div className="text-gray-800 font-black">Problems Reported</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "active", label: "In Progress" },
            { key: "approved", label: "Approved" },
            { key: "problems", label: `Problems (${problemCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-black whitespace-nowrap shadow-md border-2 transition ${
                filter === tab.key ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-gray-700 hover:bg-gray-100 border-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Bookings List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="font-black text-gray-800 mb-2">📋 Bookings ({filteredBookings.length})</h3>
              {filteredBookings.length === 0 ? (
                <div className="bg-gray-100 p-6 rounded-xl text-center text-gray-800 font-bold shadow-lg">
                  No bookings found
                </div>
              ) : (
                filteredBookings.map(booking => (
                  <div
                    key={booking.bookingId}
                    onClick={() => setSelectedBooking(booking)}
                    className={`bg-gray-50 p-4 rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                      selectedBooking?.bookingId === booking.bookingId
                        ? "bg-emerald-100 ring-4 ring-emerald-300 shadow-xl"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-black text-gray-900">{booking.client.fullName || booking.client.username}</div>
                        <div className="text-sm text-gray-700 font-bold">#{booking.bookingId}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-black shadow-sm ${BookingService.getStatusColor(booking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(booking.bookingStatus)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 font-bold">
                      📅 {booking.checkIn} → {booking.checkOut}
                    </div>
                    <div className="text-sm text-gray-800 font-bold">
                      👥 {booking.numberOfGuests} guests • 🛏️ {booking.numberOfRooms || 1} room(s)
                    </div>
                    {booking.problemReported && (
                      <div className="mt-2 text-xs text-red-700 font-black bg-red-100 px-2 py-1 rounded">⚠️ Problem Reported</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Booking Details */}
            <div className="lg:col-span-2">
              {selectedBooking ? (
                <div className="bg-gray-50 rounded-xl shadow-2xl">
                  {/* Header */}
                  <div className="p-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-t-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">🏨 {selectedBooking.hotel.name}</h2>
                        <p className="text-gray-800 font-bold">Booking #{selectedBooking.bookingId}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-black shadow-md ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-blue-100 p-5 m-4 rounded-xl shadow-lg">
                    <h3 className="font-black text-blue-900 mb-3">👤 Client Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="font-bold text-gray-800">Name: <strong className="text-gray-900">{selectedBooking.client.fullName || selectedBooking.client.username}</strong></div>
                      <div className="font-bold text-gray-800">Email: <strong className="text-gray-900">{selectedBooking.client.email || "N/A"}</strong></div>
                      <div className="font-bold text-gray-800">Check-in: <strong className="text-emerald-700">{selectedBooking.checkIn}</strong></div>
                      <div className="font-bold text-gray-800">Check-out: <strong className="text-red-700">{selectedBooking.checkOut}</strong></div>
                      <div className="font-bold text-gray-800">Guests: <strong className="text-gray-900">{selectedBooking.numberOfGuests}</strong></div>
                      <div className="font-bold text-gray-800">Rooms: <strong className="text-gray-900">{selectedBooking.numberOfRooms || 1}</strong></div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mt-3 p-3 bg-yellow-200 rounded-xl shadow-md">
                        <strong className="text-gray-900 font-black">Special Requests:</strong> <span className="font-bold text-gray-800">{selectedBooking.specialRequests}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons based on status */}
                  {selectedBooking.bookingStatus === BOOKING_STATUS.REQUESTED && (
                    <div className="bg-yellow-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-yellow-900 mb-3">📋 New Booking Request</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(selectedBooking.bookingId)}
                          disabled={submitting}
                          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50 shadow-lg"
                        >
                          ✓ Accept Request
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) {
                              setRejectReason(reason);
                              handleReject(selectedBooking.bookingId);
                            }
                          }}
                          disabled={submitting}
                          className="px-6 bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700 disabled:opacity-50 shadow-lg"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedBooking.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED && (
                    <div className="bg-blue-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-blue-900 mb-3">💰 Propose Cost</h3>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={costInput}
                          onChange={(e) => setCostInput(e.target.value)}
                          placeholder="Enter total cost (ETB)"
                          className="flex-1 bg-white rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleProposeCost(selectedBooking.bookingId)}
                          disabled={submitting || !costInput}
                          className="px-6 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg"
                        >
                          Send Cost
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                    <div className="bg-purple-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-purple-900 mb-2">⏳ Waiting for Payment</h3>
                      <p className="text-purple-800 font-bold">Cost proposed: <strong className="text-2xl text-purple-900">{selectedBooking.totalCost} ETB</strong></p>
                      <p className="text-sm text-purple-700 font-semibold mt-1">Waiting for client to upload payment receipt...</p>
                    </div>
                  )}

                  {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                    <div className="bg-indigo-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-indigo-900 mb-3">🧾 Payment Received - Review Receipt</h3>
                      {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                        <div className="mb-4">
                          <img
                            src={selectedBooking.receiptImageUrl}
                            alt="Payment Receipt"
                            className="max-w-sm rounded-xl border-2 border-indigo-400 shadow-lg"
                          />
                          <p className="text-xs text-indigo-700 mt-2 font-semibold">
                            📅 Receipt visible until checkout: {selectedBooking.checkOut}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(selectedBooking.bookingId)}
                          disabled={submitting}
                          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black hover:bg-green-700 disabled:opacity-50 shadow-lg"
                        >
                          ✓ Approve Booking
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) {
                              setRejectReason(reason);
                              handleReject(selectedBooking.bookingId);
                            }
                          }}
                          disabled={submitting}
                          className="px-6 bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700 disabled:opacity-50 shadow-lg"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                    <div className="bg-green-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-green-900">✓ Booking Approved</h3>
                      <p className="text-green-800 font-bold">This booking is confirmed until {selectedBooking.checkOut}</p>
                    </div>
                  )}

                  {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                    <div className="bg-red-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-red-900">✗ Booking Rejected</h3>
                      <p className="text-red-800 font-bold">Reason: {selectedBooking.rejectionReason}</p>
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && (
                    <div className="bg-red-200 p-5 m-4 rounded-xl shadow-lg">
                      <h3 className="font-black text-red-900 mb-2">⚠️ Problem Reported to Admin</h3>
                      <p className="text-red-800 font-bold">{selectedBooking.problemReport}</p>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="bg-green-900 rounded-b-xl p-6">
                    <h3 className="font-black text-white mb-4">💬 Messages ({selectedBooking.messages?.length || 0})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4 bg-green-300 p-4 rounded-xl shadow-inner [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-gray-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-300">
                      {selectedBooking.messages?.length > 0 ? (
                        selectedBooking.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-4 rounded-xl shadow-md ${
                              m.senderId === userId ? "bg-green-500 ml-8" : "bg-green-100 mr-8"
                            }`}
                          >
                            <div className="flex justify-between text-xs text-green-950 mb-2">
                              <span className="font-black">{m.senderName}</span>
                              <span className="font-bold">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-gray-900 font-bold">{m.message}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-green-950 text-center py-4 font-bold">No messages yet</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the client..."
                        className="flex-1 bg-white rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-green-600"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage}
                        className="px-6 py-3 bg-green-700 text-white rounded-xl font-black hover:bg-green-800 disabled:opacity-50 shadow-md"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-800 font-black">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
