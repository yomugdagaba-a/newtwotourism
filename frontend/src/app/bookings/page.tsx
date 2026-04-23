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
    if (f === "REJECTED") return b.bookingStatus === BOOKING_STATUS.REJECTED;
    // Individual status filters
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
    REJECTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REJECTED).length,
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
                <p className="text-xs text-gray-400 px-3 pb-1 font-semibold">Filter by Status</p>
                {[
                  { key: "ALL", label: "All Bookings" },
                  { key: "REQUESTED", label: "Requested" },
                  { key: "OWNER_ACCEPTED", label: "Accepted" },
                  { key: "COST_PROPOSED", label: "Cost Sent" },
                  { key: "PAID", label: "Paid" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "REJECTED", label: "Rejected" },
                ].map((f) => (
                  <button key={f.key} onClick={() => { setFilter(f.key); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={filter === f.key ? { backgroundColor: "#eff6ff", color: "#1d4ed8" } : { color: "#374151" }}>
                    <span>{f.label}</span>
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                      {f.key === "ALL" ? bookings.length
                        : f.key === "OWNER_ACCEPTED" ? bookings.filter(b => b.bookingStatus === "OWNER_ACCEPTED").length
                        : bookings.filter(b => b.bookingStatus === f.key).length}
                    </span>
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
        {/* White top bar */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 24px', marginBottom: '16px' }}>
          <h1 style={{ fontWeight: 900, fontSize: '18px', color: '#111827', margin: 0 }}>My Bookings</h1>
          <p style={{ fontWeight: 600, fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Track and manage your hotel reservations</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-4">

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-2 rounded mb-3 text-xs">{error}</div>}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { label: "Total", value: bookings.length },
              { label: "In Progress", value: activeCount },
              { label: "Needs Payment", value: needsPayment },
              { label: "Approved", value: approvedCount },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div style={{ fontWeight: 900, fontSize: '20px', color: '#111827' }}>{s.value}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#374151', marginTop: '2px' }}>{s.label}</div>
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
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h2 style={{ fontWeight: 900, fontSize: '16px', color: '#111827' }}>Booking {selectedBooking.bookingId}</h2>
                        <p style={{ fontWeight: 600, fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={"px-3 py-1 rounded-full text-sm font-bold " + BookingService.getStatusColor(selectedBooking.bookingStatus)}>{BookingService.getStatusLabel(selectedBooking.bookingStatus)}</span>
                    </div>

                    {/* Progress — dots only, no numbers */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '12px' }}>Booking Progress</p>
                      <div className="flex items-start justify-between">
                        {[
                          { status: "REQUESTED", label: "Requested" },
                          { status: "OWNER_ACCEPTED", label: "Accepted" },
                          { status: "COST_PROPOSED", label: "Cost Sent" },
                          { status: "PAID", label: "Paid" },
                          { status: "APPROVED", label: "Approved" },
                        ].map((step) => {
                          const order = ["REQUESTED","OWNER_ACCEPTED","COST_PROPOSED","PAID","APPROVED"];
                          const isRejected = selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED;
                          const currentIdx = order.indexOf(selectedBooking.bookingStatus);
                          const stepIdx = order.indexOf(step.status);
                          const done = stepIdx <= currentIdx && !isRejected;
                          const current = step.status === selectedBooking.bookingStatus;
                          // Show ✗ on the step where rejection happened
                          const rejected = isRejected && stepIdx === currentIdx;
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1">
                              <div style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: rejected ? '#fef2f2' : done ? '#f0fdf4' : '#f3f4f6',
                                border: rejected ? '2px solid #dc2626' : done ? '2px solid #16a34a' : '2px solid #d1d5db',
                                fontWeight: 900,
                                fontSize: '14px',
                                color: rejected ? '#dc2626' : done ? '#16a34a' : '#9ca3af',
                              }}>
                                {rejected ? '✗' : done ? '✓' : '○'}
                              </div>
                              <span style={{ fontSize: '12px', marginTop: '6px', textAlign: 'center', fontWeight: done || rejected ? 800 : 500, color: rejected ? '#dc2626' : done ? '#14532d' : '#9ca3af' }}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px' }}>
                          <p style={{ fontWeight: 700, fontSize: '13px', color: '#b91c1c' }}>Rejected: {selectedBooking.rejectionReason || "Not specified"}</p>
                        </div>
                      )}
                    </div>

                    {/* Hotel Info */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '10px' }}>Hotel Information</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['Hotel', selectedBooking.hotel.name],
                          ['Contact', selectedBooking.hotel.contactInfo || 'N/A'],
                          ['Owner', selectedBooking.hotel.ownerName || 'N/A'],
                          ['Status', selectedBooking.hotel.active ? 'Active' : 'Inactive'],
                        ].map(([label, value]) => (
                          <div key={String(label)} style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ color: '#374151', fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>{label}</div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: label === 'Status' ? (selectedBooking.hotel.active ? '#15803d' : '#dc2626') : '#111827' }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '10px' }}>Booking Details</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Check-in", value: selectedBooking.checkIn },
                          { label: "Check-out", value: selectedBooking.checkOut },
                          { label: "Guests", value: selectedBooking.numberOfGuests },
                          { label: "Rooms", value: selectedBooking.numberOfRooms || 1 },
                        ].map(d => (
                          <div key={d.label} style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ color: '#374151', fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>{d.label}</div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>{d.value}</div>
                          </div>
                        ))}
                      </div>
                      {selectedBooking.specialRequests && (
                        <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '13px' }}>Special Requests: </span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#374151' }}>{selectedBooking.specialRequests}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment */}
                    {selectedBooking.totalCost && (
                      <div className="px-5 py-4 border-b border-gray-200">
                        <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '10px' }}>Payment</p>
                        <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '13px' }}>Total Cost</span>
                          <span style={{ fontWeight: 900, fontSize: '18px', color: '#111827' }}>{selectedBooking.totalCost} ETB</span>
                        </div>
                        {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                          <div style={{ marginTop: '10px', padding: '12px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>Upload your payment receipt to proceed.</span>
                            <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-900 ml-3">Upload</button>
                          </div>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                          <div style={{ marginTop: '10px', padding: '12px', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '8px' }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#1d4ed8' }}>Receipt uploaded. Waiting for owner to verify.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Receipt Image */}
                    {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                      <div className="px-5 py-4 border-b border-gray-200">
                        <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '10px' }}>Payment Receipt</p>
                        <img src={selectedBooking.receiptImageUrl} alt="Receipt" className="max-w-xs rounded-lg border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}

                    {/* Approved banner */}
                    {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #bbf7d0', background: '#f0fdf4', textAlign: 'center' }}>
                        <p style={{ fontWeight: 800, fontSize: '14px', color: '#15803d' }}>✓ Booking Approved</p>
                        <p style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a', marginTop: '3px' }}>{selectedBooking.checkIn} to {selectedBooking.checkOut} · Contact: {selectedBooking.hotel.contactInfo}</p>
                      </div>
                    )}

                    {/* Problem Report */}
                    {selectedBooking.problemReported && selectedBooking.problemReport && (
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #fecaca', background: '#fef2f2' }}>
                        <div className="flex items-center justify-between">
                          <p style={{ fontWeight: 800, fontSize: '14px', color: '#dc2626' }}>Problem Reported</p>
                          <button onClick={() => setShowProblemDetail(v => !v)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700">
                            {showProblemDetail ? 'Hide' : 'View'}
                          </button>
                        </div>
                        {showProblemDetail && (
                          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fff', border: '1.5px solid #fca5a5', borderRadius: '8px' }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#b91c1c' }}>{selectedBooking.problemReport}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '10px' }}>Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && (
                          <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900">Upload Receipt</button>
                        )}
                        {!selectedBooking.problemReported && selectedBooking.bookingStatus !== BOOKING_STATUS.REJECTED && (
                          <button onClick={() => setShowProblemModal(true)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600">Report Problem</button>
                        )}
                        <button onClick={() => router.push("/hotels/" + selectedBooking.hotel.id)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 border border-gray-300">View Hotel</button>
                      </div>
                    </div>

                    {/* Messages — same style as owner page */}
                    <div style={{
                      background: '#f3f0ff',
                      border: '2px solid #7c3aed',
                      borderRadius: '16px',
                      margin: '12px',
                      padding: '16px',
                    }}>
                      <h4 className="text-purple-700 font-bold text-sm flex items-center gap-2"
                        style={{ borderBottom: '2px solid #ede9fe', paddingBottom: '10px', marginBottom: '12px' }}>
                        <span className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">M</span>
                        Messages ({selectedBooking.messages?.length || 0})
                      </h4>
                      {/* Scroll area */}
                      <div className="space-y-2 max-h-64 overflow-y-auto mb-3 p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                        style={{ border: '2px solid #94a3b8', borderRadius: '10px', background: '#ffffff' }}>
                        {!selectedBooking.messages?.length ? (
                          <p className="text-gray-400 text-center py-5 text-sm">No messages yet</p>
                        ) : selectedBooking.messages.map((m) => {
                          const isOwn = m.senderId === userId;
                          return (
                            <div key={m.id}
                              style={isOwn ? {
                                background: '#ffffff',
                                border: '1.5px solid #a78bfa',
                                borderRadius: '10px',
                                marginLeft: '2rem',
                                padding: '10px 12px',
                                boxShadow: '0 2px 8px rgba(124,58,237,0.15)',
                              } : {
                                background: '#ffffff',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '10px',
                                marginRight: '2rem',
                                padding: '10px 12px',
                              }}
                            >
                              <div className="flex justify-between text-xs mb-1.5" style={{ color: isOwn ? '#7c3aed' : '#6b7280' }}>
                                <span style={{ fontWeight: 700 }}>{m.senderName}</span>
                                <span style={{ fontWeight: 600 }}>{new Date(m.createdAt).toLocaleString()}</span>
                              </div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: isOwn ? '#4c1d95' : '#1f2937' }}>{m.message}</p>
                              {m.messageType !== "GENERAL" && (
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', marginTop: '4px' }}>[{m.messageType}]</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Input area */}
                      <div className="flex gap-2 pt-3" style={{ borderTop: '1.5px solid #ddd6fe' }}>
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                          style={{ border: '1.5px solid #9ca3af', background: '#fff' }}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} />
                        <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm">
                          Send
                        </button>
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
