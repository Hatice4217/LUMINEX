// Validation Utils - New Functions Tests
import { describe, test, expect } from '@jest/globals';
import {
  validateTurkishName,
  validateDateOfBirth,
  validateAddress,
  validateWebsite,
  normalizeTC,
  normalizePhone,
  normalizeEmail,
  validateSpecialty,
  validateHospitalName,
  validateGender,
  validateDateRange,
} from '../../src/utils/validation-utils.js';

describe('Validation Utils - New Functions', () => {
  describe('validateTurkishName', () => {
    test('Geçerli Türkçe isim kabul etmeli', () => {
      const result = validateTurkishName('Ahmet');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('Türkçe karakterli isim kabul etmeli', () => {
      const result = validateTurkishName('Çiğdem');
      expect(result.valid).toBe(true);
    });

    test('İsim nokta ve tire içerebilmeli', () => {
      const result = validateTurkishName('Ahmet-Mehmet');
      expect(result.valid).toBe(true);
    });

    test('Kısa isim reddetmeli', () => {
      const result = validateTurkishName('A');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('en az');
    });

    test('Çok uzun isim reddetmeli', () => {
      const result = validateTurkishName('A'.repeat(51));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('en fazla');
    });

    test('Rakam içeren isim reddetmeli', () => {
      const result = validateTurkishName('Ahmet123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('harf');
    });

    test('Boş isim reddetmeli', () => {
      const result = validateTurkishName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('gereklidir');
    });
  });

  describe('validateDateOfBirth', () => {
    test('Geçerli doğum tarihi kabul etmeli', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 25);
      const result = validateDateOfBirth(pastDate);
      expect(result.valid).toBe(true);
      expect(result.age).toBe(25);
    });

    test('18 yaşından küçük için uyarı vermeli', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 15);
      const result = validateDateOfBirth(pastDate);
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.error).toContain('veli izni');
    });

    test('Gelecek tarih reddetmeli', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = validateDateOfBirth(futureDate);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('gelecek');
    });

    test('Çok eski tarih reddetmeli', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 200);
      const result = validateDateOfBirth(oldDate);
      expect(result.valid).toBe(false);
    });

    test('Geçersiz format reddetmeli', () => {
      const result = validateDateOfBirth('invalid-date');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format');
    });
  });

  describe('validateAddress', () => {
    test('Geçerli adres kabul etmeli', () => {
      const result = validateAddress('Atatürk Mahallesi, İstanbul Caddesi No:123');
      expect(result.valid).toBe(true);
    });

    test('Kısa adres reddetmeli', () => {
      const result = validateAddress('ABC');
      expect(result.valid).toBe(false);
    });

    test('XSS içeren adres reddetmeli', () => {
      const result = validateAddress('<script>alert("hack")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Geçersiz');
    });
  });

  describe('validateWebsite', () => {
    test('Geçerli URL kabul etmeli', () => {
      const result = validateWebsite('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('https://example.com');
    });

    test('https olmayan URL normalize etmeli', () => {
      const result = validateWebsite('example.com');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('https://example.com');
    });

    test('Geçersiz URL reddetmeli', () => {
      const result = validateWebsite('not-a-url');
      expect(result.valid).toBe(false);
    });
  });

  describe('normalizeTC', () => {
    test('Boşlukları kaldırmalı', () => {
      const result = normalizeTC('123 456 789 01');
      expect(result).toBe('12345678901');
    });

    test('Tireleri kaldırmalı', () => {
      const result = normalizeTC('123-456-789-01');
      expect(result).toBe('12345678901');
    });

    test('Karışık boşluk ve tireleri kaldırmalı', () => {
      const result = normalizeTC('123 456-789 01');
      expect(result).toBe('12345678901');
    });
  });

  describe('normalizePhone', () => {
    test('+90 formatını 0 ile değiştirmeli', () => {
      const result = normalizePhone('+905551234567');
      expect(result).toBe('05551234567');
    });

    test('90 ile başlayan formatı düzeltmeli', () => {
      const result = normalizePhone('905551234567');
      expect(result).toBe('05551234567');
    });

    test('Parantez ve tireleri kaldırmalı', () => {
      const result = normalizePhone('0555-123-45-67');
      expect(result).toBe('05551234567');
    });

    test('Boşlukları kaldırmalı', () => {
      const result = normalizePhone('0555 123 45 67');
      expect(result).toBe('05551234567');
    });
  });

  describe('normalizeEmail', () => {
    test('Lowercase yapmalı ve trim etmeli', () => {
      const result = normalizeEmail('  TEST@EXAMPLE.COM  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('validateSpecialty', () => {
    test('Geçerli uzmanlık kabul etmeli', () => {
      const result = validateSpecialty('Kardiyoloji');
      expect(result.valid).toBe(true);
    });

    test('Çoklu uzmanlık kabul etmeli', () => {
      const result = validateSpecialty('Kardiyoloji, Dahiliye');
      expect(result.valid).toBe(true);
    });

    test('Kısa uzmanlık reddetmeli', () => {
      const result = validateSpecialty('Ab');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateHospitalName', () => {
    test('Geçerli hastane adı kabul etmeli', () => {
      const result = validateHospitalName('Şehir Hastanesi');
      expect(result.valid).toBe(true);
    });

    test('Kısa hastane adı reddetmeli', () => {
      const result = validateHospitalName('AB');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGender', () => {
    test('MALE kabul etmeli', () => {
      const result = validateGender('MALE');
      expect(result.valid).toBe(true);
    });

    test('Türkçe ERKEK normalize etmeli', () => {
      const result = validateGender('ERKEK');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('MALE');
    });

    test('KADIN normalize etmeli', () => {
      const result = validateGender('KADIN');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('FEMALE');
    });

    test('Geçersiz cinsiyet reddetmeli', () => {
      const result = validateGender('INVALID');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    test('Geçerli tarih aralığı kabul etmeli', () => {
      const start = '2025-01-01';
      const end = '2025-01-31';
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(true);
    });

    test('Başlangıç bitişten sonra olmamalı', () => {
      const start = '2025-01-31';
      const end = '2025-01-01';
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sonra');
    });

    test('Çok geniş aralık reddetmeli', () => {
      const start = '2025-01-01';
      const end = '2026-01-02'; // 367 gün
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('365');
    });
  });
});
