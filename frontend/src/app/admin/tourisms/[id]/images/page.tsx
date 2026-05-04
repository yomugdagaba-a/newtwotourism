"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminTourismService } from "@/services/admin.service";
import { useToast } from "@/components/common/Toast";
import { useConfirm } from "@/components/common/ConfirmDialog";
interface TourismImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
  title?: string | null;
  description?: string | null;
}

interface TourismImageCreateDto {
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function TourismImagesPage() {
  const params = useParams();
  const router = useRouter();
  const tourismId = Number(params.id);
  const { token, role, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const confirm = useConfirm();

  const [images, setImages] = useState<TourismImage[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit form
  const [editingImage, setEditingImage] = useState<TourismImage | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") { router.push("/auth/login"); return; }
    loadImages();
  }, [tourismId, token]);

  const loadImages = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const [data, mainUrl] = await Promise.all([
        AdminTourismService.getTourismImages(token, tourismId),
        AdminTourismService.getTourismMainImageUrl(token, tourismId),
      ]);
      setImages(data);
      setMainImageUrl(mainUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!token || !newImageUrl.trim()) return;
    try {
      setAddLoading(true);
      setAddError(null);
      const data: TourismImageCreateDto = {
        imageUrl: newImageUrl.trim(),
        title: newTitle || undefined,
        description: newDescription || undefined,
      };
      await AdminTourismService.addTourismImage(token, tourismId, data);
      setNewImageUrl(""); setNewTitle(""); setNewDescription("");
      setShowAddForm(false);
      await loadImages();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add image");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!token) return;
    const ok = await confirm({ title: "Delete Image", message: "Delete this image?", variant: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      setActionLoading(imageId);
      await AdminTourismService.deleteTourismImage(token, tourismId, imageId);
      toast.success("Image deleted");
      await loadImages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetMain = async (img: TourismImage) => {
    if (!token) return;
    try {
      setActionLoading(img.id);
      await AdminTourismService.setMainTourismImage(token, tourismId, img.imageUrl);
      setMainImageUrl(img.imageUrl);
      toast.success("Main image updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set main image");
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (img: TourismImage) => {
    setEditingImage(img);
    setEditUrl(img.imageUrl);
    setEditTitle(img.title || "");
    setEditDescription(img.description || "");
  };

  const handleEdit = async () => {
    if (!token || !editingImage || !editUrl.trim()) return;
    try {
      setEditLoading(true);
      await AdminTourismService.updateTourismImage(token, tourismId, editingImage.id, {
        imageUrl: editUrl.trim(),
        title: editTitle || undefined,
        description: editDescription || undefined,
      });
      setEditingImage(null);
      await loadImages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/tourisms")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tourisms
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-black text-gray-900">Gallery Images — Tourism #{tourismId}</h1>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Image
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm font-bold">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 font-bold text-sm">No gallery images yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "Add Image" to add gallery images for this tourism place</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative h-40">
                  <img src={img.imageUrl} alt={img.title || "Gallery image"}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  {img.imageUrl === mainImageUrl && (
                    <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded">Main</span>
                  )}
                </div>
                <div className="p-2">
                  {img.title && <p className="text-xs font-bold text-gray-800 truncate">{img.title}</p>}
                  {img.description && <p className="text-xs text-gray-500 truncate">{img.description}</p>}
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => handleSetMain(img)} disabled={actionLoading === img.id || img.imageUrl === mainImageUrl}
                      className="flex-1 py-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 disabled:opacity-40 transition-all">
                      {actionLoading === img.id ? "..." : "Set Main"}
                    </button>
                    <button onClick={() => openEdit(img)}
                      className="flex-1 py-1 text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 rounded hover:bg-gray-200 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(img.id)} disabled={actionLoading === img.id}
                      className="flex-1 py-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-40 transition-all">
                      {actionLoading === img.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Image Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
            <h3 className="text-sm font-black text-gray-900 mb-4">Add Gallery Image</h3>
            {addError && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded text-xs font-bold mb-3">{addError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image URL <span className="text-red-500">*</span></label>
                <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {newImageUrl && (
                <img src={newImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Bete Giorgis Church"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description (optional)</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                  placeholder="Brief description of this image..." rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => { setShowAddForm(false); setAddError(null); setNewImageUrl(""); setNewTitle(""); setNewDescription(""); }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAdd} disabled={addLoading || !newImageUrl.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                {addLoading ? "Adding..." : "Add Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
            <h3 className="text-sm font-black text-gray-900 mb-4">Edit Image</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image URL <span className="text-red-500">*</span></label>
                <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {editUrl && (
                <img src={editUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEditingImage(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleEdit} disabled={editLoading || !editUrl.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
