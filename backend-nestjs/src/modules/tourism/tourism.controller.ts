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
import { TourismService } from './tourism.service';
import { CreateTourismDto } from './dto/create-tourism.dto';
import { UpdateTourismDto } from './dto/update-tourism.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tourism Places')
@Controller('api/tourism')
export class TourismController {
  constructor(private tourismService: TourismService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tourism place' })
  async create(@Body() createTourismDto: CreateTourismDto) {
    return this.tourismService.create(createTourismDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tourism places' })
  async search(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.tourismService.search(query, category, skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tourism place by ID' })
  async findById(@Param('id') id: string) {
    return this.tourismService.findById(parseInt(id));
  }

  @Get()
  @ApiOperation({ summary: 'Get all tourism places' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('category') category?: string,
  ) {
    return this.tourismService.findAll(skip, take, category);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tourism place' })
  async update(
    @Param('id') id: string,
    @Body() updateTourismDto: UpdateTourismDto,
  ) {
    return this.tourismService.update(parseInt(id), updateTourismDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tourism place' })
  async delete(@Param('id') id: string) {
    return this.tourismService.delete(parseInt(id));
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add image to tourism place' })
  async addImage(
    @Param('id') id: string,
    @Body() body: { imageUrl: string },
  ) {
    return this.tourismService.addImage(parseInt(id), body.imageUrl);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from tourism place' })
  async removeImage(@Param('imageId') imageId: string) {
    return this.tourismService.removeImage(parseInt(imageId));
  }
}
