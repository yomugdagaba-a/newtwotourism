"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function OwnerBookingsPage() {
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

  const getReceiptUrl = (url: string) => url;

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
      updateBookingInList(updated); setSelectedBooking(updated);
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
      updateBookingInList(updated); setSelectedBooking(updated);
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
    PENDING: pendingCount,
    ACTIVE: bookings.filter(b => [BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus)).length,
    COMPLETED: bookings.filter(b => [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus)).length,
  };

  const applyFilter = (f: string, data: Booking[]) => data.filter(b => {
    if (f === "ALL") return true;
    if (f === "PENDING") return b.bookingStatus === BOOKING_STATUS.REQUESTED;
    if (f === "ACTIVE") return [BOOKING_STATUS.OWNER_ACCEPTED, BOOKING_STATUS.COST_PROPOSED, BOOKING_STATUS.PAID].includes(b.bookingStatus);
    if (f === "COMPLETED") return [BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].includes(b.bookingStatus);
    return true;
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
                {["ALL", "PENDING", "ACTIVE", "COMPLETED"].map(f => (
                  <button key={f} onClick={() => handleFilterChange(f)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={filter === f ? { backgroundColor: "#eff6ff", color: "#1d4ed8" } : { color: "#374151" }}>
                    <span>{f}</span>
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{filterCounts[f]}</span>
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
        className="fixed top-2 left-2 z-30 h-14 w-14 flex items-center justify-center text-white shadow-lg hover:opacity-90"
        style={{ backgroundColor: "#1d4ed8", borderRadius: "8px" }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-h-screen ml-16">
        <div className="max-w-7xl mx-auto px-4 py-3">

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-base font-bold text-gray-900">Booking Management</h1>
              <p className="text-gray-400 text-xs">Manage all booking requests</p>
            </div>
            {role === "HOTEL_OWNER" && <ModeSwitcherCompact />}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
            {[
              { label: "Hotels", value: myHotels.length },
              { label: "Active", value: activeHotels },
              { label: "Pending", value: pendingCount },
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
                  <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-start">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Booking {selectedBooking.bookingId}</h2>
                        <p className="text-gray-400 text-xs">{selectedBooking.hotel.name}</p>
                      </div>
                      <span className={"px-2 py-0.5 rounded text-xs font-bold " + BookingService.getStatusColor(selectedBooking.bookingStatus)}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>

                    <div className="p-3 border-b border-gray-100 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-gray-700 mb-1">Client</p>
                        <div className="space-y-0.5 text-xs">
                          <div><span className="text-gray-400">Name: </span><span className="font-semibold">{selectedBooking.client.fullName}</span></div>
                          <div><span className="text-gray-400">Email: </span><span className="font-semibold">{selectedBooking.client.email || "N/A"}</span></div>
                          <div><span className="text-gray-400">Phone: </span><span className="font-semibold">{selectedBooking.client.phone || "N/A"}</span></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-700 mb-1">Stay</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                            <div className="text-gray-400">Check-in</div>
                            <div className="font-bold text-gray-900">{selectedBooking.checkIn}</div>
                          </div>
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                            <div className="text-gray-400">Check-out</div>
                            <div className="font-bold text-gray-900">{selectedBooking.checkOut}</div>
                          </div>
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                            <div className="text-gray-400">Guests</div>
                            <div className="font-bold text-gray-900">{selectedBooking.numberOfGuests}</div>
                          </div>
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                            <div className="text-gray-400">Rooms</div>
                            <div className="font-bold text-gray-900">{selectedBooking.numberOfRooms || 1}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(selectedBooking.totalCost || selectedBooking.specialRequests) && (
                      <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-2 text-xs">
                        {selectedBooking.totalCost && (
                          <div className="bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                            <span className="text-gray-400">Cost: </span>
                            <span className="font-bold text-gray-900">{selectedBooking.totalCost} ETB</span>
                          </div>
                        )}
                        {selectedBooking.specialRequests && (
                          <div className="bg-gray-50 px-3 py-1.5 rounded border border-gray-100 flex-1">
                            <span className="text-gray-400">Requests: </span>
                            <span className="text-gray-700">{selectedBooking.specialRequests}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedBooking.receiptImageUrl && (
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-gray-700">Payment Receipt</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => setShowReceiptModal(true)} className="bg-gray-800 text-white px-2 py-0.5 rounded text-xs font-bold hover:bg-gray-900">View</button>
                            <button onClick={handleDownloadReceipt} className="bg-gray-600 text-white px-2 py-0.5 rounded text-xs font-bold hover:bg-gray-700">Download</button>
                          </div>
                        </div>
                        <img src={getReceiptUrl(selectedBooking.receiptImageUrl)} alt="Receipt"
                          className="max-h-20 rounded border border-gray-200"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}

                    {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && selectedBooking.rejectionReason && (
                      <div className="px-3 py-2 border-b border-red-100 bg-red-50">
                        <p className="text-xs font-bold text-red-700 mb-0.5">Rejection Reason</p>
                        <p className="text-xs text-red-800">{selectedBooking.rejectionReason}</p>
                      </div>
                    )}

                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBooking.bookingStatus === BOOKING_STATUS.REQUESTED && (
                          <>
                            <button onClick={() => handleAccept(selectedBooking.bookingId)} disabled={actionLoading}
                              className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50">Accept</button>
                            <button onClick={() => setShowCostModal(true)} disabled={actionLoading}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-700 disabled:opacity-50">Propose Cost</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED && (
                          <>
                            <button onClick={() => setShowCostModal(true)} disabled={actionLoading}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-700 disabled:opacity-50">Propose Cost</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.PAID && (
                          <>
                            <button onClick={() => handleApprove(selectedBooking.bookingId)} disabled={actionLoading}
                              className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50">Approve</button>
                            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                          <p className="text-xs text-gray-500 font-semibold">Booking approved and active</p>
                        )}
                        {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && (
                          <p className="text-xs text-red-500 font-semibold">This booking was rejected</p>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.90) 100%)',
                      boxShadow: '0 0 0 2px #7c3aed, 0 8px 32px rgba(109,40,217,0.10), inset 0 1px 0 rgba(255,255,255,1)',
                      borderRadius: '16px',
                      margin: '12px',
                      padding: '16px',
                    }}>
                      <h4 className="text-purple-700 font-bold text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">M</span>
                        Messages ({selectedBooking.messages?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-52 overflow-y-auto mb-3 p-3 rounded-xl bg-white/60 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {!selectedBooking.messages?.length ? (
                          <p className="text-gray-400 text-center py-5 text-sm">No messages yet</p>
                        ) : selectedBooking.messages.map(m => {
                          const isOwn = m.senderId === userId;
                          return (
                            <div
                              key={m.id}
                              style={isOwn ? {
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
                              <div className={`flex justify-between text-xs mb-1.5 ${isOwn ? 'text-purple-600' : 'text-gray-400'}`}>
                                <span className="font-semibold">{m.senderName}</span>
                                <span>{new Date(m.createdAt).toLocaleString()}</span>
                              </div>
                              <p className={`text-sm font-medium ${isOwn ? 'text-purple-900' : 'text-gray-700'}`}>{m.message}</p>
                              {m.messageType !== "GENERAL" && <p className="text-xs mt-1 text-gray-400">[{m.messageType}]</p>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 border border-purple-200 transition-all"
                          onKeyPress={e => e.key === "Enter" && handleSendMessage()} />
                        <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm">
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
