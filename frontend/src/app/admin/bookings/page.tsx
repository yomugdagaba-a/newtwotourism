"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'problems'>('all');
  const [filter, setFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolution, setResolution] = useState("");
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

  const displayedBookings = activeTab === 'problems' ? problemBookings : bookings;
  const filteredBookings = displayedBookings.filter(b => {
    if (filter === "ALL") return true;
    return b.bookingStatus === filter;
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-gray-900">Booking Management</h1>
              <p className="text-gray-600 text-sm mt-0.5">Monitor and manage all hotel bookings</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg px-3 py-1.5 font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
              </button>
              <button onClick={() => { loadBookings(); loadProblemBookings(); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-bold shadow-lg text-sm">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div>}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          {[
            { label: 'Total', filter: 'ALL', count: stats.ALL || 0 },
            { label: 'Requested', filter: 'REQUESTED', count: stats.REQUESTED || 0 },
            { label: 'Accepted', filter: 'OWNER_ACCEPTED', count: stats.OWNER_ACCEPTED || 0 },
            { label: 'Cost Sent', filter: 'COST_PROPOSED', count: stats.COST_PROPOSED || 0 },
            { label: 'Paid', filter: 'PAID', count: stats.PAID || 0 },
            { label: 'Approved', filter: 'APPROVED', count: stats.APPROVED || 0 },
            { label: 'Problems', filter: null, count: problemBookings.length },
          ].map(({ label, filter: f, count }) => (
            <button
              key={label}
              onClick={() => { if (f) { setFilter(f); setActiveTab('all'); setSelectedBooking(null); } else { setActiveTab('problems'); setSelectedBooking(null); } }}
              className="backdrop-blur-sm bg-white/70 border border-white/50 rounded-xl p-2.5 shadow-md hover:shadow-lg hover:bg-white/90 transition-all text-center"            >
              <div className="text-lg font-black text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 font-semibold">{label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('all'); setSelectedBooking(null); }}
            className={`px-6 py-3 rounded-lg font-black transition shadow-md border-2 ${
              activeTab === 'all' ? 'bg-gray-600 text-white border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => { setActiveTab('problems'); setSelectedBooking(null); }}
            className={`px-6 py-3 rounded-lg font-black transition shadow-md border-2 ${
              activeTab === 'problems' ? 'bg-gray-600 text-white border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
            }`}
          >
            Problem Reports ({problemBookings.length})
          </button>
        </div>

        {/* Filter */}
        {activeTab === 'all' && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'REQUESTED', label: 'Requested' },
              { key: 'OWNER_ACCEPTED', label: 'Accepted' },
              { key: 'COST_PROPOSED', label: 'Cost Proposed' },
              { key: 'PAID', label: 'Paid' },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'REJECTED', label: 'Rejected' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setSelectedBooking(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-black transition shadow-md border-2 ${
                  filter === key ? 'bg-gray-600 text-white border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List */}
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
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
                    onClick={() => setSelectedBooking(b)}
                    className={`bg-white rounded-xl px-4 py-3 cursor-pointer transition hover:shadow-xl shadow-md border ${
                      selectedBooking?.bookingId === b.bookingId ? 'bg-blue-50 shadow-xl border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-black text-gray-900 text-sm">Booking {b.bookingId}</span>
                        {b.problemReported && <span className="ml-2 text-xs text-red-500 font-bold">Problem</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-sm ${BookingService.getStatusColor(b.bookingStatus)}`}>
                        {BookingService.getStatusLabel(b.bookingStatus)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      <div className="font-black text-gray-900">{b.hotel?.name || 'N/A'}</div>
                      <div className="font-semibold">{b.client?.fullName || 'N/A'}</div>
                      <div className="font-semibold">{b.checkIn} — {b.checkOut}</div>
                      {b.totalCost && <div className="font-black text-gray-800">{b.totalCost} ETB</div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Booking Details */}
            <div className="lg:col-span-2">
              {selectedBooking ? (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
                  {/* Header */}
                  <div className="p-6 border-b bg-white rounded-t-xl border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Booking {selectedBooking.bookingId}</h2>
                        <p className="text-gray-700 font-bold">{selectedBooking.hotel?.name || 'N/A'}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-black shadow-md ${BookingService.getStatusColor(selectedBooking.bookingStatus)}`}>
                        {BookingService.getStatusLabel(selectedBooking.bookingStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Hotel & Client Info */}
                  <div className="grid md:grid-cols-2 gap-6 p-6 border-b bg-white">
                    <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200">
                      <h3 className="font-black text-gray-900 mb-3">Hotel Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="font-bold"><span className="text-gray-700">Name:</span> <strong className="text-gray-900">{selectedBooking.hotel?.name || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Contact:</span> <strong className="text-gray-900">{selectedBooking.hotel?.contactInfo || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Owner:</span> <strong className="text-gray-900">{selectedBooking.hotel?.ownerName || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Status:</span> 
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-black shadow-sm ${selectedBooking.hotel?.active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {selectedBooking.hotel?.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200">
                      <h3 className="font-black text-gray-900 mb-3">Client Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="font-bold"><span className="text-gray-700">Name:</span> <strong className="text-gray-900">{selectedBooking.client?.fullName || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Username:</span> <strong className="text-gray-900">@{selectedBooking.client?.username || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Email:</span> <strong className="text-gray-900">{selectedBooking.client?.email || 'N/A'}</strong></div>
                        <div className="font-bold"><span className="text-gray-700">Phone:</span> <strong className="text-gray-900">{selectedBooking.client?.phone || 'N/A'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-6 border-b bg-white">
                    <h3 className="font-black text-gray-900 mb-3">Booking Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-xs font-black uppercase">Check-in</div>
                        <div className="font-black text-gray-800">{selectedBooking.checkIn}</div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-xs font-black uppercase">Check-out</div>
                        <div className="font-black text-gray-800">{selectedBooking.checkOut}</div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-xs font-black uppercase">Guests</div>
                        <div className="font-black text-gray-800">{selectedBooking.numberOfGuests}</div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-xs font-black uppercase">Rooms</div>
                        <div className="font-black text-gray-800">{selectedBooking.numberOfRooms || 1}</div>
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-xl shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-sm font-black">Special Requests:</div>
                        <div className="text-gray-900 font-bold">{selectedBooking.specialRequests}</div>
                      </div>
                    )}
                    {selectedBooking.totalCost && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-xl text-center shadow-lg border border-gray-200">
                        <div className="text-gray-700 text-sm font-black">Total Cost</div>
                        <div className="text-3xl font-black text-gray-800">{selectedBooking.totalCost} ETB</div>
                      </div>
                    )}
                  </div>

                  {/* Receipt - Only show until checkout date */}
                  {selectedBooking.receiptImageUrl && new Date(selectedBooking.checkOut) >= new Date(new Date().toDateString()) && (
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-black text-gray-800">Payment Receipt</h3>
                          <p className="text-xs text-gray-500 mt-1 font-semibold">Visible until checkout: {selectedBooking.checkOut}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowReceiptModal(true)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-black border-2 border-blue-300 shadow-md"
                          >
                            View Full Size
                          </button>
                          <button
                            onClick={handleDownloadReceipt}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-black border-2 border-blue-300 shadow-md"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <img 
                        src={getReceiptUrl(selectedBooking.receiptImageUrl)} 
                        alt="Payment Receipt" 
                        className="w-full rounded-lg border-2 border-gray-300 shadow-lg"
                        onError={(e) => {
                          console.error('Image failed to load:', selectedBooking.receiptImageUrl);
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image failed to load</text></svg>';
                        }}
                      />
                    </div>
                  )}

                  {/* Problem Report */}
                  {selectedBooking.problemReported && selectedBooking.problemReport && (
                    <div className="p-6 border-b bg-red-50">
                      <h3 className="font-black text-red-700 mb-3">Problem Report</h3>
                      <p className="text-red-800 mb-4 font-semibold">{selectedBooking.problemReport}</p>
                      <div className="space-y-3">
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Enter resolution notes..."
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
                          rows={3}
                        />
                        <FormButton
                          variant="primary"
                          onClick={handleResolve}
                          loading={actionLoading}
                          disabled={!resolution.trim()}
                        >
                          Mark as Resolved
                        </FormButton>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedBooking.bookingStatus === 'REJECTED' && selectedBooking.rejectionReason && (
                    <div className="p-6 border-b bg-red-50">
                      <h3 className="font-black text-red-700 mb-2">Rejection Reason</h3>
                      <p className="text-red-800 font-semibold">{selectedBooking.rejectionReason}</p>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="p-6 bg-white border-b">
                    <h3 className="font-black text-gray-900 mb-3">Conversation History ({selectedBooking.messages?.length || 0})</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-xl shadow-inner border border-gray-200 [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-gray-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-300">
                      {selectedBooking.messages?.length === 0 ? (
                        <p className="text-gray-700 text-center py-4 font-bold">No messages</p>
                      ) : (
                        selectedBooking.messages?.map(m => (
                          <div key={m.id} className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                            <div className="flex justify-between text-xs text-gray-700 mb-1">
                              <span className="font-black">{m.senderName}</span>
                              <span className="font-bold">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-gray-900 font-bold">{m.message}</div>
                            <span className="text-xs text-gray-700 font-black bg-gray-200 px-2 py-0.5 rounded">[{m.messageType}]</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="p-4 bg-gray-100 border-t text-xs text-gray-700 flex justify-between font-bold rounded-b-xl border-gray-200">
                    <span>Created: {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedBooking.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center text-gray-800 shadow-xl border border-gray-200">
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
    </div>
  );
}
