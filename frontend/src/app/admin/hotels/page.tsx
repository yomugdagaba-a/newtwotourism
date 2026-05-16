"use client";

import { useState, useEffect } from 'react';
import { AdminHotelService, AdminTourismService, AdminImageUploadService, Hotel, HotelCreateDto, HotelUpdateDto, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import Pagination from '@/components/common/Pagination';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import ImageUpload from '@/components/common/ImageUpload';
import { getImageUrl } from '@/utils/imageUrl';
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
  const toast = useToast();
  const confirm = useConfirm();
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
  const [tourismSearch, setTourismSearch] = useState('');
  const [showTourismDrop, setShowTourismDrop] = useState(false);

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

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.tourism-drop-hotels')) setShowTourismDrop(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const loadTourisms = async () => {
    if (!token) return;
    setTourismsLoading(true);
    try {
      const response = await AdminTourismService.getAllTourism(token, 0, 500);
      const sorted = (response.content || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTourisms(sorted);
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
      // Create hotel first (without image URLs — they'll be uploaded after)
      const { mainImageUrl: _main, images: _imgs, ...coreData } = dataToSend;
      const result = await AdminHotelService.createHotel(token, coreData);
      console.log('✅ Hotel created response:', result);

      // Upload pending main image if any
      const pendingMain = (window as any).__pendingHotelMainImage as File | undefined;
      if (pendingMain) {
        try {
          await AdminImageUploadService.uploadHotelMainImage(token, result.id, pendingMain);
        } catch (imgErr) {
          console.warn('Main image upload failed:', imgErr);
        }
        delete (window as any).__pendingHotelMainImage;
      }

      // Upload pending gallery images if any
      const pendingGallery = (window as any).__pendingHotelGalleryImages as { file: File; localUrl: string }[] | undefined;
      if (pendingGallery && pendingGallery.length > 0) {
        for (const { file } of pendingGallery) {
          try {
            await AdminImageUploadService.uploadHotelGalleryImage(token, result.id, file);
          } catch (imgErr) {
            console.warn('Gallery image upload failed:', imgErr);
          }
        }
        delete (window as any).__pendingHotelGalleryImages;
      }

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
    const ok = await confirm({ message: 'Are you sure you want to delete this hotel?', variant: 'danger', title: 'Delete Hotel', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(hotelId);
      await AdminHotelService.deleteHotel(token, hotelId);
      toast.success('Hotel deleted successfully');
      await loadHotels();
    } catch (err) {
      toast.error('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    // Set tourism search to current hotel's tourism name
    const currentTourism = tourisms.find(t => t.id === (hotel.tourismPlaceId || hotel.tourismId));
    setTourismSearch(currentTourism ? currentTourism.name : '');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', tourismPlaceId: 0, starRating: 3, contactInfo: '', policies: '', images: [], latitude: undefined, longitude: undefined, mainImageUrl: '' });
    setEditingHotel(null);
    setHotelActive(true);
    setNewImageUrl('');
    setTourismSearch('');
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
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Hotel Management" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => { setSearchTerm(value); setCurrentPage(0); }}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center flex-1 justify-end">
            <button onClick={() => { resetForm(); setShowModal(true); }}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1">
              + Add Hotel
            </button>
          </div>
        }
      />
      <div className="container mx-auto px-4 pt-4 pb-8">

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
              <div key={hotel.id} className="rounded-xl overflow-hidden hover:shadow-sm transition-all duration-300 group bg-white border border-gray-200">
                <div className="h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
                  {hotel.images && hotel.images.length > 0 && !imageErrors.has(hotel.id) ? (
                    <img 
                      src={getImageUrl(
                        typeof hotel.images[0] === 'string'
                          ? hotel.images[0]
                          : (hotel.images[0] as any)?.imageUrl || ''
                      )}
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
                </div>
                <div className="p-3 bg-white border-t border-gray-200">
                  {/* Hotel Name */}
                  <h3 className="text-sm font-black text-gray-900 truncate">{hotel.name}</h3>
                  
                  {/* Phone */}
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {hotel.contactInfo || 'No contact info'}
                  </p>
                  
                  {/* Owner, Stars & Status Badges - inline */}
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                      {hotel.ownerName || (hotel.ownerId ? `Owner #${hotel.ownerId}` : 'No Owner')}
                    </span>
                    {hotel.starRating && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                        {'★'.repeat(hotel.starRating)}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded border ${hotel.active !== false ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {hotel.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-1.5">
                    <button onClick={() => router.push(`/admin/hotels/${hotel.id}`)}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold transition-all border border-gray-200">
                      Manage
                    </button>
                    <button onClick={() => openEditModal(hotel)} 
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold transition-all border border-gray-200">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(hotel.id)} disabled={actionLoading === hotel.id}
                      className="flex-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition-all border border-red-200 disabled:opacity-50">
                      {actionLoading === hotel.id ? '...' : 'Delete'}
                    </button>
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
          <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tourism Place <span className="text-red-500">*</span></label>
                  {tourismsLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">Loading...</div>
                  ) : (
                    <div className="relative tourism-drop-hotels">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input type="text" placeholder="Filter tourism place..."
                        value={tourismSearch}
                        onChange={(e) => setTourismSearch(e.target.value)}
                        onFocus={() => setShowTourismDrop(true)}
                        className={`w-full border-0 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-200 bg-gray-50 ${formErrors.tourismPlaceId ? 'ring-1 ring-red-400' : ''}`}
                      />
                      {showTourismDrop && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase()) || t.wereda?.toLowerCase().includes(tourismSearch.toLowerCase())).length === 0
                            ? <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                            : tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase()) || t.wereda?.toLowerCase().includes(tourismSearch.toLowerCase())).map(t => (
                              <div key={t.id}
                                onClick={() => { setFormData(prev => ({ ...prev, tourismPlaceId: t.id })); setTourismSearch(t.name); setShowTourismDrop(false); if (formErrors.tourismPlaceId) setFormErrors(prev => ({ ...prev, tourismPlaceId: '' })); }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.tourismPlaceId === t.id ? 'bg-blue-100 font-semibold' : ''}`}>
                                {t.name} ({t.wereda})
                              </div>
                            ))}
                        </div>
                      )}
                      {formErrors.tourismPlaceId && <p className="text-red-500 text-xs mt-1">{formErrors.tourismPlaceId}</p>}
                    </div>
                  )}
                </div>
                <FormInput label="Star Rating" name="starRating" type="select" value={formData.starRating}
                  onChange={handleInputChange} options={starOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <input
                    type="tel"
                    value={formData.contactInfo}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-300 focus:outline-none bg-white ${formErrors.contactInfo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Phone number"
                  />
                </div>
                {formErrors.contactInfo && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.contactInfo}
                  </p>
                )}
              </div>

              <FormInput label="Hotel Policies" name="policies" type="textarea" value={formData.policies || ''}
                onChange={handleInputChange} placeholder="Check-in/out times, cancellation policy, etc." rows={2}
              />

              {/* Map Coordinates */}
              <div className="border-t border-gray-200 pt-3 mt-1">
                <p className="text-sm font-semibold text-gray-700 mb-2">Map Coordinates (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={(formData as any).latitude || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 12.0316"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={(formData as any).longitude || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 39.0472"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Hotel Active Status</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hotelActive}
                      onChange={(e) => setHotelActive(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-7 rounded-full transition-colors border ${hotelActive ? 'bg-green-500 border-green-600' : 'bg-gray-300 border-gray-400'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${hotelActive ? 'translate-x-7' : ''}`}></div>
                    </div>
                  </div>
                </label>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${hotelActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                  {hotelActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>

              {/* Main Image Upload */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <ImageUpload
                  label="Main Image"
                  currentImageUrl={formData.mainImageUrl || ''}
                  onUpload={async (file) => {
                    if (editingHotel) {
                      return await AdminImageUploadService.uploadHotelMainImage(token!, editingHotel.id, file);
                    }
                    (window as any).__pendingHotelMainImage = file;
                    return URL.createObjectURL(file);
                  }}
                  onUrlChange={(url) => setFormData(prev => ({ ...prev, mainImageUrl: url }))}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-end space-x-2 z-10">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={editingHotel ? handleUpdate : handleCreate}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-semibold text-sm transition-all"
              >
                {actionLoading !== null ? 'Saving...' : editingHotel ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HotelsManagementPage;
