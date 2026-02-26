// Validation Middleware
import { body, validationResult, param, query } from 'express-validator';
import {
  validatePhone,
  normalizePhone,
  normalizeEmail,
  normalizeTC,
  validateDateOfBirth,
  validateAddress,
  validateWebsite,
  validateSpecialty,
  validateHospitalName,
  validateGender,
  validateDateRange,
} from '../utils/validation-utils.js';

/**
 * Validation error handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Input sanitization middleware - Tüm string inputları trim eder
 */
export const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/**
 * Kayıt validasyon kuralları
 */
export const registerValidation = [
  body('tcNo')
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('TC Kimlik No 11 haneli olmalı')
    .isNumeric()
    .withMessage('TC Kimlik No sadece rakamlardan oluşmalı')
    .custom((value) => {
      const normalized = normalizeTC(value);
      if (normalized !== value) {
        throw new Error('TC Kimlik No boşluk veya tire içeremez');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı')
    .isLength({ max: 128 })
    .withMessage('Şifre en fazla 128 karakter olabilir'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('İsim gereklidir')
    .isLength({ min: 2, max: 50 })
    .withMessage('İsim 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZçğıöşüÇĞİÖŞÜı\.\-\s']+$/)
    .withMessage('İsim sadece harf, nokta, tire ve boşluk içerebilir'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Soyisim gereklidir')
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyisim 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZçğıöşüÇĞİÖŞÜı\.\-\s']+$/)
    .withMessage('Soyisim sadece harf, nokta, tire ve boşluk içerebilir'),
  body('role')
    .optional()
    .isIn(['PATIENT', 'DOCTOR', 'ADMIN'])
    .withMessage('Geçersiz kullanıcı rolü'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  body('phone')
    .optional()
    .customSanitizer((value) => {
      // Telefon numarasını normalize et (10 haneli -> 05XXXXXXXXX)
      return normalizePhone(value);
    })
    .custom((value) => {
      if (value && !validatePhone(value)) {
        throw new Error('Geçersiz telefon numarası formatı (05XX XXX XX XX)');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Geçersiz cinsiyet değeri'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Geçersiz doğum tarihi formatı'),
  handleValidationErrors,
];

/**
 * Giriş validasyon kuralları
 */
export const loginValidation = [
  body('tcNo')
    .trim()
    .notEmpty()
    .withMessage('TC Kimlik No gereklidir')
    .isLength({ min: 11, max: 11 })
    .withMessage('TC Kimlik No 11 haneli olmalı')
    .isNumeric()
    .withMessage('TC Kimlik No sadece rakamlardan oluşmalı'),
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
  handleValidationErrors,
];

/**
 * Randevu validasyon kuralları
 */
export const appointmentValidation = [
  body('hospitalId')
    .trim()
    .notEmpty()
    .withMessage('Hastane seçimi gereklidir')
    .isString()
    .withMessage('Hastane ID geçersiz'),
  body('doctorId')
    .trim()
    .notEmpty()
    .withMessage('Doktor seçimi gereklidir')
    .isString()
    .withMessage('Doktor ID geçersiz'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Geçerli bir tarih girin (YYYY-MM-DD formatında)'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notlar en fazla 500 karakter olabilir'),
  body('symptoms')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Şikayetler en fazla 500 karakter olabilir'),
  handleValidationErrors,
];

/**
 * ID param validasyonu
 */
export const idParamValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID parametresi gereklidir'),
  handleValidationErrors,
];

/**
 * Profil güncelleme validasyonu
 */
export const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('İsim 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZçğıöşüÇĞİÖŞÜı\.\-\s']+$/)
    .withMessage('İsim sadece harf, nokta, tire ve boşluk içerebilir'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyisim 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZçğıöşüÇĞİÖŞÜı\.\-\s']+$/)
    .withMessage('Soyisim sadece harf, nokta, tire ve boşluk içerebilir'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin')
    .normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validatePhone(value)) {
        throw new Error('Geçersiz telefon numarası formatı');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Geçersiz cinsiyet değeri'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Geçersiz doğum tarihi formatı'),
  handleValidationErrors,
];

/**
 * Şifre değiştirme validasyonu
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gereklidir'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Yeni şifre en az 8 karakter olmalı')
    .isLength({ max: 128 })
    .withMessage('Yeni şifre en fazla 128 karakter olabilir')
    .matches(/[A-Z]/)
    .withMessage('Yeni şifre en az bir büyük harf içermeli')
    .matches(/[a-z]/)
    .withMessage('Yeni şifre en az bir küçük harf içermeli')
    .matches(/[0-9]/)
    .withMessage('Yeni şifre en az bir rakam içermeli')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Yeni şifre en az bir özel karakter içermeli'),
  handleValidationErrors,
];

/**
 * Doktor profili güncelleme validasyonu
 */
export const doctorProfileUpdateValidation = [
  body('specialty')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Uzmanlık alanı 3-100 karakter arasında olmalı')
    .matches(/^[a-zA-ZçğıöşüÇĞİÖŞÜı\,\.\-\s]+$/)
    .withMessage('Uzmanlık alanı geçersiz karakterler içeriyor'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Deneyim 0-60 yıl arasında olmalı'),
  body('education')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Eğitim bilgisi en fazla 500 karakter olabilir'),
  body('about')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Hakkımda bilgisi en fazla 1000 karakter olabilir'),
  handleValidationErrors,
];

/**
 * Hastane validasyonu
 */
export const hospitalValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Hastane adı gereklidir')
    .isLength({ min: 3, max: 100 })
    .withMessage('Hastane adı 3-100 karakter arasında olmalı'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Şehir gereklidir')
    .isLength({ min: 2, max: 50 })
    .withMessage('Şehir 2-50 karakter arasında olmalı'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('İlçe en fazla 50 karakter olabilir'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Adres 10-500 karakter arasında olmalı'),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validatePhone(value)) {
        throw new Error('Geçersiz telefon numarası formatı');
      }
      return true;
    }),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Geçerli bir website URL girin'),
  handleValidationErrors,
];

/**
 * Tarih aralığı validasyonu (randevu arama için)
 */
export const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Başlangıç tarihi geçersiz format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Bitiş tarihi geçersiz format'),
  handleValidationErrors,
];

/**
 * Arama validasyonu
 */
export const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arama terimi 2-100 karakter arasında olmalı'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sayfa numarası 1 veya daha büyük olmalı'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalı'),
  handleValidationErrors,
];

/**
 * Değerlendirme validasyonu
 */
export const reviewValidation = [
  body('appointmentId')
    .trim()
    .notEmpty()
    .withMessage('Randevu ID gereklidir'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Puan 1-5 arasında olmalı'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Yorum 10-500 karakter arasında olmalı'),
  handleValidationErrors,
];

/**
 * Mesaj validasyonu
 */
export const messageValidation = [
  body('receiverId')
    .trim()
    .notEmpty()
    .withMessage('Alıcı ID gereklidir'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Mesaj içeriği gereklidir')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Mesaj 1-1000 karakter arasında olmalı'),
  handleValidationErrors,
];
