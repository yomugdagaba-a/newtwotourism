import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TourismService } from './tourism.service';

@ApiTags('Tourism - Public')
@Controller('api/tourisms')
export class TourismPublicController {
  constructor(private tourismService: TourismService) {}

  @Get('public/search')
  @ApiOperation({ summary: 'Search tourism places (public)' })
  async search(
    @Query('keyword') keyword?: string,
    @Query('kebele') kebele?: string,
    @Query('wereda') wereda?: string,
    @Query('categories') categories?: string | string[],
    @Query('page') page: number = 0,
    @Query('size') size: number = 12,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortDir') sortDir: string = 'asc',
  ) {
    try {
      // Convert categories to array if it's a string
      const categoryArray = Array.isArray(categories)
        ? categories
        : categories
          ? [categories]
          : [];

      return await this.tourismService.searchPublic({
        keyword,
        kebele,
        wereda,
        categories: categoryArray,
        page,
        size,
        sortBy,
        sortDir,
      });
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  @Get('public/homepage')
  @ApiOperation({ summary: 'Get homepage tourism places' })
  async getHomepage(@Query('categories') categories?: string | string[]) {
    const categoryArray = Array.isArray(categories)
      ? categories
      : categories
        ? [categories]
        : [];

    return this.tourismService.getHomepageTourism(categoryArray);
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get images for tourism place' })
  async getImages(@Param('id', ParseIntPipe) id: number) {
    return this.tourismService.getImages(id);
  }

  @Get(':id/nearby')
  @ApiOperation({ summary: 'Get nearby tourism places' })
  async getNearby(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit: number = 5,
  ) {
    const nearbyPlaces = await this.tourismService.getNearbyPlaces(id, limit);
    return nearbyPlaces.map((place) => ({
      id: place.id,
      name: place.name,
      imageUrl: place.images && place.images.length > 0 ? place.images[0].imageUrl : null,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tourism place by ID (public)' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.tourismService.findById(id);
  }
}
