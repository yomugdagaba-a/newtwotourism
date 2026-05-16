const prisma = require('../lib/prisma');

const USER_SELECT = { id: true, username: true, email: true, fullName: true, active: true, emailVerified: true, createdAt: true, updatedAt: true, roles: true };

class UsersService {
  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  async findByUsername(username) {
    return prisma.user.findUnique({ where: { username }, select: USER_SELECT });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() }, select: USER_SELECT });
  }

  async updateProfile(id, data) {
    // Prevent privilege escalation
    const { password, passwordHash, role, roles, ...safeData } = data;
    if (safeData.username) {
      safeData.username = safeData.username.trim();
      const existing = await prisma.user.findUnique({ where: { username: safeData.username } });
      if (existing && existing.id !== id) throw Object.assign(new Error('Username is already taken'), { status: 400 });
    }
    return prisma.user.update({ where: { id }, data: safeData, select: USER_SELECT });
  }

  async getAllUsers(skip = 0, take = 10, search) {
    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, select: USER_SELECT, orderBy: { id: 'asc' } }),
      prisma.user.count({ where }),
    ]);
    return { users, total };
  }
}

module.exports = new UsersService();
