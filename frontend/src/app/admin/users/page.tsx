"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdminUserService, AdminHotelService, AdminTourismService, User, Hotel, Tourism } from '../../../services/admin.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { FormButton, Alert } from '@/components/common/FormInput';
import Pagination from '@/components/common/Pagination';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';

const AVAILABLE_ROLES = ['CLIENT', 'HOTEL_OWNER', 'ADMIN'];
const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 50];

const UsersManagementPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [pageSize, setPageSize] = useState(15);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // For HOTEL_OWNER role assignment with tourism place and hotel selection
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [tourisms, setTourisms] = useState<Tourism[]>([]);
  const [selectedTourismId, setSelectedTourismId] = useState<number | ''>('');
  const [tourismsLoading, setTourismsLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | ''>('');
  const [hotelsLoading, setHotelsLoading] = useState(false);

  const { token, role, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await AdminUserService.getAllUsers(token, currentPage, pageSize, sortBy, sortDir, searchTerm || undefined);
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize, sortBy, sortDir, searchTerm]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') { router.push('/auth/login'); return; }
    loadUsers();
  }, [isAuthenticated, role, loadUsers, router]);

  // Debounced search - triggers search after user stops typing for 300ms
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Auto-hide success message
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const handleClearSearch = () => { setSearchTerm(''); setCurrentPage(0); };
  const handleSort = (field: string) => {
    if (sortBy === field) { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortDir('asc'); }
    setCurrentPage(0);
  };

  const handleActivateUser = async (userId: number) => {
    if (!token) return;
    try { 
      setActionLoading(userId); 
      await AdminUserService.activateUser(token, userId); 
      setActionSuccess('User activated successfully!');
      await loadUsers(); 
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to activate user'); }
    finally { setActionLoading(null); }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!token) return;
    const ok = await confirm({ message: 'Are you sure you want to deactivate this user?', variant: 'warning', title: 'Deactivate User', confirmLabel: 'Deactivate' });
    if (!ok) return;
    try { 
      setActionLoading(userId); 
      await AdminUserService.deactivateUser(token, userId); 
      setActionSuccess('User deactivated successfully!');
      await loadUsers(); 
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to deactivate user'); }
    finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    const ok = await confirm({ message: 'Are you sure you want to delete this user permanently? This action cannot be undone.', variant: 'danger', title: 'Delete User', confirmLabel: 'Delete' });
    if (!ok) return;
    try { 
      setActionLoading(userId); 
      await AdminUserService.deleteUser(token, userId); 
      setActionSuccess('User deleted successfully!');
      await loadUsers(); 
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete user'); }
    finally { setActionLoading(null); }
  };

  const handleGrantRole = async (userId: number, r: string) => {
    if (!token) return;
    try { 
      setActionLoading(userId); 
      await AdminUserService.grantRole(token, userId, r); 
      
      // If granting HOTEL_OWNER and a hotel is selected, assign the hotel
      if (r === 'HOTEL_OWNER' && selectedHotelId) {
        await AdminHotelService.assignOwner(token, Number(selectedHotelId), userId);
        setActionSuccess(`Role ${r} granted and hotel assigned successfully!`);
      } else {
        setActionSuccess(`Role ${r} granted successfully!`);
      }
      
      await loadUsers(); 
      setShowRoleModal(false); 
      setSelectedUser(null);
      setSelectedRole(null);
      setSelectedHotelId('');
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to grant role'); }
    finally { setActionLoading(null); }
  };

  // Load tourism places for HOTEL_OWNER assignment
  const loadTourisms = async () => {
    if (!token) return;
    try {
      setTourismsLoading(true);
      const response = await AdminTourismService.getAllTourism(token, 0, 100);
      setTourisms(response.content);
    } catch (err) {
      console.error('Failed to load tourism places:', err);
    } finally {
      setTourismsLoading(false);
    }
  };

  // Load hotels filtered by tourism place for HOTEL_OWNER assignment
  const loadHotels = async (tourismId?: number) => {
    if (!token) return;
    try {
      setHotelsLoading(true);
      const response = await AdminHotelService.getAllHotels(token, 0, 100);
      console.log('All hotels loaded:', response.content);
      console.log('Looking for tourismId:', tourismId);
      
      // Filter hotels by tourism place (show ALL hotels, not just those without owners)
      // Backend returns tourismPlaceId, not tourismId
      let filteredHotels = response.content;
      
      if (tourismId) {
        filteredHotels = filteredHotels.filter(h => {
          const matches = h.tourismPlaceId === tourismId || h.tourismId === tourismId;
          console.log(`Hotel ${h.name}: tourismPlaceId=${h.tourismPlaceId}, tourismId=${h.tourismId}, matches=${matches}`);
          return matches;
        });
      }
      console.log('Filtered hotels:', filteredHotels);
      setHotels(filteredHotels);
    } catch (err) {
      console.error('Failed to load hotels:', err);
    } finally {
      setHotelsLoading(false);
    }
  };

  // Handle role selection (for HOTEL_OWNER, load tourism places first)
  const handleRoleSelect = (r: string) => {
    setSelectedRole(r);
    if (r === 'HOTEL_OWNER') {
      loadTourisms();
      setSelectedTourismId('');
      setSelectedHotelId('');
      setHotels([]);
    }
  };

  // Handle tourism place selection - load hotels for that place
  const handleTourismSelect = (tourismId: number | '') => {
    setSelectedTourismId(tourismId);
    setSelectedHotelId('');
    if (tourismId) {
      loadHotels(tourismId);
    } else {
      setHotels([]);
    }
  };

  // Confirm role assignment
  const handleConfirmRole = () => {
    if (!selectedUser || !selectedRole) return;
    handleGrantRole(selectedUser.id, selectedRole);
  };

  const handleRevokeRole = async (userId: number, r: string) => {
    if (!token) return;
    const ok = await confirm({ message: `Are you sure you want to revoke the ${r} role from this user?`, variant: 'warning', title: 'Revoke Role', confirmLabel: 'Revoke' });
    if (!ok) return;
    try { 
      setActionLoading(userId); 
      await AdminUserService.revokeRole(token, userId, r); 
      setActionSuccess(`Role ${r} revoked successfully!`);
      await loadUsers(); 
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to revoke role'); }
    finally { setActionLoading(null); }
  };

  const getRoleBadgeColor = (r: string) => {
    switch (r) { 
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200 font-black'; 
      case 'HOTEL_OWNER': return 'bg-blue-50 text-blue-700 border-blue-200 font-black'; 
      case 'CLIENT': return 'bg-amber-50 text-amber-700 border-amber-200 font-black'; 
      default: return 'bg-gray-50 text-gray-700 border-gray-200 font-black'; 
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className={`ml-1 ${sortBy === field ? 'text-blue-600' : 'text-gray-400'}`}>
      {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (!isAuthenticated || role !== 'ADMIN') return <div className="p-8 text-center">Access denied.</div>;

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
        <h1 className="text-lg font-black text-gray-900 mb-0.5">User Management</h1>
        <p className="text-gray-600 text-sm">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Success/Error Messages */}
      {actionSuccess && (
        <div className="mb-4">
          <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-blue-100 rounded-xl shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 max-w-lg flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search by name, email, username..." value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold shadow-sm" />
              {searchTerm && (
                <button onClick={handleClearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-900 bg-white px-4 py-2 rounded-lg shadow-md font-bold">
            {searchTerm && <span className="mr-2">Results for &quot;{searchTerm}&quot;:</span>}
            Total: <span className="font-black text-blue-700">{totalElements}</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-indigo-100 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-800 font-bold">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-800 bg-white">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-black">{searchTerm ? `No users found for "${searchTerm}"` : 'No users found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-200">
              <thead className="bg-indigo-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-black text-indigo-900 uppercase tracking-wider cursor-pointer hover:bg-indigo-300 transition-colors" onClick={() => handleSort('username')}>
                    User <SortIcon field="username" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-black text-indigo-900 uppercase tracking-wider cursor-pointer hover:bg-indigo-300 transition-colors" onClick={() => handleSort('email')}>
                    Email <SortIcon field="email" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-black text-indigo-900 uppercase tracking-wider">Roles</th>
                  <th className="px-3 py-3 text-left text-xs font-black text-indigo-900 uppercase tracking-wider cursor-pointer hover:bg-indigo-300 transition-colors" onClick={() => handleSort('active')}>
                    Status <SortIcon field="active" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-black text-indigo-900 uppercase tracking-wider sticky right-0 bg-indigo-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-50 transition-colors group">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white font-black text-sm">{user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-black text-gray-900">{user.fullName || 'N/A'}</div>
                          <div className="text-xs text-indigo-700 font-bold">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">{user.email}</div>
                      <div className="text-xs">
                        {user.emailVerified ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-black">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="text-yellow-700 flex items-center gap-1 font-black">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((r) => {
                          const roleName = typeof r === 'string' ? r : r.name;
                          return (
                            <span key={roleName} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black border-2 shadow-sm ${getRoleBadgeColor(roleName.replace('ROLE_', ''))}`}>
                              {roleName.replace('ROLE_', '')}
                              <button onClick={() => handleRevokeRole(user.id, roleName.replace('ROLE_', ''))} 
                                className="ml-1 hover:text-red-600 transition-colors text-xs font-black" title="Revoke role">×</button>
                            </span>
                          );
                        })}
                        <button onClick={() => { setSelectedUser(user); setShowRoleModal(true); }} 
                          className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all border-2 border-blue-300 shadow-sm">
                          + Add
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${user.active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {user.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-bold sticky right-0 bg-white group-hover:bg-indigo-50">
                      <div className="flex space-x-2">
                        {user.active ? (
                          <button onClick={() => handleDeactivateUser(user.id)} disabled={actionLoading === user.id} 
                            className="text-yellow-700 hover:text-yellow-800 font-black disabled:opacity-50 transition-colors text-xs bg-yellow-100 px-2 py-1 rounded shadow-sm">
                            {actionLoading === user.id ? '...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button onClick={() => handleActivateUser(user.id)} disabled={actionLoading === user.id} 
                            className="text-green-700 hover:text-green-800 font-black disabled:opacity-50 transition-colors text-xs bg-green-100 px-2 py-1 rounded shadow-sm">
                            {actionLoading === user.id ? '...' : 'Activate'}
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(user.id)} disabled={actionLoading === user.id} 
                          className="text-red-700 hover:text-red-800 font-black disabled:opacity-50 transition-colors text-xs bg-red-100 px-2 py-1 rounded shadow-sm">
                          {actionLoading === user.id ? '...' : 'Delete'}
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

      {/* Pagination */}
      <div className="mt-4 bg-white rounded-xl shadow-sm p-2 border border-gray-200">
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

      {/* Role Assignment Modal - Enhanced with Hotel Selection */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRole ? `Assign ${selectedRole} Role` : 'Select Role'}
                </h3>
                <p className="text-sm text-gray-600">User: {selectedUser.fullName} (@{selectedUser.username})</p>
              </div>
              <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); setSelectedRole(null); setSelectedTourismId(''); setSelectedHotelId(''); setTourisms([]); setHotels([]); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {!selectedRole ? (
                // Step 1: Select Role
                <div className="space-y-3">
                  <p className="text-gray-700 mb-4">Select a role to assign:</p>
                  {AVAILABLE_ROLES.filter(r => !selectedUser.roles?.includes(`ROLE_${r}`) && !selectedUser.roles?.includes(r)).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">User already has all available roles</p>
                  ) : (
                    AVAILABLE_ROLES.filter(r => !selectedUser.roles?.includes(`ROLE_${r}`) && !selectedUser.roles?.includes(r)).map((r) => (
                      <button 
                        key={r} 
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors hover:shadow-md ${getRoleBadgeColor(r)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{r}</span>
                            {r === 'HOTEL_OWNER' && (
                              <p className="text-xs opacity-70 mt-1">Will need to select a hotel to manage</p>
                            )}
                          </div>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : selectedRole === 'HOTEL_OWNER' ? (
                // Step 2: For HOTEL_OWNER, select tourism place first, then hotel
                <div className="space-y-4">
                  <button 
                    onClick={() => { setSelectedRole(null); setSelectedTourismId(''); setSelectedHotelId(''); setHotels([]); }} 
                    className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                  >
                    ← Back to role selection
                  </button>
                  
                  {/* Step 2a: Select Tourism Place */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-blue-700 font-medium mb-2">Step 1: Select Tourism Place</h4>
                    <p className="text-blue-600 text-sm mb-3">
                      First, select the tourism destination where the hotel is located.
                    </p>
                    
                    {tourismsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      </div>
                    ) : tourisms.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-700 text-sm">No tourism places found.</p>
                      </div>
                    ) : (
                      <select
                        value={selectedTourismId}
                        onChange={(e) => handleTourismSelect(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select a tourism place --</option>
                        {tourisms.map((tourism) => (
                          <option key={tourism.id} value={tourism.id}>
                            {tourism.name} ({tourism.wereda})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Step 2b: Select Hotel (only shown after tourism place is selected) */}
                  {selectedTourismId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-blue-700 font-medium mb-2">Step 2: Select Hotel to Manage</h4>
                      <p className="text-blue-600 text-sm mb-3">
                        Choose which hotel in <strong>{tourisms.find(t => t.id === selectedTourismId)?.name}</strong> this user will own and manage.
                      </p>
                      
                      {hotelsLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : hotels.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-700 text-sm">No hotels found in this location.</p>
                          <p className="text-yellow-600 text-xs mt-1">You can still grant the role and assign a hotel later from the Hotels page.</p>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedHotelId}
                            onChange={(e) => setSelectedHotelId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Select a hotel (optional) --</option>
                            {hotels.map((hotel) => (
                              <option key={hotel.id} value={hotel.id}>
                                {hotel.name} {hotel.starRating || hotel.stars ? `(${hotel.starRating || hotel.stars}⭐)` : ''} 
                                {hotel.ownerId ? ` - Currently owned by: ${hotel.ownerName || 'User #' + hotel.ownerId}` : ' - No owner'}
                              </option>
                            ))}
                          </select>
                          {selectedHotelId && hotels.find(h => h.id === selectedHotelId)?.ownerId && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                              <p className="text-orange-700 text-sm">This hotel already has an owner.</p>
                              <p className="text-orange-600 text-xs mt-1">Assigning this hotel will transfer ownership from the current owner.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <FormButton variant="secondary" onClick={() => { setSelectedRole(null); setSelectedTourismId(''); setSelectedHotelId(''); setHotels([]); }}>
                      Back
                    </FormButton>
                    <FormButton 
                      variant="primary" 
                      onClick={handleConfirmRole}
                      loading={actionLoading === selectedUser.id}
                      disabled={!selectedTourismId}
                    >
                      {selectedHotelId ? 'Grant Role & Assign Hotel' : 'Grant Role Only'}
                    </FormButton>
                  </div>
                </div>
              ) : (
                // Step 2: For other roles, confirm directly
                <div className="space-y-4">
                  <button 
                    onClick={() => setSelectedRole(null)} 
                    className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                  >
                    ← Back to role selection
                  </button>
                  
                  <div className={`rounded-lg p-4 ${getRoleBadgeColor(selectedRole)}`}>
                    <h4 className="font-medium mb-2">Confirm Role Assignment</h4>
                    <p className="text-sm opacity-80">
                      You are about to grant the <strong>{selectedRole}</strong> role to <strong>{selectedUser.fullName}</strong>.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
                    <FormButton variant="secondary" onClick={() => setSelectedRole(null)}>
                      Back
                    </FormButton>
                    <FormButton 
                      variant="primary" 
                      onClick={handleConfirmRole}
                      loading={actionLoading === selectedUser.id}
                    >
                      Confirm & Grant Role
                    </FormButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UsersManagementPage;
