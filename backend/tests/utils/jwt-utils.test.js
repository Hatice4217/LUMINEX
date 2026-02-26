// JWT Utils Tests
import { describe, test, expect, beforeAll } from '@jest/globals';
import { generateToken, verifyToken, getUserFromToken } from '../../src/utils/jwt-utils.js';

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test-user-123',
    tcNo: '12345678901',
    role: 'PATIENT',
  };

  describe('generateToken', () => {
    test('Geçerli bir JWT token üretmeli', () => {
      const token = generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    test('Farklı payload\'larla farklı token üretmeli', () => {
      const token1 = generateToken({ userId: 'user1', role: 'PATIENT' });
      const token2 = generateToken({ userId: 'user2', role: 'DOCTOR' });

      expect(token1).not.toBe(token2);
    });

    test('Aynı payload ile aynı token üretmeli (deterministic)', () => {
      const token1 = generateToken(testPayload);
      const token2 = generateToken(testPayload);

      expect(token1).toBe(token2);
    });
  });

  describe('verifyToken', () => {
    test('Geçerli token\'ı doğru doğrulamalı', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.tcNo).toBe(testPayload.tcNo);
      expect(decoded.role).toBe(testPayload.role);
    });

    test('Geçersiz token ile hata fırlatmalı', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow('Geçersiz veya süresi dolmuş token');
    });

    test('Boş string ile hata fırlatmalı', () => {
      expect(() => {
        verifyToken('');
      }).toThrow();
    });

    test('Manipüle edilmiş token ile hata fırlatmalı', () => {
      const validToken = generateToken(testPayload);
      const manipulatedToken = validToken + 'tampered';

      expect(() => {
        verifyToken(manipulatedToken);
      }).toThrow();
    });
  });

  describe('getUserFromToken', () => {
    test('Geçerli token\'dan kullanıcı bilgilerini çıkarmalı', () => {
      const token = generateToken(testPayload);
      const user = getUserFromToken(token);

      expect(user).toBeDefined();
      expect(user.userId).toBe(testPayload.userId);
      expect(user.tcNo).toBe(testPayload.tcNo);
      expect(user.role).toBe(testPayload.role);
    });

    test('Geçersiz token için null dönmeli', () => {
      const user = getUserFromToken('invalid.token');
      expect(user).toBeNull();
    });

    test('Boş string için null dönmeli', () => {
      const user = getUserFromToken('');
      expect(user).toBeNull();
    });

    test('Null input için null dönmeli', () => {
      const user = getUserFromToken(null);
      expect(user).toBeNull();
    });

    test('Undefined input için null dönmeli', () => {
      const user = getUserFromToken(undefined);
      expect(user).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    test('Token içinde exp (expiration) claim\'i bulunmalı', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    test('Token içinde iat (issued at) claim\'i bulunmalı', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    test('Boş payload ile token üretebilmeli', () => {
      const token = generateToken({});
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded).toMatchObject({});
    });

    test('Nested object payload ile token üretebilmeli', () => {
      const complexPayload = {
        userId: '123',
        profile: {
          name: 'Test',
          preferences: { theme: 'dark' },
        },
      };

      const token = generateToken(complexPayload);
      const decoded = verifyToken(token);

      expect(decoded.profile).toBeDefined();
      expect(decoded.profile.preferences.theme).toBe('dark');
    });

    test('Array içeren payload ile token üretebilmeli', () => {
      const arrayPayload = {
        userId: '123',
        roles: ['PATIENT', 'DOCTOR'],
        permissions: ['read', 'write'],
      };

      const token = generateToken(arrayPayload);
      const decoded = verifyToken(token);

      expect(Array.isArray(decoded.roles)).toBe(true);
      expect(decoded.roles).toEqual(['PATIENT', 'DOCTOR']);
    });
  });
});
