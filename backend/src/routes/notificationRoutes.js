// Notification Routes
import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth-middleware.js';
import { idParamValidation } from '../middlewares/validation-middleware.js';

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Bildirimları listele
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Bildirumu okundu işaretle
 * @access  Private
 */
router.put('/:id/read', idParamValidation, markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Tüm bildirimları okundu işaretle
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Bildirim sil
 * @access  Private
 */
router.delete('/:id', idParamValidation, deleteNotification);

export default router;
