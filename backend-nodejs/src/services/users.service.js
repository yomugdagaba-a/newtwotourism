const { userRepository } = require('../repositories');

const USER_SELECT = { id: true, username: true, email: true, fullName: true, active: true, emailVerified: true, createdAt: true, updatedAt: true, roles: true };

class UsersService {
  async findById(id) {
    const user = await userRepository.findByIdWithRoles(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  async findByUsername(username) {
    return await userRepository.findByUsername(username);
  }

  async findByEmail(email) {
    return await userRepository.findByEmail(email?.toLowerCase().trim());
  }

  async updateProfile(id, data) {
    const { password, passwordHash, role, roles, ...safeData } = data;
    if (safeData.username) {
      safeData.username = safeData.username.trim();
      const existing = await userRepository.findByUsername(safeData.username);
      if (existing && existing.id !== id) throw Object.assign(new Error('Username is already taken'), { status: 400 });
    }
    return await userRepository.update(id, safeData);
  }

  async getAllUsers(skip = 0, take = 10, search) {
    const result = await userRepository.getAllUsers(parseInt(skip), parseInt(take), search);
    return { users: result.data, total: result.total };
  }
}

module.exports = new UsersService();
