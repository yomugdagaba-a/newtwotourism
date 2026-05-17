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

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onUrlChange?.('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Preview with Remove button */}
      {previewSrc && (
        <div className="mb-3 relative group">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-32 w-full object-cover rounded-lg border border-gray-200"
            onError={() => setPreview(null)}
          />
          {/* Remove button - X style */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload/Change button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{previewSrc ? 'Change' : 'Upload'}</span>
            </>
          )}
        </button>
        
        <span className="text-xs text-gray-400">JPG, PNG, GIF, WebP — max 10MB</span>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
