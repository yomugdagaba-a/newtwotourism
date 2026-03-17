// frontend/src/components/map/MapLegend.tsx

"use client";

import React from "react";

const MapLegend: React.FC = () => {
  return (
    <div className="bg-white border rounded p-2 shadow text-sm space-y-1">
      <h4 className="font-semibold">Map Legend</h4>
      <ul className="list-disc list-inside">
        <li>Tourism Place: Green Marker</li>
        <li>Hotel: Blue Marker</li>
        <li>Road Info: Gray Marker</li>
        <li>Horse Service: Yellow Marker</li>
      </ul>
    </div>
  );
};

export default MapLegend;
