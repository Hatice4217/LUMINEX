// Doctor Controller
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { invalidateDoctorCache } from '../middlewares/cache-middleware.js';

/**
 * Doktorları listele
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { branch, search, page = 1, limit = 20 } = req.query;

    const where = {
      role: 'DOCTOR',
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          createdAt: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { firstName: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        doctors,
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
};

/**
 * Doktor detayı
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            doctorAppointments: true,
            receivedRatings: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doktor bulunamadı',
      });
    }

    // Ortalama puan hesapla
    const ratings = await prisma.rating.findMany({
      where: { doctorId: id },
      select: { rating: true },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      success: true,
      data: {
        doctor: {
          ...doctor,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Doktor müsaitlik ekle
 */
export const addAvailability = async (req, res, next) => {
  try {
    const { date, startTime, endTime, notes } = req.body;
    const doctorId = req.user.id;

    const availability = await prisma.availability.create({
      data: {
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        notes,
      },
    });

    logger.info('Doctor availability added', { doctorId, date });

    // Cache'i invalidate et
    await invalidateDoctorCache();

    res.status(201).json({
      success: true,
      message: 'Müsaitlik eklendi',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Doktor müsaitliklerini listele
 */
export const getAvailabilities = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { doctorId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json({
      success: true,
      data: { availabilities },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Doktor müsaitlik sil
 */
export const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Müsaitlik bulunamadı',
      });
    }

    // Yetki kontrolü
    if (availability.doctorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu müsaitliği silme yetkiniz yok',
      });
    }

    await prisma.availability.delete({
      where: { id },
    });

    logger.info('Doctor availability deleted', { availabilityId: id, deletedBy: userId });

    // Cache'i invalidate et
    await invalidateDoctorCache();

    res.json({
      success: true,
      message: 'Müsaitlik silindi',
    });
  } catch (error) {
    next(error);
  }
};
