/** Road DTOs */

const VALID_ROAD_TYPES = ['CAR', 'FOOT', 'HORSE', 'PLANE'];

const CreateRoadDto = {
  tourismPlaceId: { required: true, type: 'number' },
  initialPlace: { required: true, type: 'string' },
  roadType: { isEnum: VALID_ROAD_TYPES },
};

const UpdateRoadDto = {
  initialPlace: { type: 'string' },
  roadType: { isEnum: VALID_ROAD_TYPES },
};

/** Map a RoadInfo DB entity to the DTO shape the frontend expects */
function toRoadDto(road) {
  return {
    id: road.id,
    tourismPlaceId: road.tourismPlaceId,
    initialPlace: road.name,
    roadType: road.type,
    description: road.description,
    distanceByCar: road.distanceByCar,
    distanceByFoot: road.distanceByFoot,
    distanceByHorse: road.distanceByHorse,
    distanceByPlane: road.distanceByPlane,
    totalDistance: road.totalDistance || road.distance,
    createdAt: road.createdAt,
    updatedAt: road.updatedAt,
  };
}

/** Build DB data from DTO */
function fromRoadDto(body, existing) {
  return {
    name: body.initialPlace ?? existing?.name,
    type: body.roadType ?? existing?.type ?? 'CAR',
    description: body.description ?? existing?.description,
    distanceByCar: body.distanceByCar ?? existing?.distanceByCar,
    distanceByFoot: body.distanceByFoot ?? existing?.distanceByFoot,
    distanceByHorse: body.distanceByHorse ?? existing?.distanceByHorse,
    distanceByPlane: body.distanceByPlane ?? existing?.distanceByPlane,
    totalDistance: body.totalDistance ?? existing?.totalDistance,
    distance: body.totalDistance ?? body.distanceByCar ?? existing?.distance,
  };
}

module.exports = { CreateRoadDto, UpdateRoadDto, VALID_ROAD_TYPES, toRoadDto, fromRoadDto };
