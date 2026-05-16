"use client";

import React, { useState, useEffect } from 'react';
import { AdminRoadService, AdminTourismService, Road, RoadCreateDto, RoadUpdateDto, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import FormInput, { FormButton, Alert } from '@/components/common/FormInput';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import { ValidationErrors } from '@/utils/validation';
import {
  validatePlaceName,
  validateDistance,
  handleNumericKeyDown,
  filterNumericInput,
  hasValidationErrors,
  ValidationResult
} from '../../../utils/ethiopianValidation';

const ROAD_TYPES = [
  { value: 'CAR', label: '🚗 Car Route', icon: '🚗' },
  { value: 'FOOT', label: '🚶 Walking Route', icon: '🚶' },
  { value: 'HORSE', label: '🐎 Horse Route', icon: '🐎' }
];

const RoadsManagementPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [roads, setRoads] = useState<Road[]>([]);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourismId, setSelectedTourismId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tourismSearch, setTourismSearch] = useState('');
  const [showTourismDrop, setShowTourismDrop] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRoad, setEditingRoad] = useState<Road | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<RoadCreateDto>({
    tourismPlaceId: selectedTourismId || 0,
    initialPlace: '',
    roadType: 'CAR',
    description: '',
    distanceByCar: undefined,
    distanceByFoot: undefined,
    distanceByPlane: undefined,
    distanceByHorse: undefined,
    totalDistance: undefined
  });

  const { token, role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadTourisms();
  }, [isAuthenticated, role]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.tourism-drop-roads')) setShowTourismDrop(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (selectedTourismId) {
      loadRoads(selectedTourismId);
    }
  }, [selectedTourismId]);

  const loadTourisms = async () => {
    if (!token) return;
    try {
      const response = await AdminTourismService.getAllTourism(token, 0, 100);
      const sorted = (response.content || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTourisms(sorted);
      if (sorted.length > 0) {
        setSelectedTourismId(sorted[0].id);
      }
    } catch (err) {
      console.error('Failed to load tourisms:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoads = async (tourismId: number) => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const roadsList = await AdminRoadService.getRoadsByTourism(token, tourismId);
      setRoads(roadsList || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roads');
      setRoads([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate form data with Ethiopian validation
  const validateFormData = (): boolean => {
    const errors: ValidationResult = {};
    
    // Validate initialPlace
    const nameResult = validatePlaceName(formData.initialPlace);
    if (!nameResult.valid) errors.initialPlace = nameResult.error;
    
    // Validate distances (optional but must be valid if provided)
    if (formData.distanceByCar !== undefined && formData.distanceByCar !== null) {
      const distResult = validateDistance(formData.distanceByCar, 'Distance by car');
      if (!distResult.valid) errors.distanceByCar = distResult.error;
    }
    if (formData.distanceByFoot !== undefined && formData.distanceByFoot !== null) {
      const distResult = validateDistance(formData.distanceByFoot, 'Distance by foot');
      if (!distResult.valid) errors.distanceByFoot = distResult.error;
    }
    if (formData.distanceByPlane !== undefined && formData.distanceByPlane !== null) {
      const distResult = validateDistance(formData.distanceByPlane, 'Distance by plane');
      if (!distResult.valid) errors.distanceByPlane = distResult.error;
    }
    if (formData.distanceByHorse !== undefined && formData.distanceByHorse !== null) {
      const distResult = validateDistance(formData.distanceByHorse, 'Distance by horse');
      if (!distResult.valid) errors.distanceByHorse = distResult.error;
    }
    if (formData.totalDistance !== undefined && formData.totalDistance !== null) {
      const distResult = validateDistance(formData.totalDistance, 'Total distance');
      if (!distResult.valid) errors.totalDistance = distResult.error;
    }
    
    setFormErrors(errors as ValidationErrors);
    return !hasValidationErrors(errors);
  }

  const handleCreate = async () => {
    if (!token) return;
    setFormError('');
    if (!validateFormData()) return;
    
    try {
      setActionLoading(-1);
      const dataToSend = { ...formData };
      if (selectedTourismId) {
        dataToSend.tourismPlaceId = selectedTourismId;
      }
      await AdminRoadService.createRoad(token, dataToSend);
      setFormSuccess('Road created successfully!');
      await loadRoads(selectedTourismId ?? 0);
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create road');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingRoad) return;
    setFormError('');
    if (!validateFormData()) return;
    
    try {
      setActionLoading(editingRoad.id);
      const updateData: RoadUpdateDto = {
        initialPlace: formData.initialPlace,
        roadType: formData.roadType,
        description: formData.description,
        distanceByCar: formData.distanceByCar,
        distanceByFoot: formData.distanceByFoot,
        distanceByPlane: formData.distanceByPlane,
        distanceByHorse: formData.distanceByHorse,
        totalDistance: formData.totalDistance
      };
      await AdminRoadService.updateRoad(token, editingRoad.id, updateData);
      setFormSuccess('Road updated successfully!');
      await loadRoads(selectedTourismId ?? 0);
      setTimeout(() => {
        setShowModal(false);
        setEditingRoad(null);
        resetForm();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update road');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (roadId: number) => {
    if (!token || !selectedTourismId) return;
    const ok = await confirm({ message: 'Are you sure you want to delete this road?', variant: 'danger', title: 'Delete Road', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(roadId);
      await AdminRoadService.deleteRoad(token, roadId);
      toast.success('Road deleted successfully');
      await loadRoads(selectedTourismId);
    } catch (err) {
      toast.error('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (road: Road) => {
    setEditingRoad(road);
    setFormData({
      tourismPlaceId: selectedTourismId || 0,
      initialPlace: road.initialPlace,
      roadType: road.roadType,
      description: road.description || '',
      distanceByCar: road.distanceByCar,
      distanceByFoot: road.distanceByFoot,
      distanceByPlane: road.distanceByPlane,
      distanceByHorse: road.distanceByHorse,
      totalDistance: road.totalDistance
    });
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      tourismPlaceId: selectedTourismId || 0,
      initialPlace: '',
      roadType: 'CAR',
      description: '',
      distanceByCar: undefined,
      distanceByFoot: undefined,
      distanceByPlane: undefined,
      distanceByHorse: undefined,
      totalDistance: undefined
    });
    setEditingRoad(null);
    setFormErrors({});
    setFormError('');
    setFormSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (['distanceByCar', 'distanceByFoot', 'distanceByPlane', 'distanceByHorse', 'totalDistance'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle distance input (only numbers with decimal)
  const handleDistanceChange = (name: string, value: string) => {
    const filtered = filterNumericInput(value, true);
    setFormData(prev => ({ ...prev, [name]: filtered ? parseFloat(filtered) : undefined }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const filteredRoads = roads.filter(road =>
    road.initialPlace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    road.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedTourismName = () => {
    const tourism = tourisms.find(t => t.id === selectedTourismId);
    return tourism ? tourism.name : 'Select a tourism place';
  };

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Roads Management" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => setSearchTerm(value)}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center flex-1 justify-end">
            <button onClick={() => { resetForm(); setShowModal(true); }} disabled={!selectedTourismId}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1 disabled:opacity-40">
              + Add Road
            </button>
          </div>
        }
      />
      
      <div className="container mx-auto px-4 pt-4 pb-8">

        {/* Tourism Selector - searchable */}
        <div className="mb-6 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Tourism Place:</label>
          <div className="relative flex-1 max-w-sm tourism-drop-roads">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter tourism places..."
              value={tourismSearch}
              onChange={(e) => setTourismSearch(e.target.value)}
              onFocus={() => setShowTourismDrop(true)}
              className="w-full border-0 bg-gray-50 text-gray-900 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-200 text-sm"
            />
            {showTourismDrop && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase()) || t.wereda?.toLowerCase().includes(tourismSearch.toLowerCase())).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                ) : tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase()) || t.wereda?.toLowerCase().includes(tourismSearch.toLowerCase())).map(t => (
                  <div key={t.id} onClick={() => { setSelectedTourismId(t.id); setTourismSearch(t.name); setShowTourismDrop(false); }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedTourismId === t.id ? 'bg-blue-100 font-semibold' : ''}`}>
                    {t.name} ({t.wereda})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roads Table */}
        <div className="bg-white rounded-xl overflow-hidden">
          {!selectedTourismId ? (
            <div className="p-8 text-center text-gray-800 font-bold bg-white">
              <p className="text-lg font-black">Please select a tourism place to view roads or to add a road/route</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-800 font-bold">Loading roads...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white">
              <Alert type="error" message={error} />
              <button onClick={() => selectedTourismId && loadRoads(selectedTourismId)} className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-bold border border-gray-300">Retry</button>
            </div>
          ) : filteredRoads.length === 0 ? (
            <div className="p-8 text-center text-gray-800 bg-white">
              <p className="text-lg font-black text-gray-500">No roads found for {getSelectedTourismName()}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Initial Place</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Distances</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRoads.map((road) => (
                    <tr key={road.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-black text-gray-900">Road #{road.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-green-800 font-black">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {road.initialPlace}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {road.distanceByCar && <span className="px-2 py-1 text-xs bg-gray-50 text-gray-900 rounded font-bold">By Car: {road.distanceByCar}km</span>}
                          {road.distanceByFoot && <span className="px-2 py-1 text-xs bg-gray-50 text-gray-900 rounded font-bold">By Foot: {road.distanceByFoot}km</span>}
                          {road.distanceByHorse && <span className="px-2 py-1 text-xs bg-gray-50 text-gray-900 rounded font-bold">By Horse: {road.distanceByHorse}km</span>}
                          {road.distanceByPlane && <span className="px-2 py-1 text-xs bg-gray-50 text-gray-900 rounded font-bold">By Plane: {road.distanceByPlane}km</span>}
                          {road.totalDistance && <span className="px-2 py-1 text-xs bg-gray-50 text-gray-900 rounded font-bold">Total: {road.totalDistance}km</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800 font-bold line-clamp-2 max-w-xs">{road.description || 'No description'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button onClick={() => openEditModal(road)} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg font-black hover:bg-blue-300 shadow-md">Edit</button>
                          <button onClick={() => handleDelete(road.id)} disabled={actionLoading === road.id}
                            className="bg-red-200 text-red-800 px-3 py-1 rounded-lg font-black hover:bg-red-300 shadow-md disabled:opacity-50">
                            {actionLoading === road.id ? '...' : 'Delete'}
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
          <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <h3 className="text-xl font-black text-gray-900">
                {editingRoad ? 'Edit Road' : 'Add New Road'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 font-bold">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              <div className="p-4 space-y-3">
                {formSuccess && <Alert type="success" message={formSuccess} />}
                {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

                <FormInput label="Initial Place" name="initialPlace" value={formData.initialPlace} onChange={handleInputChange}
                  error={formErrors.initialPlace} placeholder="Starting location (e.g., Addis Ababa)" required
                  icon={<svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-800 mb-1">Distance by Car (km)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formData.distanceByCar || ''} 
                      onChange={(e) => handleDistanceChange('distanceByCar', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, true)}
                      placeholder="0" 
                      className={`w-full bg-white border text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400 ${formErrors.distanceByCar ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    />
                    {formErrors.distanceByCar && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.distanceByCar}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-800 mb-1">Distance by Foot (km)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formData.distanceByFoot || ''} 
                      onChange={(e) => handleDistanceChange('distanceByFoot', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, true)}
                      placeholder="0" 
                      className={`w-full bg-white border text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400 ${formErrors.distanceByFoot ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    />
                    {formErrors.distanceByFoot && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.distanceByFoot}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-800 mb-1">Distance by Horse (km)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formData.distanceByHorse || ''} 
                      onChange={(e) => handleDistanceChange('distanceByHorse', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, true)}
                      placeholder="0" 
                      className={`w-full bg-white border text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400 ${formErrors.distanceByHorse ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    />
                    {formErrors.distanceByHorse && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.distanceByHorse}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-800 mb-1">Distance by Plane (km)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formData.distanceByPlane || ''} 
                      onChange={(e) => handleDistanceChange('distanceByPlane', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, true)}
                      placeholder="0" 
                      className={`w-full bg-white border text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400 ${formErrors.distanceByPlane ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    />
                    {formErrors.distanceByPlane && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.distanceByPlane}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-800 mb-1">Total Distance (km)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={formData.totalDistance || ''} 
                    onChange={(e) => handleDistanceChange('totalDistance', e.target.value)}
                    onKeyDown={(e) => handleNumericKeyDown(e, true)}
                    placeholder="0" 
                    className={`w-full bg-white border text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400 ${formErrors.totalDistance ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  />
                  {formErrors.totalDistance && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.totalDistance}</p>}
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-800 mb-1">Description</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleInputChange}
                    placeholder="Road conditions, landmarks, etc." rows={3}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-400" />
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
                onClick={editingRoad ? handleUpdate : handleCreate}
                disabled={actionLoading !== null}
                className="px-3 py-1.5 bg-white text-gray-900 rounded hover:bg-gray-50 disabled:opacity-50 font-semibold text-sm transition-all border border-gray-300"
              >
                {actionLoading !== null ? 'Saving...' : editingRoad ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default RoadsManagementPage;
