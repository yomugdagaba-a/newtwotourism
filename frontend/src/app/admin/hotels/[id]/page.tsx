"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AdminHotelService, AdminUserService, User } from '@/services/admin.service';

interface HotelDetail {
  id: number;
  name: string;
  description: string;
  contactInfo?: string;
  starRating?: number;
  active: boolean;
  ownerId?: number;
  ownerName?: string;
  tourismPlaceId?: number;
  tourismPlaceName?: string;
  images?: { id: number; imageUrl: string }[];
}

export default function AdminHotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = Number(params.id);
  const { token, role, isAuthenticated } = useAuthStore();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [hotelOwners, setHotelOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | ''>('');
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadHotel();
    loadHotelOwners();
  }, [isAuthenticated, role, hotelId]);

  const loadHotel = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/hotels/${hotelId}/detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load hotel');
      const data = await response.json();
      setHotel(data);
      setSelectedOwnerId(data.ownerId || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel');
    } finally {
      setLoading(false);
    }
  };

  const loadHotelOwners = async () => {
    if (!token) return;
    try {
      const owners = await AdminUserService.getUsersByRole(token, 'HOTEL_OWNER');
      setHotelOwners(owners);
    } catch (err) {
      console.error('Failed to load hotel owners:', err);
    }
  };

  const handleAssignOwner = async () => {
    if (!token || !selectedOwnerId || selectedOwnerId === '') return;
    try {
      setActionLoading(true);
      await AdminHotelService.assignOwner(token, hotelId, Number(selectedOwnerId));
      await loadHotel();
      setShowOwnerModal(false);
      alert('Owner assigned successfully');
    } catch (err) {
      alert('Failed to assign owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveOwner = async () => {
    if (!token || !confirm('Remove owner from this hotel?')) return;
    try {
      setActionLoading(true);
      await AdminHotelService.removeOwner(token, hotelId);
      await loadHotel();
      setSelectedOwnerId('');
      alert('Owner removed successfully');
    } catch (err) {
      alert('Failed to remove owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    } catch (err) {
      alert('Failed to toggle status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Hotel not found'}</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => router.push('/admin/hotels')} className="text-blue-600 hover:underline mb-6 flex items-center gap-2">
        ← Back to Hotels
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              <p className="text-gray-600 mt-1">Hotel ID: #{hotel.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${hotel.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {hotel.active ? '✓ Active' : '✗ Inactive'}
              </span>
              <button
                onClick={handleToggleActive}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${hotel.active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-50`}
              >
                {hotel.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Hotel Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Description</label>
              <p className="text-gray-900">{hotel.description || 'No description'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Contact Info</label>
              <p className="text-gray-900">{hotel.contactInfo || 'No contact info'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Star Rating</label>
              <p className="text-gray-900">{'⭐'.repeat(hotel.starRating || 0)} ({hotel.starRating || 0}/5)</p>
            </div>
            {hotel.tourismPlaceName && (
              <div>
                <label className="text-sm text-gray-500">Tourism Place</label>
                <p className="text-gray-900">{hotel.tourismPlaceName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Owner Section */}
        <div className="p-6 border-b bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">Hotel Owner</h2>
          {hotel.ownerId ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {hotel.ownerName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{hotel.ownerName}</p>
                  <p className="text-sm text-gray-600">Owner ID: #{hotel.ownerId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOwnerModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Change Owner
                </button>
                <button
                  onClick={handleRemoveOwner}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Remove Owner
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">No owner assigned to this hotel</p>
              <button
                onClick={() => setShowOwnerModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                + Assign Owner
              </button>
            </div>
          )}
        </div>

        {/* Images */}
        {hotel.images && hotel.images.length > 0 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hotel.images.map((img, index) => (
                <div key={img.id || `img-${index}`} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img src={img.imageUrl} alt="Hotel" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Owner Modal */}
      {showOwnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Hotel Owner</h3>
            <p className="text-gray-600 mb-4">Select a user with HOTEL_OWNER role to manage this hotel:</p>
            
            {hotelOwners.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-yellow-800">No users with HOTEL_OWNER role found.</p>
                <p className="text-sm text-yellow-600 mt-1">Grant HOTEL_OWNER role to a user first.</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Owner</label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">-- Select an owner --</option>
                  {hotelOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.fullName} ({owner.username}) - {owner.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowOwnerModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOwner}
                disabled={!selectedOwnerId || actionLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Assign Owner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
