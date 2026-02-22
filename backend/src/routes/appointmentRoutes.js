// Appointment Routes
import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middlewares/auth-middleware.js';
import { appointmentValidation, idParamValidation } from '../middlewares/validation-middleware.js';

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/appointments
 * @desc    Yeni randevu oluştur
 * @access  Private (Patient)
 */
router.post('/', authorize('PATIENT', 'ADMIN'), appointmentValidation, createAppointment);

/**
 * @route   GET /api/appointments
 * @desc    Randevuları listele
 * @access  Private
 */
router.get('/', getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Randevu detayı
 * @access  Private
 */
router.get('/:id', idParamValidation, getAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Randevu güncelle
 * @access  Private (Patient, Doctor)
 */
router.put('/:id', idParamValidation, updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Randevu iptal
 * @access  Private (Patient, Doctor, Admin)
 */
router.delete('/:id', idParamValidation, cancelAppointment);

export default router;
