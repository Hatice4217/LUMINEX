// LUMINEX Backend API - Main Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/error-middleware.js';
import { auditLogger } from './middlewares/audit-middleware.js';
import { validateOrigin, getCSRFToken } from './middlewares/csrf-middleware.js';
import { swaggerSpec } from './config/swagger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';

// Environment variables'ı yükle
dotenv.config();

// Prisma Client - Global olarak kullan
const prisma = new PrismaClient();

// Global scope'a prisma'ı ata (diğer dosyalardan erişilebilsin)
global.prisma = prisma;

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Trust proxy - Render gibi platformlar için gerekli
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Helmet - Security headers with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ipify.org"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS - Cross Origin Resource Sharing
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://luminex-app-seven.vercel.app',
    'https://luminex-frontend.vercel.app',
    'https://luminex-app.vercel.app',
    /.+\.vercel\.app$/, // Tüm Vercel subdomain'lerine izin ver
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Body parser - JSON ve URL-encoded verileri parse etmek için
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (CSRF için gerekli)
app.use(cookieParser());

// Origin validation (Ek CSRF koruması) - Sadece production'da
if (process.env.NODE_ENV === 'production') {
  app.use(validateOrigin);
}

// XSS Clean - XSS saldırılarına karşı
app.use(xssClean());

// HPP - HTTP Parameter Pollution attacks'a karşı
app.use(hpp());

// Rate Limiting - API istek sınırlama
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
  skipSuccessfulRequests: false, // Başarılı istekleri de say
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

// Tüm API route'larına genel rate limiting
app.use('/api/', limiter);

// Auth endpoint'lerine özel rate limiting (Sadece production'da)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', registerLimiter);
}

// ============================================
// AUDIT LOGGING
// ============================================

app.use(auditLogger);

// ============================================
// REQUEST LOGGER
// ============================================

if (process.env.NODE_ENV === 'development') {
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
  res.json({
    success: true,
    message: 'LUMINEX API çalışıyor!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ============================================
// SWAGGER API DOCUMENTATION
// ============================================

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API dokümantasyonu
 *     description: Swagger UI ile interaktif API dokümantasyonu
 *     tags: [Documentation]
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'LUMINEX API Dokümantasyonu',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'tags',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
  },
}));

// Swagger JSON spec endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
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
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      appointments: '/api/appointments',
      users: '/api/users',
      doctors: '/api/doctors',
      notifications: '/api/notifications',
      hospitals: '/api/hospitals',
    },
    documentation: '/api-docs', // Swagger eklenebilir
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

async function startServer() {
  try {
    // Database bağlantısını test et
    await prisma.$connect();
    logger.info('✅ Database bağlantısı başarılı');

    // Production'da migration çalıştır (eğer gerekliyse)
    if (process.env.NODE_ENV === 'production') {
      // Prisma migrate deploy - sadece production'da
      logger.info('🔄 Production mode - database migration kontrolü');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Server çalışıyor`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
      console.log(`\n✅ LUMINEX Backend API başlatıldı!`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`📚 Docs: http://localhost:${PORT}/\n`);
    });
  } catch (error) {
    logger.error('❌ Server başlatma hatası:', error);
    console.error('Database bağlantı hatası:', error.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} signal received, shutting down gracefully`);

  try {
    // Prisma bağlantısını kapat
    await prisma.$disconnect();
    logger.info('✅ Database bağlantısı kapatıldı');
  } catch (error) {
    logger.error('❌ Database kapatma hatası:', error);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
