"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import LRM from "leaflet-routing-machine";
import { LocationCoordinates } from "@/types/map";
import { getUserLocation, calculateRoute, formatDistance, formatDuration } from "@/services/map.service";
import { getLocationCoordinates, addCoordinateOffset, searchTourismPlaceLocation } from "@/services/location.service";
import Modal from "@/components/common/Modal";

interface TourismMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourismName: string;
  tourismWereda?: string;
  tourismKebele?: string;
}

export default function TourismMapModal({
  isOpen,
  onClose,
  tourismName,
  tourismWereda,
  tourismKebele,
}: TourismMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routingControl = useRef<any>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const tourismMarker = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Destroy existing map if switching modes
    if (map.current) {
      map.current.remove();
      map.current = null;
      routingControl.current = null;
      userMarker.current = null;
      tourismMarker.current = null;
    }

    const initializeMap = async () => {
      try {
        // Ensure container is ready
        if (!mapContainer.current) return;

        // Try to search for the specific tourism place first
        let tourismLocation: LocationCoordinates | null = null;
        let foundExactLocation = false;
        
        if (tourismName) {
          console.log(`🔍 Searching for tourism place: ${tourismName} in ${tourismWereda}, ${tourismKebele}`);
          tourismLocation = await searchTourismPlaceLocation(tourismName, tourismWereda, tourismKebele);
          
          if (tourismLocation) {
            console.log(`✅ Found tourism place at:`, tourismLocation);
            foundExactLocation = true;
          } else {
            console.log(`⚠️ Tourism place not found via Nominatim, using wereda/kebele coordinates`);
          }
        }

        // Fallback to wereda/kebele if search fails
        if (!tourismLocation) {
          tourismLocation = getLocationCoordinates(tourismWereda, tourismKebele);
          console.log(`📍 Using wereda/kebele coordinates:`, tourismLocation);
          setUsingFallbackLocation(true);
        } else {
          setUsingFallbackLocation(false);
        }

        const tourismLocationWithOffset = addCoordinateOffset(tourismLocation, 0.3);

        // Create map centered on tourism location
        map.current = L.map(mapContainer.current).setView(
          [tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude],
          13
        );

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current);

        // Add tourism marker
        const tourismIcon = L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        tourismMarker.current = L.marker(
          [tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude],
          { icon: tourismIcon }
        )
          .addTo(map.current)
          .bindPopup(`<b>${tourismName}</b><br/>Tourism Place`);

        // Request user location
        setLoading(true);
        setError(null);

        try {
          const location = await getUserLocation();
          setUserLocation(location);

          // Add user marker
          const userIcon = L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          userMarker.current = L.marker([location.latitude, location.longitude], {
            icon: userIcon,
          })
            .addTo(map.current!)
            .bindPopup("<b>Your Location</b>");

          // Fit map to show both markers
          if (map.current && tourismMarker.current) {
            const group = new L.FeatureGroup([userMarker.current, tourismMarker.current]);
            map.current.fitBounds(group.getBounds().pad(0.1));
          }

          // Calculate and display route
          try {
            const route = await calculateRoute(location, tourismLocationWithOffset);
            setRouteInfo({
              distance: formatDistance(route.distance),
              duration: formatDuration(route.duration),
            });

            // Add routing control
            if (map.current && !routingControl.current) {
              try {
                routingControl.current = LRM.Routing.control({
                  waypoints: [
                    L.latLng(location.latitude, location.longitude),
                    L.latLng(tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude),
                  ],
                  routeWhileDragging: false,
                  lineOptions: {
                    styles: [{ color: "#3b82f6", opacity: 0.7, weight: 5 }],
                  },
                  createMarker: () => null,
                }).addTo(map.current);
              } catch (err) {
                console.warn("Routing control failed, drawing simple line:", err);
                if (map.current) {
                  const polyline = L.polyline(
                    [
                      [location.latitude, location.longitude],
                      [tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude],
                    ],
                    { color: "#3b82f6", opacity: 0.7, weight: 5 }
                  ).addTo(map.current);
                }
              }
            }
          } catch (err) {
            console.error("Route calculation failed:", err);
            setError("Could not calculate route. Showing direct path instead.");
            
            if (map.current && userMarker.current && tourismMarker.current) {
              const polyline = L.polyline(
                [
                  [location.latitude, location.longitude],
                  [tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude],
                ],
                { color: "#3b82f6", opacity: 0.7, weight: 5 }
              ).addTo(map.current);
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to get your location");
        } finally {
          setLoading(false);
        }
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
  }, [isOpen, tourismWereda, tourismKebele, tourismName, isFullscreen]);

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
      // Invalidate size multiple times to ensure proper rendering
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">{tourismName}</h2>
          <p className="text-blue-100 text-sm">Full Screen Map View</p>
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
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex gap-8">
          <div>
            <p className="text-sm text-blue-700 font-semibold">Distance</p>
            <p className="text-2xl font-black text-blue-900">{routeInfo.distance}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Estimated Time</p>
            <p className="text-2xl font-black text-blue-900">{routeInfo.duration}</p>
          </div>
        </div>
      )}

      {/* Error Bar */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Fallback Location Warning */}
      {usingFallbackLocation && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-amber-700 font-semibold">Showing approximate location for {tourismWereda}. The exact tourism place coordinates are not available.</p>
        </div>
      )}

      {/* Loading Bar */}
      {loading && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-yellow-700 font-semibold">Getting your location...</p>
        </div>
      )}

      {/* Map Container - Full Height */}
      <div className="flex-1 relative">
        <div
          ref={mapContainer}
          className="w-full h-full"
        />
        
        {/* Floating Exit Fullscreen Button (Alternative) */}
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
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 font-semibold">Tourism Place</span>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Tourism Place Map" size="2xl">
      <div className="space-y-4">
        {/* Info Section */}
        {routeInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">Route Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Distance</p>
                <p className="text-lg font-bold text-blue-900">{routeInfo.distance}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Estimated Time</p>
                <p className="text-lg font-bold text-blue-900">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Fallback Location Warning */}
        {usingFallbackLocation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-700 font-semibold">Showing approximate location for {tourismWereda}. The exact tourism place coordinates are not available.</p>
          </div>
        )}

        {/* Loading Section */}
        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 font-semibold">Getting your location...</p>
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
            className="absolute top-3 right-3 z-50 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xl flex items-center gap-2 hover:scale-110"
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
          <h4 className="font-bold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Tourism Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500"></div>
              <span className="text-gray-700">Route</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-all"
          >
            Close Map
          </button>
        </div>
      </div>
    </Modal>
  );
}
