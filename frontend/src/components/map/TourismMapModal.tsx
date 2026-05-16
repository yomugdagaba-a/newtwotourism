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

// Fix Leaflet default icon paths
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface TourismMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourismName: string;
  tourismWereda?: string;
  tourismKebele?: string;
  latitude?: number | null;
  longitude?: number | null;
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
      userMarker.current = null;
      tourismMarker.current = null;
      setMapInitialized(false);
    }

    const initializeMap = async () => {
      try {
        // Ensure container is ready — retry up to 5 times
        if (!mapContainer.current) {
          let retries = 0;
          await new Promise<void>((resolve, reject) => {
            const check = setInterval(() => {
              retries++;
              if (mapContainer.current) { clearInterval(check); resolve(); }
              else if (retries >= 10) { clearInterval(check); reject(new Error('Map container not found')); }
            }, 100);
          });
        }
        if (!mapContainer.current) return;

        // Check if container already has a map instance
        const container = mapContainer.current as any;
        if (container._leaflet_id) {
          console.log('Container already has a map, clearing...');
          container._leaflet_id = undefined;
        }

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
        console.log('🗺️ Creating Leaflet map...');
        map.current = L.map(mapContainer.current).setView(
          [tourismLocationWithOffset.latitude, tourismLocationWithOffset.longitude],
          13
        );
        setMapInitialized(true);
        console.log('✅ Map created successfully');

        // Add OpenStreetMap tiles
        console.log('🌍 Adding map tiles...');
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current);
        console.log('✅ Tiles added successfully');

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

    // Use setTimeout to ensure DOM is ready — longer delay for modal rendering
    const timeoutId = setTimeout(initializeMap, 500);

    return () => {
      clearTimeout(timeoutId);
      if (routingControl.current && map.current) {
        try {
          map.current.removeControl(routingControl.current);
        } catch (e) {
          console.warn('Error removing routing control:', e);
        }
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">{tourismName}</h2>
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
        {usingFallbackLocation && (
          <span className="text-amber-600 font-semibold text-xs ml-2">⚠ Approximate location for {tourismWereda}</span>
        )}
        {error && <span className="text-red-600 font-semibold text-xs ml-2">⚠ {error}</span>}
        {loading && <span className="text-blue-600 font-semibold text-xs ml-2">Getting your location...</span>}
      </div>

      {/* Map Container - Full Height */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <div
          ref={mapContainer}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 text-sm"
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
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>Your Location</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>Tourism Place</span>
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-blue-500 inline-block"></span>Route</span>
        </div>
        <button onClick={() => setIsFullscreen(false)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg transition-all text-sm">
          Close
        </button>
      </div>
    </div>
  ) : (
    // Modal View
    <Modal isOpen={isOpen} onClose={onClose} title="Tourism Place Map" size="2xl">
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
          {usingFallbackLocation && (
            <span className="text-amber-600 font-semibold text-xs">⚠ Approximate location for {tourismWereda}</span>
          )}
          {error && <span className="text-red-600 font-semibold text-xs">⚠ {error}</span>}
          {loading && <span className="text-blue-600 font-semibold text-xs">Getting your location...</span>}
          {/* Legend inline */}
          <span className="ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>You</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>Place</span>
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
