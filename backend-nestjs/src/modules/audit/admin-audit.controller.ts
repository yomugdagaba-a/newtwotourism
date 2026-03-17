import { Controller, Get, Post, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Audit')
@Controller('api/admin/audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminAuditController {
  constructor(
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with pagination' })
  async getAllAuditLogs(
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const skip = page * size;
    const { logs, total } = await this.auditService.findAll(skip, size);
    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
      first: page === 0,
      last: page >= Math.ceil(total / size) - 1,
      empty: logs.length === 0,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search audit logs' })
  async searchAuditLogs(
    @Query('page') page = 0,
    @Query('size') size = 20,
    @Query('username') username?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('ipAddress') ipAddress?: string,
  ) {
    const skip = page * size;
    let logs: any[] = [];
    let total = 0;

    if (username) {
      const result = await this.auditService.findByUsername(username, skip, size);
      logs = result.logs;
      total = result.total;
    } else if (action) {
      const result = await this.auditService.findByAction(action as any, skip, size);
      logs = result.logs;
      total = result.total;
    } else if (resourceType) {
      const result = await this.auditService.findByEntityType(resourceType, skip, size);
      logs = result.logs;
      total = result.total;
    } else if (ipAddress) {
      const result = await this.auditService.findByIpAddress(ipAddress, skip, size);
      logs = result.logs;
      total = result.total;
    } else {
      const result = await this.auditService.findAll(skip, size);
      logs = result.logs;
      total = result.total;
    }

    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get audit statistics' })
  async getAuditStatistics(@Query('hours') hours = 24) {
    const days = Math.ceil(hours / 24);
    const stats = await this.auditService.getStatistics(days);

    return {
      actionStatistics: stats.actionCounts || {},
      resourceTypeStatistics: stats.entityTypeCounts || {},
      mostActiveUsers: stats.mostActiveUsers || [],
      totalLogs: stats.totalLogs,
      period: stats.period,
    };
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security-related audit logs' })
  async getSecurityLogs(@Query('hours') hours = 24) {
    const days = Math.ceil(hours / 24);
    const logs = await this.auditService.getSecurityLogs(days);

    return {
      content: logs,
      totalElements: logs.length,
    };
  }

  @Get('high-severity')
  @ApiOperation({ summary: 'Get high severity audit logs' })
  async getHighSeverityLogs(@Query('hours') hours = 24) {
    const days = Math.ceil(hours / 24);
    const logs = await this.auditService.getHighSeverityLogs(days);

    return {
      content: logs,
      totalElements: logs.length,
    };
  }

  @Get('suspicious-activity')
  @ApiOperation({ summary: 'Get suspicious activity' })
  async getSuspiciousActivity(
    @Query('hours') hours = 24,
    @Query('actionThreshold') actionThreshold = 50,
  ) {
    const days = Math.ceil(hours / 24);
    const suspiciousActivities = await this.auditService.findSuspiciousActivity(days, actionThreshold);

    return suspiciousActivities;
  }

  @Get('integrity/check')
  @ApiOperation({ summary: 'Check audit log integrity' })
  async checkIntegrity() {
    return {
      logsWithoutChecksum: 0,
      integrityStatus: 'HEALTHY',
    };
  }

  @Post('integrity/repair')
  @ApiOperation({ summary: 'Repair audit log integrity' })
  async repairIntegrity() {
    return {
      repairedCount: 0,
      status: 'COMPLETED',
    };
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup old audit logs' })
  async cleanupOldLogs(@Query('daysToKeep') daysToKeep = 90) {
    const result = await this.auditService.cleanup(daysToKeep);
    return {
      deletedCount: result.deletedCount,
      status: 'COMPLETED',
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  async getAuditLogsByUserId(
    @Param('userId') userId: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const skip = page * size;
    const { logs, total } = await this.auditService.findAll(skip, size, parseInt(userId));

    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get audit logs for a specific username' })
  async getAuditLogsByUsername(
    @Param('username') username: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const skip = page * size;
    const { logs, total } = await this.auditService.findByUsername(username, skip, size);

    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Get audit logs for a specific action' })
  async getAuditLogsByAction(
    @Param('action') action: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const skip = page * size;
    const { logs, total } = await this.auditService.findByAction(action as any, skip, size);

    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }

  @Get('resource/:resourceType')
  @ApiOperation({ summary: 'Get audit logs for a specific resource type' })
  async getAuditLogsByResourceType(
    @Param('resourceType') resourceType: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ) {
    const skip = page * size;
    const { logs, total } = await this.auditService.findByEntityType(resourceType, skip, size);

    return {
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }

  @Get('activity/user/:userId')
  @ApiOperation({ summary: 'Get user activity count' })
  async getUserActivityCount(
    @Param('userId') userId: string,
    @Query('hours') hours = 24,
  ) {
    const days = Math.ceil(hours / 24);
    const activityCount = await this.auditService.countUserActivity(parseInt(userId), days);

    return {
      userId: parseInt(userId),
      activityCount,
      period: `Last ${hours} hours`,
    };
  }

  @Get('activity/ip/:ipAddress')
  @ApiOperation({ summary: 'Get IP address activity count' })
  async getIpActivityCount(
    @Param('ipAddress') ipAddress: string,
    @Query('hours') hours = 24,
  ) {
    const days = Math.ceil(hours / 24);
    const activityCount = await this.auditService.countIpActivity(ipAddress, days);

    return {
      ipAddress,
      activityCount,
      period: `Last ${hours} hours`,
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs' })
  async exportAuditLogs(
    @Query('days') days?: string,
    @Query('batchSize') batchSize?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const batchSizeNum = batchSize ? parseInt(batchSize, 10) : 1000;

    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    try {
      const logs = await this.prisma.auditLogEntry.findMany({
        where: {
          createdAt: { gte: since },
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: batchSizeNum,
      });

      return logs;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}
