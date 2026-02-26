// CSRF Middleware
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * CSRF Token oluştur
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Token doğrula
 */
export const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token eksik',
    });
  }

  const sessionToken = req.session?.csrfToken;

  if (!sessionToken || sessionToken !== token) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      url: req.url,
    });

    return res.status(403).json({
      success: false,
      message: 'Geçersiz CSRF token',
    });
  }

  next();
};

/**
 * CSRF Token endpoint'i
 */
export const getCSRFToken = (req, res) => {
  const token = generateCSRFToken();

  // Session'a token'ı kaydet (eğer varsa)
  if (req.session) {
    req.session.csrfToken = token;
  }

  res.json({
    success: true,
    data: { token },
  });
};

/**
 * State-changing işlemler için CSRF kontrolü
 * POST, PUT, DELETE, PATCH istekleri için
 */
export const csrfProtection = (req, res, next) => {
  // GET, HEAD, OPTIONS istekleri için kontrol gerekmez
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // CSRF token kontrolü
  validateCSRFToken(req, res, next);
};

/**
 * HTTP origin ve referrer kontrolü
 * CORS + CSRF ek koruması
 */
export const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://luminex-app-seven.vercel.app',
    'https://luminex-frontend.vercel.app',
    'https://luminex-app.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Vercel domain'lerini kabul et
  const isVercelOrigin = origin && /\.vercel\.app$/.test(origin);
  const isVercelReferer = referer && /vercel\.app/.test(referer);

  if (isVercelOrigin || isVercelReferer) {
    return next();
  }

  // Origin kontrolü
  if (origin && !allowedOrigins.includes(origin)) {
    logger.warn('Blocked request from invalid origin', {
      origin,
      ip: req.ip,
      url: req.url,
    });

    return res.status(403).json({
      success: false,
      message: 'İzin verilmeyen origin',
    });
  }

  // Referer kontrolü (origin yoksa)
  if (!origin && referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;

    if (!allowedOrigins.includes(refererOrigin)) {
      logger.warn('Blocked request from invalid referer', {
        referer,
        ip: req.ip,
        url: req.url,
      });

      return res.status(403).json({
        success: false,
        message: 'İzin verilmeyen referer',
      });
    }
  }

  next();
};

/**
 * Double Submit Cookie Pattern için CSRF token middleware
 */
export const doubleSubmitCookie = (req, res, next) => {
  const token = req.cookies['csrf-token'] || req.headers['x-csrf-token'];

  // Token yoksa oluştur ve cookie'e ekle
  if (!token) {
    const newToken = generateCSRFToken();
    res.cookie('csrf-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 saat
    });
    req.csrfToken = newToken;
  } else {
    req.csrfToken = token;
  }

  next();
};
