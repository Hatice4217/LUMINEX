// Authentication Routes
import express from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
} from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../middlewares/validation-middleware.js';
import { authenticate } from '../middlewares/auth-middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     description: Hastane yönetim sistemine yeni kullanıcı kaydı oluşturur.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tcNo
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               tcNo:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 11
 *                 pattern: '^[0-9]{11}$'
 *                 description: TC Kimlik Numarası (11 haneli)
 *                 example: "10000000146"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 128
 *                 description: Şifre (en az 6 karakter)
 *                 example: "Password123!"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: İsim
 *                 example: "Ahmet"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Soyisim
 *                 example: "Yılmaz"
 *               role:
 *                 type: string
 *                 enum: [PATIENT, DOCTOR, ADMIN]
 *                 default: PATIENT
 *                 description: Kullanıcı rolü
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email adresi (opsiyonel)
 *                 example: "ahmet@example.com"
 *               phone:
 *                 type: string
 *                 pattern: '^05[0-9]{9}$'
 *                 description: Telefon numarası (opsiyonel)
 *                 example: "05551234567"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 description: Cinsiyet (opsiyonel)
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Doğum tarihi (opsiyonel)
 *     responses:
 *       201:
 *         description: Kayıt başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Kayıt başarılı"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token
 *       400:
 *         description: Geçersiz istek
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: TC Kimlik No veya email zaten kayıtlı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     description: TC Kimlik Numarası ve şifre ile sistem giriş yapar.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tcNo
 *               - password
 *             properties:
 *               tcNo:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 11
 *                 description: TC Kimlik Numarası
 *                 example: "10000000146"
 *               password:
 *                 type: string
 *                 description: Şifre
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Giriş başarılı"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token (Bearer token olarak kullanılır)
 *       401:
 *         description: TC Kimlik Numarası veya şifre hatalı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Geçersiz istek
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Mevcut kullanıcı bilgileri
 *     description: JWT token ile oturum açmış kullanıcının bilgilerini getirir.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Yetkisiz (token geçersiz veya eksik)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Şifre değiştirme
 *     description: Mevcut şifreyle doğrulama yapıp yeni şifre belirler.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mevcut şifre
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Yeni şifre (en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter)
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};''"\\|,.<>\\/ ?]).{8,}$'
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Mevcut şifre hatalı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Yeni şifre gereksinimleri karşılamıyor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Şifremi unuttum
 *     description: TC Kimlik Numarası ile şifre sıfırlama token'ı gönderir.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tcNo
 *             properties:
 *               tcNo:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 11
 *                 description: TC Kimlik Numarası
 *                 example: "10000000146"
 *     responses:
 *       200:
 *         description: Şifre sıfırlama işlemi başlatıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Eğer bu TC Kimlik Numarası kayıtlıysa, şifre sıfırlama bilgileri gönderilecektir"
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Şifre sıfırlama token'ı (sadece development modunda)
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Şifre sıfırlama
 *     description: Şifremi unuttum token'ı ile yeni şifre belirler.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Şifre sıfırlama token'ı
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Yeni şifre
 *     responses:
 *       200:
 *         description: Şifre başarıyla sıfırlandı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Geçersiz token veya zayıf şifre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/request-verification:
 *   post:
 *     summary: Email doğrulama talebi
 *     description: Email adresine doğrulama linki gönderir.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email doğrulama linki gönderildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email adresi bulunamadı veya zaten doğrulanmış
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/request-verification', authenticate, requestEmailVerification);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Email doğrulama
 *     description: Email doğrulama token'ı ile email adresini doğrular.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email doğrulama token'ı
 *     responses:
 *       200:
 *         description: Email başarıyla doğrulandı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Geçersiz veya süresi geçmiş token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-email', verifyEmail);

export default router;
