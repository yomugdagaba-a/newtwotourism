import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTourismDto } from './dto/create-tourism.dto';
import { UpdateTourismDto } from './dto/update-tourism.dto';

@Injectable()
export class TourismService {
  constructor(private prisma: PrismaService) {}

  async create(createTourismDto: CreateTourismDto) {
    // Extract images and mainImageUrl (they're managed separately)
    const { images, ...dataWithoutImages } = createTourismDto as any;
    
    return this.prisma.tourismPlace.create({
      data: {
        ...dataWithoutImages,
        visitTime: createTourismDto.visitTime ? parseInt(createTourismDto.visitTime as any) : null,
      },
      include: { images: true, ratings: true },
    });
  }

  async findAll(skip = 0, take = 10, category?: string) {
    const where: any = category ? { categories: { has: category as any } } : {};

    const [places, total] = await Promise.all([
      this.prisma.tourismPlace.findMany({
        where,
        skip,
        take,
        include: { images: true, ratings: true },
      }),
      this.prisma.tourismPlace.count({ where }),
    ]);

    return { places, total };
  }

  async findById(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid tourism place ID');
    }

    const place = await this.prisma.tourismPlace.findUnique({
      where: { id },
      include: {
        images: true,
        ratings: { include: { user: true } },
        hotels: true,
        roadInfos: true,
      },
    });

    if (!place) {
      throw new NotFoundException('Tourism place not found');
    }

    // Increment viewers count
    await this.prisma.tourismPlace.update({
      where: { id },
      data: { viewersCount: { increment: 1 } },
    });

    // Get nearby places
    const nearbyPlaces = await this.getNearbyPlaces(id, 5);

    return {
      ...place,
      nearbyPlaces: nearbyPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.images && p.images.length > 0 ? p.images[0].imageUrl : null,
      })),
    };
  }

  async update(id: number, updateTourismDto: UpdateTourismDto) {
    const place = await this.prisma.tourismPlace.findUnique({ where: { id } });
    if (!place) {
      throw new NotFoundException('Tourism place not found');
    }

    // Extract images and mainImageUrl (they're managed separately)
    const { images, ...dataWithoutImages } = updateTourismDto as any;

    return this.prisma.tourismPlace.update({
      where: { id },
      data: dataWithoutImages,
      include: { images: true, ratings: true },
    });
  }

  async delete(id: number) {
    const place = await this.prisma.tourismPlace.findUnique({ where: { id } });
    if (!place) {
      throw new NotFoundException('Tourism place not found');
    }

    return this.prisma.tourismPlace.delete({ where: { id } });
  }

  async search(query: string, category?: string, skip = 0, take = 10) {
    const where: any = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
            { wereda: { contains: query, mode: 'insensitive' as const } },
          ],
        },
        category ? { categories: { has: category as any } } : {},
      ],
    };

    const [places, total] = await Promise.all([
      this.prisma.tourismPlace.findMany({
        where,
        skip,
        take,
        include: { images: true, ratings: true },
      }),
      this.prisma.tourismPlace.count({ where }),
    ]);

    return { places, total };
  }

  async addImage(tourismPlaceId: number, imageUrl: string) {
    const place = await this.prisma.tourismPlace.findUnique({
      where: { id: tourismPlaceId },
    });

    if (!place) {
      throw new NotFoundException('Tourism place not found');
    }

    return this.prisma.tourismImage.create({
      data: {
        tourismPlaceId,
        imageUrl,
      },
    });
  }

  async removeImage(imageId: number) {
    return this.prisma.tourismImage.delete({
      where: { id: imageId },
    });
  }

  // ========================
  // Public endpoints
  // ========================

  async searchPublic(params: {
    keyword?: string;
    kebele?: string;
    wereda?: string;
    categories?: string[];
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) {
    const {
      keyword = '',
      kebele = '',
      wereda = '',
      categories = [],
      page = 0,
      size = 12,
      sortBy = 'name',
      sortDir = 'asc',
    } = params;

    // Build where clause
    const where: any = {
      AND: [
        { status: 'ACTIVE' }, // Only show active tourism places
      ],
    };

    // Add keyword search
    if (keyword.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: keyword.trim(), mode: 'insensitive' as const } },
          { description: { contains: keyword.trim(), mode: 'insensitive' as const } },
        ],
      });
    }

    // Add kebele filter
    if (kebele.trim()) {
      where.AND.push({
        kebele: { contains: kebele.trim(), mode: 'insensitive' as const },
      });
    }

    // Add wereda filter
    if (wereda.trim()) {
      where.AND.push({
        wereda: { contains: wereda.trim(), mode: 'insensitive' as const },
      });
    }

    // Add category filter - validate enum values
    if (categories.length > 0) {
      const validCategories = categories.filter((cat) => {
        const validEnums = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];
        return validEnums.includes(cat.toUpperCase());
      });

      if (validCategories.length > 0) {
        where.AND.push({
          categories: { hasSome: validCategories as any },
        });
      }
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'viewersCount') {
      orderBy.viewersCount = sortDir === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy[sortBy] = sortDir === 'desc' ? 'desc' : 'asc';
    }

    // Fetch data
    const [content, totalElements] = await Promise.all([
      this.prisma.tourismPlace.findMany({
        where: where.AND ? where : {},
        skip: page * size,
        take: size,
        include: { images: true, ratings: true },
        orderBy,
      }),
      this.prisma.tourismPlace.count({
        where: where.AND ? where : {},
      }),
    ]);

    // Return paginated response matching Spring Boot Page<T> format
    const totalPages = Math.ceil(totalElements / size);
    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalPages,
      totalElements,
      number: page,
      size,
      numberOfElements: content.length,
      first: page === 0,
      last: page === totalPages - 1,
      empty: content.length === 0,
    };
  }

  async getHomepageTourism(categories: string[]) {
    const where: any = categories.length > 0 ? { categories: { hasSome: categories as any } } : {};

    return this.prisma.tourismPlace.findMany({
      where,
      take: 10,
      orderBy: { viewersCount: 'desc' },
      include: { images: true },
    });
  }

  async getImages(tourismPlaceId: number) {
    return this.prisma.tourismImage.findMany({
      where: { tourismPlaceId },
    });
  }

  async getNearbyPlaces(tourismPlaceId: number, limit = 5) {
    // Get the current place to find its kebele
    const currentPlace = await this.prisma.tourismPlace.findUnique({
      where: { id: tourismPlaceId },
    });

    if (!currentPlace) {
      throw new NotFoundException('Tourism place not found');
    }

    // Find nearby places in the same kebele, excluding the current place
    const nearbyPlaces = await this.prisma.tourismPlace.findMany({
      where: {
        kebele: currentPlace.kebele,
        id: { not: tourismPlaceId },
        status: 'ACTIVE',
      },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return nearbyPlaces;
  }
}
