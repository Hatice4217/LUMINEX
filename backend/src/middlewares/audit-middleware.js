// Audit Logging Middleware
import logger from '../utils/logger.js';

/**
 * Güvenlik ilgili olayları loglayan middleware
 */
export const auditLogger = (req, res, next) => {
  // Sadece güvenlik kritik endpoint'leri logla
  const criticalEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/change-password',
    '/api/auth/reset-password',
    '/api/users',
    '/api/appointments',
  ];

  const isCriticalEndpoint = criticalEndpoints.some(endpoint =>
    req.path.startsWith(endpoint)
  );

  if (isCriticalEndpoint) {
    const originalSend = res.json;

    res.json = function(data) {
      // Response'u logla
      logger.info('API Call', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        success: data.success,
        statusCode: res.statusCode,
      });

      // Orijinal response'u gönder
      return originalSend.call(this, data);
    };
  }

  next();
};

/**
 * Güvenlik olaylarını loglayan fonksiyon
 * @param {string} eventType - Olay türü
 * @param {Object} data - Olay verileri
 */
export const logSecurityEvent = (eventType, data = {}) => {
  logger.warn('Security Event', {
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

/**
 * Başarısız login denemelerini logla
 */
export const logFailedLogin = (tcNo, ip, reason) => {
  logSecurityEvent('FAILED_LOGIN', {
    tcNo,
    ip,
    reason,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Şifre değiştirme işlemini logla
 */
export const logPasswordChange = (userId, ip) => {
  logger.info('Password Changed', {
    userId,
    ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Randevu oluşturma işlemini logla
 */
export const logAppointmentCreated = (appointmentId, patientId, doctorId, ip) => {
  logger.info('Appointment Created', {
    appointmentId,
    patientId,
    doctorId,
    ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Kullanıcı silme işlemini logla
 */
export const logUserDeleted = (deletedUserId, deletedBy, ip) => {
  logger.warn('User Deleted', {
    deletedUserId,
    deletedBy,
    ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Şüpheli aktiviteyi logla
 */
export const logSuspiciousActivity = (activityType, details) => {
  logger.error('Suspicious Activity', {
    activityType,
    details,
    timestamp: new Date().toISOString(),
  });
};
