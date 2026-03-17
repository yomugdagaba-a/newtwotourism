// frontend/src/components/map/DistanceInfo.tsx

"use client";

import React from "react";

interface Props {
  from: string;
  to: string;
  distance: number; // in km
}

const DistanceInfo: React.FC<Props> = ({ from, to, distance }) => {
  return (
    <div className="p-2 bg-gray-100 rounded shadow text-sm">
      Distance from <strong>{from}</strong> to <strong>{to}</strong>:{" "}
      <strong>{distance.toFixed(2)} km</strong>
    </div>
  );
};

export default DistanceInfo;
