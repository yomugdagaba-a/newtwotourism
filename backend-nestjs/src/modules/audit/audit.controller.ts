import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit')
@Controller('api/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const skipVal = skip ? parseInt(skip) : 0;
    const takeVal = take ? parseInt(take) : 10;
    return this.auditService.findAll(skipVal, takeVal, userId ? parseInt(userId) : undefined, action as any);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit statistics' })
  async getStatistics(@Query('days') days = 30) {
    return this.auditService.getStatistics(days);
  }
}
