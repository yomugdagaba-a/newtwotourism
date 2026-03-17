import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LanguageGuidersService } from './language-guiders.service';

@ApiTags('Guiders')
@Controller('api/guiders')
export class GuidersController {
  constructor(private languageGuidersService: LanguageGuidersService) {}

  @Get('tourism/:tourismPlaceId')
  @ApiOperation({ summary: 'Get guiders by tourism place' })
  async getByTourism(@Param('tourismPlaceId', ParseIntPipe) tourismPlaceId: number) {
    // For now, return all guiders since the schema doesn't have a direct relationship
    // In a real implementation, this would filter by tourism place
    const result = await this.languageGuidersService.findAll(0, 100);
    return result.guiders;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guider by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.languageGuidersService.findById(id);
  }
}
