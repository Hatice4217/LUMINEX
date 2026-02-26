// Redis Cache Configuration - TypeScript Version
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
export async function get<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function set(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const data = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, data);
  } else {
    await redis.set(key, data);
  }
}

export async function del(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function flushAll(): Promise<void> {
  await redis.flushdb();
}

export default redis;
