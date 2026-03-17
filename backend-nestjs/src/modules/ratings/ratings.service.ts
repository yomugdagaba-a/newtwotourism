import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async rateTourism(tourismPlaceId: number, userId: number, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const place = await this.prisma.tourismPlace.findUnique({
      where: { id: tourismPlaceId },
    });

    if (!place) {
      throw new NotFoundException('Tourism place not found');
    }

    return this.prisma.tourismRating.upsert({
      where: { tourismPlaceId_userId: { tourismPlaceId, userId } },
      update: { rating, comment },
      create: { tourismPlaceId, userId, rating, comment },
      include: { user: true },
    });
  }

  async rateHotel(hotelId: number, userId: number, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return this.prisma.hotelRating.upsert({
      where: { hotelId_userId: { hotelId, userId } },
      update: { rating, comment },
      create: { hotelId, userId, rating, comment },
      include: { user: true },
    });
  }

  async getTourismRatings(tourismPlaceId: number, skip = 0, take = 10) {
    const [ratings, total] = await Promise.all([
      this.prisma.tourismRating.findMany({
        where: { tourismPlaceId },
        skip,
        take,
        include: { user: true },
      }),
      this.prisma.tourismRating.count({ where: { tourismPlaceId } }),
    ]);

    return { ratings, total };
  }

  async getHotelRatings(hotelId: number, skip = 0, take = 10) {
    const [ratings, total] = await Promise.all([
      this.prisma.hotelRating.findMany({
        where: { hotelId },
        skip,
        take,
        include: { user: true },
      }),
      this.prisma.hotelRating.count({ where: { hotelId } }),
    ]);

    return { ratings, total };
  }

  async getTourismRatingSummary(tourismPlaceId: number) {
    const ratings = await this.prisma.tourismRating.findMany({
      where: { tourismPlaceId },
    });

    if (ratings.length === 0) {
      return { averageRating: 0, totalRatings: 0, distribution: {} };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = {
      1: ratings.filter((r) => r.rating === 1).length,
      2: ratings.filter((r) => r.rating === 2).length,
      3: ratings.filter((r) => r.rating === 3).length,
      4: ratings.filter((r) => r.rating === 4).length,
      5: ratings.filter((r) => r.rating === 5).length,
    };

    return {
      averageRating: parseFloat(average.toFixed(2)),
      totalRatings: ratings.length,
      distribution,
    };
  }

  async getHotelRatingSummary(hotelId: number) {
    const ratings = await this.prisma.hotelRating.findMany({
      where: { hotelId },
    });

    if (ratings.length === 0) {
      return { averageRating: 0, totalRatings: 0, distribution: {} };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = {
      1: ratings.filter((r) => r.rating === 1).length,
      2: ratings.filter((r) => r.rating === 2).length,
      3: ratings.filter((r) => r.rating === 3).length,
      4: ratings.filter((r) => r.rating === 4).length,
      5: ratings.filter((r) => r.rating === 5).length,
    };

    return {
      averageRating: parseFloat(average.toFixed(2)),
      totalRatings: ratings.length,
      distribution,
    };
  }
}
