/**
 * Redis Client Configuration
 * 
 * Provides Redis connection for rate limiting and caching
 * Falls back to in-memory storage if Redis is not available
 */

const redis = require('redis');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 * @returns {Promise<Object>} Redis client or null
 */
async function initializeRedis() {
  // Skip Redis if not configured
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log('⚠️  Redis not configured - using in-memory rate limiting');
    return null;
  }

  try {
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || undefined,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 5000,
        // Enable TLS if REDIS_URL uses rediss:// or REDIS_TLS=true
        tls: process.env.REDIS_URL?.startsWith('rediss://') || process.env.REDIS_TLS === 'true' || true,
        rejectUnauthorized: false, // Required for Leapcell self-signed certs
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('❌ Redis connection failed after 3 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // Error handling
    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      isRedisAvailable = false;
    });

    client.on('connect', () => {
      console.log('🔄 Redis connecting...');
    });

    client.on('ready', () => {
      console.log('✅ Redis connected and ready');
      isRedisAvailable = true;
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    client.on('end', () => {
      console.log('⚠️  Redis connection closed');
      isRedisAvailable = false;
    });

    // Connect to Redis
    await client.connect();
    
    // Test connection
    await client.ping();
    
    redisClient = client;
    isRedisAvailable = true;
    
    console.log('✅ Redis initialized successfully');
    return client;
    
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.log('⚠️  Falling back to in-memory rate limiting');
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Get Redis client
 * @returns {Object|null} Redis client or null
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is available
 * @returns {boolean} True if Redis is connected
 */
function isRedisConnected() {
  return isRedisAvailable && redisClient && redisClient.isOpen;
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis:', error.message);
    }
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis
};
