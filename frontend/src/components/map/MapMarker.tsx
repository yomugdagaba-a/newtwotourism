// frontend/src/components/map/MapMarker.tsx

"use client";

import React from "react";
import { MapPointDto } from "../../types/map";

interface Props {
  point: MapPointDto;
  onClick?: (point: MapPointDto) => void;
}

const MapMarker: React.FC<Props> = ({ point, onClick }) => {
  const getColor = () => {
    switch (point.type) {
      case "TOURISM":
        return "bg-green-500";
      case "HOTEL":
        return "bg-blue-500";
      case "ROAD":
        return "bg-gray-500";
      case "HORSE":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div
      className={`w-4 h-4 rounded-full cursor-pointer ${getColor()}`}
      title={point.name}
      onClick={() => onClick?.(point)}
    />
  );
};

export default MapMarker;
