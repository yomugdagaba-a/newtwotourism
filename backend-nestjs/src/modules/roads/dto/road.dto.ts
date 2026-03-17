import { ApiProperty } from '@nestjs/swagger';

export class RoadDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1, required: false })
  tourismPlaceId?: number;

  @ApiProperty({ example: 'Lalibela', required: false })
  tourismPlaceName?: string;

  @ApiProperty({ example: 'North Wollo', required: false })
  tourismPlaceWereda?: string;

  @ApiProperty({ example: 'Lalibela Kebele', required: false })
  tourismPlaceKebele?: string;

  @ApiProperty({ example: 12.0269, required: false })
  tourismPlaceLatitude?: number;

  @ApiProperty({ example: 39.0471, required: false })
  tourismPlaceLongitude?: number;

  @ApiProperty({ example: 'Addis Ababa' })
  initialPlace!: string;

  @ApiProperty({ example: 'CAR' })
  roadType!: string;

  @ApiProperty({ example: 'Paved road with good conditions', required: false })
  description?: string;

  @ApiProperty({ example: 100.5, required: false })
  distanceByCar?: number;

  @ApiProperty({ example: 150, required: false })
  distanceByFoot?: number;

  @ApiProperty({ example: 80, required: false })
  distanceByPlane?: number;

  @ApiProperty({ example: 120, required: false })
  distanceByHorse?: number;

  @ApiProperty({ example: 100, required: false })
  totalDistance?: number;

  @ApiProperty({ example: 9.0320, required: false })
  startLatitude?: number;

  @ApiProperty({ example: 38.7469, required: false })
  startLongitude?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(road: any): RoadDto {
    const dto = new RoadDto();
    dto.id = road.id;
    dto.tourismPlaceId = road.tourismPlaceId;
    
    // Map tourism place information if available
    if (road.tourismPlace) {
      dto.tourismPlaceName = road.tourismPlace.name;
      dto.tourismPlaceWereda = road.tourismPlace.wereda;
      dto.tourismPlaceKebele = road.tourismPlace.kebele;
      dto.tourismPlaceLatitude = road.tourismPlace.latitude;
      dto.tourismPlaceLongitude = road.tourismPlace.longitude;
    }
    
    dto.initialPlace = road.name || 'Unknown';
    dto.roadType = (road.type || 'CAR').toString();
    dto.description = road.description || '';
    
    // Parse distances from condition field (JSON)
    let distances: any = {};
    if (road.condition) {
      try {
        distances = JSON.parse(road.condition);
      } catch (e) {
        distances = {};
      }
    }
    
    // Map all distance fields
    dto.distanceByCar = distances.distanceByCar;
    dto.distanceByFoot = distances.distanceByFoot;
    dto.distanceByHorse = distances.distanceByHorse;
    dto.distanceByPlane = distances.distanceByPlane;
    dto.totalDistance = distances.totalDistance;
    
    // Map coordinates if available
    dto.startLatitude = distances.startLatitude;
    dto.startLongitude = distances.startLongitude;
    
    dto.createdAt = road.createdAt;
    dto.updatedAt = road.updatedAt;
    return dto;
  }
}
