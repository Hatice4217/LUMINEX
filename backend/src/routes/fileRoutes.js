// File Routes
import express from 'express';
import {
  uploadProfile,
  uploadFile,
  uploadMultipleFiles,
  getFile,
  getFileInfo,
  getUserFiles,
  deleteFile,
  getProfilePicture,
} from '../controllers/fileController.js';
import { authenticate } from '../middlewares/auth-middleware.js';
import { validateFileCategory } from '../config/multer.js';
import { idParamValidation } from '../middlewares/validation-middleware.js';

const router = express.Router();

// Profil resmi public endpoint (token ile erişim)
/**
 * @route   GET /api/files/profile/:userId
 * @desc    Profil resmi getir
 * @access  Public (with token)
 */
router.get('/profile/:userId', getProfilePicture);

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/files/profile
 * @desc    Profil resmi yükle
 * @access  Private
 */
router.post('/profile', uploadProfile);

/**
 * @route   POST /api/files/upload
 * @desc    Tek dosya yükle
 * @access  Private
 */
router.post('/upload', validateFileCategory, uploadFile);

/**
 * @route   POST /api/files/upload/multiple
 * @desc    Birden fazla dosya yükle (max 5)
 * @access  Private
 */
router.post('/upload/multiple', validateFileCategory, uploadMultipleFiles);

/**
 * @route   GET /api/files
 * @desc    Kullanıcının dosyalarını listele
 * @access  Private
 */
router.get('/', getUserFiles);

/**
 * @route   GET /api/files/:id
 * @desc    Dosya indir
 * @access  Private
 */
router.get('/:id', idParamValidation, getFile);

/**
 * @route   GET /api/files/:id/info
 * @desc    Dosya bilgilerini getir
 * @access  Private
 */
router.get('/:id/info', idParamValidation, getFileInfo);

/**
 * @route   DELETE /api/files/:id
 * @desc    Dosya sil
 * @access  Private
 */
router.delete('/:id', idParamValidation, deleteFile);

export default router;
