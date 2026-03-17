// frontend/src/components/tourism/TourismImages.tsx

"use client";

import React from "react";

interface Props {
  images: string[];
}

const TourismImages: React.FC<Props> = ({ images }) => {
  if (!images.length) return null;

  return (
    <div className="flex overflow-x-auto space-x-4 py-4">
      {images.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`Tourism image ${idx + 1}`}
          className="h-48 w-auto object-cover rounded-lg"
        />
      ))}
    </div>
  );
};

export default TourismImages;
