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
import { HorseServicesService } from '../horse-services/horse-services.service';

@ApiTags('Admin - Horse Services')
@Controller('api/admin/horse-services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminHorseServicesController {
  constructor(private horseServicesService: HorseServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new horse service' })
  async create(@Body() createHorseServiceDto: any) {
    return this.horseServicesService.create(createHorseServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all horse services with pagination' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;
    return this.horseServicesService.findAll(skipNum, takeNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a horse service by ID' })
  async findById(@Param('id') id: string) {
    return this.horseServicesService.findById(parseInt(id, 10));
  }

  @Get('road/:roadId')
  @ApiOperation({ summary: 'Get horse services by road' })
  async getByRoad(@Param('roadId') roadId: string) {
    return this.horseServicesService.getByRoad(parseInt(roadId, 10));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a horse service' })
  async update(
    @Param('id') id: string,
    @Body() updateHorseServiceDto: any,
  ) {
    return this.horseServicesService.update(parseInt(id, 10), updateHorseServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a horse service' })
  async delete(@Param('id') id: string) {
    await this.horseServicesService.delete(parseInt(id, 10));
    return { message: 'Horse service deleted successfully' };
  }
}
