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
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HotelsService } from '../hotels/hotels.service';
import { CreateHotelDto } from '../hotels/dto/create-hotel.dto';
import { UpdateHotelDto } from '../hotels/dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Hotels')
@Controller('api/admin/hotels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminHotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create hotel' })
  async create(@Body() createHotelDto: CreateHotelDto, @Request() req: any) {
    try {
      // Use admin user ID as owner, or allow specifying owner in DTO
      const ownerId = (createHotelDto as any).ownerId || req.user.userId;
      console.log('🏨 [AdminHotelsController] Received create request');
      console.log('📋 DTO:', JSON.stringify(createHotelDto, null, 2));
      console.log('👤 Owner ID:', ownerId);
      console.log('🔐 User from JWT:', req.user);
      
      const result = await this.hotelsService.create(createHotelDto, ownerId);
      
      if (result) {
        console.log('✅ [AdminHotelsController] Hotel created successfully:', result.id);
        console.log('📷 [AdminHotelsController] Hotel images count:', result.images?.length || 0);
        console.log('📷 [AdminHotelsController] Hotel images:', result.images);
      } else {
        console.error('❌ [AdminHotelsController] Hotel creation returned null/undefined');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AdminHotelsController] Error creating hotel:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all hotels (paginated)' })
  async findAll(
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = Math.max(0, parseInt(page || '0') || 0);
    const sizeNum = Math.max(1, parseInt(size || '10') || 10);
    const skip = pageNum * sizeNum;
    const result = await this.hotelsService.findAll(skip, sizeNum);
    return {
      content: result.hotels || result,
      totalElements: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / sizeNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hotel by ID' })
  async findById(@Param('id') id: string) {
    return this.hotelsService.findById(parseInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update hotel' })
  async update(
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    try {
      console.log('🏨 [AdminHotelsController.update] Received update request for hotel:', id);
      console.log('📋 [AdminHotelsController.update] DTO:', JSON.stringify(updateHotelDto, null, 2));
      
      const result = await this.hotelsService.update(parseInt(id), updateHotelDto);
      
      if (result) {
        console.log('✅ [AdminHotelsController.update] Hotel updated successfully:', result.id);
        console.log('📷 [AdminHotelsController.update] Hotel images count:', result.images?.length || 0);
        console.log('📷 [AdminHotelsController.update] Hotel images:', result.images);
      } else {
        console.error('❌ [AdminHotelsController.update] Hotel update returned null/undefined');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AdminHotelsController.update] Error updating hotel:', error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hotel' })
  async delete(@Param('id') id: string) {
    return this.hotelsService.delete(parseInt(id));
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get images for hotel' })
  async getImages(@Param('id') id: string) {
    const hotel = await this.hotelsService.findById(parseInt(id));
    return hotel.images || [];
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add image to hotel' })
  async addImage(
    @Param('id') id: string,
    @Body() body: { imageUrl: string },
  ) {
    return this.hotelsService.addImage(parseInt(id), body.imageUrl);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Remove image from hotel' })
  async removeImage(@Param('imageId') imageId: string) {
    return this.hotelsService.removeImage(parseInt(imageId));
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Toggle hotel active status' })
  async toggleActive(
    @Param('id') id: string,
    @Query('active') active: boolean,
  ) {
    return this.hotelsService.update(parseInt(id), { active });
  }

  @Post(':hotelId/owner/:userId')
  @ApiOperation({ summary: 'Assign owner to hotel' })
  async assignOwner(
    @Param('hotelId') hotelId: string,
    @Param('userId') userId: string,
  ) {
    return this.hotelsService.assignOwner(parseInt(hotelId), parseInt(userId));
  }

  @Delete(':hotelId/owner')
  @ApiOperation({ summary: 'Remove owner from hotel' })
  async removeOwner(@Param('hotelId') hotelId: string) {
    return this.hotelsService.removeOwner(parseInt(hotelId));
  }
}
