// Error Handler Middleware
import logger from '../utils/logger.js';

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Hata logla
  logger.error('Error caught:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Prisma hataları
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Bu kayıt zaten mevcut',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Kayıt bulunamadı',
    });
  }

  // Validation hataları
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: err.errors,
    });
  }

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token süresi doldu',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    path: req.url,
  });
};
