// Validation Middleware
import { body, validationResult, param } from 'express-validator';

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
 * Kayıt validasyon kuralları
 */
export const registerValidation = [
  body('tcNo')
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('TC Kimlik No 11 haneli olmalı')
    .isNumeric()
    .withMessage('TC Kimlik No sadece rakamlardan oluşmalı'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('İsim gereklidir')
    .isLength({ max: 50 })
    .withMessage('İsim en fazla 50 karakter olabilir'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Soyisim gereklidir')
    .isLength({ max: 50 })
    .withMessage('Soyisim en fazla 50 karakter olabilir'),
  body('role')
    .optional()
    .isIn(['PATIENT', 'DOCTOR', 'ADMIN'])
    .withMessage('Geçersiz kullanıcı rolü'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi girin'),
  handleValidationErrors,
];

/**
 * Giriş validasyon kuralları
 */
export const loginValidation = [
  body('tcNo')
    .trim()
    .notEmpty()
    .withMessage('TC Kimlik No gereklidir'),
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
    .withMessage('Hastane seçimi gereklidir'),
  body('doctorId')
    .trim()
    .notEmpty()
    .withMessage('Doktor seçimi gereklidir'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Geçerli bir tarih girin (YYYY-MM-DD formatında)'),
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
