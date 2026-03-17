import { Controller, Get, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TourismService } from './tourism.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tourism - User')
@Controller('api/user/tourism')
export class UserTourismController {
  constructor(private tourismService: TourismService) {}

  @Get('tourism/:id/detail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full tourism place details (authenticated)' })
  async getFullDetailAuth(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.tourismService.findById(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get full tourism place details (public)' })
  async getFullDetail(@Param('id', ParseIntPipe) id: number) {
    return this.tourismService.findById(id);
  }
}
