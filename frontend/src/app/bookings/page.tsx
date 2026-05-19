"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { useToast } from "@/components/common/Toast";
import { useConfirm } from "@/components/common/ConfirmDialog";
import AvatarDropdown from "@/components/common/AvatarDropdown";
import { useBookingSSE } from "@/hooks/useBookingSSE";

export default function ClientBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId, isHydrated } = useAuthStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailOnly, setShowDetailOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [zoomedReceipt, setZoomedReceipt] = useState<string | null>(null);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemReport, setProblemReport] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    loadBookings(true);
    // Keep polling as fallback (reduced to 60s since SSE handles real-time)
    const interval = setInterval(() => loadBookings(false), 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isHydrated]);

  // SSE: real-time booking updates
  useBookingSSE(isAuthenticated ? token : null, (event, data) => {
    const booking = (data as { booking?: Booking }).booking;
    if (!booking) return;

    if (event === 'booking_update') {
      setBookings(prev => {
        const exists = prev.some(b => b.bookingId === booking.bookingId);
        if (!exists) return prev;
        return prev.map(b => b.bookingId === booking.bookingId ? booking : b);
      });
      setSelectedBooking(prev =>
        prev?.bookingId === booking.bookingId ? booking : prev
      );
      const message = (data as { message?: string }).message || 'Booking updated';
      toast.info(`🔔 ${message}`);
    }

    if (event === 'booking_message') {
      // Update the booking messages in real-time
      setBookings(prev => prev.map(b => b.bookingId === booking.bookingId ? booking : b));
      setSelectedBooking(prev =>
        prev?.bookingId === booking.bookingId ? booking : prev
      );
      const senderName = (data as { senderName?: string }).senderName || 'Owner';
      const msg = (data as { message?: string }).message || '';
      toast.info(`💬 New message from ${senderName}: "${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}"`);
    }
  });

  const filterCounts: Record<string, number> = {
    ALL: bookings.length,
    REQUESTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length,
    OWNER_ACCEPTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED).length,
    COST_PROPOSED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.COST_PROPOSED).length,
    PAID: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length,
    APPROVED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length,
    REJECTED: bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REJECTED).length,
  };

  const applyFilter = (f: string, data: Booking[]) =>
    data.filter(b => f === "ALL" ? true : b.bookingStatus === f);

  const filteredBookings = applyFilter(filter, bookings);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setSelectedBooking(applyFilter(f, bookings)[0] ?? null);
  };

  const loadBookings = async (showLoading = false) => {
    if (!token || !userId) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await BookingService.getMyBookings(token, userId);
      setBookings(data);
      setSelectedBooking(prev => {
        if (prev) return data.find(b => b.bookingId === prev.bookingId) ?? data[0] ?? null;
        return data[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally { if (showLoading) setLoading(false); }
  };

  const updateBookingInList = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? updated : b));
  };

  const handleSendMessage = async () => {
    if (!token || !userId || !selectedBooking || !newMessage.trim()) return;
    try {
      const updated = await BookingService.sendMessage(token, selectedBooking.bookingId, newMessage, userId);
      updateBookingInList(updated); setSelectedBooking(updated); setNewMessage("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to send"); }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) { toast.warning("Please select an image or PDF file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.warning("File must be under 10MB"); return; }
    setReceiptFile(file);
  };

  const handleUploadReceipt = async () => {
    if (!token || !userId || !selectedBooking || !receiptFile) return;
    const optimisticBooking = { ...selectedBooking, bookingStatus: 'PAID' as any };
    updateBookingInList(optimisticBooking);
    setSelectedBooking(optimisticBooking);
    setReceiptFile(null); setShowReceiptModal(false);
    try {
      setActionLoading(true);
      const updated = await BookingService.uploadReceiptFile(token, selectedBooking.bookingId, receiptFile, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload";
      await loadBookings(false);
      if (msg !== 'TIMEOUT_RELOAD') toast.error(msg);
    } finally { setActionLoading(false); }
  };

  const handleReportProblem = async () => {
    if (!token || !userId || !selectedBooking || !problemReport.trim()) return;
    try {
      setActionLoading(true);
      const updated = await BookingService.reportProblem(token, selectedBooking.bookingId, problemReport, userId);
      updateBookingInList(updated); setSelectedBooking(updated);
      setProblemReport(""); setShowProblemModal(false);
      toast.success("Problem reported. Admin will contact you soon.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to report"); }
    finally { setActionLoading(false); }
  };

  const handleHideBooking = async (bookingId: number) => {
    if (!token || !userId) return;
    
    // Show custom confirmation dialog
    const confirmed = await confirm({
      title: "Delete Booking",
      message: "If you delete this booking, you will not be able to view it again in your bookings list. The booking will still be visible to the hotel owner and admin for record-keeping purposes. Are you sure you want to remove this booking from your list?",
      variant: "warning",
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel"
    });
    
    if (!confirmed) return;
    
    try {
      await BookingService.hideBooking(token, bookingId, userId);
      setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
      if (selectedBooking?.bookingId === bookingId) {
        setSelectedBooking(bookings.filter(b => b.bookingId !== bookingId)[0] ?? null);
        setShowDetailOnly(false);
      }
      toast.success("Booking removed from your list");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to remove"); }
  };

  const getReceiptUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      try {
        const parsed = new URL(url);
        if (parsed.pathname.startsWith('/uploads/')) {
          return `/api/image-proxy?path=${encodeURIComponent(parsed.pathname)}`;
        }
      } catch { /* not a valid URL */ }
      return url;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    if (path.startsWith('/uploads/')) {
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://tourismsystem.onrender.com';
    return `${backendUrl}/${url.replace(/^\//, '')}`;
  };

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
    } catch {
      window.open(getReceiptUrl(selectedBooking.receiptImageUrl), '_blank');
    }
  };

  if (!mounted) return null;
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;

  return (
    <div className="min-h-screen bg-white">

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 z-50 shadow-2xl bg-white flex flex-col">
            <div className="px-4 py-4 bg-white border-b border-gray-200">
              <button onClick={() => { router.back(); setSidebarOpen(false); }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-xs font-bold mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go Back
              </button>
              <p className="text-gray-900 font-bold text-sm">My Bookings</p>
              <p className="text-gray-500 text-xs">Track your reservations</p>
            </div>
            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
              <button onClick={() => { loadBookings(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <div className="border-t border-gray-100 pt-2 mt-1">
                <p className="text-xs text-gray-400 px-3 pb-1 font-semibold">Filter Bookings</p>
                {[
                  { key: "ALL", label: "All Bookings", color: "#6d28d9" },
                  { key: "REQUESTED", label: "Requested", color: "#d97706" },
                  { key: "OWNER_ACCEPTED", label: "Accepted", color: "#0891b2" },
                  { key: "COST_PROPOSED", label: "Cost Proposed", color: "#7c3aed" },
                  { key: "PAID", label: "Paid", color: "#059669" },
                  { key: "APPROVED", label: "Approved", color: "#16a34a" },
                  { key: "REJECTED", label: "Rejected", color: "#dc2626" },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => { handleFilterChange(key); setSidebarOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={filter === key
                      ? { color, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }
                      : { color: "#374151" }}>
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
          </div>
        </div>
      )}

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm overflow-visible">
        <div className="flex items-center h-12 px-2 overflow-visible">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 flex-shrink-0 flex items-center justify-center text-gray-700 rounded-lg hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button onClick={() => router.back()} className="h-8 w-8 flex-shrink-0 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="ml-2 text-gray-900 font-bold text-sm flex-shrink-0 hidden sm:block">My Bookings</span>
          {/* Spacer */}
          <div className="flex-1 min-w-0" />
          {/* Filter buttons — scrollable on mobile, scrollbar fully hidden */}
          <div
            className="flex items-center gap-0 shrink-0 max-w-[calc(100vw-165px)] sm:max-w-none"
            style={{ overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { key: 'ALL', label: 'All' },
              { key: 'REQUESTED', label: 'Requested' },
              { key: 'OWNER_ACCEPTED', label: 'Accepted' },
              { key: 'COST_PROPOSED', label: 'Cost Proposed' },
              { key: 'PAID', label: 'Paid' },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'REJECTED', label: 'Rejected' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => handleFilterChange(s.key)}
                className={`flex-shrink-0 px-2 text-sm font-black transition-all whitespace-nowrap ${
                  filter === s.key ? 'text-purple-700' : 'text-gray-700 hover:text-black'
                }`}
              >
                {s.label} <span className="font-bold">{filterCounts[s.key]}</span>
              </button>
            ))}
          </div>
          {/* Avatar — top right */}
          <div className="flex-shrink-0 ml-1">
            <AvatarDropdown />
          </div>
        </div>
      </div>

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-1">

          {error && <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded mb-2 text-xs font-bold">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bookings list */}
              <div className={`lg:col-span-1 space-y-1.5 max-h-[calc(100vh-160px)] overflow-y-auto pr-1 ${showDetailOnly ? 'hidden lg:block' : ''}`}>
                <p className="text-xs text-gray-500 font-semibold">Bookings ({filteredBookings.length})</p>
                {filteredBookings.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">No bookings found</div>
                ) : filteredBookings.map(b => (
                  <div key={b.bookingId} className={"bg-white rounded-lg p-2.5 border transition hover:shadow-sm " + (selectedBooking?.bookingId === b.bookingId ? "border-blue-300" : "border-gray-200")}>
                    <div onClick={() => { setSelectedBooking(b); setShowDetailOnly(true); }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-0.5">
                        <div>
                          <span className="font-bold text-gray-900 text-xs">Booking {b.bookingId}</span>
                          <span className="text-gray-400 ml-1 text-xs">{b.hotel.name}</span>
                        </div>
                        <span className={"text-xs " + BookingService.getStatusColor(b.bookingStatus)}>
                          {BookingService.getStatusLabel(b.bookingStatus)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{b.checkIn} → {b.checkOut} · {b.numberOfGuests} guests</div>
                    </div>
                    {/* Action buttons */}
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => { setSelectedBooking(b); setShowDetailOnly(true); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-all"
                      >
                        See Detail
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleHideBooking(b.bookingId); }}
                        className="text-xs text-red-500 hover:text-red-600 font-semibold transition-all"
                        title="Remove from my list (booking stays in admin records)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking detail */}
              <div className={`lg:col-span-2 ${!showDetailOnly ? 'hidden lg:block' : ''}`}>
                {selectedBooking ? (
                  <div className="bg-white">
                    {/* Back Button - Mobile only */}
                    {showDetailOnly && (
                      <div className="lg:hidden pb-2">
                        <button onClick={() => setShowDetailOnly(false)}
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back to List
                        </button>
                      </div>
                    )}

                    {/* Header */}
                    <div className="pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900">Booking {selectedBooking.bookingId}</h2>
                        <span className="text-gray-400 text-sm">·</span>
                        <p className="text-gray-500 text-sm font-semibold">{selectedBooking.hotel.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={"text-xs " + BookingService.getStatusColor(selectedBooking.bookingStatus)}>
                          {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                        </span>
                        <button
                          onClick={() => handleHideBooking(selectedBooking.bookingId)}
                          className="text-gray-300 hover:text-red-400 transition-all text-xs"
                          title="Remove from list"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Booking Info — two column grid, no borders */}
                    <div className="pb-3">
                      <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '6px' }}>Booking Details</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Hotel: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.hotel.name}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Check-in: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.checkIn}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Phone: </span><span style={{ fontWeight: 700, color: '#374151' }}>{(selectedBooking as any).clientPhone || "N/A"}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Check-out: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.checkOut}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Email: </span><span style={{ fontWeight: 700, color: '#374151' }}>{(selectedBooking as any).clientEmail || "N/A"}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Guests: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.numberOfGuests}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Rooms: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.numberOfRooms || 1}</span></div>
                        {selectedBooking.totalCost && (
                          <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Proposed Cost: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.totalCost} ETB</span></div>
                        )}
                        {selectedBooking.specialRequests && (
                          <div style={{ fontSize: '13px' }} className="col-span-2"><span style={{ color: '#6b7280', fontWeight: 700 }}>Requests: </span><span style={{ fontWeight: 700, color: '#374151' }}>{selectedBooking.specialRequests}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {selectedBooking.bookingStatus === BOOKING_STATUS.REJECTED && selectedBooking.rejectionReason && (
                      <div className="py-2 mb-2">
                        <p style={{ fontWeight: 900, fontSize: '13px', color: '#b91c1c', marginBottom: '2px' }}>Rejection Reason</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: '#991b1b' }}>{selectedBooking.rejectionReason}</p>
                      </div>
                    )}

                    {/* Receipt section */}
                    {selectedBooking.receiptImageUrl && (
                      <div className="pb-3">
                        <p style={{ fontWeight: 900, fontSize: '14px', color: '#111827', marginBottom: '6px' }}>Payment Receipt</p>
                        <img src={getReceiptUrl(selectedBooking.receiptImageUrl!)} alt="Receipt"
                          className="w-full rounded-lg object-contain max-h-48 bg-gray-50 border border-gray-100 cursor-pointer"
                          onClick={() => setZoomedReceipt(getReceiptUrl(selectedBooking.receiptImageUrl!))}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setZoomedReceipt(getReceiptUrl(selectedBooking.receiptImageUrl!))}
                            className="px-3 py-1.5 text-base font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                            View
                          </button>
                          <button onClick={handleDownloadReceipt}
                            className="px-3 py-1.5 text-base font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Client actions */}
                    <div className="pb-3 flex flex-wrap gap-3 items-center">
                      {selectedBooking.bookingStatus === BOOKING_STATUS.COST_PROPOSED && !receiptFile && (
                        <>
                          <input 
                            type="file" 
                            id="receipt-upload-input" 
                            className="hidden" 
                            accept="image/*,application/pdf" 
                            onChange={handleReceiptFileChange} 
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('receipt-upload-input')?.click()}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Upload Receipt</span>
                          </button>
                        </>
                      )}
                      {receiptFile && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{receiptFile.name}</span>
                          <button onClick={handleUploadReceipt} disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                            {actionLoading ? "Uploading..." : "Submit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceiptFile(null)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove file"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <button onClick={() => setShowProblemModal(true)}
                        className="text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-red-200">
                        Report Problem
                      </button>
                      <button onClick={() => router.push(`/hotels/${selectedBooking.hotel.id}`)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-blue-200">
                        View Hotel
                      </button>
                      {selectedBooking.bookingStatus === BOOKING_STATUS.APPROVED && (
                        <p style={{ fontWeight: 800, fontSize: '13px', color: '#15803d' }}>✓ Booking approved and active</p>
                      )}
                    </div>

                    {/* Messages — identical to owner page */}
                    <div className="rounded-2xl overflow-hidden">
                      {/* Chat Header */}
                      <div className="px-4 py-3 flex items-center gap-2 bg-white">
                        <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</span>
                        <h4 className="text-gray-800 font-semibold text-sm">Messages ({selectedBooking.messages?.length || 0})</h4>
                      </div>
                      {/* Chat Body */}
                      <div
                        className="px-4 py-4 space-y-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                        style={{ backgroundColor: '#dfe7dc' }}
                      >
                        {!selectedBooking.messages?.length ? (
                          <p className="text-center py-8 text-sm text-gray-500">No messages yet</p>
                        ) : selectedBooking.messages.map(m => {
                          const isOwn = m.senderId === userId;
                          return (
                            <div key={m.id} className="flex justify-start" style={{ paddingLeft: isOwn ? '16mm' : '2mm' }}>
                              <div className="max-w-[72%] px-3 py-2 shadow-sm rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-white">
                                {!isOwn && (
                                  <p className="text-xs font-semibold mb-0.5 text-purple-600">{m.senderName}</p>
                                )}
                                <p className="text-sm leading-relaxed text-gray-900 break-words">{m.message}</p>
                                <p className="text-xs mt-1 text-gray-400 text-right">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Input Bar */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          placeholder="Write a message..."
                          className="flex-1 rounded-full px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none border border-gray-100 bg-gray-50"
                          onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition-all flex-shrink-0"
                        >
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    Select a booking to view details
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt full-screen zoom overlay */}
      {zoomedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setZoomedReceipt(null)}>
          <button onClick={() => setZoomedReceipt(null)} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 font-black text-lg hover:bg-gray-200 transition-all z-10">✕</button>
          <div className="relative w-full mx-4" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomedReceipt} alt="Receipt" className="rounded-xl object-contain w-full h-auto" style={{ maxHeight: '90vh' }} />
            <div className="absolute bottom-4 right-4">
              <button onClick={handleDownloadReceipt}
                className="px-4 py-2 text-sm font-bold text-white bg-black bg-opacity-60 border border-white/30 rounded-lg hover:bg-opacity-80 transition-all">
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-80">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Report a Problem</h3>
            <p className="text-xs text-gray-500 mb-3">Booking {selectedBooking?.bookingId} — {selectedBooking?.hotel.name}</p>
            <textarea value={problemReport} onChange={e => setProblemReport(e.target.value)}
              placeholder="Describe the problem..." rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowProblemModal(false); setProblemReport(""); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleReportProblem} disabled={actionLoading || !problemReport.trim()}
                className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? "Reporting..." : "Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
