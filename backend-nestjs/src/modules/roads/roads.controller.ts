import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoadsService } from './roads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoadDto } from './dto/create-road.dto';
import { UpdateRoadDto } from './dto/update-road.dto';

@ApiTags('Roads')
@Controller('api/roads')
export class RoadsController {
  constructor(private roadsService: RoadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create road' })
  async create(@Body(ValidationPipe) data: CreateRoadDto) {
    return this.roadsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roads' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('tourismPlaceId') tourismPlaceId?: string,
  ) {
    const skipNum = parseInt(skip as any) || 0;
    const takeNum = parseInt(take as any) || 10;
    return this.roadsService.findAll(skipNum, takeNum, tourismPlaceId ? parseInt(tourismPlaceId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get road by ID' })
  async findById(@Param('id') id: string) {
    return this.roadsService.findById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update road' })
  async update(@Param('id') id: string, @Body(ValidationPipe) data: UpdateRoadDto) {
    return this.roadsService.update(parseInt(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete road' })
  async delete(@Param('id') id: string) {
    await this.roadsService.delete(parseInt(id));
    return { message: 'Road deleted successfully' };
  }
}

@ApiTags('Tourism - Roads')
@Controller('api/tourisms')
export class TourismRoadsController {
  constructor(private roadsService: RoadsService) {}

  @Get(':tourismId/roads')
  @ApiOperation({ summary: 'Get roads by tourism place' })
  async getRoadsByTourism(@Param('tourismId') tourismId: string) {
    return this.roadsService.getByTourism(parseInt(tourismId));
  }
}
