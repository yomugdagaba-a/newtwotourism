import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LanguageGuidersService } from './language-guiders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Language Guiders')
@Controller('api/language-guiders')
export class LanguageGuidersController {
  constructor(private languageGuidersService: LanguageGuidersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create language guider' })
  async create(@Body() data: any) {
    return this.languageGuidersService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all language guiders' })
  async findAll(@Query('skip') skip = 0, @Query('take') take = 10) {
    return this.languageGuidersService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language guider by ID' })
  async findById(@Param('id') id: string) {
    return this.languageGuidersService.findById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update language guider' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.languageGuidersService.update(parseInt(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete language guider' })
  async delete(@Param('id') id: string) {
    return this.languageGuidersService.delete(parseInt(id));
  }
}
