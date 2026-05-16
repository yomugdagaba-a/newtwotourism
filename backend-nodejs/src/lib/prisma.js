const { PrismaClient } = require('@prisma/client');

/**
 * PrismaService - Singleton wrapper for Prisma Client
 * Provides centralized database access across the application
 */
class PrismaService {
  constructor() {
    if (PrismaService.instance) {
      return PrismaService.instance;
    }
    
    this.client = new PrismaClient();
    PrismaService.instance = this;
  }

  /**
   * Get the Prisma client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.client.$disconnect();
  }

  /**
   * Connect to database
   */
  async connect() {
    await this.client.$connect();
  }
}

// Create singleton instance
const prismaService = new PrismaService();
const prisma = prismaService.getClient();

// Export both the service class and the client for backward compatibility
module.exports = prisma;
module.exports.PrismaService = PrismaService;
module.exports.prismaService = prismaService;
