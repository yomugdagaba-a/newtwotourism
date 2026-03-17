import { Controller, Get, Put, Delete, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sortBy') sortBy = 'id',
    @Query('sortDir') sortDir = 'asc',
    @Query('search') search?: string,
  ) {
    // Support both pagination styles
    const pageNum = page ? parseInt(page) : 0;
    const sizeNum = size ? parseInt(size) : 20;
    const skipVal = skip ? parseInt(skip) : pageNum * sizeNum;
    const takeVal = take ? parseInt(take) : sizeNum;
    return this.adminService.getAllUsers(skipVal, takeVal, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(parseInt(id));
  }

  @Get('users/role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  async getUsersByRole(@Param('role') role: string) {
    return this.adminService.getUsersByRole(role.toUpperCase());
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(parseInt(id), data);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetUserPassword(@Param('id') id: string, @Body() data: any) {
    return this.adminService.resetUserPassword(parseInt(id), data.newPassword);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate user' })
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(parseInt(id));
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(parseInt(id));
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(parseInt(id));
  }

  @Post('users/:userId/roles/:role')
  @ApiOperation({ summary: 'Grant role to user' })
  async grantRole(
    @Param('userId') userId: string,
    @Param('role') role: string,
  ) {
    return this.adminService.grantRole(parseInt(userId), role.toUpperCase());
  }

  @Delete('users/:userId/roles/:role')
  @ApiOperation({ summary: 'Revoke role from user' })
  async revokeRole(
    @Param('userId') userId: string,
    @Param('role') role: string,
  ) {
    return this.adminService.revokeRole(parseInt(userId), role.toUpperCase());
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('bookings/recent')
  @ApiOperation({ summary: 'Get recent bookings' })
  async getRecentBookings(@Query('take') take = 10) {
    return this.adminService.getRecentBookings(take);
  }

  @Get('bookings/by-status')
  @ApiOperation({ summary: 'Get bookings by status' })
  async getBookingsByStatus() {
    return this.adminService.getBookingsByStatus();
  }
}
