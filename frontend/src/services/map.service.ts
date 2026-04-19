import { LocationCoordinates, RouteInfo } from "@/types/map";

/**
 * Get user's current location using browser Geolocation API
 */
export const getUserLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate route between two points using OSRM (Open Source Routing Machine)
 * Falls back to straight-line distance if OSRM is unavailable
 */
export const calculateRoute = async (
  start: LocationCoordinates,
  end: LocationCoordinates
): Promise<RouteInfo> => {
  try {
    // Validate coordinates
    if (!start || !end || !start.latitude || !start.longitude || !end.latitude || !end.longitude) {
      throw new Error("Invalid coordinates provided");
    }

    console.log(`📍 Calculating route from [${start.latitude}, ${start.longitude}] to [${end.latitude}, ${end.longitude}]`);

    // Try OSRM API endpoint first
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

    console.log(`🌐 OSRM URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log(`📡 OSRM Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 OSRM Data:`, data);

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [
            coord[1], // latitude
            coord[0], // longitude
          ]);

          console.log(`✅ OSRM Route found: ${route.distance}m, ${route.duration}s`);

          return {
            distance: route.distance, // in meters
            duration: route.duration, // in seconds
            coordinates,
          };
        } else {
          console.warn("⚠️ OSRM returned no routes");
        }
      } else {
        console.warn(`⚠️ OSRM API error: ${response.status}`);
      }
    } catch (osrmError) {
      console.warn("⚠️ OSRM API unavailable, using fallback calculation:", osrmError);
    }

    // Fallback: Calculate straight-line distance and estimate duration
    console.log("📏 Using fallback distance calculation");
    const distanceKm = calculateDistance(start, end);
    const distanceMeters = distanceKm * 1000;
    
    // Estimate duration: assume average speed of 50 km/h for driving
    const estimatedDurationSeconds = (distanceKm / 50) * 3600;

    console.log(`📊 Fallback: ${distanceKm.toFixed(2)}km, ${estimatedDurationSeconds.toFixed(0)}s`);

    // Create a simple straight-line route
    const coordinates: [number, number][] = [
      [start.latitude, start.longitude],
      [end.latitude, end.longitude],
    ];

    return {
      distance: distanceMeters,
      duration: estimatedDurationSeconds,
      coordinates,
    };
  } catch (error) {
    console.error("❌ Route calculation error:", error);
    throw error;
  }
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Get road info by tourism place ID
export async function getRoadInfoByTourism(
  tourismId: number,
  token?: string
): Promise<import("@/types/road").RoadInfoDto[]> {
  const { API_BASE_URL } = await import("./api");
  const url = `${API_BASE_URL}/tourism/${tourismId}/roads`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data ?? [];
  } catch (err) {
    console.error(`Road info by tourism fetch failed (tourismId=${tourismId}):`, err);
    return [];
  }
}
