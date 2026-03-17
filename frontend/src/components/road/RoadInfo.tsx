"use client";

import React from "react";
import { RoadInfoDto } from "@/types/road";

interface Props {
  road: RoadInfoDto;
}

export default function RoadInfo({ road }: Props) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">🛤️ {road.initialPlace ? `from ${road.initialPlace} to tourism place` : 'Road'}</h3>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{road.roadType}</span>
      </div>

      {road.description && (
        <p className="text-gray-700 leading-relaxed">{road.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Road distance that requires a car</p>
          <p className="text-2xl font-bold text-gray-900">{road.distanceByCar ?? '—'} km</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Road distance that requires walking</p>
          <p className="text-2xl font-bold text-gray-900">{road.distanceByFoot ?? '—'} km</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Road distance that requires a plane</p>
          <p className="text-2xl font-bold text-gray-900">{road.distanceByPlane ?? '—'} km</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Road distance that requires a horse</p>
          <p className="text-2xl font-bold text-gray-900">{road.distanceByHorse ?? '—'} km</p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-lg font-semibold text-gray-900">Total distance: {road.totalDistance ?? '—'} km</p>
      </div>
    </div>
  );
}
