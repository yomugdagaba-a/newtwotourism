"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { API_BASE_URL } from '../../../services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';
import TopBar from '@/components/layout/TopBar';
import { AdminImageUploadService } from '../../../services/admin.service';
import { getImageUrl } from '@/utils/imageUrl';

interface HeroImage {
  id: number;
  imageUrl: string;
  title?: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

export default function HeroImagesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { token, role, isAuthenticated } = useAuthStore();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HeroImage | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [form, setForm] = useState({ imageUrl: '', title: '', description: '', displayOrder: 0, active: true });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/hero-images`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load');
      setImages(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hero images');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Build full URL for uploaded images stored as relative paths
  const getImageSrc = (imageUrl: string): string => {
    return getImageUrl(imageUrl, '/images/hero.jpg');
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') { router.push('/auth/login'); return; }
    load();
  }, [isAuthenticated, role, load, router]);

  const resetForm = () => {
    setForm({ imageUrl: '', title: '', description: '', displayOrder: 0, active: true });
    setEditing(null);
    setShowForm(false);
    setError('');
    setSuccess('');
    (window as any).__pendingHeroImageFile = undefined;
  };

  const openEdit = (img: HeroImage) => {
    setEditing(img);
    setForm({ imageUrl: img.imageUrl, title: img.title || '', description: img.description || '', displayOrder: img.displayOrder, active: img.active });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    const pendingFile = (window as any).__pendingHeroImageFile as File | undefined;
    if (!form.imageUrl && !pendingFile) { setError('Image is required'); return; }
    try {
      setActionLoading(-1);
      if (editing) {
        // Update existing hero image
        await AdminImageUploadService.updateHeroImageWithUpload(token!, editing.id, pendingFile || null, {
          title: form.title,
          description: form.description,
          displayOrder: form.displayOrder,
          active: form.active,
        });
      } else {
        // Create new hero image with file upload
        if (!pendingFile) { setError('Please select an image file'); return; }
        await AdminImageUploadService.uploadHeroImage(token!, pendingFile, form.title, form.description, form.displayOrder, form.active);
      }
      (window as any).__pendingHeroImageFile = undefined;
      setSuccess(editing ? 'Updated successfully' : 'Added successfully');
      await load();
      setTimeout(resetForm, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ message: 'Delete this hero image?', variant: 'danger', title: 'Delete Hero Image', confirmLabel: 'Yes', cancelLabel: 'No' });
    if (!ok) return;
    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE_URL}/admin/hero-images/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (img: HeroImage) => {
    try {
      setActionLoading(img.id);
      const res = await fetch(`${API_BASE_URL}/admin/hero-images/${img.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !img.active }),
      });
      if (!res.ok) throw new Error('Update failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 shadow-inner admin-page">
      <TopBar 
        showCategories={false} 
        showBackButton={false}
        pageTitle="Hero Images" 
        showAdminMenu={true}
        actionButtons={
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="text-gray-900 font-black text-sm hover:text-black transition-all whitespace-nowrap px-1">
            + Add Image
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Back Button */}
        <button onClick={() => router.push('/admin/tourisms')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Tourism Places
        </button>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
                <h3 className="text-xl font-black text-gray-900">
                  {editing ? 'Edit Hero Image' : 'Add Hero Image'}
                </h3>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 font-bold">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold flex justify-between">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{success}</div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image <span className="text-red-500">*</span></label>
                  {/* Show current image preview */}
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="preview" className="mb-2 h-32 w-full object-cover rounded-lg border border-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  {/* File upload area */}
                  <div
                    className="border border-dashed border-gray-300 rounded-lg px-3 py-3 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    onClick={() => document.getElementById('hero-image-input')?.click()}
                  >
                    <input
                      id="hero-image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // Show local preview
                        const localUrl = URL.createObjectURL(file);
                        setForm(f => ({ ...f, imageUrl: localUrl }));
                        // Store file for upload on save
                        (window as any).__pendingHeroImageFile = file;
                        e.target.value = '';
                      }}
                    />
                    <svg className="w-5 h-5 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">{form.imageUrl ? 'Click to change image' : 'Click to upload image'}</p>
                    <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP — max 10MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Optional title"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                    <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional subtitle shown on hero"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600" />
                  <label htmlFor="active" className="text-sm font-semibold text-gray-700">Active (show on home page)</label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-end space-x-2 z-10">
                <button onClick={resetForm} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={actionLoading !== null}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-semibold text-sm transition-all">
                  {actionLoading !== null ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Images List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600 font-semibold text-sm">Loading...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-md">
            <p className="text-gray-500 font-semibold">No hero images yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img => (
              <div key={img.id} className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img src={getImageSrc(img.imageUrl)} alt={img.title || 'Hero'} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/images/hero.jpg'; }} />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-black/60 text-white">
                      Order: {img.displayOrder}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {img.title && <p className="font-black text-gray-900 text-sm truncate">{img.title}</p>}
                  {img.description && <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">{img.description}</p>}
                  
                  {/* Active status below image */}
                  <div className="mt-2 mb-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-black ${img.active ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}>
                      {img.active ? '✓ Active' : '○ Hidden'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(img)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all border border-gray-300">
                      Edit
                    </button>
                    <button onClick={() => toggleActive(img)} disabled={actionLoading === img.id}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border ${img.active ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300' : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'}`}>
                      {img.active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(img.id)} disabled={actionLoading === img.id}
                      className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-red-300">
                      {actionLoading === img.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
