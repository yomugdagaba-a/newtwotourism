/** Road DTOs and Mapper */

const VALID_ROAD_TYPES = ['CAR', 'FOOT', 'HORSE', 'PLANE'];

class RoadDto {
  static get VALID_ROAD_TYPES() {
    return VALID_ROAD_TYPES;
  }

  static get CreateRoadDto() {
    return {
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
  }

  static get UpdateRoadDto() {
    return {
      initialPlace: { type: 'string' },
      roadType: { isEnum: VALID_ROAD_TYPES },
      description: { type: 'string' },
      distanceByCar: { type: 'number' },
      distanceByFoot: { type: 'number' },
      distanceByHorse: { type: 'number' },
      distanceByPlane: { type: 'number' },
      totalDistance: { type: 'number' },
    };
  }
}

/**
 * RoadMapper — converts between DB entities and the DTO shape the frontend expects.
 * Distances are stored as JSON in the `condition` field (same pattern as NestJS).
 */
class RoadMapper {
  /**
   * Map a RoadInfo DB entity → DTO shape for the frontend.
   */
  toDto(road) {
    let distances = {};
    if (road.condition) {
      try { distances = JSON.parse(road.condition); } catch (e) { distances = {}; }
    }
    return {
      id: road.id,
      tourismPlaceId: road.tourismPlaceId,
      tourismPlaceName: road.tourismPlace?.name,
      tourismPlaceWereda: road.tourismPlace?.wereda,
      tourismPlaceKebele: road.tourismPlace?.kebele,
      tourismPlaceLatitude: road.tourismPlace?.latitude,
      tourismPlaceLongitude: road.tourismPlace?.longitude,
      initialPlace: road.name || 'Unknown',
      roadType: (road.type || 'CAR').toString(),
      description: road.description || '',
      distanceByCar: distances.distanceByCar,
      distanceByFoot: distances.distanceByFoot,
      distanceByHorse: distances.distanceByHorse,
      distanceByPlane: distances.distanceByPlane,
      totalDistance: distances.totalDistance,
      startLatitude: distances.startLatitude,
      startLongitude: distances.startLongitude,
      createdAt: road.createdAt,
      updatedAt: road.updatedAt,
    };
  }

  /**
   * Map a request body → DB data shape for Prisma.
   */
  fromDto(body, existing) {
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
      distanceByCar, distanceByFoot, distanceByHorse, distanceByPlane, totalDistance,
      startLatitude: body.startLatitude ?? existingDistances.startLatitude,
      startLongitude: body.startLongitude ?? existingDistances.startLongitude,
    });
    const distance = totalDistance ?? distanceByCar ?? distanceByFoot ?? distanceByHorse ?? distanceByPlane ?? existing?.distance;
    return {
      name: body.initialPlace ?? existing?.name,
      type: body.roadType ?? existing?.type ?? 'CAR',
      description: body.description ?? existing?.description,
      distance,
      condition: conditionJson,
    };
  }
}

const roadMapper = new RoadMapper();

// Export both class and individual items for backward compatibility
module.exports = {
  RoadDto,
  CreateRoadDto: RoadDto.CreateRoadDto,
  UpdateRoadDto: RoadDto.UpdateRoadDto,
  VALID_ROAD_TYPES,
  RoadMapper,
  roadMapper,
  toRoadDto: (road) => roadMapper.toDto(road),
  fromRoadDto: (body, existing) => roadMapper.fromDto(body, existing),
};
