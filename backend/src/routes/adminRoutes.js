// Admin Routes - Bull Board Dashboard ve Admin işlemleri
import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import {
  emailQueue,
  appointmentReminderQueue,
  cacheWarmingQueue,
  notificationQueue,
  cleanupQueue,
  checkQueuesHealth,
} from '../config/queues.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// BULL BOARD DASHBOARD
// ============================================

// Bull Board server adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Bull Board oluştur
const bullBoard = createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(appointmentReminderQueue),
    new BullAdapter(cacheWarmingQueue),
    new BullAdapter(notificationQueue),
    new BullAdapter(cleanupQueue),
  ],
  serverAdapter,
});

// Bull Board UI endpoint'i
router.use('/queues', serverAdapter.getRouter());

// ============================================
// QUEUE HEALTH CHECK
// ============================================

/**
 * @swagger
 * /admin/queues/health:
 *   get:
 *     summary: Queue sağlık durumunu kontrol et
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue sağlık durumu
 */
router.get('/queues/health', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const healthStatus = await checkQueuesHealth();

    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error checking queues health:', error);
    res.status(500).json({
      success: false,
      message: 'Queue sağlık kontrolü başarısız',
      error: error.message,
    });
  }
});

// ============================================
// QUEUE MANAGEMENT
// ============================================

/**
 * @swagger
 * /admin/queues/{queueName}/stats:
 *   get:
 *     summary: Queue istatistiklerini getir
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *         description: Queue adı (emails, appointment-reminders, cache-warming, notifications, cleanup)
 *     responses:
 *       200:
 *         description: Queue istatistikleri
 */
router.get('/queues/:queueName/stats', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName } = req.params;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    res.json({
      success: true,
      data: {
        queueName,
        stats: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Queue istatistikleri alınamadı',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/jobs:
 *   get:
 *     summary: Queue'daki job'ları listele
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed, failed, delayed]
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *       - in: query
 *         name: end
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job listesi
 */
router.get('/queues/:queueName/jobs', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName } = req.params;
    const { state = 'waiting', start = 0, end = 50 } = req.query;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    let jobs;
    switch (state) {
      case 'waiting':
        jobs = await queue.getWaiting(parseInt(start), parseInt(end));
        break;
      case 'active':
        jobs = await queue.getActive(parseInt(start), parseInt(end));
        break;
      case 'completed':
        jobs = await queue.getCompleted(parseInt(start), parseInt(end));
        break;
      case 'failed':
        jobs = await queue.getFailed(parseInt(start), parseInt(end));
        break;
      case 'delayed':
        jobs = await queue.getDelayed(parseInt(start), parseInt(end));
        break;
      default:
        jobs = await queue.getWaiting(parseInt(start), parseInt(end));
    }

    res.json({
      success: true,
      data: {
        queueName,
        state,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        })),
        count: jobs.length,
      },
    });
  } catch (error) {
    logger.error('Error getting queue jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Job listesi alınamadı',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/jobs/{jobId}/retry:
 *   post:
 *     summary: Job'ı retry et
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job retry edildi
 */
router.post('/queues/:queueName/jobs/:jobId/retry', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName, jobId } = req.params;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job not found: ${jobId}`,
      });
    }

    await job.retry();

    logger.info(`Job retried`, { queueName, jobId });

    res.json({
      success: true,
      message: 'Job retry edildi',
      data: {
        queueName,
        jobId,
      },
    });
  } catch (error) {
    logger.error('Error retrying job:', error);
    res.status(500).json({
      success: false,
      message: 'Job retry edilemedi',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/jobs/{jobId}:
 *   delete:
 *     summary: Job'ı sil
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job silindi
 */
router.delete('/queues/:queueName/jobs/:jobId', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName, jobId } = req.params;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job not found: ${jobId}`,
      });
    }

    await job.remove();

    logger.info(`Job deleted`, { queueName, jobId });

    res.json({
      success: true,
      message: 'Job silindi',
      data: {
        queueName,
        jobId,
      },
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Job silinemedi',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/clean:
 *   post:
 *     summary: Queue'yu temizle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: body
 *         schema:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [completed, failed, waiting, delayed]
 *             age:
 *               type: integer
 *               description: Saniye cinsinden yaş
 *             limit:
 *               type: integer
 *     responses:
 *       200:
 *         description: Queue temizlendi
 */
router.post('/queues/:queueName/clean', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName } = req.params;
    const { type = 'completed', age = 86400, limit = 1000 } = req.body;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    const cleaned = await queue.clean(age, limit, type);

    logger.info(`Queue cleaned`, { queueName, type, count: cleaned });

    res.json({
      success: true,
      message: 'Queue temizlendi',
      data: {
        queueName,
        type,
        cleaned,
      },
    });
  } catch (error) {
    logger.error('Error cleaning queue:', error);
    res.status(500).json({
      success: false,
      message: 'Queue temizlenemedi',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/pause:
 *   post:
 *     summary: Queue'yu duraklat
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue duraklatıldı
 */
router.post('/queues/:queueName/pause', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName } = req.params;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    await queue.pause();

    logger.info(`Queue paused`, { queueName });

    res.json({
      success: true,
      message: 'Queue duraklatıldı',
      data: { queueName },
    });
  } catch (error) {
    logger.error('Error pausing queue:', error);
    res.status(500).json({
      success: false,
      message: 'Queue duraklatılamadı',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /admin/queues/{queueName}/resume:
 *   post:
 *     summary: Queue'yu devam ettir
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue devam ettirildi
 */
router.post('/queues/:queueName/resume', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueName } = req.params;

    const queues = {
      emails: emailQueue,
      'appointment-reminders': appointmentReminderQueue,
      'cache-warming': cacheWarmingQueue,
      notifications: notificationQueue,
      cleanup: cleanupQueue,
    };

    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue not found: ${queueName}`,
      });
    }

    await queue.resume();

    logger.info(`Queue resumed`, { queueName });

    res.json({
      success: true,
      message: 'Queue devam ettirildi',
      data: { queueName },
    });
  } catch (error) {
    logger.error('Error resuming queue:', error);
    res.status(500).json({
      success: false,
      message: 'Queue devam ettirilemedi',
      error: error.message,
    });
  }
});

// ============================================
 // CACHE WARMING TRIGGERS
// ============================================

/**
 * @swagger
 * /admin/cache/warm:
 *   post:
 *     summary: Cache warming tetikle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache warming tetiklendi
 */
router.post('/cache/warm', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { queueFullCacheWarming } = await import('../queues/cacheWarmingProcessor.js');

    const job = await queueFullCacheWarming();

    logger.info('Cache warming triggered by admin', { jobId: job.id });

    res.json({
      success: true,
      message: 'Cache warming tetiklendi',
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    logger.error('Error triggering cache warming:', error);
    res.status(500).json({
      success: false,
      message: 'Cache warming tetiklenemedi',
      error: error.message,
    });
  }
});

export default router;
