// Validation Middleware Tests
import { describe, test, expect, beforeEach } from '@jest/globals';
import { registerValidation, loginValidation, appointmentValidation } from '../../src/middlewares/validation-middleware.js';

// Mock request/response/next
const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('Validation Middleware', () => {
  beforeEach(() => {
    mockNext.mockClear();
  });

  describe('registerValidation', () => {
    test('Geçerli kayıt verilerini geçirmeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'Password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        role: 'PATIENT',
        email: 'ahmet@example.com',
      });
      const res = mockRes();

      // Run all validations
      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('11 haneli olmayan TC No hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345', // Çok kısa
        password: 'Password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.success).toBe(false);
      expect(result.message).toBe('Doğrulama hatası');
    });

    test('Sayısal olmayan TC No hata vermeli', async () => {
      const req = mockReq({
        tcNo: '1234567890a', // Harf içeriyor
        password: 'Password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    test('6 karakterden kısa şifre hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: '12345', // 5 karakter
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
      const result = res.json.mock.calls[0][0];
      expect(result.errors.some(e => e.msg.includes('6 karakter'))).toBe(true);
    });

    test('Boş isim hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'Password123',
        firstName: '', // Boş
        lastName: 'Yılmaz',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('50 karakterden uzun isim hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'Password123',
        firstName: 'A'.repeat(51), // 51 karakter
        lastName: 'Yılmaz',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Geçersiz rol hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'Password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        role: 'INVALID_ROLE',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Geçersiz email formatı hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'Password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'not-an-email',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Geçerli roller: PATIENT, DOCTOR, ADMIN', async () => {
      const roles = ['PATIENT', 'DOCTOR', 'ADMIN'];

      for (const role of roles) {
        const req = mockReq({
          tcNo: '12345678901',
          password: 'Password123',
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          role,
        });
        const res = mockRes();

        for (const validation of registerValidation) {
          if (typeof validation === 'function') {
            await validation(req, res, mockNext);
          }
        }

        expect(res.status).not.toHaveBeenCalledWith(400);
      }
    });
  });

  describe('loginValidation', () => {
    test('Geçerli giriş verilerini geçirmeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: 'password123',
      });
      const res = mockRes();

      for (const validation of loginValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Boş TC No hata vermeli', async () => {
      const req = mockReq({
        tcNo: '',
        password: 'password123',
      });
      const res = mockRes();

      for (const validation of loginValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Boş şifre hata vermeli', async () => {
      const req = mockReq({
        tcNo: '12345678901',
        password: '',
      });
      const res = mockRes();

      for (const validation of loginValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('TC No yoksa hata vermeli', async () => {
      const req = mockReq({
        password: 'password123',
      });
      const res = mockRes();

      for (const validation of loginValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('appointmentValidation', () => {
    test('Geçerli randevu verilerini geçirmeli', async () => {
      const req = mockReq({
        hospitalId: 'hospital-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-03-15',
      });
      const res = mockRes();

      for (const validation of appointmentValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Boş hastane ID hata vermeli', async () => {
      const req = mockReq({
        hospitalId: '',
        doctorId: 'doctor-456',
        appointmentDate: '2025-03-15',
      });
      const res = mockRes();

      for (const validation of appointmentValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Boş doktor ID hata vermeli', async () => {
      const req = mockReq({
        hospitalId: 'hospital-123',
        doctorId: '',
        appointmentDate: '2025-03-15',
      });
      const res = mockRes();

      for (const validation of appointmentValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Geçersiz tarih formatı hata vermeli', async () => {
      const req = mockReq({
        hospitalId: 'hospital-123',
        doctorId: 'doctor-456',
        appointmentDate: '15-03-2025', // Yanlış format
      });
      const res = mockRes();

      for (const validation of appointmentValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('ISO8601 tarih formatı geçmeli', async () => {
      const validDates = [
        '2025-03-15',
        '2025-12-31',
        '2024-02-29',
      ];

      for (const date of validDates) {
        const req = mockReq({
          hospitalId: 'hospital-123',
          doctorId: 'doctor-456',
          appointmentDate: date,
        });
        const res = mockRes();

        for (const validation of appointmentValidation) {
          if (typeof validation === 'function') {
            await validation(req, res, mockNext);
          }
        }

        expect(res.status).not.toHaveBeenCalledWith(400);
      }
    });
  });

  describe('Error Response Format', () => {
    test('Doğrulama hatası formatı standart olmalı', async () => {
      const req = mockReq({
        tcNo: '123',
        password: 'abc',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      const result = res.json.mock.calls[0][0];

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'Doğrulama hatası');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors[0]).toHaveProperty('msg');
      expect(result.errors[0]).toHaveProperty('path');
    });

    test('Birden fazla hata olduğunda tüm hatalar dönmeli', async () => {
      const req = mockReq({
        tcNo: '123',
        password: 'abc',
        firstName: '',
        lastName: '',
      });
      const res = mockRes();

      for (const validation of registerValidation) {
        if (typeof validation === 'function') {
          await validation(req, res, mockNext);
        }
      }

      const result = res.json.mock.calls[0][0];

      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
