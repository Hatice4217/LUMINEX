// Authentication Middleware
import { getUserFromToken } from '../utils/jwt-utils.js';
import logger from '../utils/logger.js';

/**
 * JWT ile doğrulama middleware'i
 */
export const authenticate = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme token\'ı bulunamadı',
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' kısmını çıkar

    // Token'ı doğrula
    const decoded = getUserFromToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token',
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      tcNo: decoded.tcNo,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası',
    });
  }
};

// Alias for backward compatibility
export const authMiddleware = authenticate;

/**
 * Rol bazlı yetkilendirme middleware'i
 * @param {...String} roles - İzin verilen roller
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Önce giriş yapmalısınız',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok',
      });
    }

    next();
  };
};

/**
 * İsteğin sahibi olma kontrolü (kendi verilerini düzenleme)
 * @param {String} paramUserId - URL parametresindeki kullanıcı ID'si
 */
export const isOwner = (paramUserId = 'userId') => {
  return (req, res, next) => {
    const requestedUserId = req.params[paramUserId];

    // Admin her şeyi yapabilir
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Kendi verilerine erişim kontrolü
    if (req.user.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kaynağa erişim yetkiniz yok',
      });
    }

    next();
  };
};
