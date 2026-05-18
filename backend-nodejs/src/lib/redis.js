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

  try {
    let clientOptions;

    if (redisUrl) {
      // Use URL directly — rediss:// enables TLS automatically in the redis package
      clientOptions = {
        url: redisUrl,
        socket: {
          connectTimeout: 8000,
          tls: redisUrl.startsWith('rediss://'),
          rejectUnauthorized: false,
          reconnectStrategy: (retries) => {
            if (retries > 3) return new Error('Redis max retries reached');
            return Math.min(retries * 200, 2000);
          },
        },
      };
    } else {
      // Individual host/port/password vars
      clientOptions = {
        socket: {
          host: redisHost,
          port: parseInt(process.env.REDIS_PORT) || 6379,
          connectTimeout: 8000,
          tls: process.env.REDIS_TLS === 'true',
          rejectUnauthorized: false,
          reconnectStrategy: (retries) => {
            if (retries > 3) return new Error('Redis max retries reached');
            return Math.min(retries * 200, 2000);
          },
        },
        password: process.env.REDIS_PASSWORD || undefined,
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
