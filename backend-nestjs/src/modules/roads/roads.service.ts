import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoadDto } from './dto/create-road.dto';
import { UpdateRoadDto } from './dto/update-road.dto';
import { RoadDto } from './dto/road.dto';

@Injectable()
export class RoadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoadDto): Promise<RoadDto> {
    try {
      // Validate tourism place exists
      const tourismPlace = await this.prisma.tourismPlace.findUnique({
        where: { id: data.tourismPlaceId },
      });
      if (!tourismPlace) {
        throw new BadRequestException('Invalid tourism place ID');
      }

      // Store all distances in condition field as JSON (temporary solution)
      const distancesJson = JSON.stringify({
        distanceByCar: data.distanceByCar,
        distanceByFoot: data.distanceByFoot,
        distanceByHorse: data.distanceByHorse,
        distanceByPlane: data.distanceByPlane,
        totalDistance: data.totalDistance,
      });

      // Use totalDistance or first available distance for the main distance field
      let distance: number | undefined = data.totalDistance;
      if (!distance && data.distanceByCar) distance = data.distanceByCar;
      if (!distance && data.distanceByFoot) distance = data.distanceByFoot;
      if (!distance && data.distanceByHorse) distance = data.distanceByHorse;
      if (!distance && data.distanceByPlane) distance = data.distanceByPlane;

      const road = await this.prisma.roadInfo.create({
        data: {
          tourismPlaceId: data.tourismPlaceId,
          name: data.initialPlace,
          type: data.roadType || 'CAR',
          description: data.description,
          distance: distance,
          condition: distancesJson, // Store all distances as JSON
        },
      });

      return RoadDto.fromEntity(road);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Tourism place not found');
      }
      if (error instanceof BadRequestException) throw error;
      console.error('Error in create:', error);
      throw new InternalServerErrorException('Failed to create road');
    }
  }

  async findAll(skip = 0, take = 10, tourismPlaceId?: number) {
    try {
      console.log(`[RoadsService] findAll called with skip=${skip}, take=${take}, tourismPlaceId=${tourismPlaceId}`);
      const where = tourismPlaceId ? { tourismPlaceId } : {};
      const [roads, total] = await Promise.all([
        this.prisma.roadInfo.findMany({ where, skip, take }),
        this.prisma.roadInfo.count({ where }),
      ]);
      console.log(`[RoadsService] Found ${roads.length} roads, total=${total}`);
      return {
        content: roads.map(r => RoadDto.fromEntity(r)),
        totalElements: total,
        totalPages: Math.ceil(total / take),
      };
    } catch (error: any) {
      console.error('[RoadsService] Error in findAll:', error);
      console.error('[RoadsService] Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      throw new InternalServerErrorException('Failed to fetch roads');
    }
  }

  async findById(id: number): Promise<RoadDto> {
    try {
      const road = await this.prisma.roadInfo.findUnique({ where: { id } });
      if (!road) throw new NotFoundException('Road not found');
      return RoadDto.fromEntity(road);
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error in findById:', error);
      throw new InternalServerErrorException('Failed to fetch road');
    }
  }

  async getByTourism(tourismPlaceId: number): Promise<RoadDto[]> {
    try {
      console.log(`[RoadsService] Fetching roads for tourism place: ${tourismPlaceId}`);
      const roads = await this.prisma.roadInfo.findMany({
        where: { tourismPlaceId },
        include: {
          tourismPlace: true, // Include tourism place data for coordinates
        },
      });
      console.log(`[RoadsService] Found ${roads.length} roads`);
      return roads.map(r => RoadDto.fromEntity(r));
    } catch (error: any) {
      console.error('[RoadsService] Error in getByTourism:', error);
      console.error('[RoadsService] Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      throw new InternalServerErrorException('Failed to fetch roads for tourism place');
    }
  }

  async update(id: number, data: UpdateRoadDto): Promise<RoadDto> {
    try {
      const road = await this.prisma.roadInfo.findUnique({ where: { id } });
      if (!road) throw new NotFoundException('Road not found');

      // Parse existing distances from condition field
      let existingDistances: any = {};
      if (road.condition) {
        try {
          existingDistances = JSON.parse(road.condition);
        } catch (e) {
          existingDistances = {};
        }
      }

      // Merge with new distances
      const distancesJson = JSON.stringify({
        distanceByCar: data.distanceByCar ?? existingDistances.distanceByCar,
        distanceByFoot: data.distanceByFoot ?? existingDistances.distanceByFoot,
        distanceByHorse: data.distanceByHorse ?? existingDistances.distanceByHorse,
        distanceByPlane: data.distanceByPlane ?? existingDistances.distanceByPlane,
        totalDistance: data.totalDistance ?? existingDistances.totalDistance,
      });

      // Use totalDistance or first available distance for the main distance field
      let distance = road.distance;
      if (data.totalDistance !== undefined) distance = data.totalDistance;
      else if (data.distanceByCar !== undefined) distance = data.distanceByCar;
      else if (data.distanceByFoot !== undefined) distance = data.distanceByFoot;
      else if (data.distanceByHorse !== undefined) distance = data.distanceByHorse;
      else if (data.distanceByPlane !== undefined) distance = data.distanceByPlane;

      const updated = await this.prisma.roadInfo.update({
        where: { id },
        data: {
          name: data.initialPlace ?? road.name,
          type: data.roadType ?? road.type,
          description: data.description ?? road.description,
          distance: distance,
          condition: distancesJson, // Store all distances as JSON
        },
      });

      return RoadDto.fromEntity(updated);
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error in update:', error);
      throw new InternalServerErrorException('Failed to update road');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const road = await this.prisma.roadInfo.findUnique({ where: { id } });
      if (!road) throw new NotFoundException('Road not found');
      await this.prisma.roadInfo.delete({ where: { id } });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error in delete:', error);
      throw new InternalServerErrorException('Failed to delete road');
    }
  }
}
