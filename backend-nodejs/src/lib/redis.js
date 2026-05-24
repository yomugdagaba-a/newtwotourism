/**
 * Redis Client
 *
 * Connects using REDIS_URL (preferred) or individual REDIS_HOST/PORT/PASSWORD vars.
 * Leapcell Redis requires TLS — the URL must use rediss:// (double-s).
 *
 * Falls back to in-memory rate limiting if Redis is not configured or unreachable.
 */

const redis = require('redis');

let redisClient = null;
let isRedisAvailable = false;

async function initializeRedis() {
  const redisUrl  = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    console.log('⚠️  Redis not configured - using in-memory rate limiting');
    return null;
  }

  // Debug: log the URL format (hide password)
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      console.log(`🔄 Connecting to Redis: ${parsed.protocol}//${parsed.hostname}:${parsed.port}`);
    } catch (e) {
      console.error(`❌ REDIS_URL is not a valid URL. Value starts with: "${redisUrl.substring(0, 20)}..."`);
      console.error('   Make sure REDIS_URL uses format: rediss://default:PASSWORD@HOST:PORT');
      console.log('⚠️  Falling back to in-memory rate limiting');
      return null;
    }
  }

  try {
    let clientOptions;

    if (redisUrl) {
      clientOptions = {
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          keepAlive: 5000,
          tls: redisUrl.startsWith('rediss://'),
          rejectUnauthorized: false,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.warn('⚠️  Redis max retries reached - falling back to in-memory');
              return new Error('Redis max retries reached');
            }
            const delay = Math.min(retries * 500, 3000);
            console.log(`🔄 Redis retry ${retries} in ${delay}ms`);
            return delay;
          },
        },
        pingInterval: 60000, // Keep connection alive
      };
    } else {
      // Individual host/port/password vars
      clientOptions = {
        socket: {
          host: redisHost,
          port: parseInt(process.env.REDIS_PORT) || 6379,
          connectTimeout: 10000,
          keepAlive: 5000,
          tls: process.env.REDIS_TLS === 'true',
          rejectUnauthorized: false,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.warn('⚠️  Redis max retries reached - falling back to in-memory');
              return new Error('Redis max retries reached');
            }
            const delay = Math.min(retries * 500, 3000);
            console.log(`🔄 Redis retry ${retries} in ${delay}ms`);
            return delay;
          },
        },
        password: process.env.REDIS_PASSWORD || undefined,
        pingInterval: 60000, // Keep connection alive
      };
    }

    const client = redis.createClient(clientOptions);

    client.on('error',       (err) => { console.error('❌ Redis error:', err.message); isRedisAvailable = false; });
    client.on('ready',       ()    => { console.log('✅ Redis connected and ready'); isRedisAvailable = true; });
    client.on('reconnecting',()    => { console.log('🔄 Redis reconnecting...'); });
    client.on('end',         ()    => { console.log('⚠️  Redis connection closed'); isRedisAvailable = false; });

    await client.connect();
    await client.ping();

    redisClient    = client;
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

function getRedisClient()   { return redisClient; }
function isRedisConnected() { return isRedisAvailable && redisClient && redisClient.isOpen; }

async function closeRedis() {
  if (redisClient) {
    try { await redisClient.quit(); console.log('✅ Redis closed'); }
    catch (e) { console.error('❌ Error closing Redis:', e.message); }
  }
}

module.exports = { initializeRedis, getRedisClient, isRedisConnected, closeRedis };
