// Cache Middleware - TypeScript Version
import type { Request, Response, NextFunction } from 'express';
import cache from '../config/redis.js';

const CACHE_TTL = 300; // 5 dakika

export function cacheMiddleware(prefix: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `${prefix}:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    // GET istekleri için cache kontrolü
    if (req.method === 'GET') {
      try {
        const cached = await cache.get(key);
        if (cached) {
          res.json(cached);
          return;
        }
      } catch {
        // Cache hatası olduğunda devam et
      }
    }

    // Response'u yakala
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Başarılı response'ları cache'le
      if (data.success && req.method === 'GET') {
        cache.set(key, data, CACHE_TTL).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
}

export async function invalidateCache(pattern: string): Promise<void> {
  await cache.invalidatePattern(`*:${pattern}*`);
}
