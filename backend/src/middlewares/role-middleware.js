// Role Middleware - Kullanıcı yetki kontrolü
import logger from '../utils/logger.js';

/**
 * Rol tabanlı erişim kontrolü middleware'i
 * @param {string[]} allowedRoles - İzin verilen roller
 */
export function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // Auth middleware'den gelen kullanıcı bilgisi
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Yetkilendirme gerekli',
        });
      }

      // Kullanıcının rolü kontrol et
      if (!user.role || !allowedRoles.includes(user.role)) {
        logger.warn('Unauthorized access attempt', {
          userId: user.id,
          userRole: user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          message: 'Bu işlem için yetkiniz yok',
        });
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Yetki kontrolü sırasında hata oluştu',
      });
    }
  };
}

/**
 * Admin rolü kontrolü
 */
export function adminMiddleware(req, res, next) {
  return roleMiddleware(['ADMIN'])(req, res, next);
}

/**
 * Doktor veya Admin rolü kontrolü
 */
export function doctorOrAdminMiddleware(req, res, next) {
  return roleMiddleware(['DOCTOR', 'ADMIN'])(req, res, next);
}

/**
 * Personel kontrolü (Doktor, Admin, veya Personel)
 */
export function staffMiddleware(req, res, next) {
  return roleMiddleware(['DOCTOR', 'ADMIN', 'STAFF'])(req, res, next);
}

export default {
  roleMiddleware,
  adminMiddleware,
  doctorOrAdminMiddleware,
  staffMiddleware,
};
