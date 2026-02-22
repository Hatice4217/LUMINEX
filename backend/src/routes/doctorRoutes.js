// Doctor Routes
import express from 'express';
import {
  getDoctors,
  getDoctorById,
  addAvailability,
  getAvailabilities,
  deleteAvailability,
} from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middlewares/auth-middleware.js';
import { idParamValidation } from '../middlewares/validation-middleware.js';

const router = express.Router();

// Public route - doktorları listele
/**
 * @route   GET /api/doctors
 * @desc    Doktorları listele
 * @access  Public
 */
router.get('/', getDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Doktor detayı
 * @access  Public
 */
router.get('/:id', idParamValidation, getDoctorById);

// Authentication gerektiren route'lar
router.use(authenticate);

/**
 * @route   POST /api/doctors/availability
 * @desc    Müsaitlik ekle
 * @access  Private (Doctor)
 */
router.post('/availability', authorize('DOCTOR', 'ADMIN'), addAvailability);

/**
 * @route   GET /api/doctors/:doctorId/availability
 * @desc    Doktor müsaitliklerini listele
 * @access  Private
 */
router.get('/:doctorId/availability', getAvailabilities);

/**
 * @route   DELETE /api/doctors/availability/:id
 * @desc    Müsaitlik sil
 * @access  Private (Doctor veya Admin)
 */
router.delete('/availability/:id', idParamValidation, authorize('DOCTOR', 'ADMIN'), deleteAvailability);

export default router;
