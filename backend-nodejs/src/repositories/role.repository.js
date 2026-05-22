const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Role Repository
 * Handles all database operations for Role entity
 */
class RoleRepository extends BaseRepository {
  constructor() {
    super(prisma.role);
  }

  /**
   * Find role by name
   */
  async findByName(name) {
    return await this.model.findUnique({
      where: { name },
    });
  }

  /**
   * Grant role to user
   */
  async grantRoleToUser(userId, roleName) {
    const role = await this.findByName(roleName);
    if (!role) throw new Error(`Role ${roleName} not found`);

    return await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: role.id },
        },
      },
      include: { roles: true },
    });
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(userId, roleName) {
    const role = await this.findByName(roleName);
    if (!role) throw new Error(`Role ${roleName} not found`);

    return await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: role.id },
        },
      },
      include: { roles: true },
    });
  }

  /**
   * Check if user has role
   */
  async userHasRole(userId, roleName) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    return user?.roles.some((role) => role.name === roleName) || false;
  }
}

module.exports = new RoleRepository();
