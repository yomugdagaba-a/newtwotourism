"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { FormButton, Alert } from "@/components/common/FormInput";
import { API_BASE_URL } from "@/services/api";

export default function AdminBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId, role } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [problemBookings, setProblemBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailOnly, setShowDetailOnly] = useState(false); // NEW: Track if showing single booking
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'problems'>('all');
  const [filter, setFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolution, setResolution] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to get receipt URL
  const getReceiptUrl = (receiptImageUrl: string) => {
    if (!receiptImageUrl) return '';
    if (receiptImageUrl.startsWith('http')) {
      try {
        const parsed = new URL(receiptImageUrl);
        if (parsed.pathname.startsWith('/uploads/')) {
          return `/api/image-proxy?path=${encodeURIComponent(parsed.pathname)}`;
        }
      } catch { /* not a valid URL */ }
      return receiptImageUrl;
    }
    const path = receiptImageUrl.startsWith('/') ? receiptImageUrl : `/${receiptImageUrl}`;
    if (path.startsWith('/uploads/')) {
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://localhost:9001';
    return `${backendUrl}/${receiptImageUrl.replace(/^\//, '')}`;
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (role !== "ADMIN") {
      router.push("/");
      return;
    }
    loadBookings();
    loadProblemBookings();
  }, [isAuthenticated, role, page]);

  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await BookingService.getAllBookings(token, page, 50);
      setBookings(Array.isArray(data) ? data : (data as any).content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const loadProblemBookings = async () => {
    if (!token) return;
    try {
      const data = await BookingService.getProblemBookings(token);
      setProblemBookings(data);
    } catch (err) {
      console.error("Failed to load problem bookings:", err);
    }
  };

  const handleResolve = async () => {
    if (!token || !selectedBooking) return;
    try {
      setActionLoading(true);
      await BookingService.adminResolve(token, selectedBooking.bookingId, resolution);
      setSuccess("Problem resolved successfully!");
      setResolution("");
      await loadBookings();
      await loadProblemBookings();
      // Update selected booking
      const updated = bookings.find(b => b.bookingId === selectedBooking.bookingId);
      if (updated) setSelectedBooking({ ...updated, problemReported: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!token || !selectedBooking) return;
    try {
      setDeleteLoading(true);
      await BookingService.deleteBooking(token, selectedBooking.bookingId);
      setSuccess("Booking deleted successfully!");
      setShowDeleteModal(false);
      setSelectedBooking(null);
      setShowDetailOnly(false);
      await loadBookings();
      await loadProblemBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete booking");
    } finally {
      setDeleteLoading(false);
    }
  };

  const displayedBookings = activeTab === 'problems' ? problemBookings : bookings;
  const filteredBookings = displayedBookings.filter(b => {
    // Filter by status
    if (filter !== "ALL" && b.bookingStatus !== filter) return false;
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const hotelName = b.hotel?.name?.toLowerCase() || '';
      const clientName = b.client?.fullName?.toLowerCase() || '';
      const bookingId = String(b.bookingId).toLowerCase();
      return hotelName.includes(term) || clientName.includes(term) || bookingId.includes(term);
    }
    
    return true;
  });

  const getStatusStats = () => {
    const stats: Record<string, number> = { ALL: bookings.length };
    bookings.forEach(b => {
      stats[b.bookingStatus] = (stats[b.bookingStatus] || 0) + 1;
    });
    return stats;
  };

  const stats = getStatusStats();

  if (!isAuthenticated || role !== "ADMIN") {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 shadow-inner admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false}
        pageTitle="Booking Management" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => setSearchTerm(value)}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center gap-3 flex-1 justify-end">
            <select
              value={activeTab}
              onChange={(e) => { setActiveTab(e.target.value as 'all' | 'problems'); setSelectedBooking(null); }}
              style={{ fontSize: '13px', padding: '2px 4px', border: 'none' }}
              className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer"
            >
              <option value="all">All ({bookings.length}) Bookings</option>
              <option value="problems">⚠ Problems ({problemBookings.length})</option>
            </select>
            
            {activeTab === 'all' && (
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setSelectedBooking(null); }}
                style={{ fontSize: '13px', padding: '2px 0px', border: 'none', width: 'fit-content', maxWidth: '55px' }}
                className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="REQUESTED">Requested</option>
                <option value="OWNER_ACCEPTED">Accepted</option>
                <option value="COST_PROPOSED">Cost Proposed</option>
                <option value="PAID">Paid</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}
            
            <button onClick={() => { loadBookings(); loadProblemBookings(); }} className="text-gray-900 font-black text-sm hover:text-black transition-all">
              ↻
            </button>
          </div>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Alerts */}
        {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div>}

        {/* Inline Stats - No card background */}
        <div className="mb-6">
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <span className="text-gray-700 font-medium">
              <span className="font-bold">Total:</span> {stats.ALL || 0}
            </span>
            <span className="text-gray-700 font-medium">
              <span className="font-bold">Requested:</span> {stats.REQUESTED || 0}
            </span>
            <span className="text-gray-700 font-medium">
              <span className="font-bold">Accepted:</span> {stats.OWNER_ACCEPTED || 0}
            </span>
            <span className="text-gray-700 font-medium">
              <span className="font-bold">Paid:</span> {stats.PAID || 0}
            </span>
            <span className="text-gray-700 font-medium">
              <span className="font-bold">Approved:</span> {stats.APPROVED || 0}
            </span>
            <span className="text-red-600 font-medium">
              <span className="font-bold">Problems:</span> {problemBookings.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List - Hide on mobile when detail is shown */}
            <div className={`lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto ${showDetailOnly ? 'hidden lg:block' : ''}`}>
              <h2 className="font-black text-gray-800 sticky top-0 bg-white py-2 border-b border-gray-200">
                {activeTab === 'problems' ? 'Problem Reports' : 'Bookings'} ({filteredBookings.length})
              </h2>
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-800 font-bold shadow-lg border border-gray-200">
                  {activeTab === 'problems' ? 'No problem reports' : 'No bookings found'}
                </div>
              ) : (
                filteredBookings.map((b, index) => (
                  <div
                    key={b.bookingId || `booking-${index}`}
                    className={`bg-white rounded-xl px-4 py-3 transition border shadow-sm hover:shadow-md ${
                      selectedBooking?.bookingId === b.bookingId ? 'bg-blue-50 border-blue-200 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div onClick={() => { setSelectedBooking(b); setShowDetailOnly(true); }} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-black text-gray-900 text-sm">Booking {b.bookingId}</span>
                          {b.problemReported && <span className="ml-2 text-xs text-red-500 font-bold">Problem</span>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-sm ${BookingService.getStatusColor(b.bookingStatus)}`}>
                          {BookingService.getStatusLabel(b.bookingStatus)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 space-y-0.5">
                        <div className="font-black text-gray-900">{b.hotel?.name || 'N/A'}</div>
                        <div className="font-semibold">{b.client?.fullName || 'N/A'}</div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-500">{b.checkIn} — {b.checkOut}</span>
                          {b.totalCost && <span className="font-black text-gray-800">{b.totalCost} ETB</span>}
                        </div>
                      </div>
                    </div>
                    {/* See button */}
                    <div className="mt-2 flex justify-start">
                      <button
                        onClick={() => { setSelectedBooking(b); setShowDetailOnly(true); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-all"
                      >
                        See
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Booking Details - Show back button on mobile */}
            <div className={`lg:col-span-2 ${!showDetailOnly ? 'hidden lg:block' : ''}`}>
              {selectedBooking ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Back Button - Mobile only */}
                  {showDetailOnly && (
                    <div className="lg:hidden px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <button onClick={() => setShowDetailOnly(false)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                      </button>
                    </div>
                  )}

                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-black text-gray-900">Booking {selectedBooking.bookingId}</h2>
                      <p className="text-xs text-gray-500 font-medium">{selectedBooking.hotel?.name || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                      <button onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Hotel & Client Info - side by side, white bg */}
                  <div className="grid md:grid-cols-2 gap-0 border-b border-gray-200">
                    <div className="px-4 py-3 border-r border-gray-200">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Hotel</p>
                      <div className="space-y-1 text-xs">
                        <div><span className="text-gray-500">Name: </span><span className="font-semibold text-gray-800">{selectedBooking.hotel?.name || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Contact: </span><span className="font-semibold text-gray-800">{selectedBooking.hotel?.contactInfo || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Owner: </span><span className="font-semibold text-gray-800">{selectedBooking.hotel?.ownerName || 'N/A'}</span></div>
                        <div className="flex items-center gap-1"><span className="text-gray-500">Status: </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${selectedBooking.hotel?.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {selectedBooking.hotel?.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Client</p>
                      <div className="space-y-1 text-xs">
                        <div><span className="text-gray-500">Name: </span><span className="font-semibold text-gray-800">{selectedBooking.client?.fullName || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Username: </span><span className="font-semibold text-gray-800">@{selectedBooking.client?.username || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Email: </span><span className="font-semibold text-gray-800">{selectedBooking.client?.email || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Phone: </span><span className="font-semibold text-gray-800">{selectedBooking.client?.phone || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Booking Details</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Check-in: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.checkIn}</span></div>
                      <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Check-out: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.checkOut}</span></div>
                      <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Guests: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.numberOfGuests}</span></div>
                      <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Rooms: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.numberOfRooms || 1}</span></div>
                      {selectedBooking.totalCost && (
                        <div style={{ fontSize: '13px' }}><span style={{ color: '#6b7280', fontWeight: 700 }}>Total Cost: </span><span style={{ fontWeight: 800, color: '#111827' }}>{selectedBooking.totalCost} ETB</span></div>
                      )}
                      {selectedBooking.specialRequests && (
                        <div style={{ fontSize: '13px' }} className="col-span-2"><span style={{ color: '#6b7280', fontWeight: 700 }}>Requests: </span><span style={{ fontWeight: 700, color: '#374151' }}>{selectedBooking.specialRequests}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Receipt */}
                  {selectedBooking.receiptImageUrl && (
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Payment Receipt</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => setShowReceiptModal(true)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold border border-gray-300">
                            View
                          </button>
                          <button onClick={handleDownloadReceipt}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold border border-gray-300">
                            Download
                          </button>
                        </div>
                      </div>
                      <img src={getReceiptUrl(selectedBooking.receiptImageUrl)} alt="Receipt"
                        className="w-full rounded border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23f3f4f6" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280" font-size="14">Receipt not available</text></svg>'; }}
                      />
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && selectedBooking.problemReport && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
                      <p className="text-xs font-black text-red-600 uppercase tracking-wide mb-1">Problem Report</p>
                      <p className="text-sm text-red-800 font-semibold mb-2">{selectedBooking.problemReport}</p>
                      <textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                        placeholder="Enter resolution notes..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 mb-2" rows={2} />
                      <FormButton variant="primary" onClick={handleResolve} loading={actionLoading} disabled={!resolution.trim()}>
                        Mark as Resolved
                      </FormButton>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedBooking.bookingStatus === 'REJECTED' && selectedBooking.rejectionReason && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
                      <p className="text-xs font-black text-red-600 uppercase tracking-wide mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-800 font-semibold">{selectedBooking.rejectionReason}</p>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="border-b border-gray-200">
                    {/* Chat Header */}
                    <div className="px-4 py-3 flex items-center gap-2 bg-white">
                      <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">M</span>
                      <h4 className="text-gray-800 font-semibold text-sm">Conversation ({selectedBooking.messages?.length || 0})</h4>
                    </div>
                    {/* Chat Body */}
                    <div
                      className="px-4 py-4 space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                      style={{ backgroundColor: '#dfe7dc' }}
                    >
                      {!selectedBooking.messages?.length ? (
                        <p className="text-center py-8 text-sm text-gray-500">No messages yet</p>
                      ) : selectedBooking.messages.map(m => {
                        const isOwner = m.messageType === 'OWNER' || m.messageType === 'SYSTEM';
                        return (
                          <div key={m.id} className="flex justify-start" style={{ paddingLeft: isOwner ? '2mm' : '16mm' }}>
                            <div className="max-w-[72%] px-3 py-2 shadow-sm rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-white">
                              <p className="text-xs font-semibold mb-0.5 text-purple-600">{m.senderName}
                                {m.messageType && m.messageType !== 'CLIENT' && (
                                  <span className="ml-1 text-xs text-gray-400 font-normal">[{m.messageType}]</span>
                                )}
                              </p>
                              <p className="text-sm leading-relaxed text-gray-900 break-words">{m.message}</p>
                              <p className="text-xs mt-1 text-gray-400 text-right">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timestamps + Delete */}
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      <span>Created: {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                    </div>
                    <button onClick={() => setShowDeleteModal(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition">
                      Delete Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center text-gray-800 border border-gray-200">
                  <p className="font-black">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'all' && bookings.length >= 50 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-white border-2 border-gray-400 rounded-lg disabled:opacity-50 font-bold shadow-md"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 font-black">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border-2 border-gray-400 rounded-lg font-bold shadow-md"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Receipt Image Modal - Always show if exists */}
      {showReceiptModal && selectedBooking?.receiptImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div className="relative max-w-4xl w-full">
            <div className="absolute top-0 right-0 -mt-12 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(); }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-black border-2 border-blue-300 shadow-md"
              >
                Download
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-black border-2 border-red-300 shadow-md"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-gray-900 mb-4">Delete Booking?</h3>
            <p className="text-gray-700 mb-2 font-semibold">
              Are you sure you want to delete this booking?
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm">
              <div className="font-bold text-gray-900">Booking #{selectedBooking.bookingId}</div>
              <div className="text-gray-700">{selectedBooking.hotel?.name}</div>
              <div className="text-gray-700">{selectedBooking.client?.fullName}</div>
              <div className="text-gray-700">{selectedBooking.checkIn} — {selectedBooking.checkOut}</div>
            </div>
            <p className="text-red-600 font-bold text-sm mb-6">
              ⚠️ This action cannot be undone. The booking will be permanently removed from all pages (client, owner, and admin).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-black disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleDeleteBooking}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
