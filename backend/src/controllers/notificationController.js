// Notification Controller
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Kullanıcının bildirimlerini listele
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly = 'false' } = req.query;

    const where = {
      userId,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Okunmamış sayısı
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirumu okundu işaretle
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    // Yetki kontrolü
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirumu okuma yetkiniz yok',
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
      data: { notification: updatedNotification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tüm bildirimları okundu işaretle
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    logger.info('All notifications marked as read', { userId });

    res.json({
      success: true,
      message: 'Tüm bildirimlar okundu olarak işaretlendi',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirim sil
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    // Yetki kontrolü
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirumu silme yetkiniz yok',
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Bildirim silindi',
    });
  } catch (error) {
    next(error);
  }
};
