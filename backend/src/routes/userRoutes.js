// User Routes
import express from 'express';
import {
  getUsers,
  getUserById,
  getMe,
  updateUser,
  deleteUser,
  changeUserRole,
  getUserStats,
} from '../controllers/userController.js';
import { authenticate, authorize, isOwner } from '../middlewares/auth-middleware.js';
import { idParamValidation } from '../middlewares/validation-middleware.js';
import { cacheMiddleware } from '../middlewares/cache-middleware.js';

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Mevcut kullanıcının profil bilgilerini getir
 * @access  Private
 */
router.get('/me', cacheMiddleware('users', 300), getMe); // 5 dakika cache

/**
 * @route   GET /api/users
 * @desc    Tüm kullanıcıları listele
 * @access  Private (Admin)
 */
router.get('/', authorize('ADMIN'), getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Kullanıcı istatistikleri
 * @access  Private (Admin)
 */
router.get('/stats', authorize('ADMIN'), getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Kullanıcı detayı
 * @access  Private
 */
router.get('/:id', idParamValidation, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Kullanıcı güncelle
 * @access  Private (Admin veya kendi hesabı)
 */
router.put('/:id', idParamValidation, authorize('ADMIN'), updateUser);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Kullanıcı rolünü değiştir
 * @access  Private (Admin)
 */
router.put('/:id/role', idParamValidation, authorize('ADMIN'), changeUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Kullanıcı sil
 * @access  Private (Admin)
 */
router.delete('/:id', idParamValidation, authorize('ADMIN'), deleteUser);

export default router;
