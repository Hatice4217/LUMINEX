// Redis Cache Configuration - JavaScript Version
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy(times) {
    if (times === 1) {
      console.error('Redis bağlantı hatası, cache devre dışı');
      return new Error('Redis bağlantısı başarısız');
    }
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => {
  console.log('✅ Redis bağlantısı başarılı');
});

redis.on('error', (err) => {
  console.error('Redis hatası:', err);
});

// Cache helper functions
export async function get(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function set(key, value, ttlSeconds) {
  const data = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, data);
  } else {
    await redis.set(key, data);
  }
}

export async function del(key) {
  await redis.del(key);
}

export async function invalidatePattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function flushAll() {
  await redis.flushdb();
}

export async function exists(key) {
  const result = await redis.exists(key);
  return result === 1;
}

export async function ttl(key) {
  return await redis.ttl(key);
}

export async function expire(key, seconds) {
  await redis.expire(key, seconds);
}

export async function keys(pattern) {
  return await redis.keys(pattern);
}

export async function mget(keys) {
  const values = await redis.mget(...keys);
  return values.map(v => v ? JSON.parse(v) : null);
}

export async function mset(keyValuePairs) {
  const pipeline = redis.pipeline();
  for (const [key, value, ttl] of keyValuePairs) {
    const data = JSON.stringify(value);
    if (ttl) {
      pipeline.setex(key, ttl, data);
    } else {
      pipeline.set(key, data);
    }
  }
  await pipeline.exec();
}

// Cache health check
export async function healthCheck() {
  try {
    await redis.ping();
    return {
      status: 'healthy',
      connected: redis.status === 'ready',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
    };
  }
}

// Cache statistics
export async function getStats() {
  try {
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();
    const memory = await redis.info('memory');

    return {
      status: redis.status,
      dbSize,
      info,
      memory,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

export default redis;
