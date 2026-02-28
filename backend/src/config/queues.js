// Bull Queues Configuration - Background Job Processing
import Queue from 'bull';
import Redis from 'ioredis';

// Redis connection configuration for queues
const queueRedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '1'), // Farklı DB kullanıyoruz queue'lar için
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Common queue options
const queueOptions = {
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // 24 saat sonra sil
      count: 1000, // Max 1000 completed job tut
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 gün sonra sil
      count: 5000, // Max 5000 failed job tut
    },
    attempts: 3, // 3 kez dene
    backoff: {
      type: 'exponential',
      delay: 2000, // İlk deneme: 2sn, sonra ikiye katla
    },
  },
  settings: {
    stalledInterval: 30 * 1000, // 30 saniyede bir kontrol et
    maxStalledCount: 1, // 1 stalled job'a izin ver
  },
  limiter: {
    max: 100, // Saniyede max 100 job
    duration: 1000,
  },
};

/**
 * Email Queue - Email gönderimi için
 */
export const emailQueue = new Queue('emails', {
  redis: queueRedisConfig,
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 5, // Email için 5 deneme
    timeout: 30000, // 30 sn timeout
  },
});

/**
 * Appointment Reminder Queue - Randevu hatırlatma job'ları
 */
export const appointmentReminderQueue = new Queue('appointment-reminders', {
  redis: queueRedisConfig,
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 3,
    timeout: 60000, // 1 dk timeout
  },
});

/**
 * Cache Warming Queue - Cache warming job'ları
 */
export const cacheWarmingQueue = new Queue('cache-warming', {
  redis: queueRedisConfig,
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 2,
    timeout: 120000, // 2 dk timeout
  },
});

/**
 * Notification Queue - Bildirim job'ları
 */
export const notificationQueue = new Queue('notifications', {
  redis: queueRedisConfig,
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 3,
    timeout: 10000, // 10 sn timeout
  },
});

/**
 * Cleanup Queue - Temizlik job'ları (eski loglar, geçici dosyalar vb.)
 */
export const cleanupQueue = new Queue('cleanup', {
  redis: queueRedisConfig,
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    attempts: 1, // Cleanup job'ları için 1 deneme
    timeout: 300000, // 5 dk timeout
  },
});

/**
 * Queue health check fonksiyonu
 */
export async function checkQueuesHealth() {
  const queues = [
    { name: 'email', queue: emailQueue },
    { name: 'appointment-reminders', queue: appointmentReminderQueue },
    { name: 'cache-warming', queue: cacheWarmingQueue },
    { name: 'notifications', queue: notificationQueue },
    { name: 'cleanup', queue: cleanupQueue },
  ];

  const healthStatus = {};

  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      healthStatus[name] = {
        status: 'healthy',
        counts: {
          waiting,
          active,
          completed,
          failed,
          delayed,
        },
      };
    } catch (error) {
      healthStatus[name] = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  return healthStatus;
}

/**
 * Graceful shutdown - Tüm queue'ları kapat
 */
export async function closeQueues() {
  const queues = [emailQueue, appointmentReminderQueue, cacheWarmingQueue, notificationQueue, cleanupQueue];

  for (const queue of queues) {
    try {
      await queue.close();
      console.log(`✅ Queue closed: ${queue.name}`);
    } catch (error) {
      console.error(`❌ Error closing queue ${queue.name}:`, error);
    }
  }
}

// Queue event listeners - Debug ve monitoring için
function setupQueueListeners(queue, queueName) {
  queue.on('error', (error) => {
    console.error(`❌ Queue error [${queueName}]:`, error);
  });

  queue.on('waiting', (jobId) => {
    console.log(`⏳ Job waiting [${queueName}]:`, jobId);
  });

  queue.on('active', (job, jobPromise) => {
    console.log(`▶️  Job started [${queueName}]:`, job.id);
  });

  queue.on('completed', (job, result) => {
    console.log(`✅ Job completed [${queueName}]:`, job.id);
  });

  queue.on('failed', (job, err) => {
    console.error(`❌ Job failed [${queueName}]:`, job?.id, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`⚠️  Job stalled [${queueName}]:`, job?.id);
  });

  queue.on('progress', (job, progress) => {
    console.log(`📊 Job progress [${queueName}]:`, job?.id, progress);
  });
}

// Tüm queue'lara event listener'ları ekle
setupQueueListeners(emailQueue, 'emails');
setupQueueListeners(appointmentReminderQueue, 'appointment-reminders');
setupQueueListeners(cacheWarmingQueue, 'cache-warming');
setupQueueListeners(notificationQueue, 'notifications');
setupQueueListeners(cleanupQueue, 'cleanup');

export default {
  emailQueue,
  appointmentReminderQueue,
  cacheWarmingQueue,
  notificationQueue,
  cleanupQueue,
  checkQueuesHealth,
  closeQueues,
};
