const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const emailService = require('./email-gmail.service');

const USER_SELECT = { id: true, username: true, email: true, fullName: true, active: true, emailVerified: true, createdAt: true, updatedAt: true, roles: true };

class AdminService {
  async getAllUsers(skip = 0, take = 20, search) {
    const where = search?.trim() ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { roles: true }, orderBy: { id: 'asc' } }),
      prisma.user.count({ where }),
    ]);
    return { content: users, totalElements: total, totalPages: Math.ceil(total / parseInt(take)), size: parseInt(take), number: Math.floor(parseInt(skip) / parseInt(take)) };
  }

  async getUserById(id) {
    const user = await prisma.user.findUnique({ where: { id }, include: { roles: true } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  async getUsersByRole(role) {
    return prisma.user.findMany({ where: { roles: { some: { name: role.toUpperCase() } } }, include: { roles: true } });
  }

  async updateUser(id, data) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const { password, passwordHash, roles, ...safeData } = data;
    return prisma.user.update({ where: { id }, data: safeData, include: { roles: true } });
  }

  async resetUserPassword(id, newPassword) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (!newPassword || newPassword.trim().length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({ where: { id }, data: { passwordHash }, include: { roles: true } });
  }

  async activateUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const updated = await prisma.user.update({ where: { id }, data: { active: true }, include: { roles: true } });
    if (user.email) {
      emailService.sendEmail(user.email, 'Account Reactivated — North Wollo Tourism', `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#15803d;">✓ Account Reactivated</h2>
          <p>Hello <strong>${user.fullName || user.username}</strong>,</p>
          <p>Your North Wollo Tourism account has been reactivated by an administrator. You can now log in.</p>
        </div>
      `).catch(() => {});
    }
    return updated;
  }

  async deactivateUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const updated = await prisma.user.update({ where: { id }, data: { active: false }, include: { roles: true } });
    if (user.email) {
      emailService.sendEmail(user.email, 'Account Deactivated — North Wollo Tourism', `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#dc2626;">⛔ Account Deactivated</h2>
          <p>Hello <strong>${user.fullName || user.username}</strong>,</p>
          <p>Your North Wollo Tourism account has been deactivated by an administrator.</p>
          <p style="color:#6b7280;font-size:13px;">If you believe this is a mistake, please contact support.</p>
        </div>
      `).catch(() => {});
    }
    return updated;
  }

  async deleteUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return prisma.user.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [totalUsers, totalHotels, totalBookings, totalTourismPlaces] = await Promise.all([
      prisma.user.count(),
      prisma.hotel.count(),
      prisma.hotelBooking.count(),
      prisma.tourismPlace.count(),
    ]);
    return { totalUsers, totalHotels, totalBookings, totalTourismPlaces };
  }

  async getRecentBookings(take = 10) {
    return prisma.hotelBooking.findMany({ take: parseInt(take), orderBy: { createdAt: 'desc' }, include: { hotel: true, user: true, status: true } });
  }

  async getBookingsByStatus() {
    const statuses = await prisma.bookingStatusEntity.findMany({ include: { bookings: true } });
    return statuses.map(s => ({ status: s.name, count: s.bookings.length }));
  }

  async grantRole(userId, roleName) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const name = roleName.toUpperCase();
    let role = await prisma.role.findUnique({ where: { name } });
    if (!role) role = await prisma.role.create({ data: { name } });
    if (user.roles.some(r => r.name === name)) throw Object.assign(new Error(`User already has role ${name}`), { status: 400 });
    return prisma.user.update({ where: { id: userId }, data: { roles: { connect: { id: role.id } } }, include: { roles: true } });
  }

  async revokeRole(userId, roleName) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const name = roleName.toUpperCase();
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role) throw Object.assign(new Error(`Role ${name} not found`), { status: 404 });
    if (!user.roles.some(r => r.name === name)) throw Object.assign(new Error(`User does not have role ${name}`), { status: 400 });
    return prisma.user.update({ where: { id: userId }, data: { roles: { disconnect: { id: role.id } } }, include: { roles: true } });
  }
}

module.exports = new AdminService();
