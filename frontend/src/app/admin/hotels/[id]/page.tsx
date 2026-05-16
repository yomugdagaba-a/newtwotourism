"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AdminHotelService, AdminUserService, User } from '@/services/admin.service';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import { Alert } from '@/components/common/FormInput';
import { getImageUrl } from '@/utils/imageUrl';

interface HotelDetail {
  id: number;
  name: string;
  description?: string;
  contactInfo?: string;
  starRating?: number;
  stars?: number;
  active: boolean;
  ownerId?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerUsername?: string;
  tourismPlaceId?: number;
  tourismPlaceName?: string;
  policies?: string;
  viewersCount?: number;
  images?: any[];
}

export default function AdminHotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = Number(params.id);
  const { token, role, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [hotelOwners, setHotelOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | ''>('');
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [showOwnerDrop, setShowOwnerDrop] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullPolicies, setShowFullPolicies] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    // Load owners first, then hotel (so owner name lookup works)
    loadHotelOwners().then(() => loadHotel());
  }, [isAuthenticated, role, hotelId]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.owner-drop')) setShowOwnerDrop(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const loadHotel = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await AdminHotelService.getAllHotels(token, 0, 500);
      const found = (response.content || []).find((h: any) => h.id === hotelId);
      if (!found) throw new Error('Hotel not found');

      // If ownerName is missing but ownerId exists, look up from already-loaded owners
      if (found.ownerId && !found.ownerName) {
        const owner = hotelOwners.find((u: User) => u.id === found.ownerId);
        if (owner) {
          found.ownerName = owner.fullName || owner.username;
          (found as any).ownerEmail = owner.email;
          (found as any).ownerPhone = (owner as any).phone;
          (found as any).ownerUsername = owner.username;
        } else {
          // Fallback: fetch all users with HOTEL_OWNER role again
          try {
            const owners = await AdminUserService.getUsersByRole(token, 'HOTEL_OWNER');
            const o = owners.find((u: User) => u.id === found.ownerId);
            if (o) {
              found.ownerName = o.fullName || o.username;
              (found as any).ownerEmail = o.email;
              (found as any).ownerPhone = (o as any).phone;
              (found as any).ownerUsername = o.username;
            }
          } catch (e) { /* ignore */ }
        }
      }

      setHotel(found as any);
      setSelectedOwnerId((found as any).ownerId || '');
      if ((found as any).ownerName) setOwnerSearch((found as any).ownerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel');
    } finally {
      setLoading(false);
    }
  };

  const loadHotelOwners = async (): Promise<User[]> => {
    if (!token) return [];
    try {
      const owners = await AdminUserService.getUsersByRole(token, 'HOTEL_OWNER');
      const sorted = owners.sort((a: User, b: User) => (a.fullName || '').localeCompare(b.fullName || ''));
      setHotelOwners(sorted);
      return sorted;
    } catch (err) {
      console.error('Failed to load hotel owners:', err);
      return [];
    }
  };

  const handleAssignOwner = async () => {
    if (!token || !selectedOwnerId) return;
    try {
      setActionLoading(true);
      await AdminHotelService.assignOwner(token, hotelId, Number(selectedOwnerId));
      await loadHotel();
      setShowOwnerModal(false);
      toast.success('Owner assigned successfully');
    } catch (err) {
      toast.error('Failed to assign owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveOwner = async () => {
    if (!token) return;
    const ok = await confirm({ message: 'Remove owner from this hotel?', variant: 'warning', title: 'Remove Owner', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(true);
      await AdminHotelService.removeOwner(token, hotelId);
      await loadHotel();
      setSelectedOwnerId('');
      setOwnerSearch('');
      toast.success('Owner removed successfully');
    } catch (err) {
      toast.error('Failed to remove owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!token || !hotel) return;
    try {
      setActionLoading(true);
      await AdminHotelService.toggleActive(token, hotelId, !hotel.active);
      await loadHotel();
      toast.success('Hotel status updated');
    } catch (err) {
      toast.error('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOwners = hotelOwners.filter(o =>
    o.fullName?.toLowerCase().includes(ownerSearch.toLowerCase()) ||
    o.username?.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white admin-page">
        <TopBar showCategories={false} showBackButton={false} pageTitle="Hotel Details" showAdminMenu={true} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-white admin-page">
        <TopBar showCategories={false} showBackButton={false} pageTitle="Hotel Details" showAdminMenu={true} />
        <div className="container mx-auto px-4 pt-6">
          <Alert type="error" message={error || 'Hotel not found'} />
          <button onClick={() => router.push('/admin/hotels')} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Hotels
          </button>
        </div>
      </div>
    );
  }

  const stars = hotel.starRating || hotel.stars || 0;
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar
        showCategories={false}
        showBackButton={false}
        pageTitle={hotel.name}
        showAdminMenu={true}
        actionButtons={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/hotels/${hotelId}/images`)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-white text-purple-600 hover:bg-purple-50"
            >
              Manage Images
            </button>
            <button
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors ${
                hotel.active
                  ? 'bg-white text-red-600 hover:bg-red-50'
                  : 'bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              {hotel.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        }
      />

      <div className="px-4 pt-4 pb-8 max-w-7xl mx-auto">
        {/* Back button */}
        <button onClick={() => router.push('/admin/hotels')}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 mb-5 text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Hotels
        </button>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{hotel.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-sm text-gray-500">ID: #{hotel.id}</p>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm text-gray-500">{hotel.viewersCount || 0} views</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  hotel.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hotel.active ? '✓ Active' : '✕ Inactive'}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-5 h-5 ${star <= stars ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{stars > 0 ? `${stars}/5 Stars` : 'Not rated'}</span>
              </div>

              {/* Description */}
              {hotel.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {showFullDescription ? hotel.description : truncateText(hotel.description, 300)}
                  </p>
                  {hotel.description.length > 300 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {showFullDescription ? (
                        <>
                          <span>See Less</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>See More</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Policies */}
              {hotel.policies && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Policies</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {showFullPolicies ? hotel.policies : truncateText(hotel.policies, 200)}
                  </p>
                  {hotel.policies.length > 200 && (
                    <button
                      onClick={() => setShowFullPolicies(!showFullPolicies)}
                      className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {showFullPolicies ? (
                        <>
                          <span>See Less</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>See More</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Images Gallery */}
            {hotel.images && hotel.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hotel Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {hotel.images.map((img: any, index: number) => {
                    const url = typeof img === 'string' ? img : img?.imageUrl || '';
                    return url ? (
                      <div key={img.id || index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img src={getImageUrl(url)} alt={`Hotel ${index + 1}`} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Owner Management Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Hotel Owner</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setShowOwnerModal(true); }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                    {hotel.ownerId ? 'Change Owner' : 'Assign Owner'}
                  </button>
                  {hotel.ownerId && (
                    <button onClick={handleRemoveOwner} disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-red-100 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {hotel.ownerId ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md">
                    {(hotel.ownerName || hotel.ownerUsername || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">
                      {hotel.ownerName || hotel.ownerUsername || `User #${hotel.ownerId}`}
                    </p>
                    {hotel.ownerUsername && <p className="text-sm text-gray-500">@{hotel.ownerUsername}</p>}
                    {hotel.ownerEmail && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-gray-500">{hotel.ownerEmail}</p>
                      </div>
                    )}
                    {hotel.ownerPhone && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-xs text-gray-500">{hotel.ownerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">No owner assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Info cards */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Hotel ID</span>
                  <span className="text-sm font-bold text-gray-900">#{hotel.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  <span className={`text-sm font-bold ${hotel.active ? 'text-green-600' : 'text-red-600'}`}>
                    {hotel.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Star Rating</span>
                  <span className="text-sm font-bold text-gray-900">{stars > 0 ? `${stars}/5` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Total Views</span>
                  <span className="text-sm font-bold text-gray-900">{hotel.viewersCount || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500 font-medium">Images</span>
                  <span className="text-sm font-bold text-gray-900">{hotel.images?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            {hotel.contactInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{hotel.contactInfo}</p>
              </div>
            )}

            {/* Tourism Place Card */}
            {hotel.tourismPlaceName && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-100 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tourism Place
                </h3>
                <p className="text-base font-bold text-gray-900">{hotel.tourismPlaceName}</p>
                <p className="text-xs text-gray-500 mt-1">This hotel is located near this tourism destination</p>
              </div>
            )}

            {/* Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/admin/hotels/${hotelId}/images`)}
                  className="w-full px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Manage Images
                </button>
                <button
                  onClick={handleToggleActive}
                  disabled={actionLoading}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
                    hotel.active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {hotel.active ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Deactivate Hotel
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Activate Hotel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign/Change Owner Modal */}
      {showOwnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <h3 className="text-xl font-black text-gray-900">
                {hotel.ownerId ? 'Change Hotel Owner' : 'Assign Hotel Owner'}
              </h3>
              <button onClick={() => setShowOwnerModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Select a user with Hotel Owner role to manage this hotel.</p>

              {hotelOwners.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm font-semibold">No users with Hotel Owner role found.</p>
                  <p className="text-yellow-600 text-xs mt-1">Grant Hotel Owner role to a user first from User Management.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Owner</label>
                  <div className="relative owner-drop">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Filter by name or username..."
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      onFocus={() => setShowOwnerDrop(true)}
                      className="w-full border-0 bg-gray-50 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-200"
                    />
                    {showOwnerDrop && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                        ) : filteredOwners.map(owner => (
                          <div key={owner.id}
                            onClick={() => { setSelectedOwnerId(owner.id); setOwnerSearch(owner.fullName || owner.username || ''); setShowOwnerDrop(false); }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedOwnerId === owner.id ? 'bg-blue-100 font-semibold' : ''}`}>
                            <span className="font-medium">{owner.fullName}</span>
                            <span className="text-gray-500 ml-1">@{owner.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedOwnerId && hotelOwners.find(o => o.id === selectedOwnerId) && (
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      Selected: {hotelOwners.find(o => o.id === selectedOwnerId)?.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-end space-x-2 z-10">
              <button onClick={() => setShowOwnerModal(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold text-sm transition-all">
                Cancel
              </button>
              <button onClick={handleAssignOwner} disabled={!selectedOwnerId || actionLoading}
                className="px-3 py-1.5 bg-white text-blue-600 rounded border border-blue-100 hover:bg-blue-50 disabled:opacity-50 font-semibold text-sm transition-all">
                {actionLoading ? 'Saving...' : hotel.ownerId ? 'Change Owner' : 'Assign Owner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
