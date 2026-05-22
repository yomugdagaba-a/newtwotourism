const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * User Repository
 * Handles all database operations for User entity
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await this.model.findUnique({
      where: { username },
      include: { roles: true },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.model.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  /**
   * Find user with roles
   */
  async findByIdWithRoles(id) {
    return await this.model.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  /**
   * Get all users with pagination and search
   */
  async getAllUsers(skip, take, search) {
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return await this.findAll(skip, take, where, { roles: true });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleName) {
    return await this.model.findMany({
      where: {
        roles: {
          some: {
            name: roleName,
          },
        },
      },
      include: { roles: true },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id, passwordHash) {
    return await this.update(id, { passwordHash });
  }

  /**
   * Verify email
   */
  async verifyEmail(id) {
    return await this.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  /**
   * Activate user
   */
  async activate(id) {
    return await this.update(id, { active: true });
  }

  /**
   * Deactivate user
   */
  async deactivate(id) {
    return await this.update(id, { active: false });
  }
}

module.exports = new UserRepository();
