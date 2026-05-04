"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { API_BASE_URL } from '../../../services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';

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
  };

  const openEdit = (img: HeroImage) => {
    setEditing(img);
    setForm({ imageUrl: img.imageUrl, title: img.title || '', description: img.description || '', displayOrder: img.displayOrder, active: img.active });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { setError('Image URL is required'); return; }
    try {
      setActionLoading(-1);
      const url = editing ? `${API_BASE_URL}/admin/hero-images/${editing.id}` : `${API_BASE_URL}/admin/hero-images`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
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
    const ok = await confirm({ message: 'Delete this hero image?', variant: 'danger', title: 'Delete Hero Image', confirmLabel: 'Delete' });
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 mb-6">
          <button onClick={() => router.push('/admin/tourisms')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 text-sm font-bold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tourism Places
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-black text-gray-900">Hero Images</h1>
              <p className="text-sm text-gray-500">Manage slideshow images shown on the home page</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold text-sm flex items-center gap-2 shadow">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Image
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold flex justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">x</button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{success}</div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-base font-black text-gray-900 mb-4">{editing ? 'Edit Hero Image' : 'Add Hero Image'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Image URL <span className="text-red-500">*</span></label>
                <input type="text" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 h-32 w-full object-cover rounded-lg border border-gray-200"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Optional title"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional subtitle shown on hero"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600" />
                <label htmlFor="active" className="text-sm font-bold text-gray-700">Active (show on home page)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={actionLoading !== null}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-bold text-sm disabled:opacity-50">
                {actionLoading !== null ? 'Saving...' : editing ? 'Update' : 'Add'}
              </button>
              <button onClick={resetForm} className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 font-bold text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Images List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-3 text-gray-600 font-semibold text-sm">Loading...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow">
            <p className="text-gray-500 font-semibold">No hero images yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img => (
              <div key={img.id} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="relative h-40">
                  <img src={img.imageUrl} alt={img.title || 'Hero'} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/images/hero.jpg'; }} />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${img.active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {img.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-black/50 text-white">
                      Order: {img.displayOrder}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {img.title && <p className="font-black text-gray-900 text-sm truncate">{img.title}</p>}
                  {img.description && <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">{img.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(img)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-black transition-all">
                      Edit
                    </button>
                    <button onClick={() => toggleActive(img)} disabled={actionLoading === img.id}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50 ${img.active ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                      {img.active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(img.id)} disabled={actionLoading === img.id}
                      className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-black transition-all disabled:opacity-50">
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
