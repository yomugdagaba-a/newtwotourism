"use client";

import React, { useState, useEffect } from 'react';
import { AdminGuiderService, AdminTourismService, Guider, GuiderCreateDto, GuiderUpdateDto, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import { ValidationErrors } from '@/utils/validation';
import {
  validateFullName,
  validateEthiopianPhone,
  validateLanguages,
  handleNameKeyDown,
  handlePhoneKeyDown,
  formatPhoneInput,
  hasValidationErrors,
  ValidationResult
} from '../../../utils/ethiopianValidation';

const GuidersManagementPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [guiders, setGuiders] = useState<Guider[]>([]);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourismId, setSelectedTourismId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTourismTerm, setSearchTourismTerm] = useState('');
  const [showTourismDropdown, setShowTourismDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGuider, setEditingGuider] = useState<Guider | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<GuiderCreateDto>({
    name: '', contactInfo: '', languages: [], experience: '', active: true, tourismPlaceId: undefined
  });

  const { token, role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const LANGUAGES = ['Amharic', 'English', 'Oromo', 'Tigrinya', 'Somali', 'Arabic', 'French', 'German', 'Italian', 'Spanish'];
  const [customLanguage, setCustomLanguage] = useState('');

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadTourisms();
  }, [isAuthenticated, role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tourism-dropdown-container')) {
        setShowTourismDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedTourismId) {
      loadGuiders(selectedTourismId);
    } else {
      setGuiders([]);
    }
  }, [selectedTourismId]);

  const loadTourisms = async () => {
    if (!token) return;
    try {
      const response = await AdminTourismService.getAllTourism(token, 0, 100);
      const sortedTourisms = (response.content || []).sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );
      setTourisms(sortedTourisms);
      // Don't auto-select - let admin choose
      // if (sortedTourisms.length > 0) {
      //   setSelectedTourismId(sortedTourisms[0].id);
      //   setSearchTourismTerm(sortedTourisms[0].name);
      // }
    } catch (err) {
      console.error('Failed to load tourisms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tourisms based on search term
  const filteredTourisms = tourisms.filter(t =>
    t.name?.toLowerCase().includes(searchTourismTerm.toLowerCase()) ||
    t.wereda?.toLowerCase().includes(searchTourismTerm.toLowerCase())
  );

  const loadGuiders = async (tourismId: number) => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const guidersList = await AdminGuiderService.getGuidersByTourism(token, tourismId);
      setGuiders(guidersList || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guiders');
      setGuiders([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate form data with Ethiopian validation
  const validateFormData = (): boolean => {
    const errors: ValidationResult = {};
    
    // Validate full name (at least 2 words, each 2+ letters)
    const nameResult = validateFullName(formData.name);
    if (!nameResult.valid) errors.name = nameResult.error;
    
    // Validate Ethiopian phone number
    const phoneResult = validateEthiopianPhone(formData.contactInfo);
    if (!phoneResult.valid) errors.contactInfo = phoneResult.error;
    
    // Validate languages
    const langResult = validateLanguages(formData.languages || []);
    if (!langResult.valid) errors.languages = langResult.error;
    
    setFormErrors(errors as ValidationErrors);
    return !hasValidationErrors(errors);
  };

  const handleCreate = async () => {
    if (!token) return;
    setFormError('');
    if (!validateFormData()) return;
    if (!selectedTourismId) { setFormError('Please select a tourism place first.'); return; }
    
    try {
      setActionLoading(-1);
      await AdminGuiderService.createGuider(token, { ...formData, tourismPlaceId: selectedTourismId });
      setFormSuccess('Guider created successfully!');
      await loadGuiders(selectedTourismId);
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create guider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingGuider || !selectedTourismId) return;
    setFormError('');
    if (!validateFormData()) return;
    
    try {
      setActionLoading(editingGuider.id);
      const updateData: GuiderUpdateDto = {
        name: formData.name, contactInfo: formData.contactInfo,
        experience: formData.experience,
        languages: formData.languages, active: formData.active
      };
      await AdminGuiderService.updateGuider(token, editingGuider.id, updateData);
      setFormSuccess('Guider updated successfully!');
      await loadGuiders(selectedTourismId);
      setTimeout(() => {
        setShowModal(false);
        setEditingGuider(null);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update guider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (guiderId: number) => {
    if (!token || !selectedTourismId) return;
    const ok = await confirm({ message: 'Are you sure you want to delete this guider?', variant: 'danger', title: 'Delete Guider', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(guiderId);
      await AdminGuiderService.deleteGuider(token, guiderId);
      toast.success('Guider deleted successfully');
      await loadGuiders(selectedTourismId);
    } catch (err) {
      toast.error('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (guiderId: number, currentStatus: boolean) => {
    if (!token || !selectedTourismId) return;
    const action = currentStatus ? 'deactivate' : 'activate';
    const ok = await confirm({ 
      message: `Are you sure you want to ${action} this guider? ${currentStatus ? 'The guider will not be visible to clients.' : 'The guider will be visible to clients.'}`, 
      variant: currentStatus ? 'warning' : 'info', 
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Guider`, 
      confirmLabel: 'Yes', 
      cancelLabel: 'No' 
    });
    if (!ok) return;
    try {
      setActionLoading(guiderId);
      await AdminGuiderService.toggleGuiderActive(token, guiderId);
      toast.success(`Guider ${action}d successfully`);
      await loadGuiders(selectedTourismId);
    } catch (err) {
      toast.error(`Failed to ${action}: ` + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (guider: Guider) => {
    setEditingGuider(guider);
    setFormData({
      name: guider.name, contactInfo: guider.contactInfo,
      experience: guider.experience,
      languages: guider.languages || [], active: guider.active
    });
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', contactInfo: '', languages: [], experience: '', active: true, tourismPlaceId: undefined });
    setEditingGuider(null);
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
    setCustomLanguage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleLanguageChange = (lang: string) => {
    const langs = formData.languages || [];
    if (langs.includes(lang)) {
      setFormData({ ...formData, languages: langs.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...langs, lang] });
    }
    if (formErrors.languages) {
      setFormErrors(prev => ({ ...prev, languages: '' }));
    }
  };

  const getSelectedTourismName = () => {
    const tourism = tourisms.find(t => t.id === selectedTourismId);
    return tourism ? tourism.name : 'Select a tourism place';
  };

  const filteredGuiders = guiders.filter(guider =>
    guider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guider.contactInfo?.includes(searchTerm)
  );

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Guiders Management" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => setSearchTerm(value)}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center flex-1 justify-end">
            <button onClick={() => { resetForm(); setShowModal(true); }} disabled={!selectedTourismId}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1 disabled:opacity-40">
              + Add Guider
            </button>
          </div>
        }
      />
      
      <div className="container mx-auto px-4 pt-4 pb-8">

      {/* Tourism Selector - Compact inline version with search */}
      <div className="mb-6 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Select Tourism Place:</label>
        <div className="relative flex-1 max-w-md tourism-dropdown-container">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter tourism places..."
            value={searchTourismTerm}
            onChange={(e) => setSearchTourismTerm(e.target.value)}
            onFocus={() => setShowTourismDropdown(true)}
            className="w-full border-0 bg-gray-50 text-gray-900 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-200 text-sm"
          />
          {showTourismDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredTourisms.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No tourism places found</div>
              ) : (
                filteredTourisms.map(tourism => (
                  <div
                    key={tourism.id}
                    onClick={() => {
                      setSelectedTourismId(tourism.id);
                      setSearchTourismTerm(tourism.name);
                      setShowTourismDropdown(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                      selectedTourismId === tourism.id ? 'bg-blue-100 font-semibold' : ''
                    }`}
                  >
                    {tourism.name} ({tourism.wereda})
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Guiders Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        {!selectedTourismId ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <p className="text-lg font-black">Please select a tourism place to view language guiders or to add a new guider</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading guiders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white">
            <Alert type="error" message={error} />
            <button onClick={() => selectedTourismId && loadGuiders(selectedTourismId)} className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-bold border border-gray-300">Retry</button>
          </div>
        ) : filteredGuiders.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <p className="text-lg font-black text-gray-500">No guiders found for {getSelectedTourismName()}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Guider</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Languages</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredGuiders.map((guider) => (
                  <tr key={guider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-black">{guider.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-black text-gray-900">{guider.name}</div>
                          <div className="text-xs text-gray-600 font-bold">ID: {guider.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {guider.contactInfo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-x-1">
                        {guider.languages?.slice(0, 3).map((lang, i, arr) => (
                          <span key={lang} className="text-xs text-gray-700 font-medium">
                            {lang}{i < arr.length - 1 || (guider.languages.length > 3) ? ',' : ''}
                          </span>
                        ))}
                        {guider.languages?.length > 3 && (
                          <span className="text-xs text-gray-400 font-medium">+{guider.languages.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${guider.active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                        {guider.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => openEditModal(guider)} className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg font-black transition-colors">Edit</button>
                        <button onClick={() => handleDelete(guider.id)} disabled={actionLoading === guider.id}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                          {actionLoading === guider.id ? '...' : 'Delete'}
                        </button>
                        {guider.active ? (
                          <button onClick={() => handleToggleActive(guider.id, guider.active)} disabled={actionLoading === guider.id}
                            className="text-orange-600 hover:text-orange-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                            {actionLoading === guider.id ? '...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button onClick={() => handleToggleActive(guider.id, guider.active)} disabled={actionLoading === guider.id}
                            className="text-green-600 hover:text-green-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                            {actionLoading === guider.id ? '...' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editingGuider ? 'Edit Guider' : 'Add New Guider'}
                </h3>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 font-bold">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {formSuccess && <Alert type="success" message={formSuccess} />}
              {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

              <FormInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange}
                error={formErrors.name} placeholder="e.g., Abebe Kebede" required
                onKeyDown={handleNameKeyDown}
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

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
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-400 bg-white ${formErrors.contactInfo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Phone number"
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Languages Spoken <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.languages?.includes(lang) 
                        ? 'bg-purple-100 border-purple-300 text-purple-800' 
                        : 'bg-purple-50 border-purple-200 text-gray-700 hover:bg-purple-100 hover:border-purple-300'
                    }`}>
                      <input type="checkbox" checked={formData.languages?.includes(lang) || false}
                        onChange={() => handleLanguageChange(lang)} className="sr-only" />
                      <span className="text-xs font-medium">{lang}</span>
                      {formData.languages?.includes(lang) && (
                        <svg className="w-3.5 h-3.5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
                {formErrors.languages && (
                  <p className="mt-1 text-sm text-red-600 font-semibold flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.languages}
                  </p>
                )}

                {/* Add custom language */}
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Add Other Language</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      placeholder="e.g., Japanese, Portuguese, Swahili..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const lang = customLanguage.trim();
                          if (lang && !formData.languages?.includes(lang)) {
                            setFormData(prev => ({ ...prev, languages: [...(prev.languages || []), lang] }));
                          }
                          setCustomLanguage('');
                        }
                      }}
                    />
                    <button type="button"
                      onClick={() => {
                        const lang = customLanguage.trim();
                        if (lang && !formData.languages?.includes(lang)) {
                          setFormData(prev => ({ ...prev, languages: [...(prev.languages || []), lang] }));
                        }
                        setCustomLanguage('');
                      }}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700">
                      Add
                    </button>
                  </div>
                  {/* Show custom languages */}
                  {formData.languages?.filter(l => !LANGUAGES.includes(l)).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.languages.filter(l => !LANGUAGES.includes(l)).map(lang => (
                        <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-400 text-green-800 rounded-full text-xs font-bold">
                          {lang}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, languages: prev.languages?.filter(l2 => l2 !== lang) || [] }))} className="hover:text-red-600 font-black">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {editingGuider && (
                <div className="flex items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <input type="checkbox" id="active" checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded" />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900 font-bold">Active (available for tours)</label>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-end space-x-2 z-10">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={editingGuider ? handleUpdate : handleCreate}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-semibold text-sm transition-all"
              >
                {actionLoading !== null ? 'Saving...' : editingGuider ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GuidersManagementPage;
