"use client";

import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPointDto } from "@/types/map";
import { useEffect, useState, useRef, useCallback } from "react";

// Fix for default marker icons in Leaflet with Next.js
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const tourismIcon = createIcon("#10b981"); // emerald
const roadIcon = createIcon("#3b82f6"); // blue
const hotelIcon = createIcon("#8b5cf6"); // purple
const horseIcon = createIcon("#ec4899"); // pink

interface Props {
  points: MapPointDto[];
  roadType: string;
  startPlace: string;
  endPlace: string;
}

// Component to handle map cleanup
function MapCleanup() {
  const map = useMap();
  
  useEffect(() => {
    return () => {
      // Cleanup map instance on unmount
      if (map) {
        map.remove();
      }
    };
  }, [map]);
  
  return null;
}

export default function MapWithRoute({ points, roadType, startPlace, endPlace }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Only render on client side
  useEffect(() => {
    setIsClient(true);
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Cleanup any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Calculate center and bounds
  const getCenter = useCallback((): [number, number] => {
    if (points.length === 0) return [11.5, 39.5]; // North Wollo default
    
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }, [points]);

  const getZoom = useCallback((): number => {
    if (points.length <= 1) return 13;
    if (points.length <= 3) return 11;
    return 10;
  }, [points.length]);

  const getIcon = (type: string) => {
    switch (type) {
      case "TOURISM":
        return tourismIcon;
      case "HOTEL":
        return hotelIcon;
      case "ROAD":
        return roadIcon;
      case "HORSE":
        return horseIcon;
      default:
        return roadIcon;
    }
  };

  const getRouteColor = () => {
    switch (roadType) {
      case "CAR":
        return "#3b82f6"; // blue
      case "FOOT":
        return "#10b981"; // emerald
      case "PLANE":
        return "#f97316"; // orange
      case "HORSE":
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  // Create route line from points
  const routePositions: [number, number][] = points.map(p => [p.latitude, p.longitude]);

  // Don't render on server side or before ready
  if (!isClient || !mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <LeafletMap 
        center={getCenter()} 
        zoom={getZoom()} 
        className="w-full h-full"
        scrollWheelZoom={true}
        ref={(map) => {
          if (map) {
            mapInstanceRef.current = map;
          }
        }}
      >
        <MapCleanup />
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Line */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color={getRouteColor()}
            weight={4}
            opacity={0.8}
            dashArray={roadType === "PLANE" ? "10, 10" : undefined}
          />
        )}

        {/* Markers */}
        {points.map((point, index) => (
          <Marker 
            key={`marker-${point.id}`} 
            position={[point.latitude, point.longitude]}
            icon={getIcon(point.type)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {point.type === "TOURISM" && "🏔️"}
                    {point.type === "HOTEL" && "🏨"}
                    {point.type === "ROAD" && "📍"}
                    {point.type === "HORSE" && "🐎"}
                  </span>
                  <h3 className="font-bold text-gray-900">{point.name}</h3>
                </div>
                {point.description && (
                  <p className="text-sm text-gray-600 mb-2">{point.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{point.type}</span>
                  {index === 0 && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Start</span>}
                  {index === points.length - 1 && points.length > 1 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">End</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
}
