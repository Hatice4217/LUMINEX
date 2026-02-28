// User Controller
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { validateTC, validateEmail, validatePassword } from '../utils/validation-utils.js';
import logger from '../utils/logger.js';
import { invalidateUserCache } from '../middlewares/cache-middleware.js';

/**
 * Tüm kullanıcıları listele (Admin)
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { tcNo: { contains: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          tcNo: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
          phone: true,
          gender: true,
          createdAt: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
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
 * Mevcut kullanıcının profil bilgilerini getir
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        tcNo: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true,
            testResults: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı detayı getir
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tcNo: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true,
            testResults: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı güncelle
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, gender, dateOfBirth } = req.body;

    // Email değiştiriliyorsa ve yeni email farklıysa
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu email zaten kullanımda',
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tcNo: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
      },
    });

    logger.info('User updated', { userId: id, updatedBy: req.user.id });

    // Cache'i invalidate et
    await invalidateUserCache(id);

    res.json({
      success: true,
      message: 'Kullanıcı güncellendi',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı sil (Admin)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kendini silemez
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendinizi silemezsiniz',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info('User deleted', { userId: id, deletedBy: req.user.id });

    res.json({
      success: true,
      message: 'Kullanıcı silindi',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı rolünü değiştir (Admin)
 */
export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['PATIENT', 'DOCTOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    logger.info('User role changed', { userId: id, newRole: role, changedBy: req.user.id });

    res.json({
      success: true,
      message: 'Kullanıcı rolü değiştirildi',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı istatistikleri
 */
export const getUserStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAdmins,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalAdmins,
        },
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
