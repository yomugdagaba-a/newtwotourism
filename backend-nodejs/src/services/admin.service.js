const bcrypt = require('bcryptjs');
const { userRepository, roleRepository, bookingRepository } = require('../repositories');
const emailService = require('./email.service');
const prisma = require('../lib/prisma');

class AdminService {
  async getAllUsers(skip = 0, take = 20, search) {
    const result = await userRepository.getAllUsers(parseInt(skip), parseInt(take), search?.trim());
    return {
      content: result.data,
      totalElements: result.total,
      totalPages: Math.ceil(result.total / parseInt(take)),
      size: parseInt(take),
      number: Math.floor(parseInt(skip) / parseInt(take)),
    };
  }

  async getUserById(id) {
    const user = await userRepository.findByIdWithRoles(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  async getUsersByRole(role) {
    return await userRepository.getUsersByRole(role.toUpperCase());
  }

  async updateUser(id, data) {
    const user = await userRepository.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const { password, passwordHash, roles, ...safeData } = data;
    return await userRepository.update(id, safeData);
  }

  async resetUserPassword(id, newPassword) {
    const user = await userRepository.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (!newPassword || newPassword.trim().length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return await userRepository.updatePassword(id, passwordHash);
  }

  async activateUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const updated = await userRepository.activate(id);
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
    const user = await userRepository.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const updated = await userRepository.deactivate(id);
    if (user.email) {
      emailService.sendEmail(user.email, 'Account Deactivated — North Wollo Tourism', `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#dc2626;">⛔ Account Deactivated</h2>
          <p>Hello <strong>${user.fullName || user.username}</strong>,</p>
          <p>Your North Wollo Tourism account has been deactivated by an administrator.</p>
        </div>
      `).catch(() => {});
    }
    return updated;
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return await userRepository.delete(id);
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
    return await bookingRepository.getRecentBookings(parseInt(take));
  }

  async getBookingsByStatus() {
    const statuses = await prisma.bookingStatusEntity.findMany({ include: { bookings: true } });
    return statuses.map(s => ({ status: s.name, count: s.bookings.length }));
  }

  async grantRole(userId, roleName) {
    const user = await userRepository.findByIdWithRoles(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const name = roleName.toUpperCase();
    if (user.roles.some(r => r.name === name)) throw Object.assign(new Error(`User already has role ${name}`), { status: 400 });
    return await roleRepository.grantRoleToUser(userId, name);
  }

  async revokeRole(userId, roleName) {
    const user = await userRepository.findByIdWithRoles(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const name = roleName.toUpperCase();
    if (!user.roles.some(r => r.name === name)) throw Object.assign(new Error(`User does not have role ${name}`), { status: 400 });
    return await roleRepository.revokeRoleFromUser(userId, name);
  }
}

module.exports = new AdminService();
