// Cache Warmer - Sık kullanılan verileri cache'ler
import prisma from '../config/database.js';
import { set, keys, healthCheck } from '../config/redis.js';
import logger from '../utils/logger.js';

// Cache warming interval (ms)
const WARMING_INTERVAL = 10 * 60 * 1000; // 10 dakika

/**
 * Doktor listesini cache'ler
 */
async function warmDoctorsCache() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        createdAt: true,
      },
      take: 100,
      orderBy: { firstName: 'asc' },
    });

    // Her sayfa için cache key oluştur
    for (let page = 1; page <= Math.ceil(doctors.length / 20); page++) {
      const skip = (page - 1) * 20;
      const pageData = doctors.slice(skip, skip + 20);

      const cacheKey = `doctors:/api/doctors?page=${page}&limit=20:anonymous`;
      await set(cacheKey, {
        success: true,
        data: {
          doctors: pageData,
          pagination: {
            total: doctors.length,
            page,
            limit: 20,
            pages: Math.ceil(doctors.length / 20),
          },
        },
      }, 900); // 15 dakika
    }

    logger.info(`Doctors cache warmed: ${doctors.length} doctors`);
  } catch (error) {
    logger.error('Error warming doctors cache:', error);
  }
}

/**
 * Hastane listesini cache'ler
 */
async function warmHospitalsCache() {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        district: true,
      },
      take: 100,
      orderBy: { name: 'asc' },
    });

    // Her sayfa için cache key oluştur
    for (let page = 1; page <= Math.ceil(hospitals.length / 20); page++) {
      const skip = (page - 1) * 20;
      const pageData = hospitals.slice(skip, skip + 20);

      const cacheKey = `hospitals:/api/hospitals?page=${page}&limit=20:anonymous`;
      await set(cacheKey, {
        success: true,
        data: {
          hospitals: pageData,
          pagination: {
            total: hospitals.length,
            page,
            limit: 20,
            pages: Math.ceil(hospitals.length / 20),
          },
        },
      }, 1800); // 30 dakika
    }

    logger.info(`Hospitals cache warmed: ${hospitals.length} hospitals`);
  } catch (error) {
    logger.error('Error warming hospitals cache:', error);
  }
}

/**
 * Şehirlere göre hastane cache'ler
 */
async function warmHospitalsByCityCache() {
  try {
    const cities = await prisma.hospital.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ['city'],
    });

    for (const { city } of cities) {
      const hospitals = await prisma.hospital.findMany({
        where: { isActive: true, city },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          city: true,
          district: true,
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      const cacheKey = `hospitals:/api/hospitals?city=${encodeURIComponent(city)}&limit=20:anonymous`;
      await set(cacheKey, {
        success: true,
        data: {
          hospitals,
          pagination: {
            total: hospitals.length,
            page: 1,
            limit: 20,
            pages: 1,
          },
        },
      }, 1800);
    }

    logger.info(`Hospitals by city cache warmed: ${cities.length} cities`);
  } catch (error) {
    logger.error('Error warming hospitals by city cache:', error);
  }
}

/**
 * Ana cache warming fonksiyonu
 */
export async function warmCache() {
  try {
    const health = await healthCheck();

    if (health.status !== 'healthy') {
      logger.warn('Redis not available, skipping cache warming');
      return;
    }

    logger.info('Starting cache warming...');

    // Paralel olarak cache'leri ısıt
    await Promise.all([
      warmDoctorsCache(),
      warmHospitalsCache(),
      warmHospitalsByCityCache(),
    ]);

    logger.info('Cache warming completed');
  } catch (error) {
    logger.error('Error during cache warming:', error);
  }
}

/**
 * Cache warming interval'ını başlat
 */
let warmingInterval;

export function startCacheWarming() {
  // İlk çalıştırma - hemen başlat
  warmCache().catch((error) => {
    logger.error('Initial cache warming failed:', error);
  });

  // Periyodik çalıştırma
  warmingInterval = setInterval(() => {
    warmCache().catch((error) => {
      logger.error('Periodic cache warming failed:', error);
    });
  }, WARMING_INTERVAL);

  logger.info(`Cache warming scheduled every ${WARMING_INTERVAL / 1000} seconds`);
}

/**
 * Cache warming interval'ını durdur
 */
export function stopCacheWarming() {
  if (warmingInterval) {
    clearInterval(warmingInterval);
    warmingInterval = null;
    logger.info('Cache warming stopped');
  }
}

/**
 * Manuel cache warming trigger
 */
export async function triggerCacheWarming() {
  logger.info('Manual cache warming triggered');
  await warmCache();
}
