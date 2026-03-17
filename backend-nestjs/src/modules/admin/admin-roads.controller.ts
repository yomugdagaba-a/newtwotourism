import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoadsService } from '../roads/roads.service';
import { CreateRoadDto } from '../roads/dto/create-road.dto';
import { UpdateRoadDto } from '../roads/dto/update-road.dto';

@ApiTags('Admin - Roads')
@Controller('api/admin/roads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminRoadsController {
  constructor(private roadsService: RoadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new road' })
  async create(@Body() createRoadDto: CreateRoadDto) {
    return this.roadsService.create(createRoadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roads with pagination' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('tourismPlaceId') tourismPlaceId?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;
    const tourismId = tourismPlaceId ? parseInt(tourismPlaceId, 10) : undefined;
    return this.roadsService.findAll(skipNum, takeNum, tourismId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a road by ID' })
  async findById(@Param('id') id: string) {
    return this.roadsService.findById(parseInt(id, 10));
  }

  @Get('tourism/:tourismPlaceId')
  @ApiOperation({ summary: 'Get roads by tourism place' })
  async getByTourism(@Param('tourismPlaceId') tourismPlaceId: string) {
    return this.roadsService.getByTourism(parseInt(tourismPlaceId, 10));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a road' })
  async update(
    @Param('id') id: string,
    @Body() updateRoadDto: UpdateRoadDto,
  ) {
    return this.roadsService.update(parseInt(id, 10), updateRoadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a road' })
  async delete(@Param('id') id: string) {
    await this.roadsService.delete(parseInt(id, 10));
    return { message: 'Road deleted successfully' };
  }
}
