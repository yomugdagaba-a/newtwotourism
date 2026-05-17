"use client";

import React, { useState, useEffect } from 'react';
import { AdminTourismService, Tourism, TourismCreateDto, TourismUpdateDto } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import Pagination from '@/components/common/Pagination';
import { ValidationErrors } from '@/utils/validation';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import ImageUpload from '@/components/common/ImageUpload';
import { AdminImageUploadService } from '../../../services/admin.service';
import { getImageUrl } from '@/utils/imageUrl';
import {
  validatePlaceName,
  validateDescription,
  hasValidationErrors,
  ValidationResult
} from '../../../utils/ethiopianValidation';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BLOCKED', label: 'Blocked' }
];

const PAGE_SIZE_OPTIONS = [9, 12, 15, 20, 30];

const TourismsManagementPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingTourism, setEditingTourism] = useState<Tourism | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(12);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [languagesRaw, setLanguagesRaw] = useState('');
  const [formData, setFormData] = useState<any>({
    name: '', description: '', wereda: '', kebele: '', categories: [],
    bestTime: '', peaceInfo: '', visitTime: '', languages: [],
    imageUrl: '', status: 'ACTIVE'
  });

  const { token, role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadTourisms();
  }, [isAuthenticated, role, currentPage, pageSize]);

  const loadTourisms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      console.log('Loading tourisms with page:', currentPage, 'size:', pageSize);
      const response = await AdminTourismService.getAllTourism(token, currentPage, pageSize);
      console.log('Response received:', response);
      setTourisms(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      console.log('Set tourisms:', response.content?.length, 'Total pages:', response.totalPages);
    } catch (err) {
      console.error('Error loading tourisms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tourism places');
    } finally {
      setLoading(false);
    }
  };

  // Validate form data with Ethiopian validation
  const validateFormData = (): boolean => {
    const errors: ValidationResult = {};
    
    // Validate name
    const nameResult = validatePlaceName(formData.name);
    if (!nameResult.valid) errors.name = nameResult.error;
    
    // Validate description (required, min 20 chars)
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Description is required';
    } else {
      const descResult = validateDescription(formData.description, 20);
      if (!descResult.valid) errors.description = descResult.error;
    }
    
    // Validate wereda
    const weredaResult = validatePlaceName(formData.wereda);
    if (!weredaResult.valid) errors.wereda = weredaResult.error?.replace('Place name', 'Wereda') ?? null;
    
    // Validate kebele
    const kebeleResult = validatePlaceName(formData.kebele);
    if (!kebeleResult.valid) errors.kebele = kebeleResult.error?.replace('Place name', 'Kebele') ?? null;
    
    // Validate category
    if (!formData.categories || formData.categories.length === 0) {
      errors.categories = 'At least one category is required';
    }
    
    setFormErrors(errors as ValidationErrors);
    return !hasValidationErrors(errors);
  };

  const handleCreate = async () => {
    if (!token) return;
    setFormError('');
    if (!validateFormData()) return;
    
    try {
      setActionLoading(-1);

      // Strip blob: imageUrl before sending — it will be uploaded separately
      const { imageUrl: _imgUrl, ...coreData } = formData as any;
      const result = await AdminTourismService.createTourism(token, coreData);

      // result is the new tourism ID (number) or the full object
      const newId = typeof result === 'number' ? result : (result as any)?.id;

      // Upload pending main image if any
      const pendingMain = (window as any).__pendingTourismMainImage as File | undefined;
      if (pendingMain && newId) {
        try {
          await AdminImageUploadService.uploadTourismMainImage(token, newId, pendingMain);
        } catch (imgErr) {
          console.warn('Tourism main image upload failed:', imgErr);
        }
        delete (window as any).__pendingTourismMainImage;
      }

      setFormSuccess('Tourism place created successfully!');
      await loadTourisms();
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tourism place');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingTourism) return;
    setFormError('');
    if (!validateFormData()) return;
    
    try {
      setActionLoading(editingTourism.id);
      const updateData: any = {
        name: formData.name, description: formData.description,
        wereda: formData.wereda, kebele: formData.kebele, categories: formData.categories,
        bestTime: formData.bestTime, peaceInfo: formData.peaceInfo, visitTime: formData.visitTime,
        languages: formData.languages, imageUrl: (formData as any).imageUrl, status: (formData as any).status
      };
      await AdminTourismService.updateTourism(token, editingTourism.id, updateData);
      setFormSuccess('Tourism place updated successfully!');
      await loadTourisms();
      setTimeout(() => {
        setShowModal(false);
        setEditingTourism(null);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update tourism place');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tourismId: number) => {
    if (!token) return;
    const ok = await confirm({ message: 'Are you sure you want to delete this tourism place?', variant: 'danger', title: 'Delete Tourism Place', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(tourismId);
      await AdminTourismService.deleteTourism(token, tourismId);
      toast.success('Tourism place deleted');
      await loadTourisms();
    } catch (err) {
      toast.error('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (tourism: Tourism) => {
    setEditingTourism(tourism);
    const langs = tourism.languages || [];
    setFormData({
      name: tourism.name, description: tourism.description,
      wereda: tourism.wereda, kebele: tourism.kebele, categories: (tourism as any).categories || [],
      bestTime: tourism.bestTime || '', peaceInfo: tourism.peaceInfo || '',
      visitTime: tourism.visitTime || '', languages: langs,
      imageUrl: (tourism as any).imageUrl || '', status: (tourism as any).status || 'ACTIVE'
    });
    setLanguagesRaw(langs.join(', '));
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', wereda: '', kebele: '', categories: [],
      bestTime: '', peaceInfo: '', visitTime: '', languages: [],
      imageUrl: '', status: 'ACTIVE'
    });
    setLanguagesRaw('');
    setEditingTourism(null);
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLanguageChange = (lang: string) => {
    const langs = formData.languages || [];
    if (langs.includes(lang)) {
      setFormData({ ...formData, languages: langs.filter((l: any) => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...langs, lang] });
    }
  };

  const handleCategoryChange = (category: string) => {
    const cats = formData.categories || [];
    if (cats.includes(category)) {
      setFormData({ ...formData, categories: cats.filter((c: any) => c !== category) });
    } else {
      setFormData({ ...formData, categories: [...cats, category] });
    }
  };

  const filteredTourisms = tourisms
    .filter(tourism =>
      tourism.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourism.wereda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((tourism as any).categories || []).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'wereda': aVal = a.wereda || ''; bVal = b.wereda || ''; break;
        case 'category': aVal = ((a as any).categories || []).join(',') || ''; bVal = ((b as any).categories || []).join(',') || ''; break;
        case 'viewersCount': aVal = a.viewersCount || 0; bVal = b.viewersCount || 0; break;
        case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
        default: aVal = a.name || ''; bVal = b.name || '';
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const LANGUAGES = ['Amharic', 'English', 'Oromo', 'Tigrinya', 'Somali', 'Arabic'];
  const CATEGORIES = [
    { value: 'HERITAGE', label: 'Heritage Site' },
    { value: 'HIGHLAND', label: 'Highland' },
    { value: 'CAVERN', label: 'Cavern' },
    { value: 'AQUATICS', label: 'Aquatics' },
    { value: 'CULTURE', label: 'Cultural' },
    { value: 'MODERN', label: 'Modern' }
  ];

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Tourism Places" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => { setSearchTerm(value); setCurrentPage(0); }}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button onClick={() => router.push('/admin/hero-images')}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1">
              Hero Images
            </button>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1">
              + Add Tourism
            </button>
          </div>
        }
      />
      
      <div className="container mx-auto px-4 pt-4 pb-8">

      {/* Tourism Grid */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading tourism places...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white">
            <Alert type="error" message={error} />
            <button onClick={loadTourisms} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-black">Retry</button>
          </div>
        ) : filteredTourisms.length === 0 ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="font-black">No tourism places found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTourisms.map((tourism) => (
              <div key={tourism.id} className="rounded-xl overflow-hidden hover:shadow-sm transition-all duration-300 group bg-white border border-gray-200">
                <div className="h-36 bg-gray-100 flex items-center justify-center relative">
                  {tourism.images && tourism.images.length > 0 ? (
                    <img src={getImageUrl(typeof tourism.images[0] === 'string' ? tourism.images[0] : (tourism.images[0] as any).imageUrl)} alt={tourism.name} className="w-full h-full object-cover" />
                  ) : (tourism as any).imageUrl ? (
                    <img src={getImageUrl((tourism as any).imageUrl)} alt={tourism.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-300">No Image</span>
                  )}
                </div>
                <div className="p-3 bg-white border-t border-gray-200">
                  {/* Tourism Name */}
                  <h3 className="text-sm font-black text-gray-900 truncate">{tourism.name}</h3>

                  {/* Location */}
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {tourism.wereda}, {tourism.kebele}
                  </p>

                  {/* Categories */}
                  {((tourism as any).categories || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {((tourism as any).categories || []).slice(0, 2).map((cat: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 text-xs bg-white text-gray-700 rounded">
                          {cat}
                        </span>
                      ))}
                      {((tourism as any).categories || []).length > 2 && (
                        <span className="px-1.5 py-0.5 text-xs bg-white text-gray-600 rounded">
                          +{((tourism as any).categories || []).length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - all inline */}
                  <div className="mt-2.5 flex gap-1.5 flex-wrap">
                    <button onClick={() => router.push(`/admin/tourisms/${tourism.id}/images`)}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold transition-all border border-gray-200">
                      Images
                    </button>
                    <button onClick={() => openEditModal(tourism)}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold transition-all border border-gray-200">
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!token) return;
                        const isActive = (tourism as any).status !== 'BLOCKED';
                        const action = isActive ? 'block' : 'activate';
                        const ok = await confirm({ message: `Are you sure you want to ${action} this tourism place?`, variant: isActive ? 'warning' : 'info', title: `${isActive ? 'Block' : 'Activate'} Tourism Place`, confirmLabel: 'Yes', cancelLabel: 'No' });
                        if (!ok) return;
                        try {
                          setActionLoading(tourism.id);
                          await AdminTourismService.updateTourism(token, tourism.id, { status: isActive ? 'BLOCKED' : 'ACTIVE' } as any);
                          toast.success(`Tourism place ${isActive ? 'blocked' : 'activated'} successfully`);
                          await loadTourisms();
                        } catch (err) {
                          toast.error('Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                        } finally { setActionLoading(null); }
                      }}
                      disabled={actionLoading === tourism.id}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all border disabled:opacity-50 ${(tourism as any).status === 'BLOCKED' ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'}`}>
                      {actionLoading === tourism.id ? '...' : (tourism as any).status === 'BLOCKED' ? 'Activate' : 'Deactivate'}
                    </button>
                    <button onClick={() => handleDelete(tourism.id)} disabled={actionLoading === tourism.id}
                      className="flex-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition-all border border-red-200 disabled:opacity-50">
                      {actionLoading === tourism.id ? '...' : 'Delete'}
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
              <h3 className="text-xl font-black text-gray-900">
                {editingTourism ? 'Edit Tourism Place' : 'Add New Tourism Place'}
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

              <FormInput label="Name" name="name" value={formData.name} onChange={handleInputChange}
                error={formErrors.name} placeholder="Enter tourism place name" required
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />

              <FormInput label="Description" name="description" type="textarea" value={formData.description}
                onChange={handleInputChange} error={formErrors.description} placeholder="Describe the tourism place (min 20 characters)"
                required rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Wereda" name="wereda" value={formData.wereda} onChange={handleInputChange}
                  error={formErrors.wereda} placeholder="Enter wereda" required
                  icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
                />
                <FormInput label="Kebele" name="kebele" value={formData.kebele} onChange={handleInputChange}
                  error={formErrors.kebele} placeholder="Enter kebele" required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categories <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat.value} className={`inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                        formData.categories?.includes(cat.value) 
                          ? 'bg-purple-100 border-purple-400 text-purple-800' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300'
                      }`}>
                        <input type="checkbox" checked={formData.categories?.includes(cat.value) || false}
                          onChange={() => handleCategoryChange(cat.value)} className="sr-only" />
                        <span className="text-sm font-semibold">{cat.label}</span>
                        {formData.categories?.includes(cat.value) && (
                          <svg className="w-4 h-4 ml-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                  {formErrors.categories && <p className="text-red-500 text-sm font-semibold mt-1">{formErrors.categories}</p>}
                </div>
                <FormInput label="Best Time to Visit" name="bestTime" type="textarea" value={formData.bestTime || ''}
                  onChange={handleInputChange} placeholder="e.g., October - March (Dry season, clear skies)" rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Visit Duration" name="visitTime" type="textarea" value={formData.visitTime || ''}
                  onChange={handleInputChange} placeholder="e.g., 2-3 hours, half day, full day" rows={3}
                />
                <FormInput label="Peace Info" name="peaceInfo" type="textarea" value={formData.peaceInfo || ''}
                  onChange={handleInputChange} placeholder="Safety information, security details" rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Languages Spoken</label>
                <input
                  type="text"
                  value={languagesRaw}
                  onChange={(e) => setLanguagesRaw(e.target.value)}
                  onBlur={(e) => {
                    const langs = e.target.value.split(',').map(l => l.trim()).filter(l => l.length > 0);
                    setFormData({ ...formData, languages: langs });
                  }}
                  placeholder="Enter languages separated by commas (e.g., Amharic, English, Oromo)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                />
              </div>

              {/* Status Selection */}
              <FormInput label="Status" name="status" type="select" value={(formData as any).status || 'ACTIVE'}
                onChange={handleInputChange} options={STATUS_OPTIONS}
              />

              {/* Main Image */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <ImageUpload
                  label="Main Image"
                  currentImageUrl={(formData as any).imageUrl || ''}
                  onUpload={async (file) => {
                    if (editingTourism) {
                      // Upload immediately for existing tourism
                      return await AdminImageUploadService.uploadTourismMainImage(token!, editingTourism.id, file);
                    } else {
                      // For new tourism, store file temporarily and upload after creation
                      (window as any).__pendingTourismMainImage = file;
                      return URL.createObjectURL(file);
                    }
                  }}
                  onUrlChange={(url) => setFormData((prev: any) => ({ ...prev, imageUrl: url }))}
                />
              </div>

              {/* Note about internal images - removed */}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-end space-x-2 z-10">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={editingTourism ? handleUpdate : handleCreate}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-semibold text-sm transition-all"
              >
                {actionLoading !== null ? 'Saving...' : editingTourism ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TourismsManagementPage;
