import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Hotels')
@Controller('api/hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create hotel' })
  async create(@Body() createHotelDto: CreateHotelDto, @Request() req: any) {
    return this.hotelsService.create(createHotelDto, req.user.userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search hotels' })
  async search(
    @Query('q') query: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.hotelsService.search(query, skip, take);
  }

  @Get('owner/my-hotels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my hotels' })
  async getMyHotels(
    @Request() req: any,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.hotelsService.getHotelsByOwner(req.user.userId, skip, take);
  }

  @Get('owner/:ownerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hotels by owner ID' })
  async getHotelsByOwnerId(
    @Param('ownerId') ownerId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    const result = await this.hotelsService.getHotelsByOwner(parseInt(ownerId), skip, take);
    return result.hotels;
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Get hotel detail by ID' })
  async getDetail(
    @Param('id') id: string,
    @Query('eager') eager?: string,
  ) {
    return this.hotelsService.findById(parseInt(id));
  }

  @Get(':id/ratings/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has rated hotel' })
  async checkUserRating(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.hotelsService.checkUserRating(parseInt(id), req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hotels' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('tourismPlaceId') tourismPlaceId?: string,
  ) {
    return this.hotelsService.findAll(
      skip,
      take,
      tourismPlaceId ? parseInt(tourismPlaceId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hotel by ID' })
  async findById(@Param('id') id: string) {
    return this.hotelsService.findById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update hotel' })
  async update(
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    return this.hotelsService.update(parseInt(id), updateHotelDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete hotel' })
  async delete(@Param('id') id: string) {
    return this.hotelsService.delete(parseInt(id));
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add image to hotel' })
  async addImage(@Param('id') id: string, @Body() body: { imageUrl: string }) {
    return this.hotelsService.addImage(parseInt(id), body.imageUrl);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from hotel' })
  async removeImage(@Param('imageId') imageId: string) {
    return this.hotelsService.removeImage(parseInt(imageId));
  }
}

@ApiTags('Tourism - Hotels')
@Controller('api/tourisms')
export class TourismHotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get(':tourismId/hotels')
  @ApiOperation({ summary: 'Get hotels by tourism place' })
  async getHotelsByTourism(@Param('tourismId') tourismId: string) {
    return this.hotelsService.getByTourism(parseInt(tourismId));
  }
}
