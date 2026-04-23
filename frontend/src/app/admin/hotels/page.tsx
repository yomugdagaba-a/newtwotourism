"use client";

import { useState, useEffect } from 'react';
import { AdminHotelService, AdminTourismService, Hotel, HotelCreateDto, HotelUpdateDto, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import Pagination from '@/components/common/Pagination';
import { ValidationErrors } from '@/utils/validation';
import {
  validatePlaceName,
  validateEthiopianPhone,
  validateDescription,
  handlePhoneKeyDown,
  formatPhoneInput,
  hasValidationErrors,
  ValidationResult
} from '../../../utils/ethiopianValidation';

const PAGE_SIZE_OPTIONS = [9, 12, 15, 20, 30];

const HotelsManagementPage = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [tourismsLoading, setTourismsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<HotelCreateDto>({
    name: '', description: '', tourismPlaceId: 0, starRating: 3, contactInfo: '', policies: '', images: [],
    latitude: undefined, longitude: undefined,
    mainImageUrl: ''
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [hotelActive, setHotelActive] = useState(true);

  const handleImageError = (hotelId: number) => {
    setImageErrors(prev => new Set(prev).add(hotelId));
  };

  const { token, role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        router.push('/auth/login');
      } else {
        setAuthChecked(true);
      }
    };
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadHotels();
    loadTourisms();
  }, [authChecked, isAuthenticated, role, currentPage, pageSize]);

  const loadTourisms = async () => {
    if (!token) return;
    setTourismsLoading(true);
    try {
      const response = await AdminTourismService.getAllTourism(token, 0, 500);
      console.log('Loaded tourisms:', response.content);
      setTourisms(response.content || []);
    } catch (err) {
      console.error('Failed to load tourisms:', err);
      setTourisms([]);
    } finally {
      setTourismsLoading(false);
    }
  };

  const loadHotels = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading hotels with page:', currentPage, 'size:', pageSize);
      const response = await AdminHotelService.getAllHotels(token, currentPage, pageSize);
      console.log('✅ Hotels response received:', response);
      console.log('📊 Hotels content:', response.content);
      if (response.content && response.content.length > 0) {
        console.log('🏨 First hotel:', response.content[0]);
        console.log('🏨 First hotel images:', response.content[0].images);
        console.log('🏨 First hotel images count:', response.content[0].images?.length || 0);
        
        // Log all hotels with their image counts
        response.content.forEach((hotel, idx) => {
          console.log(`🏨 Hotel ${idx + 1}: ${hotel.name} - Images: ${hotel.images?.length || 0}`);
          if (hotel.images && hotel.images.length > 0) {
            console.log(`   First image:`, hotel.images[0]);
          }
        });
      }
      setHotels(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      console.log('📊 Set hotels:', response.content?.length, 'Total pages:', response.totalPages);
    } catch (err) {
      console.error('❌ Error loading hotels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  // Validate form data with Ethiopian validation
  const validateFormData = (): boolean => {
    const errors: ValidationResult = {};
    
    // Validate hotel name
    const nameResult = validatePlaceName(formData.name);
    if (!nameResult.valid) errors.name = nameResult.error;
    
    // Validate description (optional but if provided, min 10 chars)
    if (formData.description) {
      const descResult = validateDescription(formData.description, 10);
      if (!descResult.valid) errors.description = descResult.error;
    }
    
    // Validate tourism place selection
    if (!formData.tourismPlaceId || formData.tourismPlaceId === 0) {
      errors.tourismPlaceId = 'Please select a tourism place';
    }
    
    // Validate Ethiopian phone number
    const phoneResult = validateEthiopianPhone(formData.contactInfo);
    if (!phoneResult.valid) errors.contactInfo = phoneResult.error;
    
    setFormErrors(errors as ValidationErrors);
    return !hasValidationErrors(errors);
  };

  const handleCreate = async () => {
    if (!token) return;
    setFormError('');
    
    console.log('🏨 Form data before validation:', formData);
    
    if (!validateFormData()) {
      console.error('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed');
    
    // Include active status in the data being sent
    const dataToSend = {
      ...formData,
      active: hotelActive
    };
    
    console.log('📤 Sending hotel data:', dataToSend);
    
    try {
      setActionLoading(-1);
      const result = await AdminHotelService.createHotel(token, dataToSend);
      console.log('✅ Hotel created response:', result);
      setFormSuccess('Hotel created successfully!');
      await loadHotels();
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      console.error('❌ Hotel creation error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create hotel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingHotel) return;
    setFormError('');
    
    console.log('🏨 Form data before validation:', formData);
    
    if (!validateFormData()) {
      console.error('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed');
    
    // Include all fields including images and active status
    const updateData: HotelUpdateDto = {
      name: formData.name,
      description: formData.description,
      starRating: formData.starRating,
      contactInfo: formData.contactInfo,
      policies: formData.policies,
      images: formData.images,
      mainImageUrl: formData.mainImageUrl,
      active: hotelActive
    };
    
    console.log('📤 Sending hotel update data:', updateData);
    
    try {
      setActionLoading(editingHotel.id);
      const result = await AdminHotelService.updateHotel(token, editingHotel.id, updateData);
      console.log('✅ Hotel updated response:', result);
      setFormSuccess('Hotel updated successfully!');
      await loadHotels();
      setTimeout(() => {
        setShowModal(false);
        setEditingHotel(null);
        resetForm();
      }, 1500);
    } catch (err) {
      console.error('❌ Hotel update error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update hotel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (hotelId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this hotel?')) return;
    try {
      setActionLoading(hotelId);
      await AdminHotelService.deleteHotel(token, hotelId);
      await loadHotels();
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (hotel: Hotel) => {
    setEditingHotel(hotel);
    
    // Extract image URLs from hotel.images (handle both string and object formats)
    const imageUrls = (hotel.images || []).map(img => 
      typeof img === 'string' ? img : (img as any)?.imageUrl || ''
    ).filter(url => url);
    
    // Main image is the first one
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
    
    // Gallery images are the rest
    const galleryImages = imageUrls.slice(1);
    
    console.log('📝 [openEditModal] Hotel images:', hotel.images);
    console.log('📝 [openEditModal] Extracted URLs:', imageUrls);
    console.log('📝 [openEditModal] Main image:', mainImageUrl);
    console.log('📝 [openEditModal] Gallery images:', galleryImages);
    
    setFormData({
      name: hotel.name, 
      description: hotel.description || '',
      tourismPlaceId: hotel.tourismPlaceId || hotel.tourismId || 0, 
      starRating: hotel.starRating || hotel.stars || 3,
      contactInfo: hotel.contactInfo || '', 
      policies: hotel.policies || '', 
      images: galleryImages,
      latitude: (hotel as any).latitude || undefined,
      longitude: (hotel as any).longitude || undefined,
      mainImageUrl: mainImageUrl
    });
    setHotelActive(hotel.active !== false);
    setNewImageUrl('');
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', tourismPlaceId: 0, starRating: 3, contactInfo: '', policies: '', images: [], latitude: undefined, longitude: undefined, mainImageUrl: '' });
    setEditingHotel(null);
    setHotelActive(true);
    setNewImageUrl('');
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'tourismPlaceId' || name === 'starRating') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === 'latitude' || name === 'longitude') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle phone input with formatting
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setFormData(prev => ({ ...prev, contactInfo: formatted }));
    if (formErrors.contactInfo) {
      setFormErrors(prev => ({ ...prev, contactInfo: '' }));
    }
  };

  const filteredHotels = hotels
    .filter(hotel =>
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.contactInfo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'starRating': aVal = a.starRating || 0; bVal = b.starRating || 0; break;
        case 'tourismPlace': aVal = tourisms.find(t => t.id === a.tourismPlaceId)?.name || ''; bVal = tourisms.find(t => t.id === b.tourismPlaceId)?.name || ''; break;
        default: aVal = a.name || ''; bVal = b.name || '';
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const tourismOptions: { value: number; label: string }[] = tourisms.map(t => ({ value: t.id, label: `${t.name} (${t.wereda || 'N/A'})` }));
  const starOptions = [
    { value: 1, label: '1 Star' },
    { value: 2, label: '2 Stars' },
    { value: 3, label: '3 Stars' },
    { value: 4, label: '4 Stars' },
    { value: 5, label: '5 Stars' }
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-page">
      <div className="container mx-auto px-4 pt-4 pb-8">
      <div className="mb-8 bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-1 transition-colors font-bold text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold">Back to Dashboard</span>
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black text-gray-900 mb-0.5">Hotel Management</h1>
            <p className="text-gray-600 text-sm">Manage hotels, assign owners, and control booking availability</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-black shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Hotel
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search hotels by name, description, or contact..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold bg-white shadow-sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-700">Sort:</span>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [newSortBy, newSortDir] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortDir(newSortDir as 'asc' | 'desc');
                }}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 font-bold bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="starRating-desc">Highest Rating</option>
                <option value="starRating-asc">Lowest Rating</option>
                <option value="tourismPlace-asc">Tourism Place A-Z</option>
              </select>
            </div>
            <div className="text-sm text-gray-900 bg-white px-4 py-2 rounded-lg font-bold shadow-md border border-gray-200">
              Total: <span className="font-black text-gray-700">{totalElements}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading hotels...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white">
            <Alert type="error" message={error} />
            <button onClick={loadHotels} className="mt-4 bg-blue-200 text-blue-800 px-4 py-2 rounded-md hover:bg-blue-300 font-black shadow-md">Retry</button>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="font-black">No hotels found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredHotels.map((hotel) => (
              <div key={hotel.id} className="rounded-xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 group bg-white hover:-translate-y-1 border border-gray-200">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
                  {hotel.images && hotel.images.length > 0 && !imageErrors.has(hotel.id) ? (
                    <img 
                      src={
                        (() => {
                          // Handle both string and object image formats
                          const imageUrl = typeof hotel.images[0] === 'string' 
                            ? hotel.images[0]
                            : (hotel.images[0] as any)?.imageUrl || '';
                          
                          if (!imageUrl) return '';
                          
                          if (imageUrl.startsWith('http')) {
                            return imageUrl;
                          } else if (imageUrl.startsWith('/uploads')) {
                            return `${window.location.origin}${imageUrl}`;
                          } else {
                            return `${window.location.origin}/uploads/${imageUrl}`;
                          }
                        })()
                      }
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(hotel.id)}
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-semibold">No image added</p>
                      <p className="text-xs text-gray-500 mt-1">Click Edit to add images</p>
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-black shadow-lg ${hotel.active !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {hotel.active !== false ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                <div className="p-4 bg-white shadow-inner border-t border-gray-200">
                  {/* Hotel Name */}
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-green-700 transition-colors">{hotel.name}</h3>
                  
                  {/* Phone */}
                  <p className="text-sm font-black text-gray-700 mt-2 flex items-center gap-2">
                    {hotel.contactInfo || 'No contact info'}
                  </p>
                  
                  {/* Owner & Stars Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {hotel.ownerId ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-black bg-blue-500 text-white rounded-full shadow-md">
                        {hotel.ownerName || `Owner #${hotel.ownerId}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-black bg-orange-500 text-white rounded-full shadow-md">
                        No Owner
                      </span>
                    )}
                    {hotel.starRating && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-black bg-yellow-500 text-white rounded-full shadow-md">
                        {'★'.repeat(hotel.starRating)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm font-bold text-gray-800 mt-3 line-clamp-2">{hotel.description}</p>
                  
                  {/* Views */}
                  <div className="mt-3 text-sm font-black text-gray-800 flex items-center gap-1">
                    {hotel.viewersCount || 0} views
                  </div>
                  
                  {/* Action Buttons - Stacked vertically for better visibility */}
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => router.push(`/admin/hotels/${hotel.id}`)}
                      className="w-full py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg text-sm font-black transition-all shadow-md hover:shadow-lg hover:scale-105">
                      Manage
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(hotel)} 
                        className="flex-1 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg text-sm font-black transition-all shadow-md hover:shadow-lg hover:scale-105">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(hotel.id)} disabled={actionLoading === hotel.id}
                        className="flex-1 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-black transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50">
                        {actionLoading === hotel.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 bg-white rounded-xl shadow-xl p-4 border border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(0); }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300">
            <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">
                {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 font-bold">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {formSuccess && <Alert type="success" message={formSuccess} />}
              {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

              <FormInput label="Hotel Name" name="name" value={formData.name} onChange={handleInputChange}
                error={formErrors.name} placeholder="Enter hotel name" required
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />

              <FormInput label="Description" name="description" type="textarea" value={formData.description || ''}
                onChange={handleInputChange} error={formErrors.description} placeholder="Describe the hotel" rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tourismsLoading ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tourism Place <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                      Loading tourism places...
                    </div>
                  </div>
                ) : tourismOptions.length > 0 ? (
                  <FormInput label="Tourism Place" name="tourismPlaceId" type="select" value={formData.tourismPlaceId}
                    onChange={handleInputChange} error={formErrors.tourismPlaceId} required options={tourismOptions}
                  />
                ) : (
                  <FormInput label="Tourism Place ID" name="tourismPlaceId" type="number" value={formData.tourismPlaceId || ''}
                    onChange={handleInputChange} error={formErrors.tourismPlaceId} required 
                    placeholder="Enter tourism place ID"
                    helpText="No tourism places found. Enter the ID manually."
                  />
                )}
                <FormInput label="Star Rating" name="starRating" type="select" value={formData.starRating}
                  onChange={handleInputChange} options={starOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Contact Phone <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <input
                    type="tel"
                    value={formData.contactInfo}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                    className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold bg-gray-50 ${formErrors.contactInfo ? 'border-red-500 bg-red-50' : 'border-gray-400'}`}
                    placeholder="09XXXXXXXX or 07XXXXXXXX"
                  />
                </div>
                {formErrors.contactInfo && (
                  <p className="mt-1 text-sm text-red-600 font-semibold flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.contactInfo}
                  </p>
                )}
                <p className="text-gray-600 text-xs mt-1 font-medium">Ethiopian phone: Ethio Telecom (09X) or Safaricom (07X)</p>
              </div>

              <FormInput label="Hotel Policies" name="policies" type="textarea" value={formData.policies || ''}
                onChange={handleInputChange} placeholder="Check-in/out times, cancellation policy, etc." rows={2}
              />

              {/* Map Coordinates */}
              <div className="border-t-2 border-gray-200 pt-3 mt-1">
                <p className="text-sm font-bold text-gray-800 mb-2">📍 Map Coordinates (optional)</p>
                <p className="text-xs text-gray-500 mb-2">Add coordinates to show this hotel on the map. Find them on Google Maps.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={(formData as any).latitude || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 12.0316"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={(formData as any).longitude || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 39.0472"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-gray-800">Hotel Active Status</span>
                    <p className="text-xs text-gray-600 font-medium">Inactive hotels won't appear in search results</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hotelActive}
                      onChange={(e) => setHotelActive(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-7 rounded-full transition-colors border-2 ${hotelActive ? 'bg-green-500 border-green-600' : 'bg-gray-300 border-gray-400'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${hotelActive ? 'translate-x-7' : ''}`}></div>
                    </div>
                  </div>
                </label>
                <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${hotelActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                  {hotelActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>

              {/* Main Image URL */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <h4 className="text-md font-black text-gray-800 mb-3">Main Image</h4>
                <FormInput label="Main Image URL" name="mainImageUrl" value={formData.mainImageUrl || ''}
                  onChange={handleInputChange} placeholder="https://example.com/hotel-image.jpg"
                  helpText="Enter the URL of the main/cover image for this hotel"
                />
                {formData.mainImageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 font-semibold mb-1">Preview:</p>
                    <img src={formData.mainImageUrl} alt="Main preview" 
                      className="w-32 h-24 object-cover rounded-lg border-2 border-gray-300" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <h4 className="text-md font-black text-gray-800 mb-3">Gallery Images</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL and click Add"
                    className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          images: [...(prev.images || []), newImageUrl.trim()]
                        }));
                        setNewImageUrl('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold border-2 border-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Gallery ${idx + 1}`} 
                          className="w-full h-20 object-cover rounded-lg border-2 border-gray-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error'; }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images?.filter((_, i) => i !== idx) || []
                            }));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold border border-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  Tip: You can manage detailed hotel images from the "Manage" button after creating the hotel.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-100 border-t-2 border-gray-300 px-6 py-4 flex justify-end space-x-3">
              <FormButton variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</FormButton>
              <FormButton variant="primary" onClick={editingHotel ? handleUpdate : handleCreate}
                loading={actionLoading !== null} disabled={actionLoading !== null}>
                {editingHotel ? 'Update Hotel' : 'Create Hotel'}
              </FormButton>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HotelsManagementPage;
