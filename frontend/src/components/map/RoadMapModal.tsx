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

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Destroy existing map if switching modes
    if (map.current) {
      map.current.remove();
      map.current = null;
      routingControl.current = null;
      startMarker.current = null;
      destinationMarker.current = null;
    }

    const initializeMap = async () => {
      try {
        if (!mapContainer.current) return;

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
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">{road.roadType} Route</h2>
          <p className="text-gray-300 text-sm">From {road.initialPlace} to {tourismName || road.tourismPlaceName || 'Destination'}</p>
        </div>
        <button
          onClick={() => setIsFullscreen(false)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Fullscreen
        </button>
      </div>

      {/* Info Bar */}
      {routeInfo && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex gap-8">
          <div>
            <p className="text-sm text-gray-700 font-semibold">Distance</p>
            <p className="text-2xl font-black text-gray-900">{routeInfo.distance}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-semibold">Estimated Time</p>
            <p className="text-2xl font-black text-gray-900">{routeInfo.duration}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-semibold">Road Type</p>
            <p className="text-2xl font-black text-gray-900">{road.roadType}</p>
          </div>
        </div>
      )}

      {/* Error Bar */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-red-700 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Loading Bar */}
      {loading && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-yellow-700 font-semibold">📍 Loading map...</p>
        </div>
      )}

      {/* Map Container - Full Height */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Floating Exit Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute bottom-4 right-4 z-40 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 hover:scale-105"
          title="Exit fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Starting Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500"></div>
              <span className="text-gray-700 font-semibold">Route</span>
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : (
    // Modal View
    <Modal isOpen={isOpen} onClose={onClose} title={`${road.roadType} Route`} size="2xl">
      <div className="space-y-4">
        {/* Route Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-black text-gray-900 mb-3">Route Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold">From:</span>
              <span className="text-gray-900 font-black">{road.initialPlace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold">To:</span>
              <span className="text-gray-900 font-black">{tourismName || road.tourismPlaceName || 'Destination'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold">Type:</span>
              <span className="text-gray-900 font-black">{road.roadType}</span>
            </div>
            {road.totalDistance && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold">Distance:</span>
                <span className="text-gray-900 font-black">{road.totalDistance.toFixed(1)} km</span>
              </div>
            )}
          </div>
        </div>

        {/* Route Calculation Info */}
        {routeInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-black text-blue-900 mb-2">Calculated Route</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-semibold">Distance</p>
                <p className="text-lg font-black text-blue-900">{routeInfo.distance}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">Estimated Time</p>
                <p className="text-lg font-black text-blue-900">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Loading Section */}
        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 font-semibold">📍 Loading map...</p>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapContainer}
          className="w-full rounded-lg border-2 border-gray-300 bg-gray-100 relative"
          style={{ height: "600px", minHeight: "600px" }}
        >
          {/* Floating Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 z-50 px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-all shadow-xl flex items-center gap-2 hover:scale-110"
            title="Expand to fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4m12-4h4v4M6 18h4v-4m12 4h-4v-4" />
            </svg>
            Fullscreen
          </button>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-black text-gray-900 mb-2">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Starting Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500"></div>
              <span className="text-gray-700 font-semibold">Route</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {road.description && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-black text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 text-sm font-semibold">{road.description}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-900 font-black rounded-lg transition-all"
          >
            Close Map
          </button>
        </div>
      </div>
    </Modal>
  );
}
