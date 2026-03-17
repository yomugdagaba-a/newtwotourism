"use client";

import { useState, useEffect } from "react";
import { TourismImageDto } from "@/types/tourismImage";
import { getTourismImages } from "@/services/tourismImage.service";
import Image from "next/image";

interface TourismImageGalleryProps {
  tourismId: number;
  tourismName: string;
  isOpen: boolean;
  onClose: () => void;
  // Optional: pass images directly to avoid API call
  preloadedImages?: TourismImageDto[];
}

export default function TourismImageGallery({
  tourismId,
  tourismName,
  isOpen,
  onClose,
  preloadedImages,
}: TourismImageGalleryProps) {
  const [images, setImages] = useState<TourismImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<TourismImageDto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && tourismId) {
      loadImages();
    }
  }, [isOpen, tourismId, preloadedImages]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If preloaded images are provided, use them directly
      if (preloadedImages && preloadedImages.length > 0) {
        console.log(`Using ${preloadedImages.length} preloaded images with details`);
        setImages(preloadedImages);
        setSelectedImage(preloadedImages[0]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }
      
      // Otherwise, try to fetch from API
      console.log(`Loading images from API for tourism ${tourismId}...`);
      const data = await getTourismImages(tourismId);
      console.log(`Received ${data.length} images from API:`, data);
      
      if (data.length > 0) {
        setImages(data);
        setSelectedImage(data[0]);
        setCurrentIndex(0);
      } else {
        setImages([]);
      }
    } catch (err) {
      setError("Failed to load images");
      console.error("Error loading images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const handleThumbnailClick = (image: TourismImageDto, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📸 {tourismName}</h2>
            <p className="text-sm text-gray-600">
              {images.length} images • {selectedImage?.title || `Image ${currentIndex + 1}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
          {/* Main Image */}
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-white">Loading images...</p>
              </div>
            ) : error ? (
              <div className="text-center text-white">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadImages}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Retry
                </button>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center text-white p-8">
                <span className="text-6xl mb-4 block">📷</span>
                <h3 className="text-xl font-medium mb-2">No Images Yet</h3>
                <p className="text-gray-400 mb-4">This tourism place doesn't have any images uploaded yet.</p>
              </div>
            ) : selectedImage ? (
              <>
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title || `Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Info Overlay - Shows title and description */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  {selectedImage.title && (
                    <h3 className="text-xl font-bold text-white mb-1">{selectedImage.title}</h3>
                  )}
                  {selectedImage.description && (
                    <p className="text-gray-300 text-sm">{selectedImage.description}</p>
                  )}
                  {!selectedImage.title && !selectedImage.description && (
                    <p className="text-gray-400 text-sm">Image {currentIndex + 1} of {images.length}</p>
                  )}
                </div>

                {/* Image Counter */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            ) : null}
          </div>

          {/* Thumbnails Sidebar */}
          {images.length > 0 && (
            <div className="w-full md:w-48 bg-gray-100 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto">
              <div className="p-2 grid grid-cols-4 md:grid-cols-2 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => handleThumbnailClick(image, index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentIndex === index
                        ? "border-emerald-500 ring-2 ring-emerald-500/50"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    title={image.title || `Image ${index + 1}`}
                  >
                    <Image
                      src={image.imageUrl}
                      alt={image.title || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {image.isMain && (
                      <span className="absolute top-1 left-1 px-1 py-0.5 bg-emerald-500 text-white text-[10px] rounded">
                        Main
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
