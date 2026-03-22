"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";

export default function ClientBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [problemReport, setProblemReport] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showProblemDetail, setShowProblemDetail] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    loadBookings();
  }, [isAuthenticated]);

  // When filter changes, auto-select first or clear
  useEffect(() => {
    const filtered = getFiltered(bookings, filter);
    setSelectedBooking(filtered.length > 0 ? filtered[0] : null);
  }, [filter]);

  const getFiltered = (list: Booking[], f: string) => list.filter(b => {
    if (f === "ALL") return true;
    if (f === "ACTIVE") return [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus);
    if (f === "APPROVED") return b.bookingStatus === BOOKING_STATUS.APPROVED;
    if (f === "COMPLETED") return [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus);
    return b.bookingStatus === f;
  });

  const filteredBookings = getFiltered(bookings, filter);

  const loadBookings = async () => {
    if (!token || !userId) return;
    try {
      setLoading(true); setError(null);
      const data = await BookingService.getMyBookings(token, userId);
      setBookings(data);
      if (data.length > 0) setSelectedBooking(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally { setLoading(false); }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) { alert("Please select an image or PDF"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10MB"); return; }
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else { setReceiptPreview(null); }
  };

  const handleUploadReceipt = async () => {
    if (!token || !userId || !selectedBooking || !receiptFile) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.uploadReceiptFile(token, selectedBooking.bookingId, receiptFile, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
      setReceiptFile(null); setReceiptPreview(null); setShowReceiptModal(false);
      alert("Receipt uploaded! The hotel owner will review it.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to upload"); }
    finally { setActionLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage.trim()) return;
    try {
      const updated = await BookingService.sendMessage(token, selectedBooking.bookingId, newMessage, userId);
      updateBookingInList(updated); setSelectedBooking(updated); setNewMessage("");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to send"); }
  };

  const handleReportProblem = async () => {
    if (!token || !userId || !selectedBooking || !problemReport.trim()) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.reportProblem(token, selectedBooking.bookingId, problemReport, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
      setProblemReport(""); setShowProblemModal(false);
      alert("Problem reported. Admin will contact you soon.");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to report"); }
    finally { setActionLoading(false); }
  };

  const updateBookingInList = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
  };

  const activeCount = bookings.filter(b => [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus)).length;
  const approvedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length;
  const needsPayment = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.COST_PROPOSED).length;

  const filterCounts: Record<string, number> = {
    ALL: bookings.length,
    ACTIVE: activeCount,
    APPROVED: approvedCount,
    COMPLETED: bookings.filter(b => [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus)).length,
  };

  if (!mounted) return null;
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 z-50 shadow-2xl bg-white flex flex-col">
            <div className="px-4 py-5" style={{ backgroundColor: "#1d4ed8" }}>
              <button onClick={() => router.push("/tourisms")} className="flex items-center gap-2 text-blue-200 hover:text-white text-xs font-bold mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Tourism
              </button>
              <p className="text-white font-bold text-sm">My Bookings</p>
              <p className="text-blue-200 text-xs">Client</p>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              <button onClick={() => { router.push("/tourisms"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Browse Hotels
              </button>
              <button onClick={() => { loadBookings(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
              <div className="border-t border-gray-100 pt-2 mt-1">
                <p className="text-xs text-gray-400 px-3 pb-1 font-semibold">Filter</p>
                {["ALL", "ACTIVE", "APPROVED", "COMPLETED"].map((f) => (
                  <button key={f} onClick={() => { setFilter(f); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={filter === f ? { backgroundColor: "#eff6ff", color: "#1d4ed8" } : { color: "#374151" }}>
                    <span>{f}</span>
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{filterCounts[f]}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-2 left-2 z-30 h-14 w-14 flex items-center justify-center text-white shadow-lg hover:opacity-90"
        style={{ backgroundColor: "#1d4ed8", borderRadius: "8px" }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-h-screen ml-16">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-3">
            <h1 className="text-base font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-400 text-xs">Track and manage your hotel reservations</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-2 rounded mb-3 text-xs">{error}</div>}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Total", value: bookings.length },
              { label: "In Progress", value: activeCount },
              { label: "Needs Payment", value: needsPayment },
              { label: "Approved", value: approvedCount },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                <div className="text-base font-bold text-gray-900">{s.value}</div>
                <div className="text-gray-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-1">No Bookings Yet</p>
              <p className="text-gray-400 text-xs mb-4">Start exploring hotels and make your first reservation!</p>
              <button onClick={() => router.push("/tourisms")} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-900">Browse Hotels</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* List */}
              <div className="lg:col-span-1 space-y-2 max-h-screen overflow-y-auto pr-1">
                <p className="text-xs text-gray-500 font-semibold">Bookings ({filteredBookings.length})</p>
                {filteredBookings.length === 0 ? (
                  <div className="bg-white rounded-lg p-4 text-center text-gray-400 border border-gray-200 text-xs">No bookings found</div>
                ) : filteredBookings.map(b => (
                  <div key={b.bookingId} onClick={() => { setSelectedBooking(b); setShowProblemDetail(false); }}
                    className={"bg-white rounded-lg p-3 cursor-pointer transition hover:shadow-sm border " + (selectedBooking?.bookingId === b.bookingId ? "ring-2 ring-blue-400 border-blue-200" : "border-gray-200")}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs text-gray-900">Booking {b.bookingId}</span>
                      <span className={"px-1.5 py-0.5 rounded text-xs font-medium " + BookingService.getStatusColor(b.bookingStatus)}>{BookingService.getStatusLabel(b.bookingStatus)}</span>
                    </div>
                    <div className="text-xs text-gray-700 font-medium">{b.hotel.name}</div>
                    <div className="text-xs text-gray-400">{b.checkIn} to {b.checkOut} · {b.numberOfGuests} guests</div>
                    {b.totalCost && <div className="text-xs text-green-600 font-semibold mt-0.5">{b.totalCost} ETB</div>}
                    {b.problemReported && <div className="text-xs text-red-500 font-bold mt-0.5">Problem Reported</div>}
                  </div>
                ))}
              </div>

              {/* Detail */}
              <div className="lg:col-span-2">
                {selectedBooking ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h2 className="text-sm font-extrabold text-gray-900">Booking {selectedBooking.bookingId}</h2>
                        <p className="text-xs text-gray-400">{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={"px-2 py-0.5 rounded text-xs font-medium " + BookingService.getStatusColor(selectedBooking.bookingStatus)}>{BookingService.getStatusLabel(selectedBooking.bookingStatus)}</span>
                    </div>

                    {/* Progress */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-700 mb-2">Booking Progress</p>
                      <div className="flex items-start justify-between">
                        {[
                          { status: "REQUESTED", label: "Requested" },
                          { status: "OWNER_ACCEPTED", label: "Accepted" },
                          { status: "COST_PROPOSED", label: "Cost Sent" },
                          { status: "PAID", label: "Paid" },
                          { status: "APPROVED", label: "Approved" },
                        ].map((step, i) => {
                          const order = ["REQUESTED","OWNER_ACCEPTED","COST_PROPOSED","PAID","APPROVED"];
                          const done = order.indexOf(step.status) <= order.indexOf(selectedBooking.bookingStatus);
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1">
                              <div className={"w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold " + (done ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400")}>{i + 1}</div>
                              <span className={"text-xs mt-1 text-center leading-tight " + (done ? "text-gray-700 font-semibold" : "text-gray-400")}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-xs border border-red-100">
                          Rejected: {selectedBooking.rejectionReason || "Not specified"}
                        </div>
                      )}
                    </div>

                    {/* Hotel Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-700 mb-2">Hotel Information</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="bg-gray-50 p-2 rounded border border-gray-100"><span className="text-gray-400">Hotel: </span><span className="font-medium">{selectedBooking.hotel.name}</span></div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100"><span className="text-gray-400">Contact: </span><span className="font-medium">{selectedBooking.hotel.contactInfo || "N/A"}</span></div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100"><span className="text-gray-400">Owner: </span><span className="font-medium">{selectedBooking.hotel.ownerName || "N/A"}</span></div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100"><span className="text-gray-400">Status: </span><span className={"font-medium " + (selectedBooking.hotel.active ? "text-green-600" : "text-red-500")}>{selectedBooking.hotel.active ? "Active" : "Inactive"}</span></div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-700 mb-2">Booking Details</p>
                      <div className="grid grid-cols-4 gap-1.5 text-xs">
                        {[
                          { label: "Check-in", value: selectedBooking.checkIn },
                          { label: "Check-out", value: selectedBooking.checkOut },
                          { label: "Guests", value: selectedBooking.numberOfGuests },
                          { label: "Rooms", value: selectedBooking.numberOfRooms || 1 },
                        ].map(d => (
                          <div key={d.label} className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                            <div className="text-gray-400 text-xs">{d.label}</div>
                            <div className="font-bold text-gray-900 text-sm mt-0.5">{d.value}</div>
                          </div>
                        ))}
                      </div>
                      {selectedBooking.specialRequests && (
                        <div className="mt-1.5 p-2 bg-gray-50 rounded border border-gray-100 text-xs">
                          <span className="text-gray-400">Special Requests: </span><span className="text-gray-700">{selectedBooking.specialRequests}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment */}
                    {selectedBooking.totalCost && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-extrabold text-gray-700 mb-2">Payment</p>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-400">Total Cost</span>
                          <span className="text-base font-bold text-gray-900">{selectedBooking.totalCost} ETB</span>
                        </div>
                        {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100 text-xs text-amber-700 flex items-center justify-between">
                            <span>Upload your payment receipt to proceed.</span>
                            <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium hover:bg-gray-900 ml-2">Upload</button>
                          </div>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 text-xs text-blue-600">Receipt uploaded. Waiting for owner to verify.</div>
                        )}
                      </div>
                    )}

                    {/* Receipt Image */}
                    {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-extrabold text-gray-700 mb-2">Payment Receipt</p>
                        <img src={selectedBooking.receiptImageUrl} alt="Receipt" className="max-w-xs rounded border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}

                    {/* Approved banner */}
                    {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                      <div className="px-4 py-3 border-b border-green-100 bg-green-50 text-center">
                        <p className="text-xs font-bold text-green-700">Booking Approved</p>
                        <p className="text-xs text-green-600">{selectedBooking.checkIn} to {selectedBooking.checkOut} · Contact: {selectedBooking.hotel.contactInfo}</p>
                      </div>
                    )}

                    {/* Problem Report */}
                    {selectedBooking.problemReported && selectedBooking.problemReport && (
                      <div className="px-4 py-3 border-b border-red-100 bg-red-50">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-red-600">Problem Reported</p>
                          <button
                            onClick={() => setShowProblemDetail(v => !v)}
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold hover:bg-red-700"
                          >
                            {showProblemDetail ? 'Hide' : 'View'}
                          </button>
                        </div>
                        {showProblemDetail && (
                          <div className="mt-2 p-2 bg-white rounded border border-red-200 text-xs text-red-700">
                            {selectedBooking.problemReport}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-extrabold text-gray-700 mb-2">Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                          <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-900">Upload Receipt</button>
                        )}
                        {!selectedBooking.problemReported && selectedBooking.bookingStatus !== BOOKING_STATUS.REJECTED && (
                          <button onClick={() => setShowProblemModal(true)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600">Report Problem</button>
                        )}
                        <button onClick={() => router.push("/hotels/" + selectedBooking.hotel.id)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 border border-gray-200">View Hotel</button>
                      </div>
                    </div>

                    {/* Messages — chat style */}
                    <div className="border-t-2 mt-1" style={{ borderColor: "#7c3aed" }}>
                      <div className="px-4 pt-3 pb-2 bg-gray-50 border-b" style={{ borderColor: "#7c3aed" }}>
                        <p className="text-sm font-extrabold" style={{ color: "#7c3aed" }}>Messages <span className="font-normal text-xs text-gray-400">({selectedBooking.messages?.length || 0})</span></p>
                      </div>
                      <div className="flex flex-col border-l border-r border-b rounded-b-xl" style={{ height: "280px", borderColor: "#7c3aed" }}>
                        <div className="flex-1 overflow-y-auto py-3 space-y-2 bg-white">
                          {!selectedBooking.messages?.length ? (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-xs text-gray-400">No messages yet</p>
                            </div>
                          ) : (
                            selectedBooking.messages.map((m) => {
                              const isOwn = m.senderId === userId;
                              return (
                                <div key={m.id} className="flex justify-center">
                                  <div className={"w-64 text-xs border rounded-xl px-3 py-2 " + (isOwn ? "ml-16 bg-slate-100 text-gray-800 border-slate-200" : "mr-16 bg-white text-gray-800 border-gray-200 shadow-sm")}>
                                    <div className={"font-bold mb-0.5 " + (isOwn ? "text-slate-500" : "text-gray-500")}>{m.senderName}</div>
                                    <div>{m.message}</div>
                                    {m.messageType !== "GENERAL" && (
                                      <div className="text-xs mt-0.5 text-gray-400">[{m.messageType}]</div>
                                    )}
                                    <div className="text-right mt-1 text-gray-400" style={{ fontSize: "10px" }}>
                                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white rounded-full px-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} />
                          <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                            className="text-white px-4 py-2 rounded-full text-xs font-bold disabled:opacity-40"
                            style={{ backgroundColor: "#1d4ed8" }}>
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
                    <p className="text-gray-400 text-xs">Select a booking to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-4 rounded-t-xl" style={{ backgroundColor: "#1d4ed8" }}>
              <h3 className="text-sm font-bold text-white">Upload Payment Receipt</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-500 mb-3 text-xs">Select your payment receipt image or PDF.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:bg-gray-50 cursor-pointer">
                <input type="file" accept="image/*,.pdf" onChange={handleReceiptFileChange} className="hidden" id="receipt-file-input" />
                <label htmlFor="receipt-file-input" className="cursor-pointer block">
                  {receiptFile ? (
                    <div>
                      <p className="text-gray-800 font-medium text-sm">{receiptFile.name}</p>
                      <p className="text-gray-400 text-xs">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 font-medium text-sm">Click to select file</p>
                      <p className="text-gray-400 text-xs">JPG, PNG, GIF, WebP or PDF (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
              {receiptPreview && <img src={receiptPreview} alt="Preview" className="max-h-36 rounded-lg mx-auto mt-3 border border-gray-200" />}
            </div>
            <div className="flex gap-2 justify-end p-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <button onClick={() => { setShowReceiptModal(false); setReceiptFile(null); setReceiptPreview(null); }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded text-xs border border-gray-300">Cancel</button>
              <button onClick={handleUploadReceipt} disabled={!receiptFile || actionLoading}
                className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50">
                {actionLoading ? "Uploading..." : "Upload Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showProblemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-4 bg-red-600 rounded-t-xl">
              <h3 className="text-sm font-bold text-white">Report a Problem</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-500 mb-3 text-xs">Describe the issue. Admin will be notified.</p>
              <textarea value={problemReport} onChange={(e) => setProblemReport(e.target.value)}
                className="w-full bg-gray-50 rounded px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-300"
                rows={4} placeholder="Describe your problem..." />
            </div>
            <div className="flex gap-2 justify-end p-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <button onClick={() => setShowProblemModal(false)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded text-xs border border-gray-300">Cancel</button>
              <button onClick={handleReportProblem} disabled={!problemReport.trim() || actionLoading}
                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? "Reporting..." : "Report Problem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
