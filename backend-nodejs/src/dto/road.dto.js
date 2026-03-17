/** Road DTOs */

const VALID_ROAD_TYPES = ['CAR', 'FOOT', 'HORSE', 'PLANE'];

const CreateRoadDto = {
  tourismPlaceId: { required: true, type: 'number' },
  initialPlace: { required: true, type: 'string' },
  roadType: { isEnum: VALID_ROAD_TYPES },
  description: { type: 'string' },
  distanceByCar: { type: 'number' },
  distanceByFoot: { type: 'number' },
  distanceByHorse: { type: 'number' },
  distanceByPlane: { type: 'number' },
  totalDistance: { type: 'number' },
};

const UpdateRoadDto = {
  initialPlace: { type: 'string' },
  roadType: { isEnum: VALID_ROAD_TYPES },
  description: { type: 'string' },
  distanceByCar: { type: 'number' },
  distanceByFoot: { type: 'number' },
  distanceByHorse: { type: 'number' },
  distanceByPlane: { type: 'number' },
  totalDistance: { type: 'number' },
};

/**
 * Map a RoadInfo DB entity to the DTO shape the frontend expects.
 * Distances are stored as JSON in the `condition` field (same as NestJS).
 */
function toRoadDto(road) {
  // Parse distances from condition JSON field (NestJS pattern)
  let distances = {};
  if (road.condition) {
    try { distances = JSON.parse(road.condition); } catch (e) { distances = {}; }
  }

  return {
    id: road.id,
    tourismPlaceId: road.tourismPlaceId,
    // Tourism place fields (populated when included via Prisma relation)
    tourismPlaceName: road.tourismPlace?.name,
    tourismPlaceWereda: road.tourismPlace?.wereda,
    tourismPlaceKebele: road.tourismPlace?.kebele,
    tourismPlaceLatitude: road.tourismPlace?.latitude,
    tourismPlaceLongitude: road.tourismPlace?.longitude,
    initialPlace: road.name || 'Unknown',
    roadType: (road.type || 'CAR').toString(),
    description: road.description || '',
    // Distances from condition JSON
    distanceByCar: distances.distanceByCar,
    distanceByFoot: distances.distanceByFoot,
    distanceByHorse: distances.distanceByHorse,
    distanceByPlane: distances.distanceByPlane,
    totalDistance: distances.totalDistance,
    // Coordinates from condition JSON
    startLatitude: distances.startLatitude,
    startLongitude: distances.startLongitude,
    createdAt: road.createdAt,
    updatedAt: road.updatedAt,
  };
}

/**
 * Build DB data from request body.
 * Distances are stored as JSON in `condition` field (same as NestJS).
 */
function fromRoadDto(body, existing) {
  // Parse existing distances from condition JSON
  let existingDistances = {};
  if (existing?.condition) {
    try { existingDistances = JSON.parse(existing.condition); } catch (e) { existingDistances = {}; }
  }

  const distanceByCar = body.distanceByCar ?? existingDistances.distanceByCar;
  const distanceByFoot = body.distanceByFoot ?? existingDistances.distanceByFoot;
  const distanceByHorse = body.distanceByHorse ?? existingDistances.distanceByHorse;
  const distanceByPlane = body.distanceByPlane ?? existingDistances.distanceByPlane;
  const totalDistance = body.totalDistance ?? existingDistances.totalDistance;

  const conditionJson = JSON.stringify({
    distanceByCar,
    distanceByFoot,
    distanceByHorse,
    distanceByPlane,
    totalDistance,
    startLatitude: body.startLatitude ?? existingDistances.startLatitude,
    startLongitude: body.startLongitude ?? existingDistances.startLongitude,
  });

  // Use totalDistance or first available for the main `distance` field
  const distance = totalDistance ?? distanceByCar ?? distanceByFoot ?? distanceByHorse ?? distanceByPlane ?? existing?.distance;

  return {
    name: body.initialPlace ?? existing?.name,
    type: body.roadType ?? existing?.type ?? 'CAR',
    description: body.description ?? existing?.description,
    distance,
    condition: conditionJson,
  };
}

module.exports = { CreateRoadDto, UpdateRoadDto, VALID_ROAD_TYPES, toRoadDto, fromRoadDto };
