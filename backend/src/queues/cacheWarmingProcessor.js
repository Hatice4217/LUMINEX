// Cache Warming Job Processor - Cache Isıtma Job'ları
import { cacheWarmingQueue } from '../config/queues.js';
import prisma from '../config/database.js';
import { set } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Job types
 */
const CacheWarmingJobTypes = {
  DOCTORS_CACHE: 'doctors_cache',
  HOSPITALS_CACHE: 'hospitals_cache',
  HOSPITALS_BY_CITY_CACHE: 'hospitals_by_city_cache',
  FULL_WARMING: 'full_warming',
  INVALIDATE_AND_WARM: 'invalidate_and_warm',
};

/**
 * Cache warming job processor - Ana işleyici
 */
async function processCacheWarmingJob(job) {
  const { type, data } = job.data;

  logger.info('Processing cache warming job', { jobId: job.id, type });

  try {
    let result;

    switch (type) {
      case CacheWarmingJobTypes.DOCTORS_CACHE:
        result = await processDoctorsCache(data);
        break;

      case CacheWarmingJobTypes.HOSPITALS_CACHE:
        result = await processHospitalsCache(data);
        break;

      case CacheWarmingJobTypes.HOSPITALS_BY_CITY_CACHE:
        result = await processHospitalsByCityCache(data);
        break;

      case CacheWarmingJobTypes.FULL_WARMING:
        result = await processFullWarming(data);
        break;

      case CacheWarmingJobTypes.INVALIDATE_AND_WARM:
        result = await processInvalidateAndWarm(data);
        break;

      default:
        throw new Error(`Bilinmeyen cache warming job type: ${type}`);
    }

    logger.info('Cache warming job completed successfully', { jobId: job.id, type });

    return result;
  } catch (error) {
    logger.error('Cache warming job failed', { jobId: job.id, type, error: error.message });
    throw error;
  }
}

/**
 * Doktor listesini cache'le
 */
async function processDoctorsCache(data) {
  const { page = 1, limit = 20 } = data;

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

  const totalPages = Math.ceil(doctors.length / limit);

  // Eğer belirli bir sayfa isteniyorsa sadece o sayfayı cache'le
  if (page) {
    const skip = (page - 1) * limit;
    const pageData = doctors.slice(skip, skip + limit);

    const cacheKey = `doctors:/api/doctors?page=${page}&limit=${limit}:anonymous`;
    await set(cacheKey, {
      success: true,
      data: {
        doctors: pageData,
        pagination: {
          total: doctors.length,
          page,
          limit,
          pages: totalPages,
        },
      },
    }, 900); // 15 dakika

    return {
      cacheKey,
      count: pageData.length,
      page,
    };
  }

  // Tüm sayfaları cache'le
  const results = [];
  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const skip = (currentPage - 1) * limit;
    const pageData = doctors.slice(skip, skip + limit);

    const cacheKey = `doctors:/api/doctors?page=${currentPage}&limit=${limit}:anonymous`;
    await set(cacheKey, {
      success: true,
      data: {
        doctors: pageData,
        pagination: {
          total: doctors.length,
          page: currentPage,
          limit,
          pages: totalPages,
        },
      },
    }, 900);

    results.push({
      cacheKey,
      count: pageData.length,
      page: currentPage,
    });
  }

  return {
    totalDoctors: doctors.length,
    pagesCached: results.length,
    results,
  };
}

/**
 * Hastane listesini cache'le
 */
async function processHospitalsCache(data) {
  const { page = 1, limit = 20 } = data;

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

  const totalPages = Math.ceil(hospitals.length / limit);

  // Eğer belirli bir sayfa isteniyorsa sadece o sayfayı cache'le
  if (page) {
    const skip = (page - 1) * limit;
    const pageData = hospitals.slice(skip, skip + limit);

    const cacheKey = `hospitals:/api/hospitals?page=${page}&limit=${limit}:anonymous`;
    await set(cacheKey, {
      success: true,
      data: {
        hospitals: pageData,
        pagination: {
          total: hospitals.length,
          page,
          limit,
          pages: totalPages,
        },
      },
    }, 1800); // 30 dakika

    return {
      cacheKey,
      count: pageData.length,
      page,
    };
  }

  // Tüm sayfaları cache'le
  const results = [];
  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const skip = (currentPage - 1) * limit;
    const pageData = hospitals.slice(skip, skip + limit);

    const cacheKey = `hospitals:/api/hospitals?page=${currentPage}&limit=${limit}:anonymous`;
    await set(cacheKey, {
      success: true,
      data: {
        hospitals: pageData,
        pagination: {
          total: hospitals.length,
          page: currentPage,
          limit,
          pages: totalPages,
        },
      },
    }, 1800);

    results.push({
      cacheKey,
      count: pageData.length,
      page: currentPage,
    });
  }

  return {
    totalHospitals: hospitals.length,
    pagesCached: results.length,
    results,
  };
}

/**
 * Şehirlere göre hastane cache'le
 */
async function processHospitalsByCityCache(data) {
  const { city } = data;

  if (city) {
    // Belirli bir şehir için cache'le
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

    return {
      cacheKey,
      city,
      count: hospitals.length,
    };
  }

  // Tüm şehirler için cache'le
  const cities = await prisma.hospital.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ['city'],
  });

  const results = [];
  for (const { city: city_name } of cities) {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true, city: city_name },
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

    const cacheKey = `hospitals:/api/hospitals?city=${encodeURIComponent(city_name)}&limit=20:anonymous`;
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

    results.push({
      cacheKey,
      city: city_name,
      count: hospitals.length,
    });
  }

  return {
    totalCities: results.length,
    results,
  };
}

/**
 * Tam cache warming - tüm cache'leri ısıt
 */
async function processFullWarming(data) {
  logger.info('Starting full cache warming...');

  const results = await Promise.allSettled([
    processDoctorsCache({}),
    processHospitalsCache({}),
    processHospitalsByCityCache({}),
  ]);

  const summary = {
    doctors: null,
    hospitals: null,
    hospitalsByCity: null,
    errors: [],
  };

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      switch (index) {
        case 0:
          summary.doctors = result.value;
          break;
        case 1:
          summary.hospitals = result.value;
          break;
        case 2:
          summary.hospitalsByCity = result.value;
          break;
      }
    } else {
      summary.errors.push({
        index,
        error: result.reason.message,
      });
    }
  });

  logger.info('Full cache warming completed', summary);

  return summary;
}

/**
 * Cache'i invalidate et ve yeniden ısıt
 */
async function processInvalidateAndWarm(data) {
  const { pattern, type } = data;

  // Burada Redis'in del komutunu kullanarak cache'i temizleyebiliriz
  // Şimdilik sadece warming yapıyoruz

  let result;
  switch (type) {
    case 'doctors':
      result = await processDoctorsCache({});
      break;
    case 'hospitals':
      result = await processHospitalsCache({});
      break;
    case 'hospitalsByCity':
      result = await processHospitalsByCityCache({});
      break;
    case 'full':
      result = await processFullWarming({});
      break;
    default:
      throw new Error(`Bilinmeyen cache type: ${type}`);
  }

  return {
    invalidated: pattern,
    warmed: result,
  };
}

/**
 * Cache warming job'ini kuyruğa ekle (yardımcı fonksiyonlar)
 */

/**
 * Doktor cache'i kuyruğa ekle
 */
export async function queueDoctorsCache(page = null) {
  const job = await cacheWarmingQueue.add({
    type: CacheWarmingJobTypes.DOCTORS_CACHE,
    data: { page },
  });

  logger.info('Doctors cache warming queued', { jobId: job.id, page });
  return job;
}

/**
 * Hastane cache'i kuyruğa ekle
 */
export async function queueHospitalsCache(page = null) {
  const job = await cacheWarmingQueue.add({
    type: CacheWarmingJobTypes.HOSPITALS_CACHE,
    data: { page },
  });

  logger.info('Hospitals cache warming queued', { jobId: job.id, page });
  return job;
}

/**
 * Şehir bazlı hastane cache'i kuyruğa ekle
 */
export async function queueHospitalsByCityCache(city = null) {
  const job = await cacheWarmingQueue.add({
    type: CacheWarmingJobTypes.HOSPITALS_BY_CITY_CACHE,
    data: { city },
  });

  logger.info('Hospitals by city cache warming queued', { jobId: job.id, city });
  return job;
}

/**
 * Tam cache warming kuyruğa ekle
 */
export async function queueFullCacheWarming() {
  const job = await cacheWarmingQueue.add({
    type: CacheWarmingJobTypes.FULL_WARMING,
    data: {},
  });

  logger.info('Full cache warming queued', { jobId: job.id });
  return job;
}

/**
 * Periyodik tam cache warming kuyruğa ekle
 */
export async function schedulePeriodicCacheWarming() {
  // Her 10 dakikada bir çalışacak şekilde schedule et
  const job = await cacheWarmingQueue.add(
    {
      type: CacheWarmingJobTypes.FULL_WARMING,
      data: {},
    },
    {
      repeat: {
        every: 10 * 60 * 1000, // 10 dakika
      },
    }
  );

  logger.info('Periodic cache warming scheduled', { jobId: job.id });
  return job;
}

/**
 * Cache invalidate ve warming kuyruğa ekle
 */
export async function queueInvalidateAndWarm(pattern, type) {
  const job = await cacheWarmingQueue.add({
    type: CacheWarmingJobTypes.INVALIDATE_AND_WARM,
    data: { pattern, type },
  });

  logger.info('Cache invalidate and warm queued', { jobId: job.id, pattern, type });
  return job;
}

/**
 * Cache warming queue processor'ı başlat
 */
export function startCacheWarmingProcessor() {
  cacheWarmingQueue.process(2, async (job) => {
    return await processCacheWarmingJob(job);
  });

  logger.info('Cache warming processor started (concurrency: 2)');

  // Error handling
  cacheWarmingQueue.on('failed', (job, err) => {
    logger.error('Cache warming job permanently failed', {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  cacheWarmingQueue.on('completed', (job, result) => {
    logger.info('Cache warming job completed', {
      jobId: job.id,
      type: job.data.type,
    });
  });
}

export default {
  CacheWarmingJobTypes,
  processCacheWarmingJob,
  queueDoctorsCache,
  queueHospitalsCache,
  queueHospitalsByCityCache,
  queueFullCacheWarming,
  schedulePeriodicCacheWarming,
  queueInvalidateAndWarm,
  startCacheWarmingProcessor,
};
