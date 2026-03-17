export interface RoadInfoDto {
  id: number;
  tourismPlaceId?: number;
  tourismPlaceName?: string;
  tourismPlaceWereda?: string;
  tourismPlaceKebele?: string;
  tourismPlaceLatitude?: number;
  tourismPlaceLongitude?: number;
  initialPlace: string;
  roadType: string; // "CAR", "FOOT", "PLANE", "HORSE"
  description?: string;
  distanceByCar?: number;
  distanceByFoot?: number;
  distanceByPlane?: number;
  distanceByHorse?: number;
  totalDistance?: number;
  startLatitude?: number;
  startLongitude?: number;
}
