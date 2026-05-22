const prisma = require('../lib/prisma');

/**
 * Auth Repository
 * Handles all database operations for authentication-related entities
 */
class AuthRepository {
  constructor() {
    this.emailToken = prisma.emailVerificationToken;
    this.passwordToken = prisma.passwordResetToken;
    this.refreshToken = prisma.refreshToken;
    this.loginAttempt = prisma.loginAttempt;
    this.accountLockout = prisma.accountLockout;
  }

  // ========== Email Verification Token Operations ==========

  async createEmailToken(data) {
    return await this.emailToken.create({ data });
  }

  async findEmailToken(token) {
    return await this.emailToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markEmailTokenVerified(token) {
    return await this.emailToken.update({
      where: { token },
      data: { verified: true },
    });
  }

  async deleteEmailToken(token) {
    return await this.emailToken.delete({ where: { token } });
  }

  async incrementEmailTokenAttempt(token) {
    return await this.emailToken.update({
      where: { token },
      data: { attemptCount: { increment: 1 } },
    });
  }

  // ========== Password Reset Token Operations ==========

  async createPasswordToken(data) {
    return await this.passwordToken.create({ data });
  }

  async findPasswordToken(token) {
    return await this.passwordToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markPasswordTokenUsed(token) {
    return await this.passwordToken.update({
      where: { token },
      data: { used: true },
    });
  }

  async deletePasswordToken(token) {
    return await this.passwordToken.delete({ where: { token } });
  }

  async incrementPasswordTokenAttempt(token) {
    return await this.passwordToken.update({
      where: { token },
      data: { attemptCount: { increment: 1 } },
    });
  }

  // ========== Refresh Token Operations ==========

  async createRefreshToken(data) {
    return await this.refreshToken.create({ data });
  }

  async findRefreshToken(token) {
    return await this.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token) {
    return await this.refreshToken.delete({ where: { token } });
  }

  async deleteUserRefreshTokens(userId) {
    return await this.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteExpiredTokens() {
    return await this.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ========== Login Attempt Operations ==========

  async recordLoginAttempt(data) {
    return await this.loginAttempt.create({ data });
  }

  async getRecentLoginAttempts(ipAddress, minutes = 15) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return await this.loginAttempt.findMany({
      where: {
        ipAddress,
        createdAt: { gte: cutoffTime },
        success: false,
      },
    });
  }

  async getLoginAttemptsByUser(userId, skip, take) {
    return await this.loginAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // ========== Account Lockout Operations ==========

  async createLockout(userId, lockedUntil) {
    return await this.accountLockout.upsert({
      where: { userId },
      create: { userId, lockedUntil },
      update: { lockedUntil },
    });
  }

  async findLockout(userId) {
    return await this.accountLockout.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async deleteLockout(userId) {
    return await this.accountLockout.delete({ where: { userId } });
  }

  async isAccountLocked(userId) {
    const lockout = await this.findLockout(userId);
    if (!lockout) return false;
    if (lockout.lockedUntil < new Date()) {
      await this.deleteLockout(userId);
      return false;
    }
    return true;
  }
}

module.exports = new AuthRepository();
