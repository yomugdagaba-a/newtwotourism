export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  id: string;
  name: string;
  coordinates: LocationCoordinates;
  type: 'user' | 'tourism';
  icon?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lat, lng] pairs
}

export interface MapState {
  userLocation: LocationCoordinates | null;
  tourismLocation: LocationCoordinates | null;
  route: RouteInfo | null;
  loading: boolean;
  error: string | null;
}
