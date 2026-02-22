// LUMINEX Backend API - Main Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/error-middleware.js';
import { auditLogger } from './middlewares/audit-middleware.js';
import { validateOrigin, doubleSubmitCookie } from './middlewares/csrf-middleware.js';
import { checkIPBlacklist, checkSuspiciousPattern, createIPRateLimiter, recordFailedAttempt, recordSuccessAttempt } from './middlewares/ip-blacklist-middleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';

// Environment variables'ı yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy - Render gibi platformlar için gerekli
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Production için güvenli session secret
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Helmet - Security headers with CSP
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // Development'de kapalı
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS - Cross Origin Resource Sharing
app.use(cors({
  origin: isProduction
    ? [FRONTEND_URL] // Production'da sadece production domain
    : [FRONTEND_URL, 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-2FA-Token'],
}));

// Cookie parser
app.use(cookieParser());

// Session middleware (2FA ve CSRF için)
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'luminex.sid',
  cookie: {
    secure: isProduction, // Production'da HTTPS
    httpOnly: true,
    sameSite: 'strict',
    maxAge: isProduction ? 24 * 60 * 60 * 1000 : null, // Production'da 24 saat
  },
}));

// Body parser - JSON verisi için
app.use(express.json({ limit: '1mb' })); // Azaltıldı: 10mb -> 1mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// XSS Clean - XSS saldırılarına karşı
app.use(xssClean());

// HPP - HTTP Parameter Pollution attacks'a karşı
app.use(hpp());

// IP Blacklist ve Suspicious Pattern kontrolü
app.use(checkIPBlacklist);
app.use(checkSuspiciousPattern);

// ============================================
// RATE LIMITING - Katmanlı koruma
// ============================================

// Genel rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoint'leri için sıkı rate limiting (Brute Force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına max 5 giriş denemesi
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Kayıt için rate limiting
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına max 3 kayıt denemesi
  message: {
    success: false,
    message: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// IP bazlı rate limiting (daha agresif)
const ipRateLimiter = createIPRateLimiter({
  windowMs: 60 * 1000, // 1 dakika
  maxRequests: 30, // Dakikada max 30 istek
});

// Tüm API route'larına genel rate limiting
app.use('/api/', limiter);
app.use('/api/', ipRateLimiter);

// Auth endpoint'lerine özel rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);

// ============================================
// AUDIT LOGGING
// ============================================

app.use(auditLogger);

// ============================================
// CSRF PROTECTION
// ============================================

// CSRF token cookie (double submit pattern)
app.use(doubleSubmitCookie);

// ============================================
// REQUEST LOGGER (Development only)
// ============================================

if (!isProduction) {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'LUMINEX API çalışıyor!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    security: {
      csrfProtection: true,
      rateLimiting: true,
      ipBlacklist: true,
      twoFactorAuth: process.env.ENABLE_2FA === 'true',
      auditLogging: true,
    },
  };

  res.json(healthCheck);
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hospitals', hospitalRoutes);

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LUMINEX Sağlık Yönetim Sistemi API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    security: {
      csrfProtection: 'enabled',
      rateLimiting: 'enabled',
      ipBlacklist: 'enabled',
      twoFactorAuth: process.env.ENABLE_2FA === 'true',
      auditLogging: 'enabled',
    },
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      appointments: '/api/appointments',
      users: '/api/users',
      doctors: '/api/doctors',
      notifications: '/api/notifications',
      hospitals: '/api/hospitals',
    },
    documentation: 'Security: All endpoints protected with rate limiting and IP blacklist',
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler - son route olarak
app.use(notFoundHandler);

// Global error handler - en son route olarak
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  logger.info(`🚀 Server çalışıyor`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    security: {
      csrf: true,
      rateLimit: true,
      ipBlacklist: true,
      twoFactorAuth: process.env.ENABLE_2FA === 'true',
    },
  });
  console.log(`\n✅ LUMINEX Backend API başlatıldı!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} mode\n`);

  if (isProduction) {
    console.log('⚠️ PRODUCTION MODE - Güvenlik önlemleri aktif!');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received, shutting down gracefully');
  process.exit(0);
});

export default app;
