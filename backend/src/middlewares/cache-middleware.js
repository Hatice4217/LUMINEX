// Cache Middleware - JavaScript Version
import { get, set } from '../config/redis.js';

const DEFAULT_CACHE_TTL = 300; // 5 dakika

/**
 * Cache middleware oluştur
 * @param {string} prefix - Cache key prefix'i
 * @param {number} ttl - Cache TTL (saniye cinsinden)
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(prefix, ttl = DEFAULT_CACHE_TTL) {
  return async (req, res, next) => {
    // Cache'i devre dışı bırakmak için环境 variable kontrolü
    if (process.env.CACHE_ENABLED === 'false') {
      next();
      return;
    }

    // User ID'yi req.user'dan al (authentication middleware'den sonra gelmeli)
    const userId = req.user?.id || 'anonymous';

    // Cache key oluştur: prefix:originalUrl:userId
    // Query parametreleri de dahil edilir
    const cacheKey = `${prefix}:${req.originalUrl}:${userId}`;

    // Sadece GET istekleri için cache kontrolü
    if (req.method === 'GET') {
      try {
        const cached = await get(cacheKey);

        if (cached) {
          // Cache hit - header ekle ve response'u dön
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('Content-Type', 'application/json');
          return res.json(cached);
        }

        // Cache miss - header ekle
        res.setHeader('X-Cache', 'MISS');
      } catch (error) {
        // Cache hatası olduğunda devam et, request'i engelleme
        console.error('Cache okuma hatası:', error);
      }
    }

    // Response'u yakala ve cache'le
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Başarılı GET response'ları cache'le
      if (req.method === 'GET' && data && data.success !== false) {
        set(cacheKey, data, ttl).catch((error) => {
          // Cache yazma hatası request'i engellememeli
          console.error('Cache yazma hatası:', error);
        });
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Belirli bir pattern'e uyan tüm cache'leri invalidate eder
 * @param {string} pattern - Invalidate edilecek pattern
 */
export async function invalidateCache(pattern) {
  try {
    const { invalidatePattern: invalidate } = await import('../config/redis.js');
    await invalidate(`*:${pattern}*`);
  } catch (error) {
    console.error('Cache invalidation hatası:', error);
  }
}

/**
 * Kullanıcıya özel cache'i invalidate eder
 * @param {string} userId - Kullanıcı ID
 * @param {string} prefix - Cache prefix'i (opsiyonel)
 */
export async function invalidateUserCache(userId, prefix = '*') {
  try {
    const { invalidatePattern } = await import('../config/redis.js');
    await invalidatePattern(`${prefix}:*:${userId}`);
  } catch (error) {
    console.error('User cache invalidation hatası:', error);
  }
}

/**
 * Doktor cache'ini invalidate eder
 */
export async function invalidateDoctorCache() {
  try {
    const { invalidatePattern } = await import('../config/redis.js');
    await invalidatePattern('doctors:*');
  } catch (error) {
    console.error('Doctor cache invalidation hatası:', error);
  }
}

/**
 * Hastane cache'ini invalidate eder
 */
export async function invalidateHospitalCache() {
  try {
    const { invalidatePattern } = await import('../config/redis.js');
    await invalidatePattern('hospitals:*');
  } catch (error) {
    console.error('Hospital cache invalidation hatası:', error);
  }
}

/**
 * Randevu cache'ini invalidate eder
 * @param {string} userId - Kullanıcı ID (opsiyonel)
 */
export async function invalidateAppointmentCache(userId) {
  try {
    const { invalidatePattern } = await import('../config/redis.js');
    if (userId) {
      await invalidatePattern(`appointments:*:${userId}`);
    } else {
      await invalidatePattern('appointments:*');
    }
  } catch (error) {
    console.error('Appointment cache invalidation hatası:', error);
  }
}

/**
 * Cache'i temizler (tümü)
 */
export async function clearAllCache() {
  try {
    const { flushAll } = await import('../config/redis.js');
    await flushAll();
  } catch (error) {
    console.error('Cache temizleme hatası:', error);
  }
}

export default {
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  invalidateDoctorCache,
  invalidateHospitalCache,
  invalidateAppointmentCache,
  clearAllCache,
};
