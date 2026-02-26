// Authentication Middleware Tests
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { authenticate, authorize, isOwner } from '../../src/middlewares/auth-middleware.js';
import { generateToken } from '../../src/utils/jwt-utils.js';

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    test('Geçerli Bearer token ile kullanıcı bilgilerini req.user eklemeli', () => {
      const payload = { userId: 'user-123', tcNo: '12345678901', role: 'PATIENT' };
      const token = generateToken(payload);
      mockReq.headers.authorization = `Bearer ${token}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(payload.userId);
      expect(mockReq.user.role).toBe(payload.role);
      expect(mockReq.user.tcNo).toBe(payload.tcNo);
    });

    test('Authorization header yoksa 401 dönmeli', () => {
      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Yetkilendirme token\'ı bulunamadı',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Bearer prefix olmadan 401 dönmeli', () => {
      mockReq.headers.authorization = 'invalid-format-token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Yetkilendirme token\'ı bulunamadı',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Geçersiz token ile 401 dönmeli', () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Boş Bearer token ile 401 dönmeli', () => {
      mockReq.headers.authorization = 'Bearer ';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Lowercase "bearer" ile çalışmamalı (case sensitive)', () => {
      const token = generateToken({ userId: '123', role: 'PATIENT' });
      mockReq.headers.authorization = `bearer ${token}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      mockReq.user = { userId: 'user-123', role: 'PATIENT', id: 'user-123' };
    });

    test('İzin verilen role sahipse next çağırmalı', () => {
      mockReq.user.role = 'DOCTOR';
      const middleware = authorize('DOCTOR', 'ADMIN');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('İzin verilen rollerden birine sahipse next çağırmalı', () => {
      mockReq.user.role = 'DOCTOR';
      const middleware = authorize('PATIENT', 'DOCTOR', 'ADMIN');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('İzin verilmeyen role sahipse 403 dönmeli', () => {
      mockReq.user.role = 'PATIENT';
      const middleware = authorize('DOCTOR', 'ADMIN');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bu işlem için yetkiniz yok',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('req.user yoksa 401 dönmeli', () => {
      mockReq.user = null;
      const middleware = authorize('ADMIN');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Önce giriş yapmalısınız',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Tek rol kontrolü yapabilmeli', () => {
      mockReq.user.role = 'ADMIN';
      const middleware = authorize('ADMIN');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('isOwner', () => {
    beforeEach(() => {
      mockReq.user = { userId: 'user-123', role: 'PATIENT', id: 'user-123' };
    });

    test('Admin her kaynağa erişebilmeli', () => {
      mockReq.user.role = 'ADMIN';
      mockReq.params.userId = 'different-user-456';
      const middleware = isOwner('userId');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('Kullanıcı kendi kaynaklarına erişebilmeli', () => {
      mockReq.user.id = 'user-123';
      mockReq.params.userId = 'user-123';
      const middleware = isOwner('userId');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('Kullanıcı başkasının kaynaklarına erişememeli', () => {
      mockReq.user.id = 'user-123';
      mockReq.user.role = 'PATIENT';
      mockReq.params.userId = 'different-user-456';
      const middleware = isOwner('userId');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bu kaynağa erişim yetkiniz yok',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Farklı param ismi ile çalışabilmeli', () => {
      mockReq.user.id = 'user-123';
      mockReq.params.profileId = 'user-123';
      const middleware = isOwner('profileId');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('Varsayılan olarak "userId" parametresini kontrol etmeli', () => {
      mockReq.user.id = 'user-123';
      mockReq.params.userId = 'user-123';
      const middleware = isOwner();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('Non-admin farklı ID ile erişememeli', () => {
      mockReq.user.role = 'DOCTOR';
      mockReq.user.id = 'doctor-123';
      mockReq.params.userId = 'patient-456';
      const middleware = isOwner('userId');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
