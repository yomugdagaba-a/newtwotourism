// frontend/src/components/tourism/TourismGrid.tsx

"use client";

import React from "react";
import TourismCard from "./TourismCard";
import { TourismPublicCard } from "../../types/tourism";

interface Props {
  tourisms: TourismPublicCard[];
  onSelect?: (id: number) => void;
}

const TourismGrid: React.FC<Props> = ({ tourisms, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {tourisms.map((tourism) => (
        <TourismCard key={tourism.id} tourism={tourism} onClick={onSelect} />
      ))}
    </div>
  );
};

export default TourismGrid;
