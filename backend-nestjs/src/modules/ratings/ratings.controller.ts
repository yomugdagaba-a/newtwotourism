import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ratings')
@Controller('api/ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post('tourism')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate tourism place' })
  async rateTourismGeneric(
    @Body() body: { tourismPlaceId: number; rating: number; comment?: string },
    @Request() req: any,
  ) {
    return this.ratingsService.rateTourism(
      body.tourismPlaceId,
      req.user.userId,
      body.rating,
      body.comment,
    );
  }

  @Post('hotel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate hotel' })
  async rateHotelGeneric(
    @Body() body: { hotelId: number; rating: number; comment?: string },
    @Request() req: any,
  ) {
    return this.ratingsService.rateHotel(
      body.hotelId,
      req.user.userId,
      body.rating,
      body.comment,
    );
  }

  @Post('tourism/:tourismPlaceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate tourism place' })
  async rateTourism(
    @Param('tourismPlaceId', ParseIntPipe) tourismPlaceId: number,
    @Body() body: { rating: number; comment?: string },
    @Request() req: any,
  ) {
    return this.ratingsService.rateTourism(
      tourismPlaceId,
      req.user.userId,
      body.rating,
      body.comment,
    );
  }

  @Post('hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate hotel' })
  async rateHotel(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() body: { rating: number; comment?: string },
    @Request() req: any,
  ) {
    return this.ratingsService.rateHotel(
      hotelId,
      req.user.userId,
      body.rating,
      body.comment,
    );
  }

  @Get('tourism/:tourismPlaceId')
  @ApiOperation({ summary: 'Get tourism ratings' })
  async getTourismRatings(
    @Param('tourismPlaceId', ParseIntPipe) tourismPlaceId: number,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    const result = await this.ratingsService.getTourismRatings(tourismPlaceId, skip, take);
    return result.ratings;
  }

  @Get('hotel/:hotelId')
  @ApiOperation({ summary: 'Get hotel ratings' })
  async getHotelRatings(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    const result = await this.ratingsService.getHotelRatings(hotelId, skip, take);
    return result.ratings;
  }

  @Get('tourism/:tourismPlaceId/summary')
  @ApiOperation({ summary: 'Get tourism rating summary' })
  async getTourismRatingSummary(@Param('tourismPlaceId', ParseIntPipe) tourismPlaceId: number) {
    return this.ratingsService.getTourismRatingSummary(tourismPlaceId);
  }

  @Get('hotel/:hotelId/summary')
  @ApiOperation({ summary: 'Get hotel rating summary' })
  async getHotelRatingSummary(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.ratingsService.getHotelRatingSummary(hotelId);
  }
}
