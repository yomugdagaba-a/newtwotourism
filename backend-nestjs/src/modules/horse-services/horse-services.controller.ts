import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HorseServicesService } from './horse-services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Horse Services')
@Controller('api/horse-services')
export class HorseServicesController {
  constructor(private horseServicesService: HorseServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create horse service' })
  async create(@Body() data: any) {
    return this.horseServicesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all horse services' })
  async findAll(@Query('skip') skip = 0, @Query('take') take = 10) {
    return this.horseServicesService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get horse service by ID' })
  async findById(@Param('id') id: string) {
    return this.horseServicesService.findById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update horse service' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.horseServicesService.update(parseInt(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete horse service' })
  async delete(@Param('id') id: string) {
    return this.horseServicesService.delete(parseInt(id));
  }
}

@ApiTags('Roads - Horse Services')
@Controller('api/roads')
export class RoadsHorseServicesController {
  constructor(private horseServicesService: HorseServicesService) {}

  @Get(':roadId/horse-services')
  @ApiOperation({ summary: 'Get horse services by road' })
  async getByRoad(@Param('roadId') roadId: string) {
    return this.horseServicesService.getByRoad(parseInt(roadId));
  }
}
