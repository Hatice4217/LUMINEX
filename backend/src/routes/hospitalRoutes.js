// Hospital Routes
import express from 'express';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middlewares/auth-middleware.js';
import logger from '../utils/logger.js';
import { cacheMiddleware, invalidateHospitalCache } from '../middlewares/cache-middleware.js';

const router = express.Router();

// Authentication gerektiren route'lar
router.use(authenticate);

/**
 * @route   GET /api/hospitals
 * @desc    Hastaneleri listele
 * @access  Private
 */
router.get('/', cacheMiddleware('hospitals', 1800), async (req, res, next) => { // 30 dakika cache
  try {
    const { city, search, page = 1, limit = 20 } = req.query;

    const where = {
      isActive: true,
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.hospital.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        hospitals,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/hospitals/:id
 * @desc    Hastane detayı
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            doctors: true,
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hastane bulunamadı',
      });
    }

    res.json({
      success: true,
      data: { hospital },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/hospitals
 * @desc    Hastane ekle
 * @access  Private (Admin)
 */
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, address, phone, email, city, district } = req.body;

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        phone,
        email,
        city,
        district,
      },
    });

    logger.info('Hospital created', { hospitalId: hospital.id, createdBy: req.user.id });

    // Cache'i invalidate et
    await invalidateHospitalCache();

    res.status(201).json({
      success: true,
      message: 'Hastane oluşturuldu',
      data: { hospital },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Hastane güncelle
 * @access  Private (Admin)
 */
router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, city, district, isActive } = req.body;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        email,
        city,
        district,
        isActive,
      },
    });

    logger.info('Hospital updated', { hospitalId: id, updatedBy: req.user.id });

    // Cache'i invalidate et
    await invalidateHospitalCache();

    res.json({
      success: true,
      message: 'Hastane güncellendi',
      data: { hospital },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/hospitals/:id
 * @desc    Hastane sil
 * @access  Private (Admin)
 */
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.hospital.delete({
      where: { id },
    });

    logger.info('Hospital deleted', { hospitalId: id, deletedBy: req.user.id });

    // Cache'i invalidate et
    await invalidateHospitalCache();

    res.json({
      success: true,
      message: 'Hastane silindi',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
