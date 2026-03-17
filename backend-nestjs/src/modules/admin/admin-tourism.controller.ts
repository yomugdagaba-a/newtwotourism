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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TourismService } from '../tourism/tourism.service';
import { CreateTourismDto } from '../tourism/dto/create-tourism.dto';
import { UpdateTourismDto } from '../tourism/dto/update-tourism.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Tourism')
@Controller('api/admin/tourism')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminTourismController {
  constructor(private tourismService: TourismService) {}

  @Post()
  @ApiOperation({ summary: 'Create tourism place' })
  async create(@Body() createTourismDto: CreateTourismDto) {
    return this.tourismService.create(createTourismDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tourism places (admin - no pagination)' })
  async getAll() {
    const result = await this.tourismService.findAll(0, 10000);
    return {
      content: result.places || result,
      totalElements: result.total || 0,
      totalPages: 1,
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'Get tourism places list (for dropdowns)' })
  async getList() {
    const places = await this.tourismService.findAll(0, 1000);
    return places.places || places;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tourism place by ID' })
  async findById(@Param('id') id: string) {
    return this.tourismService.findById(parseInt(id));
  }

  @Get()
  @ApiOperation({ summary: 'Get all tourism places (paginated)' })
  async findAll(
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('category') category?: string,
  ) {
    const skip = page * size;
    const result = await this.tourismService.findAll(skip, size, category);
    return {
      content: result.places || result,
      totalElements: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / size),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tourism place' })
  async update(
    @Param('id') id: string,
    @Body() updateTourismDto: UpdateTourismDto,
  ) {
    return this.tourismService.update(parseInt(id), updateTourismDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tourism place' })
  async delete(@Param('id') id: string) {
    return this.tourismService.delete(parseInt(id));
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get images for tourism place' })
  async getImages(@Param('id') id: string) {
    return this.tourismService.getImages(parseInt(id));
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add image to tourism place' })
  async addImage(
    @Param('id') id: string,
    @Body() body: { imageUrl: string },
  ) {
    return this.tourismService.addImage(parseInt(id), body.imageUrl);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Remove image from tourism place' })
  async removeImage(@Param('imageId') imageId: string) {
    return this.tourismService.removeImage(parseInt(imageId));
  }
}
