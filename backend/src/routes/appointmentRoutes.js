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
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Yeni randevu oluştur
 *     description: Hasta veya admin olarak yeni randevu talebi oluşturur.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalId
 *               - doctorId
 *               - appointmentDate
 *             properties:
 *               hospitalId:
 *                 type: string
 *                 format: uuid
 *                 description: Hastane ID
 *                 example: "hospital-123"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: Doktor ID
 *                 example: "doctor-123"
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Bölüm ID (opsiyonel)
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Randevu tarihi ve saati
 *                 example: "2025-06-15T10:30:00Z"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Notlar (opsiyonel)
 *               symptoms:
 *                 type: string
 *                 maxLength: 500
 *                 description: Şikayetler (opsiyonel)
 *     responses:
 *       201:
 *         description: Randevu talebi başarıyla oluşturuldu
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
 *                   example: "Randevu talebi oluşturuldu"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointment:
 *                       $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Geçersiz istek veya tarih
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Yetkisiz (sadece hastalar randevu oluşturabilir)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authorize('PATIENT', 'ADMIN'), appointmentValidation, createAppointment);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Randevuları listele
 *     description: Kullanıcının rolüne göre randevuları listeler (hasta kendi randevularını, doktor atanan randevuları).
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED]
 *         description: Durum filtresi (opsiyonel)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlangıç tarihi (opsiyonel)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitiş tarihi (opsiyonel)
 *     responses:
 *       200:
 *         description: Randevular başarıyla listelendi
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
 *                     appointments:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Appointment'
 *                           - type: object
 *                             properties:
 *                               doctor:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                                   role:
 *                                     type: string
 *                               patient:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                               hospital:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   city:
 *                                     type: string
 */
router.get('/', getAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Randevu detayı
 *     description: Belirli bir randevunun detaylarını getirir.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Randevu ID
 *     responses:
 *       200:
 *         description: Randevu detayı başarıyla getirildi
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
 *                     appointment:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Appointment'
 *                         - type: object
 *                           properties:
 *                             doctor:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 firstName:
 *                                   type: string
 *                                 lastName:
 *                                   type: string
 *                                 role:
 *                                   type: string
 *                                 phone:
 *                                   type: string
 *                             patient:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 firstName:
 *                                   type: string
 *                                 lastName:
 *                                   type: string
 *                                 phone:
 *                                   type: string
 *                             hospital:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 address:
 *                                   type: string
 *                                 phone:
 *                                   type: string
 *       403:
 *         description: Bu randevuya erişim yetkiniz yok
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Randevu bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', idParamValidation, getAppointment);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Randevu güncelle
 *     description: Randevu durumunu, teşhisi veya notlarını günceller.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Randevu ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED]
 *                 description: Randevu durumu
 *               diagnosis:
 *                 type: string
 *                 description: Teşhis (sadece doktorlar)
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Notlar
 *     responses:
 *       200:
 *         description: Randevu başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Yetkisiz (sadece kendi randevularınızı güncelleyebilirsiniz)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Randevu bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', idParamValidation, updateAppointment);

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Randevu iptal
 *     description: Randevuyu iptal eder.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Randevu ID
 *     responses:
 *       200:
 *         description: Randevu başarıyla iptal edildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Randevu zaten iptal edilmiş veya tamamlanmış
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Bu randevuyu iptal etme yetkiniz yok
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Randevu bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', idParamValidation, cancelAppointment);

export default router;
