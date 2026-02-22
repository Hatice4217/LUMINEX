// IP Blacklist Middleware
import logger from '../utils/logger.js';

// In-memory blacklist (production'da Redis kullanılmalı)
const ipBlacklist = new Set();
const ipAttempts = new Map(); // IP -> { count, lastAttempt, lockedUntil }

// Şüpheli aktivite eşiği
const SUSPICIOUS_THRESHOLD = 10;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 saat

/**
 * IP'yi kara listeye ekle
 */
export const addToBlacklist = (ip, reason = 'Suspicious activity') => {
  ipBlacklist.add(ip);
  logger.warn('IP Added to blacklist', { ip, reason });

  setTimeout(() => {
    ipBlacklist.delete(ip);
    logger.info('IP Removed from blacklist', { ip });
  }, 24 * 60 * 60 * 1000); // 24 saat sonra kaldır
};

/**
 * IP'yi kontrol et
 */
export const checkIPBlacklist = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Kara listede kontrolü
  if (ipBlacklist.has(ip)) {
    logger.warn('Blocked request from blacklisted IP', {
      ip,
      url: req.url,
      userAgent: req.get('user-agent'),
    });

    return res.status(403).json({
      success: false,
      message: 'Erişiminiz engellendi. Lütfen daha sonra tekrar deneyin.',
    });
  }

  // Şüpheli aktivite kontrolü
  const attempts = ipAttempts.get(ip);

  if (attempts && attempts.count >= SUSPICIOUS_THRESHOLD) {
    const now = Date.now();

    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);

      return res.status(429).json({
        success: false,
        message: `Çok fazla başarısız deneme. Lütfen ${remainingMinutes} dakika sonra tekrar deneyin.`,
      });
    } else if (attempts.lockedUntil && now >= attempts.lockedUntil) {
      // Lockout süresi bitti, sıfırla
      ipAttempts.delete(ip);
    }
  }

  next();
};

/**
 * Başarısız denemeleri kaydet
 */
export const recordFailedAttempt = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const current = ipAttempts.get(ip) || { count: 0, lastAttempt: 0 };

  current.count++;
  current.lastAttempt = Date.now();

  // Eşik aşıldıysa kilitle
  if (current.count >= SUSPICIOUS_THRESHOLD) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION;
    addToBlacklist(ip, 'Too many failed attempts');
  }

  ipAttempts.set(ip, current);
};

/**
 * Başarılı işlemi kaydet (sayaç sıfırla)
 */
export const recordSuccessAttempt = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  ipAttempts.delete(ip);
};

/**
 * Şüpheli pattern kontrolü
 */
export const checkSuspiciousPattern = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script>/i,  // XSS attempt
    /union.*select/i,  // SQL injection
    /drop table/i,  // SQL injection
    /eval\(/i,  // Code injection
    /exec\(/i,  // Command injection
  ];

  const url = req.url;
  const body = JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      logger.error('Suspicious pattern detected', {
        ip: req.ip,
        url,
        pattern: pattern.toString(),
        method: req.method,
      });

      addToBlacklist(req.ip, 'Malicious pattern detected');

      return res.status(403).json({
        success: false,
        message: 'Güvenlik ihlali tespit edildi',
      });
    }
  }

  next();
};

/**
 * Rate limiting by IP (daha agresif)
 */
export const createIPRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 dakika
    maxRequests = 20, // Dakikada max 20 istek
    skipSuccessfulRequests = false,
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Eski kayıtları temizle
    for (const [key, value] of requests.entries()) {
      if (now - value.timestamp > windowMs) {
        requests.delete(key);
      }
    }

    // IP'nin isteklerini al
    const key = `${ip}-${Math.floor(now / windowMs)}`;
    const record = requests.get(key) || { count: 0, timestamp: now };

    record.count++;
    requests.set(key, record);

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip,
        count: record.count,
        max: maxRequests,
      });

      return res.status(429).json({
        success: false,
        message: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.',
      });
    }

    // Rate limit header'ları ekle
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};
