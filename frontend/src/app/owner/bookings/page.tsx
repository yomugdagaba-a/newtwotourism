"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { ModeSwitcherCompact } from "@/components/common/ModeSwitcher";
import { API_BASE_URL } from "@/services/api";

interface OwnerHotel {
  id: number;
  name: string;
  stars?: number;
  starRating?: number;
  contactInfo: string;
  active: boolean;
  images: string[];
}

function OwnerBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelFilter = searchParams.get("hotel") ? Number(searchParams.get("hotel")) : null;
  const { isAuthenticated, token, userId, role, browsingMode, setBrowsingMode } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myHotels, setMyHotels] = useState<OwnerHotel[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proposedCost, setProposedCost] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const getReceiptUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Relative path — prepend backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://tourismsystem.onrender.com';
    return `${backendUrl}/${url.replace(/^\//, '')}`;
  };

  const handleDownloadReceipt = async () => {
    if (!selectedBooking?.receiptImageUrl) return;
    try {
      const res = await fetch(selectedBooking.receiptImageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "receipt-" + selectedBooking.bookingId + "." + (selectedBooking.receiptImageUrl.split(".").pop() || "jpg");
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
    } catch { window.open(selectedBooking.receiptImageUrl, "_blank"); }
  };

  const loadBookings = useCallback(async (showLoading = false) => {
    if (!token || !userId) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await BookingService.getOwnerBookings(token, userId);
      setBookings(data);
      setSelectedBooking(prev => {
        if (prev) return data.find(b => b.bookingId === prev.bookingId) ?? prev;
        return data[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally { if (showLoading) setLoading(false); }
  }, [token, userId]);

  const loadHotels = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/hotels/owner/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMyHotels(await res.json());
    } catch { /* silent */ }
  }, [token, userId]);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (role !== "HOTEL_OWNER" && role !== "ADMIN") { router.push("/"); return; }
    if (role === "HOTEL_OWNER" && browsingMode !== "OWNER") setBrowsingMode("OWNER");
    loadBookings(true);
    loadHotels();
    const interval = setInterval(() => loadBookings(false), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, role, token, userId]);

  const updateBookingInList = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
  };

  const handleAccept = async (bookingId: number) => {
    if (!token || !userId) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.acceptBookingRequest(token, bookingId, userId);
      // Force reload to get fresh state from server
      await loadBookings(false);
      setSelectedBooking(updated);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to accept"); }
    finally { setActionLoading(false); }
  };

  const handleProposeCost = async () => {
    if (!token || !userId || !selectedBooking || !proposedCost) return;
    try {
      setActionLoading(true);
      const cost = parseFloat(proposedCost);
      if (isNaN(cost) || cost <= 0) { alert("Enter a valid cost"); return; }
      const updated = await BookingService.proposeCost(token, selectedBooking.bookingId, cost, userId);
      // Force reload to get fresh state
      await loadBookings(false);
      setSelectedBooking(updated);
      setProposedCost(""); setShowCostModal(false);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to propose cost"); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async (bookingId: number) => {
    if (!token || !userId) return;
    if (!confirm("Approve this booking?")) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.approveBooking(token, bookingId, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to approve"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!token || !userId || !selectedBooking || !rejectReason) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.rejectBooking(token, selectedBooking.bookingId, rejectReason, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
      setRejectReason(""); setShowRejectModal(false);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to reject"); }
    finally { setActionLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage.trim()) return;
    try {
      const updated = await BookingService.ownerSendMessage(token, selectedBooking.bookingId, newMessage, userId);
      updateBookingInList(updated); setSelectedBooking(updated); setNewMessage("");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to send"); }
  };

  const pendingCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length;
  const paidCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length;
  const approvedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length;
  const activeHotels = myHotels.filter(h => h.active).length;

  const filterCounts: Record<string, number> = {
    ALL: bookings.length,
    REQUESTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length,
    OWNER_ACCEPTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED).length,
    COST_PROPOSED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.COST_PROPOSED).length,
    PAID: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length,
    APPROVED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length,
    REJECTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REJECTED).length,
  };

  const applyFilter = (f: string, data: Booking[]) => data.filter(b => {
    if (f === "ALL") return true;
    return b.bookingStatus === f;
  });

  const filteredBookings = applyFilter(filter, bookings).filter(b =>
    hotelFilter ? b.hotel.id === hotelFilter : true
  );

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setSidebarOpen(false);
    setSelectedBooking(applyFilter(f, bookings)[0] ?? null);
  };

  if (!mounted) return null;
  if (!isAuthenticated || (role !== "HOTEL_OWNER" && role !== "ADMIN")) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl bg-white flex flex-col">
            <div className="px-4 py-4" style={{ backgroundColor: "#1d4ed8" }}>
              <button onClick={() => { router.push("/tourisms"); setSidebarOpen(false); }}
                className="flex items-center gap-2 text-blue-200 hover:text-white text-xs font-bold mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Tourism
              </button>
              <p className="text-white font-bold text-sm">Owner Panel</p>
              <p className="text-blue-200 text-xs">{role}</p>
            </div>
            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
              <button onClick={() => { loadBookings(true); loadHotels(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button onClick={() => { setBrowsingMode("CLIENT"); router.push("/tourisms"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Browse as Client
              </button>

              {myHotels.length > 0 && (
                <div className="border-t border-gray-100 pt-2 mt-1">
                  <p className="text-xs text-gray-400 px-3 pb-1 font-semibold">My Hotels ({myHotels.length})</p>
                  {myHotels.map(h => (
                    <button key={h.id} onClick={() => { router.push(`/owner/bookings?hotel=${h.id}`); setSidebarOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100">
                      <span className="truncate">{h.name}</span>
                      <span className={"ml-1 px-1.5 py-0.5 rounded text-xs font-bold " + (h.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                        {h.active ? "On" : "Off"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-2 mt-1">
                <p className="text-xs text-gray-400 px-3 pb-1 font-semibold">Filter Bookings</p>
                {[
                  { key: "ALL", label: "All Bookings", color: "#1d4ed8" },
                  { key: "REQUESTED", label: "Requested", color: "#d97706" },
                  { key: "OWNER_ACCEPTED", label: "Accepted", color: "#0891b2" },
                  { key: "COST_PROPOSED", label: "Cost Sent", color: "#7c3aed" },
                  { key: "PAID", label: "Paid", color: "#059669" },
                  { key: "APPROVED", label: "Approved", color: "#16a34a" },
                  { key: "REJECTED", label: "Rejected", color: "#dc2626" },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => handleFilterChange(key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={filter === key
                      ? { backgroundColor: `${color}18`, color, borderLeft: `3px solid ${color}` }
                      : { color: "#374151", borderLeft: "3px solid transparent" }}>
                    <span>{label}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, minWidth: '20px', textAlign: 'center',
                      background: filter === key ? color : '#e5e7eb',
                      color: filter === key ? '#fff' : '#374151',
                      borderRadius: '999px', padding: '1px 7px',
                    }}>{filterCounts[key]}</span>
                  </button>
                ))}
              </div>
            </nav>
            <div className="p-3 border-t border-gray-100">
              {role === "HOTEL_OWNER" && <ModeSwitcherCompact className="w-full justify-center" />}
            </div>
          </div>
        </div>
      )}

      {/* Hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-2 left-1 z-30 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-white shadow-lg hover:opacity-90"
        style={{ backgroundColor: "#1d4ed8", borderRadius: "8px" }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-h-screen">
        {/* Top bar */}
        <div style={{
          background: '#ffffff',
          borderBottom: '2px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '14px 24px',
          paddingLeft: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '18px', color: '#111827', margin: 0 }}>Booking Management</h1>
            <p style={{ fontWeight: 600, fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>Manage all booking requests</p>
          </div>
          {role === "HOTEL_OWNER" && <ModeSwitcherCompact />}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3">

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {[
              { label: "Hotels", value: myHotels.length },
              { label: "Active", value: activeHotels },
              { label: "Requested", value: pendingCount },
              { label: "Awaiting", value: paidCount },
              { label: "Approved", value: approvedCount },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                <div className="text-base font-bold text-gray-900">{s.value}</div>
                <div className="text-gray-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* My Hotels compact pills */}
          {myHotels.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              {hotelFilter && (
                <button onClick={() => router.push("/owner/bookings")}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 hover:shadow-sm transition-all">
                  All Hotels
                </button>
              )}
              {myHotels.map(h => (
                <button key={h.id} onClick={() => router.push(`/owner/bookings?hotel=${h.id}`)}
                  className={"flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm " + (hotelFilter === h.id ? "bg-blue-100 border-blue-400 text-blue-800" : "bg-white border-gray-200 text-gray-700")}>
                  <span className={"w-2 h-2 rounded-full " + (h.active ? "bg-green-500" : "bg-red-400")} />
                  <span>{h.name}</span>
                  <span className="text-gray-400">({bookings.filter(b => b.hotel.id === h.id).length})</span>
                </button>
              ))}
            </div>
          )}

          {error && <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded mb-2 text-xs font-bold">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bookings list */}
              <div className="lg:col-span-1 space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                <p className="text-xs text-gray-500 font-semibold">Bookings ({filteredBookings.length})</p>
                {filteredBookings.length === 0 ? (
                  <div className="bg-white rounded-lg p-4 text-center text-gray-400 border border-gray-200 text-xs">No bookings found</div>
                ) : filteredBookings.map(b => (
                  <div key={b.bookingId} onClick={() => setSelectedBooking(b)}
                    className={"bg-white rounded-lg p-2.5 cursor-pointer border transition hover:shadow-sm " + (selectedBooking?.bookingId === b.bookingId ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200")}>
                    <div className="flex justify-between items-start mb-0.5">
                      <div>
                        <span className="font-bold text-gray-900 text-xs">Booking {b.bookingId}</span>
                        <span className="text-gray-400 ml-1 text-xs">{b.hotel.name}</span>
                      </div>
                      <span className={"px-1.5 py-0.5 rounded text-xs font-bold " + BookingService.getStatusColor(b.bookingStatus)}>
                        {b.bookingStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{b.client.fullName} · {b.checkIn} → {b.checkOut}</div>
                  </div>
                ))}
              </div>

              {/* Booking detail */}
              <div className="lg:col-span-2">
                {selectedBooking ? (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-start">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Booking {selectedBooking.bookingId}</h2>
                        <p className="text-gray-500 text-sm font-semibold">{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={"px-3 py-1 rounded-full text-sm font-bold " + BookingService.getStatusColor(selectedBooking.bookingStatus)}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>

                    {/* Client + Stay */}
                    <div className="p-5 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <p style={{ fontWeight: 900, fontSize: '15px', color: '#111827', marginBottom: '10px' }}>Client</p>
                        <div className="space-y-1.5">
                          <div style={{ fontSize: '14px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Name: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.client.fullName}</span></div>
                          <div style={{ fontSize: '14px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Email: </span><span style={{ fontWeight: 700, color: '#374151' }}>{selectedBooking.client.email || "N/A"}</span></div>
                          <div style={{ fontSize: '14px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Phone: </span><span style={{ fontWeight: 700, color: '#374151' }}>{selectedBooking.client.phone || "N/A"}</span></div>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontWeight: 900, fontSize: '15px', color: '#111827', marginBottom: '10px' }}>Stay</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            ['Check-in', selectedBooking.checkIn],
                            ['Check-out', selectedBooking.checkOut],
                            ['Guests', selectedBooking.numberOfGuests],
                            ['Rooms', selectedBooking.numberOfRooms || 1],
                          ].map(([label, value]) => (
                            <div key={String(label)} style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '10px 12px' }}>
                              <div style={{ color: '#6b7280', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>{label}</div>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cost + Requests */}
                    {(selectedBooking.totalCost || selectedBooking.specialRequests) && (
                      <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap gap-3">
                        {selectedBooking.totalCost && (
                          <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '8px 16px' }}>
                            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '14px' }}>Cost: </span>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{selectedBooking.totalCost} ETB</span>
                          </div>
                        )}
                        {selectedBooking.specialRequests && (
                          <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '8px 16px', flex: 1 }}>
                            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '14px' }}>Requests: </span>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>{selectedBooking.specialRequests}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Receipt */}
                    {selectedBooking.receiptImageUrl && (
                      <div className="px-5 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>Payment Receipt</p>
                          <div className="flex gap-2">
                            <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-900">View</button>
                            <button onClick={handleDownloadReceipt} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-700">Download</button>
                          </div>
                        </div>
                        <img src={getReceiptUrl(selectedBooking.receiptImageUrl)} alt="Receipt"
                          className="max-h-24 rounded-lg border border-gray-200"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}

                    {/* Rejection reason */}
                    {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && selectedBooking.rejectionReason && (
                      <div className="px-5 py-3 border-b border-red-200 bg-red-50">
                        <p style={{ fontWeight: 900, fontSize: '14px', color: '#b91c1c', marginBottom: '4px' }}>Rejection Reason</p>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>{selectedBooking.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="px-5 py-4 border-b border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.bookingStatus === BOOKING_STATUS.REQUESTED && (
                          <>
                            <button onClick={() => handleAccept(selectedBooking.bookingId)} disabled={actionLoading}
                              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50">Accept</button>
                            <button onClick={() => setShowCostModal(true)} disabled={actionLoading}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 disabled:opacity-50">Propose Cost</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED && (
                          <>
                            <button onClick={() => setShowCostModal(true)} disabled={actionLoading}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 disabled:opacity-50">Propose Cost</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                          <>
                            <button onClick={() => handleApprove(selectedBooking.bookingId)} disabled={actionLoading}
                              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50">Approve</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                          <p style={{ fontWeight: 800, fontSize: '14px', color: '#15803d' }}>✓ Booking approved and active</p>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                          <p style={{ fontWeight: 800, fontSize: '14px', color: '#dc2626' }}>✗ This booking was rejected</p>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                      background: '#f3f0ff',
                      border: '2px solid #7c3aed',
                      borderRadius: '16px',
                      margin: '12px',
                      padding: '16px',
                    }}>
                      <h4 className="text-purple-700 font-bold text-sm mb-3 flex items-center gap-2"
                        style={{ borderBottom: '2px solid #ede9fe', paddingBottom: '10px' }}>
                        <span className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">M</span>
                        Messages ({selectedBooking.messages?.length || 0})
                      </h4>
                      {/* Scroll area — slate gray border, white background */}
                      <div className="space-y-2 max-h-52 overflow-y-auto mb-3 p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                        style={{ border: '2px solid #94a3b8', borderRadius: '10px', background: '#ffffff' }}>
                        {!selectedBooking.messages?.length ? (
                          <p className="text-gray-400 text-center py-5 text-sm">No messages yet</p>
                        ) : selectedBooking.messages.map(m => {
                          const isOwn = m.senderId === userId;
                          return (
                            <div
                              key={m.id}
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
                              <div className={`flex justify-between text-xs mb-1.5 ${isOwn ? 'text-purple-700' : 'text-gray-500'}`}>
                                <span className="font-bold">{m.senderName}</span>
                                <span className="font-semibold">{new Date(m.createdAt).toLocaleString()}</span>
                              </div>
                              <p className={`text-sm font-semibold ${isOwn ? 'text-purple-900' : 'text-gray-800'}`}>{m.message}</p>
                              {m.messageType !== "GENERAL" && <p className="text-xs mt-1 font-bold text-purple-400">[{m.messageType}]</p>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Input area — gray border, separated by top divider */}
                      <div className="flex gap-2 pt-3" style={{ borderTop: '1.5px solid #ddd6fe' }}>
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                          style={{ border: '1.5px solid #9ca3af', background: '#fff' }}
                          onKeyPress={e => e.key === "Enter" && handleSendMessage()} />
                        <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200 text-xs">
                    Select a booking to view details
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Propose Cost Modal */}
      {showCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-80 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Propose Cost</h3>
            <p className="text-xs text-gray-500 mb-3">Booking {selectedBooking?.bookingId} — {selectedBooking?.hotel.name}</p>
            <input type="number" value={proposedCost} onChange={e => setProposedCost(e.target.value)}
              placeholder="Enter cost in ETB"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowCostModal(false); setProposedCost(""); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleProposeCost} disabled={actionLoading || !proposedCost}
                className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-50">
                {actionLoading ? "Sending..." : "Propose"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-80 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Reject Booking</h3>
            <p className="text-xs text-gray-500 mb-3">Booking {selectedBooking?.bookingId} — {selectedBooking?.hotel.name}</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..." rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
                className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedBooking?.receiptImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-lg w-full mx-4 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-900">Payment Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">x</button>
            </div>
            <img src={getReceiptUrl(selectedBooking.receiptImageUrl)} alt="Receipt"
              className="w-full rounded-lg border border-gray-200 max-h-96 object-contain"
              onError={e => { (e.target as HTMLImageElement).alt = "Failed to load receipt"; }} />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={handleDownloadReceipt} className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-900">Download</button>
              <button onClick={() => setShowReceiptModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerBookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <OwnerBookingsContent />
    </Suspense>
  );
}

