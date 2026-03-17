"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import TopBar from "@/components/layout/TopBar";
import { BookingService, Booking, BOOKING_STATUS } from "@/services/booking.service";
import { ModeSwitcherCompact } from "@/components/common/ModeSwitcher";
import { API_BASE_URL } from "@/services/api";

interface OwnerHotel {
  id: number;
  name: string;
  description?: string;
  stars?: number;
  starRating?: number;
  contactInfo: string;
  active: boolean;
  images: string[];
  tourismPlaceName?: string;
  tourismPlaceId?: number;
  ownerId?: number;
  ownerName?: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, userId, role, browsingMode, setBrowsingMode } = useAuthStore();

  const [myHotels, setMyHotels] = useState<OwnerHotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'bookings'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOTEL_OWNER" && role !== "ADMIN") {
      router.push("/");
      return;
    }
    // Auto-switch to owner mode
    if (role === "HOTEL_OWNER" && browsingMode !== "OWNER") {
      setBrowsingMode("OWNER");
    }
    loadData();
  }, [isAuthenticated, role]);

  const loadData = async () => {
    if (!token || !userId) {
      console.warn("Missing token or userId:", { token: !!token, userId });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Load owner's hotels
      try {
        const response = await fetch(`${API_BASE_URL}/hotels/owner/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const hotelsData = await response.json();
          console.log("Hotels loaded:", hotelsData);
          setMyHotels(hotelsData);
        } else {
          console.error("Failed to load hotels, status:", response.status);
        }
      } catch (e) {
        console.error("Failed to load hotels:", e);
      }
      
      // Load owner's bookings
      try {
        console.log("Fetching bookings for owner:", userId);
        const bookingsData = await BookingService.getOwnerBookings(token, userId);
        console.log("Bookings loaded:", bookingsData);
        setBookings(bookingsData);
      } catch (e) {
        console.error("Failed to load bookings:", e);
        setError("Failed to load bookings");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const pendingCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length;
  const acceptedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.OWNER_ACCEPTED).length;
  const costProposedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.COST_PROPOSED).length;
  const paidCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length;
  const approvedCount = bookings.filter(b => b.bookingStatus === BOOKING_STATUS.APPROVED).length;
  const problemCount = bookings.filter(b => b.problemReported).length;
  const activeHotels = myHotels.filter(h => h.active).length;

  if (!isAuthenticated || (role !== "HOTEL_OWNER" && role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors font-bold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">🏨 Hotel Owner Dashboard</h1>
            <p className="text-gray-700 mt-1 font-semibold">Manage your hotels and bookings</p>
          </div>
          <div className="flex items-center gap-3">
            {role === "HOTEL_OWNER" && <ModeSwitcherCompact />}
            <button onClick={loadData} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 font-black border-2 border-gray-900">
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 p-4 rounded-lg mb-6 font-bold">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{myHotels.length}</div>
            <div className="text-gray-700 text-sm font-bold">My Hotels</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{activeHotels}</div>
            <div className="text-gray-700 text-sm font-bold">Active Hotels</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{pendingCount}</div>
            <div className="text-gray-700 text-sm font-bold">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{paidCount}</div>
            <div className="text-gray-700 text-sm font-bold">Awaiting Approval</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{approvedCount}</div>
            <div className="text-gray-700 text-sm font-bold">Approved</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-gray-700">
            <div className="text-3xl font-black text-gray-900">{bookings.length}</div>
            <div className="text-gray-700 text-sm font-bold">Total Bookings</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300 border-l-4 border-l-red-600">
            <div className="text-3xl font-black text-red-600">{problemCount}</div>
            <div className="text-gray-700 text-sm font-bold">Problems</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: '📊 Overview', count: null },
            { id: 'hotels', label: '🏨 My Hotels', count: myHotels.length },
            { id: 'bookings', label: '📋 All Bookings', count: bookings.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 rounded-lg font-black transition border-2 ${
                activeTab === tab.id ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Urgent Actions */}
                {(pendingCount > 0 || paidCount > 0 || problemCount > 0) && (
                  <div className="bg-white rounded-xl p-6 text-gray-900 border-4 border-gray-300">
                    <h2 className="text-xl font-black mb-4">⚡ Actions Required</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                      {pendingCount > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                          <div className="text-3xl font-black text-gray-900">{pendingCount}</div>
                          <div className="text-sm font-bold text-gray-700">New booking requests waiting for your review</div>
                          <button 
                            onClick={() => router.push('/owner/bookings')}
                            className="mt-3 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-gray-900 border-2 border-gray-900"
                          >
                            Review Now →
                          </button>
                        </div>
                      )}
                      {paidCount > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                          <div className="text-3xl font-black text-gray-900">{paidCount}</div>
                          <div className="text-sm font-bold text-gray-700">Payments received - verify receipts</div>
                          <button 
                            onClick={() => router.push('/owner/bookings')}
                            className="mt-3 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-gray-900 border-2 border-gray-900"
                          >
                            Verify Payments →
                          </button>
                        </div>
                      )}
                      {problemCount > 0 && (
                        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                          <div className="text-3xl font-black text-red-600">{problemCount}</div>
                          <div className="text-sm font-bold text-red-700">Problem reports need attention</div>
                          <button 
                            onClick={() => router.push('/owner/bookings')}
                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-red-700 border-2 border-red-700"
                          >
                            View Problems →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* My Hotels Quick View */}
                <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-gray-900">🏨 My Hotels</h2>
                    <button 
                      onClick={() => setActiveTab('hotels')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-black"
                    >
                      View All →
                    </button>
                  </div>
                  {myHotels.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-4xl mb-2">🏨</div>
                      <p className="font-bold">No hotels assigned to you yet.</p>
                      <p className="text-sm font-semibold">Contact admin to get a hotel assigned.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myHotels.slice(0, 3).map(hotel => (
                        <div 
                          key={hotel.id}
                          className="border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                          onClick={() => router.push(`/hotels/${hotel.id}/booking`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border-2 border-gray-300">
                              🏨
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-gray-900">{hotel.name}</h3>
                              <div className="text-amber-600 text-sm font-bold">
                                {'★'.repeat(hotel.stars || hotel.starRating || 4)}{'☆'.repeat(5 - (hotel.stars || hotel.starRating || 4))}
                              </div>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black border ${
                                hotel.active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'
                              }`}>
                                {hotel.active ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-700 font-bold">
                            {bookings.filter(b => b.hotel.id === hotel.id).length} bookings
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-gray-900">📋 Recent Bookings</h2>
                    <button 
                      onClick={() => router.push('/owner/bookings')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-black"
                    >
                      Manage All →
                    </button>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="font-bold">No bookings yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(booking => (
                        <div 
                          key={booking.bookingId}
                          className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer bg-white"
                          onClick={() => router.push('/owner/bookings')}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-black border-2 border-gray-300">
                              {booking.client.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-black text-gray-900">
                                {booking.client.fullName} - {booking.hotel.name}
                              </div>
                              <div className="text-sm text-gray-600 font-semibold">
                                {booking.checkIn} → {booking.checkOut} • {booking.numberOfGuests} guests
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {booking.totalCost && (
                              <span className="text-gray-900 font-black">{booking.totalCost} ETB</span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-black border ${BookingService.getStatusColor(booking.bookingStatus)}`}>
                              {BookingService.getStatusLabel(booking.bookingStatus)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/owner/bookings')}
                    className="bg-gray-800 text-white p-6 rounded-xl hover:bg-gray-900 transition text-left border-2 border-gray-900"
                  >
                    <div className="text-3xl mb-2">📋</div>
                    <div className="font-black text-lg">Manage Bookings</div>
                    <div className="text-gray-300 text-sm font-semibold">Accept, propose costs, approve payments</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('hotels')}
                    className="bg-gray-700 text-white p-6 rounded-xl hover:bg-gray-800 transition text-left border-2 border-gray-800"
                  >
                    <div className="text-3xl mb-2">🏨</div>
                    <div className="font-black text-lg">View My Hotels</div>
                    <div className="text-gray-300 text-sm font-semibold">See hotel details and manage bookings</div>
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 text-white p-6 rounded-xl hover:bg-gray-700 transition text-left border-2 border-gray-700"
                  >
                    <div className="text-3xl mb-2">🌍</div>
                    <div className="font-black text-lg">Browse as Client</div>
                    <div className="text-gray-300 text-sm font-semibold">Switch to client mode to explore</div>
                  </button>
                </div>
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === 'hotels' && (
              <div className="space-y-4">
                {myHotels.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-300">
                    <div className="text-6xl mb-4">🏨</div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Hotels Assigned</h3>
                    <p className="text-gray-700 font-semibold">Contact the administrator to get a hotel assigned to your account.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myHotels.map(hotel => {
                      const hotelBookings = bookings.filter(b => b.hotel.id === hotel.id);
                      const hotelPending = hotelBookings.filter(b => b.bookingStatus === BOOKING_STATUS.REQUESTED).length;
                      const hotelPaid = hotelBookings.filter(b => b.bookingStatus === BOOKING_STATUS.PAID).length;
                      
                      return (
                        <div key={hotel.id} className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-300">
                          <div className="relative h-40 bg-gray-300">
                            {(() => {
                              // Extract first image URL from images array (handle both string and object formats)
                              let imageUrl = '';
                              if (hotel.images && hotel.images.length > 0) {
                                const image = hotel.images[0];
                                imageUrl = typeof image === 'string' ? image : (image as any)?.imageUrl || '';
                              }
                              
                              return imageUrl ? (
                                <Image src={imageUrl} alt={hotel.name} fill className="object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-6xl text-gray-400">
                                  🏨
                                </div>
                              );
                            })()}
                            <div className="absolute top-3 right-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-black border-2 ${
                                hotel.active ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'
                              }`}>
                                {hotel.active ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-black text-lg text-gray-900">{hotel.name}</h3>
                            <div className="text-amber-600 text-sm mb-2 font-bold">
                              {'★'.repeat(hotel.starRating || 4)}{'☆'.repeat(5 - (hotel.starRating || 4))}
                            </div>
                            {hotel.contactInfo && (
                              <p className="text-gray-700 text-sm mb-3 font-semibold">📞 {hotel.contactInfo}</p>
                            )}
                            
                            {/* Hotel Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="bg-gray-100 p-2 rounded text-center border-2 border-gray-300">
                                <div className="font-black text-gray-900">{hotelBookings.length}</div>
                                <div className="text-xs text-gray-600 font-bold">Total</div>
                              </div>
                              <div className="bg-gray-100 p-2 rounded text-center border-2 border-gray-300">
                                <div className="font-black text-gray-900">{hotelPending}</div>
                                <div className="text-xs text-gray-600 font-bold">Pending</div>
                              </div>
                              <div className="bg-gray-100 p-2 rounded text-center border-2 border-gray-300">
                                <div className="font-black text-gray-900">{hotelPaid}</div>
                                <div className="text-xs text-gray-600 font-bold">To Approve</div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => router.push(`/hotels/${hotel.id}/booking`)}
                              className="w-full bg-gray-800 text-white py-2 rounded-lg font-black hover:bg-gray-900 transition border-2 border-gray-900"
                            >
                              Manage Bookings →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-gray-900">All Bookings</h2>
                  <button
                    onClick={() => router.push('/owner/bookings')}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 font-black border-2 border-gray-900"
                  >
                    Open Full Manager →
                  </button>
                </div>
                
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="font-bold">No bookings yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-2 border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Hotel</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Dates</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Guests</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Cost</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-200">
                        {bookings.map(b => (
                          <tr 
                            key={b.bookingId} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push('/owner/bookings')}
                          >
                            <td className="px-4 py-3 text-sm font-black text-gray-900">#{b.bookingId}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{b.hotel.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{b.client.fullName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{b.checkIn} → {b.checkOut}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{b.numberOfGuests}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-black">
                              {b.totalCost ? `${b.totalCost} ETB` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-black border ${BookingService.getStatusColor(b.bookingStatus)}`}>
                                {b.bookingStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
