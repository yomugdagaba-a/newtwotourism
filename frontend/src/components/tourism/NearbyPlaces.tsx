// frontend/src/components/tourism/NearbyPlaces.tsx

"use client";

import React from "react";
import { NearbyTourismDto } from "../../types/tourism";
import { getImageUrl } from "@/utils/imageUrl";

interface Props {
  places: NearbyTourismDto[];
  onSelect?: (place: NearbyTourismDto) => void;
}

const NearbyPlaces: React.FC<Props> = ({ places, onSelect }) => {
  if (!places || places.length === 0) {
    return <p className="text-gray-500 text-sm">No nearby places found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {places.map((place) => (
        <div
          key={place.id}
          className="cursor-pointer border rounded-lg overflow-hidden shadow hover:shadow-md transition"
          onClick={() => onSelect?.(place)}
        >
          {place.imageUrl ? (
            <img
              src={getImageUrl(place.imageUrl)}
              alt={place.name}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}

          <div className="p-2">
            <h4 className="font-semibold text-sm text-gray-800">{place.name}</h4>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NearbyPlaces;
