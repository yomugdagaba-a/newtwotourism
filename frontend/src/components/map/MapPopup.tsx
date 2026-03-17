// frontend/src/components/map/MapPopup.tsx

"use client";

import React from "react";
import { MapPointDto } from "../../types/map";

interface Props {
  point: MapPointDto;
}

const MapPopup: React.FC<Props> = ({ point }) => {
  return (
    <div className="bg-white p-2 rounded shadow border text-sm space-y-1">
      <h4 className="font-semibold">{point.name}</h4>
      <p>{point.description}</p>
      <p>Type: {point.type}</p>
      {point.tourismPlaceId && <p>Tourism Place ID: {point.tourismPlaceId}</p>}
      {point.hotelId && <p>Hotel ID: {point.hotelId}</p>}
      {point.roadInfoId && <p>Road Info ID: {point.roadInfoId}</p>}
    </div>
  );
};

export default MapPopup;
