// Validation Utils Tests
import {
  validateTC,
  validateEmail,
  validatePhone,
  validatePassword,
  validateAppointmentDate,
} from '../src/utils/validation-utils.js';

describe('Validation Utils', () => {
  describe('validateTC', () => {
    it('should validate correct TC numbers', () => {
      expect(validateTC('10000000146')).toBe(true);
      // Doğru TC Kimlik numaraları
      expect(validateTC('55900442860')).toBe(true);
      expect(validateTC('47282921838')).toBe(true);
    });

    it('should reject invalid TC numbers', () => {
      // Yanlış TC Kimlik numarası
      expect(validateTC('12345678901')).toBe(false);
      expect(validateTC('11111111111')).toBe(false);
      expect(validateTC('00000000000')).toBe(false);

      // Uzunluk hataları
      expect(validateTC('123')).toBe(false);
      expect(validateTC('123456789012')).toBe(false);

      // İlk hane 0 olamaz
      expect(validateTC('01234567890')).toBe(false);

      // Boş değerler
      expect(validateTC('')).toBe(false);
      expect(validateTC(null)).toBe(false);
      expect(validateTC(undefined)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct Turkish phone numbers', () => {
      expect(validatePhone('05551234567')).toBe(true);
      expect(validatePhone('5 551 234 56 78')).toBe(true);
      expect(validatePhone('0555 123 45 67')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123456789')).toBe(false);
      expect(validatePhone('0555123456')).toBe(false); // 10 haneli
      expect(validatePhone('055512345678')).toBe(false); // 12 haneli
    });
  });

  describe('validatePassword', () => {
    it('should validate correct passwords', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Şifre en az 6 karakter olmalı');
    });

    it('should reject very long passwords', () => {
      const result = validatePassword('a'.repeat(130));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Şifre en fazla 128 karakter olabilir');
    });
  });

  describe('validateAppointmentDate', () => {
    it('should validate future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(validateAppointmentDate(tomorrow.toISOString().split('T')[0])).toBe(true);
    });

    it('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(validateAppointmentDate(yesterday.toISOString().split('T')[0])).toBe(false);
    });

    it('should reject very far future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      expect(validateAppointmentDate(futureDate.toISOString().split('T')[0])).toBe(false);
    });
  });
});
