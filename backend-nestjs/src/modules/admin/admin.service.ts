import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(skip = 0, take = 10, search?: string) {
    const where: any = {};
    
    if (search && search.trim()) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        include: { roles: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      content: users,
      totalElements: total,
      totalPages: Math.ceil(total / take),
      size: take,
      number: Math.floor(skip / take),
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUsersByRole(role: string) {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: role,
          },
        },
      },
      include: { roles: true },
    });
    return users;
  }

  async updateUser(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data,
      include: { roles: true },
    });
  }

  async resetUserPassword(id: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    if (!newPassword || newPassword.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // In a real application, you would hash the password
    // For now, we'll just update it directly
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPassword },
      include: { roles: true },
    });
  }

  async activateUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.user.update({
      where: { id },
      data: { active: true },
      include: { roles: true },
    });
  }

  async deactivateUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      include: { roles: true },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [totalUsers, totalHotels, totalBookings, totalTourismPlaces] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.hotel.count(),
      this.prisma.hotelBooking.count(),
      this.prisma.tourismPlace.count(),
    ]);

    return {
      totalUsers,
      totalHotels,
      totalBookings,
      totalTourismPlaces,
    };
  }

  async getRecentBookings(take = 10) {
    return this.prisma.hotelBooking.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { hotel: true, user: true, status: true },
    });
  }

  async getBookingsByStatus() {
    const statuses = await this.prisma.bookingStatusEntity.findMany({
      include: {
        bookings: true,
      },
    });

    return statuses.map((status) => ({
      status: status.name,
      count: status.bookings.length,
    }));
  }

  async grantRole(userId: number, roleName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Find or create the role
    let role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: roleName },
      });
    }

    // Check if user already has this role
    const hasRole = user.roles.some((r) => r.name === roleName);
    if (hasRole) {
      throw new BadRequestException(`User already has role ${roleName}`);
    }

    // Add role to user
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: role.id },
        },
      },
      include: { roles: true },
    });
  }

  async revokeRole(userId: number, roleName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // Check if user has this role
    const hasRole = user.roles.some((r) => r.name === roleName);
    if (!hasRole) {
      throw new BadRequestException(`User does not have role ${roleName}`);
    }

    // Remove role from user
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: role.id },
        },
      },
      include: { roles: true },
    });
  }
}
