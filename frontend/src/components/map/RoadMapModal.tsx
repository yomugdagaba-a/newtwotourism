"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import LRM from "leaflet-routing-machine";
import { LocationCoordinates } from "@/types/map";
import { calculateRoute, formatDistance, formatDuration } from "@/services/map.service";
import { getLocationCoordinates, addCoordinateOffset } from "@/services/location.service";
import { RoadInfoDto } from "@/types/road";
import { API_BASE_URL } from "@/services/api";
import Modal from "@/components/common/Modal";

// Fix Leaflet default icon paths
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface RoadMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  road: RoadInfoDto;
  tourismName?: string;
  tourismWereda?: string;
  tourismKebele?: string;
  tourismLatitude?: number;
  tourismLongitude?: number;
}

export default function RoadMapModal({
  isOpen,
  onClose,
  road,
  tourismName,
  tourismWereda,
  tourismKebele,
  tourismLatitude,
  tourismLongitude,
}: RoadMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routingControl = useRef<any>(null);
  const startMarker = useRef<L.Marker | null>(null);
  const destinationMarker = useRef<L.Marker | null>(null);

  const [startLocation, setStartLocation] = useState<LocationCoordinates | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Destroy existing map if switching modes
    if (map.current) {
      try {
        map.current.remove();
      } catch (e) {
        console.warn('Error removing map:', e);
      }
      map.current = null;
      routingControl.current = null;
      startMarker.current = null;
      destinationMarker.current = null;
      setMapInitialized(false);
    }

    const initializeMap = async () => {
      try {
        if (!mapContainer.current) return;

        // Check if container already has a map instance
        const container = mapContainer.current as any;
        if (container._leaflet_id) {
          console.log('Container already has a map, clearing...');
          container._leaflet_id = undefined;
        }

        // Use tourism place data from road if not provided via props
        const destName = tourismName || road.tourismPlaceName || 'Destination';
        const destWereda = tourismWereda || road.tourismPlaceWereda;
        const destKebele = tourismKebele || road.tourismPlaceKebele;
        const destLat = tourismLatitude ?? road.tourismPlaceLatitude;
        const destLon = tourismLongitude ?? road.tourismPlaceLongitude;

        console.log('[RoadMapModal] Initializing map with:', {
          tourismName: destName,
          tourismWereda: destWereda,
          tourismKebele: destKebele,
          tourismLatitude: destLat,
          tourismLongitude: destLon,
          roadInitialPlace: road.initialPlace,
        });

        // Get destination location (tourism place)
        let destLocation: LocationCoordinates;
        
        if (destLat && destLon) {
          // Use provided coordinates
          destLocation = {
            latitude: destLat,
            longitude: destLon,
          };
          console.log(`[RoadMapModal] Using tourism coordinates:`, destLocation);
        } else {
          // Fallback to wereda/kebele
          destLocation = getLocationCoordinates(destWereda, destKebele);
          console.log(`[RoadMapModal] Using wereda/kebele coordinates:`, destLocation);
        }

        // Get start location (road starting point)
        let startLoc: LocationCoordinates;
        
        if (road.startLatitude && road.startLongitude) {
          // Use road coordinates if available
          startLoc = {
            latitude: road.startLatitude,
            longitude: road.startLongitude,
          };
          console.log(`[RoadMapModal] Using road starting coordinates:`, startLoc);
        } else {
          // Use road's initial place name to look up coordinates
          startLoc = getLocationCoordinates(road.initialPlace);
          console.log(`[RoadMapModal] Using road initial place lookup:`, startLoc);
        }

        setStartLocation(startLoc);
        setDestinationLocation(destLocation);

        // Add offset to destination for better map view
        const destWithOffset = addCoordinateOffset(destLocation, 0.3);

        // Create map centered on destination
        map.current = L.map(mapContainer.current).setView(
          [destWithOffset.latitude, destWithOffset.longitude],
          13
        );
        setMapInitialized(true);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current);

        // Add destination marker (Red)
        const destinationIcon = L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        destinationMarker.current = L.marker(
          [destWithOffset.latitude, destWithOffset.longitude],
          { icon: destinationIcon }
        )
          .addTo(map.current)
          .bindPopup(`<b>${destName}</b><br/>Destination`);

        // Add start marker (Green)
        const startIcon = L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        startMarker.current = L.marker([startLoc.latitude, startLoc.longitude], {
          icon: startIcon,
        })
          .addTo(map.current)
          .bindPopup(`<b>${road.initialPlace}</b><br/>Starting Point`);

        // Fit map to show both markers
        if (map.current && startMarker.current && destinationMarker.current) {
          const group = new L.FeatureGroup([startMarker.current, destinationMarker.current]);
          map.current.fitBounds(group.getBounds().pad(0.1));
        }

        // Calculate and display route
        try {
          const route = await calculateRoute(startLoc, destWithOffset);
          setRouteInfo({
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration),
          });

          // Add routing control
          if (map.current && !routingControl.current) {
            try {
              routingControl.current = LRM.Routing.control({
                waypoints: [
                  L.latLng(startLoc.latitude, startLoc.longitude),
                  L.latLng(destWithOffset.latitude, destWithOffset.longitude),
                ],
                routeWhileDragging: false,
                lineOptions: {
                  styles: [{ color: "#3b82f6", opacity: 0.7, weight: 5 }],
                },
                createMarker: () => null,
              }).addTo(map.current);
            } catch (err) {
              console.warn("[RoadMapModal] Routing control failed, drawing simple line:", err);
              if (map.current) {
                const polyline = L.polyline(
                  [
                    [startLoc.latitude, startLoc.longitude],
                    [destWithOffset.latitude, destWithOffset.longitude],
                  ],
                  { color: "#3b82f6", opacity: 0.7, weight: 5 }
                ).addTo(map.current);
              }
            }
          }
        } catch (err) {
          console.error("[RoadMapModal] Route calculation failed:", err);
          
          if (map.current && startMarker.current && destinationMarker.current) {
            const polyline = L.polyline(
              [
                [startLoc.latitude, startLoc.longitude],
                [destWithOffset.latitude, destWithOffset.longitude],
              ],
              { color: "#3b82f6", opacity: 0.7, weight: 5 }
            ).addTo(map.current);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize map");
        setLoading(false);
      }
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (routingControl.current && map.current) {
        map.current.removeControl(routingControl.current);
        routingControl.current = null;
      }
    };
  }, [isOpen, road, tourismName, tourismWereda, tourismKebele, tourismLatitude, tourismLongitude, isFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle map resize when fullscreen changes
  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 50);
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 200);
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 500);
    }
  }, [isFullscreen]);

  return isFullscreen ? (
    // Fullscreen Map View
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">{road.roadType} Route</h2>
          <p className="text-gray-500 text-xs">Full Screen Map View</p>
        </div>
        <button
          onClick={() => setIsFullscreen(false)}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Fullscreen
        </button>
      </div>

      {/* Single compact info row — all status in one bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 bg-gray-50 text-sm">
        {routeInfo && (
          <>
            <span className="text-gray-500 font-semibold">Distance:</span>
            <span className="font-black text-gray-900">{routeInfo.distance}</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-gray-500 font-semibold">Est. Time:</span>
            <span className="font-black text-gray-900">{routeInfo.duration}</span>
          </>
        )}
        {error && <span className="text-red-600 font-semibold text-xs ml-2">⚠ {error}</span>}
        {loading && <span className="text-blue-600 font-semibold text-xs ml-2">Loading map...</span>}
      </div>

      {/* Map Container - Full Height */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        
        {/* Floating Exit Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 text-sm"
          title="Exit fullscreen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>
      </div>

      {/* Single bottom row — legend + close */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>Starting Point</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>Destination</span>
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-blue-500 inline-block"></span>Route</span>
        </div>
        <button onClick={() => setIsFullscreen(false)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg transition-all text-sm">
          Close
        </button>
      </div>
    </div>
  ) : (
    // Modal View
    <Modal isOpen={isOpen} onClose={onClose} title="Road Route Map" size="2xl">
      <div className="space-y-2">

        {/* Single compact info row — all status in one bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          {routeInfo && (
            <>
              <span className="text-gray-500 font-semibold">Distance:</span>
              <span className="font-black text-gray-900">{routeInfo.distance}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-semibold">Est. Time:</span>
              <span className="font-black text-gray-900">{routeInfo.duration}</span>
              <span className="text-gray-300">|</span>
            </>
          )}
          {error && <span className="text-red-600 font-semibold text-xs">⚠ {error}</span>}
          {loading && <span className="text-blue-600 font-semibold text-xs">Loading map...</span>}
          {/* Legend inline */}
          <span className="ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>Start</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>Destination</span>
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-blue-500 inline-block"></span>Route</span>
          </span>
        </div>

        {/* Fullscreen button — always visible, outside the map */}
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4m12-4h4v4M6 18h4v-4m12 4h-4v-4" />
            </svg>
            Fullscreen
          </button>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainer}
          className="w-full rounded-lg border border-gray-300 bg-gray-100 relative overflow-hidden"
          style={{ height: "380px", minHeight: "380px", width: "100%" }}
        >
          {!mapInitialized && loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 font-semibold">Loading map...</p>
              </div>
            </div>
          )}
          {!mapInitialized && error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center px-4">
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom single row — close */}
        <div className="flex justify-end pt-1">
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm transition-all">
            Close Map
          </button>
        </div>
      </div>
    </Modal>
  );
}
