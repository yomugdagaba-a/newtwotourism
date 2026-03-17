// frontend/src/components/map/MapPointList.tsx

"use client";

import React from "react";
import { MapPointDto } from "../../types/map";
import MapMarker from "./MapMarker";

interface Props {
  points: MapPointDto[];
  onMarkerClick?: (point: MapPointDto) => void;
}

const MapPointList: React.FC<Props> = ({ points, onMarkerClick }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {points.map((point) => (
        <MapMarker key={point.id} point={point} onClick={onMarkerClick} />
      ))}
    </div>
  );
};

export default MapPointList;
