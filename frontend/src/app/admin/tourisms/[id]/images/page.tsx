"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminTourismService, TourismImage, TourismImageCreateDto } from "@/services/admin.service";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";
import Image from "next/image";

export default function TourismImagesPage() {
  const params = useParams();
  const router = useRouter();
  const tourismId = Number(params.id);
  const { token, role, isAuthenticated } = useAuthStore();

  const [images, setImages] = useState<TourismImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tourismName, setTourismName] = useState<string>("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<TourismImage | null>(null);
  const [formData, setFormData] = useState<TourismImageCreateDto>({
    imageUrl: "",
    title: "",
    description: "",
    isMain: false,
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      router.push("/auth/login");
      return;
    }
    loadImages();
    loadTourismInfo();
  }, [isAuthenticated, role, tourismId]);

  const loadTourismInfo = async () => {
    if (!token) return;
    try {
      const tourism = await AdminTourismService.getTourismById(token, tourismId);
      setTourismName(tourism.name);
    } catch (err) {
      console.error("Failed to load tourism info:", err);
    }
  };

  const loadImages = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await AdminTourismService.getTourismImages(token, tourismId);
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ imageUrl: "", title: "", description: "", isMain: false });
    setEditingImage(null);
  };

  const handleEdit = (image: TourismImage) => {
    setEditingImage(image);
    setFormData({
      imageUrl: image.imageUrl,
      title: image.title || "",
      description: image.description || "",
      isMain: image.isMain,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!token || !formData.imageUrl.trim()) return;

    try {
      setActionLoading(-1);
      if (editingImage) {
        await AdminTourismService.updateTourismImage(token, tourismId, editingImage.id, formData);
        setSuccess("Image updated successfully!");
      } else {
        await AdminTourismService.addTourismImage(token, tourismId, formData);
        setSuccess("Image added successfully!");
      }
      setShowModal(false);
      resetForm();
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save image");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!token || !confirm("Are you sure you want to delete this image?")) return;

    try {
      setActionLoading(imageId);
      await AdminTourismService.deleteTourismImage(token, tourismId, imageId);
      setSuccess("Image deleted successfully!");
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetMain = async (imageId: number) => {
    if (!token) return;

    try {
      setActionLoading(imageId);
      await AdminTourismService.setMainTourismImage(token, tourismId, imageId);
      setSuccess("Main image set successfully!");
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set main image");
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isAuthenticated || role !== "ADMIN") {
    return <div className="p-8 text-center">Access denied.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/tourisms")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Tourism Places</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Internal Images</h1>
            <p className="text-gray-600">
              Manage internal images for <span className="font-semibold text-emerald-600">{tourismName || `Tourism #${tourismId}`}</span>
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Image
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

      {/* Images Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <span className="text-6xl mb-4 block">📷</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Internal Images</h3>
            <p className="mb-4">Add internal images to showcase different areas of this tourism place.</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Add First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  image.isMain ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="aspect-square relative bg-gray-100">
                  <Image
                    src={image.imageUrl}
                    alt={image.title || `Image ${image.id}`}
                    fill
                    className="object-cover"
                  />
                  {image.isMain && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                      ⭐ Main
                    </span>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    #{image.displayOrder}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{image.title || "Untitled"}</h3>
                  {image.description && (
                    <p className="text-gray-500 text-sm truncate mt-1">{image.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(image)}
                      disabled={actionLoading === image.id}
                      className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    {!image.isMain && (
                      <button
                        onClick={() => handleSetMain(image.id)}
                        disabled={actionLoading === image.id}
                        className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={actionLoading === image.id}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      {actionLoading === image.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingImage ? "Edit Image" : "Add New Image"}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormInput
                label="Image URL"
                name="imageUrl"
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                required
              />
              <FormInput
                label="Title"
                name="title"
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Bete Giorgis, Main Entrance"
              />
              <FormInput
                label="Description"
                name="description"
                type="textarea"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this image shows..."
                rows={3}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={formData.isMain || false}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isMain" className="text-sm text-gray-700">Set as main image</label>
              </div>

              {/* Preview */}
              {formData.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Preview:</p>
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Invalid+URL";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <FormButton variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </FormButton>
              <FormButton
                variant="primary"
                onClick={handleSubmit}
                loading={actionLoading === -1}
                disabled={!formData.imageUrl.trim()}
              >
                {editingImage ? "Update Image" : "Add Image"}
              </FormButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
