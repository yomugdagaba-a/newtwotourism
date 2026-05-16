"use client";

import React, { useState, useRef, useEffect } from 'react';
import { getImageUrl } from '@/utils/imageUrl';

// Use the shared getImageUrl which routes /uploads/ through the proxy
// For blob: URLs (local file previews), pass through directly — they're valid in the current session
function getImageSrc(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('blob:')) return imageUrl;
  return getImageUrl(imageUrl);
}

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<string>; // returns the saved imageUrl
  onUrlChange?: (url: string) => void; // called after successful upload with the new URL
  uploading?: boolean;
  required?: boolean;
  accept?: string;
}

export default function ImageUpload({
  label,
  currentImageUrl,
  onUpload,
  onUrlChange,
  uploading: externalUploading,
  required = false,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when the parent passes a new currentImageUrl (e.g. edit modal opens)
  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const isUploading = externalUploading || uploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setError('');

    try {
      setUploading(true);
      const savedUrl = await onUpload(file);
      setPreview(savedUrl);
      onUrlChange?.(savedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const previewSrc = preview ? getImageSrc(preview) : '';

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Preview — only render when we have a non-empty src */}
      {previewSrc && (
        <div className="mb-2">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-28 w-full object-cover rounded border border-gray-200"
            onError={() => setPreview(null)}
          />
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border border-dashed border-gray-300 rounded-lg px-3 py-3 text-center cursor-pointer transition-colors ${
          isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400 hover:bg-purple-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-xs text-gray-500">Uploading...</span>
          </div>
        ) : (
          <div>
            <svg className="w-5 h-5 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500">
              {previewSrc ? 'Click to change image' : 'Click to upload image'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP — max 10MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
