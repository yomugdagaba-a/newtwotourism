// frontend/src/components/tourism/NearbyPlaces.tsx
"use client";

import React from "react";
import { NearbyTourismDto } from "../../types/tourism";
import { getImageUrl } from "@/utils/imageUrl";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

interface Props {
  places: NearbyTourismDto[];
  onSelect?: (place: NearbyTourismDto) => void;
}

function NearbyPlaceCard({ place, onSelect }: { place: NearbyTourismDto; onSelect?: (p: NearbyTourismDto) => void }) {
  const { t } = useTranslation();
  const translatedName = useTranslateText(place.name);
  return (
    <div
      className="cursor-pointer border rounded-lg overflow-hidden shadow hover:shadow-md transition"
      onClick={() => onSelect?.(place)}
    >
      {place.imageUrl ? (
        <img src={getImageUrl(place.imageUrl)} alt={place.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
          {t("tourism.noImage")}
        </div>
      )}
      <div className="p-2">
        <h4 className="font-semibold text-sm text-gray-800">{translatedName}</h4>
      </div>
    </div>
  );
}

const NearbyPlaces: React.FC<Props> = ({ places, onSelect }) => {
  const { t } = useTranslation();

  if (!places || places.length === 0) {
    return <p className="text-gray-500 text-sm">{t("common.noResults")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {places.map((place) => (
        <NearbyPlaceCard key={place.id} place={place} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default NearbyPlaces;
