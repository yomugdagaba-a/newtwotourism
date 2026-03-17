import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TourismService } from './tourism.service';

@ApiTags('Tourism - Images')
@Controller('api/tourisms')
export class TourismImagesController {
  constructor(private tourismService: TourismService) {}

  @Get(':id/images')
  @ApiOperation({ summary: 'Get images for tourism place' })
  async getImages(@Param('id') id: string) {
    return this.tourismService.getImages(parseInt(id));
  }
}
