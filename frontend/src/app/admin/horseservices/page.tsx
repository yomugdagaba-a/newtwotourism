"use client";

import React, { useState, useEffect } from 'react';
import { AdminHorseServiceService, AdminRoadService, AdminTourismService, HorseService, HorseServiceCreateDto, HorseServiceUpdateDto, Road, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { 
  validateFullName, 
  validateEthiopianPhone, 
  validatePlaceName, 
  validateCost,
  handleNameKeyDown,
  handlePhoneKeyDown,
  handleNumericKeyDown,
  filterNumericInput,
  formatPhoneInput,
  hasValidationErrors,
  ValidationResult
} from '../../../utils/ethiopianValidation';

const HorseServicesManagementPage = () => {
  const [horseServices, setHorseServices] = useState<HorseService[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [loading, setLoading] = useState(true);
  const [roadsLoading, setRoadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourismId, setSelectedTourismId] = useState<number | null>(null);
  const [selectedRoadId, setSelectedRoadId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<HorseService | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formData, setFormData] = useState<HorseServiceCreateDto>({
    ownerName: '', contactInfo: '', initialPlace: '', cost: 0, roadInfoId: 0
  });
  const [formErrors, setFormErrors] = useState<ValidationResult>({});

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
    if (selectedTourismId) {
      loadRoads(selectedTourismId);
    } else {
      setRoads([]);
      setSelectedRoadId(null);
    }
  }, [selectedTourismId]);

  useEffect(() => {
    if (selectedRoadId) {
      loadHorseServices(selectedRoadId);
    } else {
      setHorseServices([]);
    }
  }, [selectedRoadId]);

  const loadTourisms = async () => {
    if (!token) return;
    try {
      const response = await AdminTourismService.getAllTourism(token, 0, 100);
      setTourisms(response.content || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load tourisms:', err);
      setLoading(false);
    }
  };

  const loadRoads = async (tourismId: number) => {
    if (!token) {
      console.error('No token available for loading roads');
      return;
    }
    try {
      setRoadsLoading(true);
      console.log('Loading roads for tourism ID:', tourismId);
      const roadsList = await AdminRoadService.getRoadsByTourism(token, tourismId);
      console.log('Roads loaded:', roadsList);
      setRoads(roadsList || []);
      if (roadsList && roadsList.length > 0) {
        setSelectedRoadId(roadsList[0].id);
      } else {
        setSelectedRoadId(null);
        console.log('No roads found for this tourism place');
      }
    } catch (err) {
      console.error('Failed to load roads:', err);
      setRoads([]);
      setSelectedRoadId(null);
    } finally {
      setRoadsLoading(false);
    }
  };

  const loadHorseServices = async (roadId: number) => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const services = await AdminHorseServiceService.getHorseServicesByRoad(token, roadId);
      setHorseServices(services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load horse services');
      setHorseServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !selectedRoadId) return;
    if (!validateFormData()) return;
    
    try {
      setActionLoading(-1);
      await AdminHorseServiceService.createHorseService(token, { ...formData, roadInfoId: selectedRoadId });
      await loadHorseServices(selectedRoadId);
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert('Failed to create horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingService || !selectedRoadId) return;
    if (!validateFormData()) return;
    
    try {
      setActionLoading(editingService.id);
      const updateData: HorseServiceUpdateDto = {
        ownerName: formData.ownerName, contactInfo: formData.contactInfo,
        initialPlace: formData.initialPlace, cost: formData.cost, roadInfoId: selectedRoadId
      };
      await AdminHorseServiceService.updateHorseService(token, editingService.id, updateData);
      await loadHorseServices(selectedRoadId);
      setShowModal(false);
      setEditingService(null);
      resetForm();
    } catch (err) {
      alert('Failed to update horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (!token || !selectedRoadId) return;
    if (!confirm('Are you sure you want to delete this horse service?')) return;
    try {
      setActionLoading(serviceId);
      await AdminHorseServiceService.deleteHorseService(token, serviceId);
      await loadHorseServices(selectedRoadId);
    } catch (err) {
      alert('Failed to delete horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (service: HorseService) => {
    setEditingService(service);
    setFormData({
      ownerName: service.ownerName, contactInfo: service.contactInfo,
      initialPlace: service.initialPlace, cost: service.cost, roadInfoId: service.roadInfoId || selectedRoadId || 0
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ ownerName: '', contactInfo: '', initialPlace: '', cost: 0, roadInfoId: selectedRoadId || 0 });
    setEditingService(null);
    setFormErrors({});
  };

  // Validate form data
  const validateFormData = (): boolean => {
    const errors: ValidationResult = {};
    
    // Validate owner name (full name with at least 2 words)
    const nameResult = validateFullName(formData.ownerName);
    if (!nameResult.valid) errors.ownerName = nameResult.error;
    
    // Validate Ethiopian phone number
    const phoneResult = validateEthiopianPhone(formData.contactInfo);
    if (!phoneResult.valid) errors.contactInfo = phoneResult.error;
    
    // Validate initial place
    const placeResult = validatePlaceName(formData.initialPlace);
    if (!placeResult.valid) errors.initialPlace = placeResult.error;
    
    // Validate cost
    const costResult = validateCost(formData.cost, 'Cost');
    if (!costResult.valid) errors.cost = costResult.error;
    
    setFormErrors(errors);
    return !hasValidationErrors(errors);
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof HorseServiceCreateDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle phone input with formatting
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    handleInputChange('contactInfo', formatted);
  };

  // Handle cost input (only numbers)
  const handleCostChange = (value: string) => {
    const filtered = filterNumericInput(value, true);
    handleInputChange('cost', parseFloat(filtered) || 0);
  };

  const getSelectedRoadName = () => {
    const road = roads.find(r => r.id === selectedRoadId);
    return road ? `${road.initialPlace} (${road.roadType})` : 'Select a road';
  };

  const filteredServices = horseServices.filter(service =>
    service.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.initialPlace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.contactInfo?.includes(searchTerm)
  );

  if (!isAuthenticated || role !== 'ADMIN') {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-white admin-page">
      <div className="container mx-auto px-4 pt-4 pb-8">
      <div className="mb-8 bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-1 transition-colors font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-bold">Back to Dashboard</span>
            </button>
            <h1 className="text-lg font-black text-gray-900 mb-0.5">Horse Services Management</h1>
            <p className="text-gray-600 text-sm">Manage horse rental and transportation services</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            disabled={!selectedRoadId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-black shadow-lg"
          >+ Add Horse Service</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-amber-100 rounded-xl shadow-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">Tourism Place</label>
            <select
              value={selectedTourismId || ''}
              onChange={(e) => setSelectedTourismId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border-2 border-amber-300 rounded-lg px-4 py-2 font-bold bg-white shadow-sm"
            >
              <option value="">-- Select tourism place --</option>
              {tourisms.map(tourism => (
                <option key={tourism.id} value={tourism.id}>{tourism.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">Road</label>
            <div className="relative">
              <select
                value={selectedRoadId || ''}
                onChange={(e) => setSelectedRoadId(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!selectedTourismId || roadsLoading}
                className="w-full border-2 border-amber-300 rounded-lg px-4 py-2 disabled:opacity-50 font-bold bg-white shadow-sm"
              >
                {roadsLoading ? (
                  <option value="">Loading roads...</option>
                ) : roads.length === 0 ? (
                  <option value="">-- No roads available --</option>
                ) : (
                  <>
                    <option value="">-- Select road --</option>
                    {roads.map(road => (
                      <option key={road.id} value={road.id}>{road.initialPlace} ({road.roadType})</option>
                    ))}
                  </>
                )}
              </select>
              {roadsLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {selectedTourismId && !roadsLoading && roads.length === 0 && (
              <p className="text-sm text-orange-700 mt-1 font-bold">
                No roads found for this tourism place. <a href="/admin/roads" className="underline text-blue-700 hover:text-blue-900">Create roads first</a>.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by owner, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-amber-300 rounded-lg px-4 py-2 font-bold bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Horse Services Grid */}
      <div className="bg-amber-100 rounded-xl shadow-xl overflow-hidden">
        {!selectedRoadId ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <p className="font-black">Please select a tourism place and road to view horse services</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading horse services...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-700 font-bold bg-white">
            <p>Error: {error}</p>
            <button onClick={() => selectedRoadId && loadHorseServices(selectedRoadId)} className="mt-4 bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-black shadow-md">Retry</button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <p className="font-black">No horse services found for {getSelectedRoadName()}</p>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="mt-4 bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-black shadow-md">Add First Horse Service</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="rounded-xl overflow-hidden hover:shadow-xl transition-shadow bg-white shadow-lg">
                <div className="h-32 bg-gradient-to-r from-amber-200 to-orange-200 flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-800">Horse Service</span>
                </div>
                <div className="p-4 bg-amber-50 shadow-inner">
                  <h3 className="text-lg font-black text-gray-900">{service.ownerName}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-800 font-bold">
                    <p>{service.initialPlace}</p>
                    <p>{service.contactInfo}</p>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 text-lg font-black text-green-800 bg-green-200 rounded-full shadow-sm">{service.cost} ETB</span>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => openEditModal(service)} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-black hover:bg-blue-300 shadow-md">Edit</button>
                    <button onClick={() => handleDelete(service.id)} disabled={actionLoading === service.id} className="bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm font-black hover:bg-red-300 shadow-md disabled:opacity-50">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-300 shadow-2xl">
            <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 px-6 py-4">
              <h3 className="text-lg font-black">{editingService ? 'Edit Horse Service' : 'Add New Horse Service'}</h3>
              <p className="text-sm text-gray-600 font-bold mt-1">Road: {getSelectedRoadName()}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Owner Full Name *</label>
                <input 
                  type="text" 
                  value={formData.ownerName} 
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  className={`w-full border-2 rounded-lg px-3 py-2 font-semibold ${formErrors.ownerName ? 'border-red-500 bg-red-50' : 'border-gray-400'}`}
                  placeholder="e.g., Abebe Kebede"
                  required 
                />
                {formErrors.ownerName && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.ownerName}</p>}
                <p className="text-gray-500 text-xs mt-1 font-semibold">Enter first and last name (at least 2 words, each 2+ letters)</p>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Contact Phone *</label>
                <input 
                  type="tel" 
                  value={formData.contactInfo} 
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  className={`w-full border-2 rounded-lg px-3 py-2 font-semibold ${formErrors.contactInfo ? 'border-red-500 bg-red-50' : 'border-gray-400'}`}
                  placeholder="09XXXXXXXX or 07XXXXXXXX"
                  required 
                />
                {formErrors.contactInfo && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.contactInfo}</p>}
                <p className="text-gray-500 text-xs mt-1 font-semibold">Ethiopian phone: Ethio Telecom (09X) or Safaricom (07X)</p>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Initial Place *</label>
                <input 
                  type="text" 
                  value={formData.initialPlace} 
                  onChange={(e) => handleInputChange('initialPlace', e.target.value)}
                  className={`w-full border-2 rounded-lg px-3 py-2 font-semibold ${formErrors.initialPlace ? 'border-red-500 bg-red-50' : 'border-gray-400'}`}
                  placeholder="Starting location"
                  required 
                />
                {formErrors.initialPlace && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.initialPlace}</p>}
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Cost (ETB) *</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={formData.cost || ''} 
                  onChange={(e) => handleCostChange(e.target.value)}
                  onKeyDown={(e) => handleNumericKeyDown(e, true)}
                  className={`w-full border-2 rounded-lg px-3 py-2 font-semibold ${formErrors.cost ? 'border-red-500 bg-red-50' : 'border-gray-400'}`}
                  placeholder="Enter cost in ETB"
                  required 
                />
                {formErrors.cost && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.cost}</p>}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-100 border-t-2 border-gray-300 px-6 py-4 flex justify-end space-x-3">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 hover:text-gray-900 border-2 border-gray-400 rounded-lg font-bold">Cancel</button>
              <button 
                onClick={editingService ? handleUpdate : handleCreate} 
                disabled={actionLoading !== null} 
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-black border-2 border-blue-300"
              >
                {editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HorseServicesManagementPage;
