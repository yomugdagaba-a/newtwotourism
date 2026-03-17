import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HorseServicesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      console.log('[HorseServicesService] Creating horse service with data:', data);
      
      // Map from Spring Boot structure to database structure
      // Frontend sends: ownerName, contactInfo, initialPlace, cost, roadInfoId
      // Database has: name, description, pricePerHour, maxCapacity, active, roadInfoId
      
      const dbData = {
        name: data.ownerName || 'Horse Service',
        description: `Owner: ${data.ownerName}, Contact: ${data.contactInfo}, Place: ${data.initialPlace}`,
        pricePerHour: data.cost || 0,
        maxCapacity: 1,
        active: true,
        roadInfoId: data.roadInfoId || null,
      };
      
      console.log('[HorseServicesService] Mapped data for database:', dbData);
      const service = await this.prisma.horseService.create({ data: dbData });
      console.log('[HorseServicesService] Created horse service:', service);
      return service;
    } catch (error: any) {
      console.error('[HorseServicesService] Error in create:', error);
      throw new InternalServerErrorException('Failed to create horse service');
    }
  }

  private mapToDto(service: any) {
    // Extract owner name from description or use name as fallback
    const ownerMatch = service.description?.match(/Owner:\s*([^,]+)/);
    const ownerName = ownerMatch ? ownerMatch[1].trim() : service.name;
    
    const contactMatch = service.description?.match(/Contact:\s*([^,]+)/);
    const contactInfo = contactMatch ? contactMatch[1].trim() : '';
    
    const placeMatch = service.description?.match(/Place:\s*(.+)$/);
    const initialPlace = placeMatch ? placeMatch[1].trim() : '';
    
    return {
      id: service.id,
      ownerName,
      contactInfo,
      initialPlace,
      cost: service.pricePerHour || 0,
    };
  }

  async findAll(skip = 0, take = 10) {
    try {
      const [services, total] = await Promise.all([
        this.prisma.horseService.findMany({ skip, take }),
        this.prisma.horseService.count(),
      ]);
      return { services: services.map(s => this.mapToDto(s)), total };
    } catch (error: any) {
      console.error('[HorseServicesService] Error in findAll:', error);
      throw new InternalServerErrorException('Failed to fetch horse services');
    }
  }

  async findById(id: number) {
    try {
      const service = await this.prisma.horseService.findUnique({ where: { id } });
      if (!service) throw new NotFoundException('Horse service not found');
      return this.mapToDto(service);
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('[HorseServicesService] Error in findById:', error);
      throw new InternalServerErrorException('Failed to fetch horse service');
    }
  }

  async getByRoad(roadId: number) {
    try {
      console.log(`[HorseServicesService] Fetching horse services for road: ${roadId}`);
      
      // Filter horse services by roadInfoId
      const services = await this.prisma.horseService.findMany({
        where: { roadInfoId: roadId }
      });
      
      console.log(`[HorseServicesService] Found ${services.length} horse services for road ${roadId}`);
      return services.map(s => this.mapToDto(s));
    } catch (error: any) {
      console.error('[HorseServicesService] Error in getByRoad:', error);
      throw new InternalServerErrorException('Failed to fetch horse services for road');
    }
  }

  async update(id: number, data: any) {
    try {
      const service = await this.prisma.horseService.findUnique({ where: { id } });
      if (!service) throw new NotFoundException('Horse service not found');
      
      // Map from Spring Boot structure to database structure
      const dbData = {
        name: data.ownerName || service.name,
        description: data.contactInfo || data.initialPlace ? `Owner: ${data.ownerName}, Contact: ${data.contactInfo}, Place: ${data.initialPlace}` : service.description,
        pricePerHour: data.cost !== undefined ? data.cost : service.pricePerHour,
        roadInfoId: data.roadInfoId !== undefined ? data.roadInfoId : service.roadInfoId,
      };
      
      return this.prisma.horseService.update({ where: { id }, data: dbData });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('[HorseServicesService] Error in update:', error);
      throw new InternalServerErrorException('Failed to update horse service');
    }
  }

  async delete(id: number) {
    try {
      const service = await this.prisma.horseService.findUnique({ where: { id } });
      if (!service) throw new NotFoundException('Horse service not found');
      return this.prisma.horseService.delete({ where: { id } });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('[HorseServicesService] Error in delete:', error);
      throw new InternalServerErrorException('Failed to delete horse service');
    }
  }
}
