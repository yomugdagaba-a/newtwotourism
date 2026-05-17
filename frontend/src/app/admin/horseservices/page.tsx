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
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';

const HorseServicesManagementPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [horseServices, setHorseServices] = useState<HorseService[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [loading, setLoading] = useState(true);
  const [roadsLoading, setRoadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourismId, setSelectedTourismId] = useState<number | null>(null);
  const [selectedRoadId, setSelectedRoadId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tourismSearch, setTourismSearch] = useState('');
  const [showTourismDrop, setShowTourismDrop] = useState(false);
  const [roadSearch, setRoadSearch] = useState('');
  const [showRoadDrop, setShowRoadDrop] = useState(false);
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
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.tourism-drop-horse')) setShowTourismDrop(false);
      if (!t.closest('.road-drop-horse')) setShowRoadDrop(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (selectedTourismId) {
      loadRoads(selectedTourismId);
    } else {
      setRoads([]);
      setSelectedRoadId(null);
      setRoadSearch('');
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
      const sorted = (response.content || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTourisms(sorted);
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
      const sortedRoads = (roadsList || []).sort((a, b) => (a.initialPlace || '').localeCompare(b.initialPlace || ''));
      setRoads(sortedRoads);
      if (sortedRoads && sortedRoads.length > 0) {
        setSelectedRoadId(sortedRoads[0].id);
        setRoadSearch(`${sortedRoads[0].initialPlace} (${sortedRoads[0].roadType})`);
      } else {
        setSelectedRoadId(null);
        setRoadSearch('');
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
      toast.success('Horse service created');
      await loadHorseServices(selectedRoadId);
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to create horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
      toast.success('Horse service updated');
      await loadHorseServices(selectedRoadId);
      setShowModal(false);
      setEditingService(null);
      resetForm();
    } catch (err) {
      toast.error('Failed to update horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (!token || !selectedRoadId) return;
    const ok = await confirm({ message: 'Are you sure you want to delete this horse service?', variant: 'danger', title: 'Delete Horse Service', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(serviceId);
      await AdminHorseServiceService.deleteHorseService(token, serviceId);
      toast.success('Horse service deleted');
      await loadHorseServices(selectedRoadId);
    } catch (err) {
      toast.error('Failed to delete horse service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (serviceId: number, currentStatus: boolean) => {
    if (!token || !selectedRoadId) return;
    const action = currentStatus ? 'deactivate' : 'activate';
    const ok = await confirm({ 
      message: `Are you sure you want to ${action} this horse service? ${currentStatus ? 'The service will not be visible to clients.' : 'The service will be visible to clients.'}`, 
      variant: currentStatus ? 'warning' : 'info', 
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Horse Service`, 
      confirmLabel: 'Yes', 
      cancelLabel: 'No' 
    });
    if (!ok) return;
    try {
      setActionLoading(serviceId);
      await AdminHorseServiceService.toggleHorseServiceActive(token, serviceId);
      toast.success(`Horse service ${action}d successfully`);
      await loadHorseServices(selectedRoadId);
    } catch (err) {
      toast.error(`Failed to ${action}: ` + (err instanceof Error ? err.message : 'Unknown error'));
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
      <TopBar 
        showCategories={false} 
        showBackButton={false} 
        pageTitle="Horse Services" 
        showAdminMenu={true}
        keyword={searchTerm}
        onSearch={(value) => setSearchTerm(value)}
        liveSearch={true}
        actionButtons={
          <div className="flex items-center flex-1 justify-end">
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              disabled={!selectedRoadId}
              style={{ fontSize: '14px' }}
              className="text-gray-900 font-black hover:text-black transition-all whitespace-nowrap px-1 disabled:opacity-40"
            >
              + Add Horse Service
            </button>
          </div>
        }
      />

      <div className="container mx-auto px-4 pt-4 pb-8">

      {/* Filters - searchable dropdowns */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tourism Place:</label>
          <div className="relative tourism-drop-horse">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Filter tourism..." value={tourismSearch}
              onChange={(e) => setTourismSearch(e.target.value)} onFocus={() => setShowTourismDrop(true)}
              className="border-0 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-gray-200 bg-gray-50" />
            {showTourismDrop && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase())).length === 0
                  ? <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  : tourisms.filter(t => t.name?.toLowerCase().includes(tourismSearch.toLowerCase())).map(t => (
                    <div key={t.id} onClick={() => { setSelectedTourismId(t.id); setTourismSearch(t.name); setShowTourismDrop(false); }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedTourismId === t.id ? 'bg-blue-100 font-semibold' : ''}`}>
                      {t.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Road:</label>
          <div className="relative road-drop-horse">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder={!selectedTourismId ? 'Select tourism first' : roadsLoading ? 'Loading...' : 'Filter road...'}
              value={roadSearch} onChange={(e) => setRoadSearch(e.target.value)}
              onFocus={() => selectedTourismId && !roadsLoading && setShowRoadDrop(true)}
              disabled={!selectedTourismId || roadsLoading}
              className="border-0 bg-gray-50 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-gray-200 disabled:opacity-50 disabled:bg-gray-100" />
            {showRoadDrop && roads.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {roads.filter(r => r.initialPlace?.toLowerCase().includes(roadSearch.toLowerCase()) || r.roadType?.toLowerCase().includes(roadSearch.toLowerCase())).length === 0
                  ? <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  : roads.filter(r => r.initialPlace?.toLowerCase().includes(roadSearch.toLowerCase()) || r.roadType?.toLowerCase().includes(roadSearch.toLowerCase())).map(r => (
                    <div key={r.id} onClick={() => { setSelectedRoadId(r.id); setRoadSearch(`${r.initialPlace} (${r.roadType})`); setShowRoadDrop(false); }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedRoadId === r.id ? 'bg-blue-100 font-semibold' : ''}`}>
                      {r.initialPlace} ({r.roadType})
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Horse Services Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        {!selectedRoadId ? (
          <div className="p-8 text-center text-gray-800 font-bold bg-white">
            <p className="text-lg font-black">Please select a tourism place and road to view horse services or to add a new horse service</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading horse services...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white">
            <p className="text-red-700 font-bold">Error: {error}</p>
            <button onClick={() => selectedRoadId && loadHorseServices(selectedRoadId)} className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-bold border border-gray-300">Retry</button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <p className="text-lg mb-4 font-black">No horse services found for {getSelectedRoadName()}</p>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 font-bold border border-gray-300">Add First Horse Service</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Owner Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Initial Place</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900">#{service.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900">{service.ownerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {service.contactInfo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-green-800 font-black">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {service.initialPlace}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full font-bold border border-green-300">{service.cost} ETB</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${service.active !== false ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                        {service.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => openEditModal(service)} className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg font-black transition-colors">Edit</button>
                        <button onClick={() => handleDelete(service.id)} disabled={actionLoading === service.id}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                          {actionLoading === service.id ? '...' : 'Delete'}
                        </button>
                        {service.active !== false ? (
                          <button onClick={() => handleToggleActive(service.id, service.active !== false)} disabled={actionLoading === service.id}
                            className="text-orange-600 hover:text-orange-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                            {actionLoading === service.id ? '...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button onClick={() => handleToggleActive(service.id, service.active !== false)} disabled={actionLoading === service.id}
                            className="text-green-600 hover:text-green-800 px-3 py-1 rounded-lg font-black transition-colors disabled:opacity-50">
                            {actionLoading === service.id ? '...' : 'Activate'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 z-10">
              <h3 className="text-lg font-black">{editingService ? 'Edit Horse Service' : 'Add New Horse Service'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Owner Full Name *</label>
                <input 
                  type="text" 
                  value={formData.ownerName} 
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 ${formErrors.ownerName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="e.g., Abebe Kebede"
                  required 
                />
                {formErrors.ownerName && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.ownerName}</p>}
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Contact Phone *</label>
                <input 
                  type="tel" 
                  value={formData.contactInfo} 
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 ${formErrors.contactInfo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Phone number"
                  required 
                />
                {formErrors.contactInfo && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.contactInfo}</p>}
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Initial Place *</label>
                <input 
                  type="text" 
                  value={formData.initialPlace} 
                  onChange={(e) => handleInputChange('initialPlace', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 ${formErrors.initialPlace ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
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
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 ${formErrors.cost ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter cost in ETB"
                  required 
                />
                {formErrors.cost && <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.cost}</p>}
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
                onClick={editingService ? handleUpdate : handleCreate} 
                disabled={actionLoading !== null} 
                className="px-3 py-1.5 bg-white text-gray-900 rounded hover:bg-gray-50 disabled:opacity-50 font-semibold text-sm transition-all border border-gray-300"
              >
                {actionLoading !== null ? 'Saving...' : editingService ? 'Update' : 'Create'}
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
