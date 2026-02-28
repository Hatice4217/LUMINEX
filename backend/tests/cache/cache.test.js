// Cache Tests
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');

describe('Cache Module Tests', () => {
  let redis;

  beforeEach(() => {
    // Redis instance'ı sıfırla
    redis = new Redis();
    jest.clearAllMocks();
  });

  describe('Cache Get Operations', () => {
    it('should retrieve data from cache', async () => {
      const mockData = { id: '1', name: 'Test Hospital' };
      redis.get.mockResolvedValue(JSON.stringify(mockData));

      const { get } = await import('../../src/config/redis.js');
      const result = await get('test:key');

      expect(result).toEqual(mockData);
      expect(redis.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null for non-existent key', async () => {
      redis.get.mockResolvedValue(null);

      const { get } = await import('../../src/config/redis.js');
      const result = await get('non:existent:key');

      expect(result).toBeNull();
    });

    it('should handle cache errors gracefully', async () => {
      redis.get.mockRejectedValue(new Error('Redis connection error'));

      const { get } = await import('../../src/config/redis.js');

      // Error handling test - should not throw
      const result = await get('test:key');
      expect(result).toBeNull();
    });
  });

  describe('Cache Set Operations', () => {
    it('should set data with TTL', async () => {
      const mockData = { id: '1', name: 'Test' };
      redis.setex.mockResolvedValue('OK');

      const { set } = await import('../../src/config/redis.js');
      await set('test:key', mockData, 300);

      expect(redis.setex).toHaveBeenCalledWith(
        'test:key',
        300,
        JSON.stringify(mockData)
      );
    });

    it('should set data without TTL', async () => {
      const mockData = { id: '1', name: 'Test' };
      redis.set.mockResolvedValue('OK');

      const { set } = await import('../../src/config/redis.js');
      await set('test:key', mockData);

      expect(redis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify(mockData)
      );
    });
  });

  describe('Cache Delete Operations', () => {
    it('should delete a key', async () => {
      redis.del.mockResolvedValue(1);

      const { del } = await import('../../src/config/redis.js');
      await del('test:key');

      expect(redis.del).toHaveBeenCalledWith('test:key');
    });

    it('should handle delete of non-existent key', async () => {
      redis.del.mockResolvedValue(0);

      const { del } = await import('../../src/config/redis.js');
      await del('non:existent:key');

      expect(redis.del).toHaveBeenCalledWith('non:existent:key');
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate keys by pattern', async () => {
      const mockKeys = ['doctors:1', 'doctors:2', 'doctors:3'];
      redis.keys.mockResolvedValue(mockKeys);
      redis.del.mockResolvedValue(3);

      const { invalidatePattern } = await import('../../src/config/redis.js');
      await invalidatePattern('doctors:*');

      expect(redis.keys).toHaveBeenCalledWith('doctors:*');
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle empty pattern results', async () => {
      redis.keys.mockResolvedValue([]);

      const { invalidatePattern } = await import('../../src/config/redis.js');
      await invalidatePattern('empty:*');

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('Cache Health Check', () => {
    it('should return healthy status when Redis is connected', async () => {
      redis.ping.mockResolvedValue('PONG');
      redis.status = 'ready';

      const { healthCheck } = await import('../../src/config/redis.js');
      const result = await healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        connected: true,
      });
    });

    it('should return unhealthy status when Redis is disconnected', async () => {
      redis.ping.mockRejectedValue(new Error('Not connected'));
      redis.status = 'close';

      const { healthCheck } = await import('../../src/config/redis.js');
      const result = await healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.connected).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should retrieve cache statistics', async () => {
      redis.dbsize.mockResolvedValue(100);
      redis.info.mockResolvedValue('stats');
      redis.info.mockResolvedValueOnce('memory');

      const { getStats } = await import('../../src/config/redis.js');
      const stats = await getStats();

      expect(stats.dbSize).toBe(100);
      expect(stats.status).toBeDefined();
    });
  });

  describe('TTL Operations', () => {
    it('should get TTL for a key', async () => {
      redis.ttl.mockResolvedValue(300);

      const { ttl } = await import('../../src/config/redis.js');
      const result = await ttl('test:key');

      expect(result).toBe(300);
    });

    it('should set TTL for a key', async () => {
      redis.expire.mockResolvedValue(1);

      const { expire } = await import('../../src/config/redis.js');
      await expire('test:key', 600);

      expect(redis.expire).toHaveBeenCalledWith('test:key', 600);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple keys', async () => {
      const mockValues = ['value1', 'value2', 'value3'];
      redis.mget.mockResolvedValue(mockValues);

      const { mget } = await import('../../src/config/redis.js');
      const result = await mget(['key1', 'key2', 'key3']);

      expect(redis.mget).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should set multiple keys', async () => {
      redis.setex.mockResolvedValue('OK');
      redis.set.mockResolvedValue('OK');

      const { mset } = await import('../../src/config/redis.js');
      const keyValuePairs = [
        ['key1', 'value1', 300],
        ['key2', 'value2', null],
      ];

      await mset(keyValuePairs);

      expect(redis.setex).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('Flush Operations', () => {
    it('should flush all cache data', async () => {
      redis.flushdb.mockResolvedValue('OK');

      const { flushAll } = await import('../../src/config/redis.js');
      await flushAll();

      expect(redis.flushdb).toHaveBeenCalled();
    });
  });
});
