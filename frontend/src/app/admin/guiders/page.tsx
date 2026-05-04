"use client";

import React, { useState, useEffect } from 'react';
import { AdminGuiderService, AdminTourismService, Guider, GuiderCreateDto, GuiderUpdateDto, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
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
      setTourisms(response.content || []);
      if (response.content && response.content.length > 0) {
        setSelectedTourismId(response.content[0].id);
      }
    } catch (err) {
      console.error('Failed to load tourisms:', err);
    } finally {
      setLoading(false);
    }
  };

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
    const ok = await confirm({ message: 'Are you sure you want to delete this guider?', variant: 'danger', title: 'Delete Guider', confirmLabel: 'Delete' });
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
            <h1 className="text-lg font-black text-gray-900 mb-0.5">Guiders Management</h1>
            <p className="text-gray-600 text-sm">Manage tour guides and language specialists</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} disabled={!selectedTourismId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-black shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Guider
          </button>
        </div>
      </div>

      {/* Tourism Selector */}
      <div className="bg-purple-100 rounded-xl shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-black text-gray-900 mb-1">Select Tourism Place</label>
            <select value={selectedTourismId || ''} onChange={(e) => setSelectedTourismId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border-2 border-purple-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold bg-white shadow-sm">
              <option value="">-- Select a tourism place --</option>
              {tourisms.map(tourism => (
                <option key={tourism.id} value={tourism.id}>{tourism.name} ({tourism.wereda})</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search guiders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* Guiders Table */}
      <div className="bg-purple-100 rounded-xl shadow-xl overflow-hidden">
        {!selectedTourismId ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <p className="text-lg font-black">Please select a tourism place to view its guiders</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading guiders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white">
            <Alert type="error" message={error} />
            <button onClick={() => selectedTourismId && loadGuiders(selectedTourismId)} className="mt-4 bg-purple-200 text-purple-800 px-4 py-2 rounded-md font-black shadow-md">Retry</button>
          </div>
        ) : filteredGuiders.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <p className="text-lg mb-4 font-black">No guiders found for {getSelectedTourismName()}</p>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-purple-200 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-300 font-black shadow-md">Add First Guider</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-200">
              <thead className="bg-purple-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-purple-900 uppercase tracking-wider">Guider</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-purple-900 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-purple-900 uppercase tracking-wider">Languages</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-purple-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-purple-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-100">
                {filteredGuiders.map((guider) => (
                  <tr key={guider.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-black">{guider.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-black text-gray-900">{guider.name}</div>
                          <div className="text-xs text-purple-700 font-bold">ID: {guider.id}</div>
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
                      <div className="flex flex-wrap gap-1">
                        {guider.languages?.slice(0, 3).map(lang => (
                          <span key={lang} className="px-2 py-1 text-xs bg-blue-200 text-blue-900 rounded-full font-black shadow-sm">{lang}</span>
                        ))}
                        {guider.languages && guider.languages.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full font-black shadow-sm">+{guider.languages.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-black rounded-full shadow-sm ${guider.active ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                        {guider.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => openEditModal(guider)} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg font-black hover:bg-blue-300 shadow-md">Edit</button>
                        <button onClick={() => handleDelete(guider.id)} disabled={actionLoading === guider.id}
                          className="bg-red-200 text-red-800 px-3 py-1 rounded-lg font-black hover:bg-red-300 shadow-md disabled:opacity-50">
                          {actionLoading === guider.id ? '...' : 'Delete'}
                        </button>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300">
            <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editingGuider ? 'Edit Guider' : 'Add New Guider'}
                </h3>
                <p className="text-sm text-gray-600 font-semibold mt-1">Tourism Place: {getSelectedTourismName()}</p>
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
                helpText="Enter first and last name (at least 2 words, each 2+ letters)"
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

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Languages Spoken <span className="text-red-500 font-black">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className={`inline-flex items-center px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors font-semibold ${
                      formData.languages?.includes(lang) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-400 hover:bg-gray-100'
                    }`}>
                      <input type="checkbox" checked={formData.languages?.includes(lang) || false}
                        onChange={() => handleLanguageChange(lang)} className="sr-only" />
                      <span className="text-sm font-semibold">{lang}</span>
                      {formData.languages?.includes(lang) && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
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
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type any language and press Enter or click Add</p>
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
                <div className="flex items-center border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                  <input type="checkbox" id="active" checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded" />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900 font-bold">Active (available for tours)</label>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-100 border-t-2 border-gray-300 px-6 py-4 flex justify-end space-x-3">
              <FormButton variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</FormButton>
              <FormButton variant="primary" onClick={editingGuider ? handleUpdate : handleCreate}
                loading={actionLoading !== null} disabled={actionLoading !== null}>
                {editingGuider ? 'Update Guider' : 'Create Guider'}
              </FormButton>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GuidersManagementPage;
