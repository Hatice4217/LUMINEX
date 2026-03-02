# LUMINEX Sağlık Yönetim Sistemi
## Teknik Dokümantasyon & Güvenlik Analizi

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Sistem Mimarisi](#sistem-mimarisi)
4. [Veritabanı Yapısı](#veritabanı-yapısı)
5. [Güvenlik Önlemleri](#güvenlik-önlemleri)
6. [API Endpoints](#api-endpoints)
7. [Frontend Yapısı](#frontend-yapısı)
8. [Deployment](#deployment)
9. [Uyumluluk ve Standartlar](#uyumluluk-ve-standartlar)

---

## 1. Genel Bakış

LUMINEX, tam kapsamlı bir sağlık yönetim sistemidir. Üç farklı kullanıcı rolü (Hasta, Doktor, Yönetici) için özelleştirilmiş arayüzler sunar.

### Temel Özellikler
- Çoklu rol tabanlı erişim kontrolü (RBAC)
- Online randevu sistemi
- Test sonucu ve reçete yönetimi
- Doktor-hasta mesajlaşma sistemi
- Değerlendirme ve puanlama sistemi
- Gerçek zamanlı bildirimler
- Sağlık geçmişi takibi

---

## 2. Kullanılan Teknolojiler

### 2.1 Backend Teknolojileri

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Node.js** | Runtime | Backend sunucu çalıştırma ortamı |
| **Express.js** | ^4.21.2 | Web framework |
| **Prisma ORM** | ^6.1.0 | Veritabanı yönetimi ve migrations |
| **PostgreSQL** | - | Üretim veritabanı |
| **SQLite** | - | Geliştirme veritabanı (opsiyonel) |

#### Backend Dependencies
```json
{
  "@prisma/client": "^6.1.0",      // ORM client
  "bcryptjs": "^2.4.3",             // Şifre hashleme
  "cookie-parser": "^1.4.7",        // Cookie işleme
  "cors": "^2.8.5",                 // Cross-origin resource sharing
  "dotenv": "^16.4.7",              // Environment değişkenleri
  "express": "^4.21.2",             // Web framework
  "express-rate-limit": "^7.5.0",   // Rate limiting
  "express-session": "^1.19.0",     // Session yönetimi
  "express-validator": "^7.2.1",    // Input validation
  "helmet": "^8.0.0",               // Security headers
  "hpp": "^0.2.3",                  // HTTP Parameter Pollution koruması
  "jsonwebtoken": "^9.0.2",         // JWT authentication
  "winston": "^3.17.0",             // Logging
  "xss-clean": "^0.1.4"             // XSS koruması
}
```

### 2.2 Frontend Teknolojileri

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **HTML5** | - | Semantik markup |
| **CSS3** | - | Stil ve responsive tasarım |
| **Vanilla JavaScript** | ES6+ | Frontend logic (framework yok) |
| **SweetAlert2** | ^11.26.18 | Modal dialog'lar |
| **http-server** | ^14.1.1 | Static file server |

### 2.3 Geliştirme Araçları

| Araç | Versiyon | Amaç |
|------|----------|------|
| **Nodemon** | ^3.1.9 | Hot reload during development |
| **Jest** | ^29.7.0 | Unit testing |
| **Supertest** | ^7.0.0 | API testing |
| **Playwright** | ^1.49.1 | E2E testing |
| **Prisma Studio** | ^6.1.0 | Database GUI |

---

## 3. Sistem Mimarisi

### 3.1 Katman Yapısı

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  (HTML5, CSS3, Vanilla JS) - Port: 8080                    │
│  - Static pages served by http-server                       │
│  - SweetAlert2 for modals                                   │
│  - Dark mode support                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Helmet.js (Security Headers)                        │   │
│  │ CORS (Cross-Origin Control)                         │   │
│  │ Rate Limiting (Brute Force Protection)               │   │
│  │ CSRF Protection (Double Submit Cookie)              │   │
│  │ XSS Clean (XSS Attack Prevention)                   │   │
│  │ HPP (HTTP Parameter Pollution Protection)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express)                    │
│  (Node.js + Express.js) - Port: 3000                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Routes:                                             │   │
│  │  /api/auth          - Authentication                │   │
│  │  /api/appointments  - Appointment management        │   │
│  │  /api/users         - User management               │   │
│  │  /api/doctors       - Doctor operations             │   │
│  │  /api/notifications - Notification system           │   │
│  │  /api/hospitals     - Hospital management           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Controllers                                         │   │
│  │  - authController                                   │   │
│  │  - appointmentController                            │   │
│  │  - userController                                   │   │
│  │  - doctorController                                 │   │
│  │  - notificationController                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Middlewares                                         │   │
│  │  - authenticate (JWT verification)                  │   │
│  │  - authorize (Role-based access)                    │   │
│  │  - isOwner (Resource ownership check)               │   │
│  │  - validation (Input sanitization)                  │   │
│  │  - auditLogger (Security event logging)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRISMA ORM LAYER                          │
│  - Type-safe database access                                │
│  - Automatic migrations                                     │
│  - Query building                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                               │
│  PostgreSQL (Production) / SQLite (Development)             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 İletişim Akışı

```
Client Browser
      │
      ├─ HTTP Request (with JWT Token)
      │
      ▼
Security Middleware Stack
      │
      ├─ Helmet Headers Check
      ├─ CORS Validation
      ├─ CSRF Token Validation (POST/PUT/DELETE)
      ├─ Rate Limit Check
      ├─ XSS Clean
      └─ HPP Protection
      │
      ▼
Authentication Middleware
      │
      ├─ JWT Token Verification
      ├─ User Role Extraction
      └─ Permission Check
      │
      ▼
Route Handler
      │
      ├─ Input Validation (express-validator)
      ├─ Business Logic Execution
      └─ Audit Logging
      │
      ▼
Database Query (Prisma)
      │
      ▼
Response
      │
      ▼
Client Browser
```

---

## 4. Veritabanı Yapısı

### 4.1 Veritabanı Modelleri

#### User Model (Kullanıcı)
```prisma
model User {
  id                String        @id @default(uuid())
  tcNo              String        @unique           // TC Kimlik No
  email             String?                         // E-posta
  password          String                          // Hash edilmiş şifre
  firstName         String                          // Ad
  lastName          String                          // Soyad
  role              UserRole                        // PATIENT, DOCTOR, ADMIN
  gender            Gender?                         // MALE, FEMALE, OTHER
  phone             String?                         // Telefon
  dateOfBirth       DateTime?                       // Doğum tarihi
  hospitalId        String?                         // Hastane ID (doktorlar için)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // İlişkiler
  appointments      Appointment[]  @relation("PatientAppointments")
  doctorAppointments Appointment[]  @relation("DoctorAppointments")
  notifications     Notification[]
  testResults       TestResult[]
  prescriptions     Prescription[]
  // ... daha fazla ilişki
}
```

#### Appointment Model (Randevu)
```prisma
model Appointment {
  id              String            @id @default(uuid())
  patientId       String
  doctorId        String
  hospitalId      String
  departmentId    String?
  appointmentDate DateTime
  status          AppointmentStatus @default(PENDING)
  notes           String?
  symptoms        String?
  diagnosis       String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  patient         User              @relation("PatientAppointments",
                                              fields: [patientId],
                                              references: [id],
                                              onDelete: Cascade)
  doctor          User              @relation("DoctorAppointments",
                                              fields: [doctorId],
                                              references: [id],
                                              onDelete: Cascade)
  hospital        Hospital          @relation(fields: [hospitalId],
                                              references: [id],
                                              onDelete: Cascade)
}
```

### 4.2 Veritabanı İndeksleri

```prisma
// User model indeksleri
@@index([tcNo])        // TC Kimlik No sorguları için
@@index([email])       // Email lookup için
@@index([role])        // Role bazlı filtreleme için

// Appointment model indeksleri
@@index([patientId])   // Hasta randevuları için
@@index([doctorId])    // Doktor randevuları için
@@index([appointmentDate]) // Tarih bazlı sorgular için
@@index([status])      // Durum filtreleri için
```

### 4.3 Veri İlişkileri ve Cascade Silme

```prisma
// Cascade delete örnekleri
onDelete: Cascade  // İlişkili kayıtları otomatik siler
onDelete: SetNull  // İlişkili kayıtları NULL yapar
```

---

## 5. GÜVENLİK ÖNLEMLERİ

### 5.1 OWASP Top 10 Korumaları

#### A. Injection Attacks (SQL Injection)
- **Koruma Yöntemi**: Prisma ORM kullanımı
- **Açıklama**: Parametreli sorgular ile SQL injection önlenir
- **Konum**: `backend/prisma/schema.prisma`

```javascript
// Güvenli - Prisma ORM
const user = await prisma.user.findUnique({
  where: { tcNo: inputTcNo }
});

// ❌ Güvensiz - Kullanılmıyor
// const user = await prisma.$queryRaw(
//   `SELECT * FROM User WHERE tcNo = '${inputTcNo}'`
// );
```

#### B. Broken Authentication
- **JWT Token Authentication**
- **Şifre Hashleme**: bcryptjs (salt rounds: 10)
- **Session Yönetimi**: express-session
- **Konum**: `backend/src/utils/jwt-utils.js`

```javascript
// JWT Token oluşturma
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE, // 7 gün
  });
};

// Şifre hashleme
const hashedPassword = await bcrypt.hash(password, 10);
```

#### C. XSS (Cross-Site Scripting)
- **Koruma Yöntemi**: xss-clean middleware
- **Content Security Policy**: Helmet.js CSP headers
- **Konum**: `backend/src/server.js:101`

```javascript
// XSS Clean middleware
app.use(xssClean());

// CSP directives
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    // ...
  }
}
```

#### D. CSRF (Cross-Site Request Forgery)
- **Koruma Yöntemi**: Double Submit Cookie Pattern
- **Token Uzunluğu**: 32 bytes (256-bit)
- **Konum**: `backend/src/middlewares/csrf-middleware.js`

```javascript
// CSRF Token oluşturma
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Double Submit Cookie Pattern
export const doubleSubmitCookie = (req, res, next) => {
  const token = req.cookies['csrf-token'] || req.headers['x-csrf-token'];

  if (!token) {
    const newToken = generateCSRFToken();
    res.cookie('csrf-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 saat
    });
    req.csrfToken = newToken;
  }
  next();
};
```

#### E. Security Misconfiguration
- **Helmet.js**: Güvenlik header'ları
- **Environment Variables**: Hassas veriler .env dosyasında
- **Konum**: `backend/src/server.js:45-72`

```javascript
app.use(helmet({
  contentSecurityPolicy: { /* ... */ },
  hsts: {
    maxAge: 31536000,           // 1 yıl
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,                // MIME type sniffing kapat
  xssFilter: true,              // XSS filtresi
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

#### F. Sensitive Data Exposure
- **Şifreler**: bcryptjs ile hash'lenir (plaintext asla saklanmaz)
- **TLS/SSL**: Production'da zorunlu
- **Encryption**: AES-GCM 256-bit (localStorage için)

```javascript
// Frontend encryption - js/utils/crypto-utils.js
export async function encryptData(text, key) {
  // PBKDF2 key derivation
  const cryptoKey = await crypto.subtle.deriveKey({
    name: 'PBKDF2',
    salt: salt,
    iterations: 100000,
    hash: 'SHA-256'
  }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

  // AES-GCM encryption
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    encoder.encode(text)
  );
}
```

### 5.2 Rate Limiting (Hız Sınırlama)

| Endpoint | Limit | Pencere | Amaç |
|----------|-------|---------|------|
| `/api/*` | 100 | 15 dakika | Genel API koruması |
| `/api/auth/login` | 5 | 15 dakika | Brute force koruması |
| `/api/auth/register` | 3 | 1 saat | Spam kayıt koruması |

```javascript
// Auth endpoint'leri için sıkı rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 5,                     // IP başına max 5 giriş denemesi
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  skipSuccessfulRequests: false,
});
```

### 5.3 Input Validation (Girdi Doğrulama)

#### Backend Validation
```javascript
// express-validator kullanımı
export const registerValidation = [
  body('tcNo')
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('TC Kimlik No 11 haneli olmalı')
    .isNumeric()
    .withMessage('TC Kimlik No sadece rakamlardan oluşmalı'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  // ...
];
```

#### Frontend Validation
```javascript
// TC Kimlik No algoritma doğrulaması
export function validateTcKimlik(tc) {
  // 1. Format kontrolü
  if (!/^[1-9]\d{10}$/.test(tc)) return false;

  // 2. 10. hane kontrolü: (Tek x 7 - Çift) % 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenthDigit = ((oddSum * 7) - evenSum) % 10;

  // 3. 11. hane kontrolü: İlk 10 hane toplamı % 10
  const first10Sum = digits.slice(0, 10).reduce((sum, d) => sum + d, 0);
  const eleventhDigit = first10Sum % 10;

  return digits[9] === tenthDigit && digits[10] === eleventhDigit;
}
```

### 5.4 CORS Politikası

```javascript
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://luminex-app-seven.vercel.app',
    'https://luminex-frontend.vercel.app',
    /.+\.vercel\.app$/, // Tüm Vercel subdomain'leri
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
```

### 5.5 Role-Based Access Control (RBAC)

```javascript
// Rol bazlı yetkilendirme middleware
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

// Kullanım örneği
router.get('/admin/users', authenticate, authorize('ADMIN'), userController.getAllUsers);
```

### 5.6 Audit Logging (Denetim Günlüğü)

```javascript
// Güvenlik olayları loglama
export const logSecurityEvent = (eventType, data = {}) => {
  logger.warn('Security Event', {
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

// Loglanan olaylar:
// - FAILED_LOGIN: Başarısız giriş denemeleri
// - PASSWORD_CHANGED: Şifre değişiklikleri
// - USER_DELETED: Kullanıcı silme işlemleri
// - SUSPICIOUS_ACTIVITY: Şüpheli aktiviteler
```

### 5.7 Origin ve Referer Validation

```javascript
// Production'da origin kontrolü
export const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080',
    'https://luminex-app-seven.vercel.app',
    // ...
  ];

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Vercel domain'lerini kabul et
  const isVercelOrigin = origin && /\.vercel\.app$/.test(origin);

  if (!isVercelOrigin && origin && !allowedOrigins.includes(origin)) {
    logger.warn('Blocked request from invalid origin', { origin, ip: req.ip });
    return res.status(403).json({ message: 'İzin verilmeyen origin' });
  }

  next();
};
```

### 5.8 Güvenlik Header'ları

| Header | Değer | Amaç |
|--------|-------|------|
| Strict-Transport-Security | max-age=31536000 | HTTPS zorlama |
| X-Content-Type-Options | nosniff | MIME sniffing engelle |
| X-Frame-Options | DENY | Clickjacking koruması |
| X-XSS-Protection | 1; mode=block | XSS koruması |
| Content-Security-Policy | custom policy | XSS ve data injection koruması |
| Referrer-Policy | strict-origin-when-cross-origin | Referer bilgisi kontrolü |

---

## 6. API Endpoints

### 6.1 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/register` | Yeni kullanıcı kaydı | Hayır |
| POST | `/login` | Kullanıcı girişi | Hayır |
| GET | `/me` | Mevcut kullanıcı bilgisi | Evet |
| POST | `/change-password` | Şifre değiştirme | Evet |
| POST | `/forgot-password` | Şifre unuttum | Hayır |
| POST | `/reset-password` | Şifre sıfırlama | Hayır |

### 6.2 Appointment Endpoints (`/api/appointments`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/` | Randevu oluştur | Evet (PATIENT) |
| GET | `/` | Randevu listesi | Evet |
| GET | `/:id` | Randevu detayı | Evet |
| PUT | `/:id` | Randevu güncelle | Evet |
| DELETE | `/:id` | Randevu iptal | Evet |
| GET | `/doctor/:doctorId` | Doktor randevuları | Evet (DOCTOR) |
| GET | `/patient/:patientId` | Hasta randevuları | Evet (PATIENT) |

### 6.3 User Endpoints (`/api/users`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Tüm kullanıcılar | Evet (ADMIN) |
| GET | `/stats` | Kullanıcı istatistikleri | Evet (ADMIN) |
| GET | `/:id` | Kullanıcı detayı | Evet |
| PUT | `/:id` | Kullanıcı güncelle | Evet |
| PUT | `/:id/role` | Rol değiştir | Evet (ADMIN) |
| DELETE | `/:id` | Kullanıcı sil | Evet (ADMIN) |

### 6.4 Doctor Endpoints (`/api/doctors`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Doktor listesi | Evet |
| GET | `/:id` | Doktor profili | Evet |
| GET | `/:id/reviews` | Doktor değerlendirmeleri | Evet |
| GET | `/:id/availability` | Müsaitlik durumu | Evet |
| POST | `/:id/availability` | Müsaitlik ekle | Evet (DOCTOR) |

### 6.5 Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Bildirim listesi | Evet |
| GET | `/unread` | Okunmamış bildirimler | Evet |
| PUT | `/:id/read` | Okundu işaretle | Evet |
| PUT | `/read-all` | Tümünü okundu işaretle | Evet |

### 6.6 Hospital Endpoints (`/api/hospitals`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Hastane listesi | Evet |
| GET | `/:id` | Hastane detayı | Evet |
| POST | `/` | Hastane ekle | Evet (ADMIN) |
| PUT | `/:id` | Hastane güncelle | Evet (ADMIN) |
| DELETE | `/:id` | Hastane sil | Evet (ADMIN) |

---

## 7. Frontend Yapısı

### 7.1 Sayfa Yapısı (50+ Sayfa)

#### Hasta Sayfaları
- `index.html` - Ana sayfa
- `login.html` - Giriş sayfası
- `register.html` - Kayıt sayfası
- `patient-dashboard.html` - Hasta paneli
- `appointment.html` - Randevu oluştur
- `my-appointments.html` - Randevularım
- `test-results.html` - Test sonuçları
- `prescriptions.html` - Reçeteler
- `health-history.html` - Sağlık geçmişi

#### Doktor Sayfaları
- `doctor-dashboard.html` - Doktor paneli
- `doctor-appointments.html` - Randevu yönetimi
- `doctor-profile.html` - Profil yönetimi
- `doctor-availability.html` - Müsaitlik ayarı
- `doctor-reviews.html` - Değerlendirmeler
- `doctor-messages.html` - Mesajlaşma

#### Yönetici Sayfaları
- `admin-dashboard.html` - Yönetici paneli
- `admin-users.html` - Kullanıcı yönetimi
- `admin-reports.html` - Raporlar
- `admin-departments.html` - Departman yönetimi
- `admin-hospitals.html` - Hastane yönetimi

### 7.2 JavaScript Modülleri

```
js/
├── config/
│   └── api-config.js           # API URL yapılandırması
├── utils/
│   ├── crypto-utils.js         # AES-GCM şifreleme
│   ├── validation-utils.js     # TC Kimlik, email validasyonu
│   ├── storage-utils.js        # localStorage yönetimi
│   ├── header-manager.js       # Header yönetimi
│   └── logger.js               # Frontend logging
├── admin-dashboard.js
├── appointment.js
├── dashboard.js
├── doctor-dashboard.js
├── register.js
├── login.js
├── user-session.js
├── notifications.js
└── ...
```

### 7.3 CSS Modülleri

```
css/
├── style.css                   # Ana stil dosyası
├── dark-mode.css              # Dark mode stilleri
├── landing.css                # Ana sayfa stilleri
├── payment.css                # Ödeme sayfası
├── kvkk-page.css              # KVKK sayfası
├── loading.css                # Yükleme animasyonları
└── custom-select.css          # Özel form elementleri
```

### 7.4 Frontend Güvenlik

#### API Request Wrapper
```javascript
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 durumunda token temizle
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }

  return response;
};
```

#### LocalStorage Encryption
```javascript
// Hassas veriler için AES-GCM şifreleme
const encrypted = await encryptData(tcKimlik, APP_SECRET);
localStorage.setItem('tcKimlik', encrypted);

// Deşifreleme
const decrypted = await decryptData(encrypted, APP_SECRET);
```

---

## 8. Deployment

### 8.1 Frontend Deployment (Vercel)

```json
{
  "rewrites": [
    { "source": "/dashboard/:match*", "destination": "/dashboard.html" },
    { "source": "/patient-dashboard", "destination": "/patient-dashboard.html" },
    { "source": "/doctor-dashboard", "destination": "/doctor-dashboard.html" },
    { "source": "/admin-dashboard", "destination": "/admin-dashboard.html" }
  ]
}
```

### 8.2 Backend Deployment (Render)

- **Platform**: Render.com
- **URL**: https://luminex-backend-8zyl.onrender.com
- **Database**: PostgreSQL (Render'da hosted)

### 8.3 Environment Variables

```env
# Backend .env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=minimum_32_characters_long_secret
FRONTEND_URL=http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENCRYPTION_KEY=32_character_encryption_key
NODE_ENV=production
```

---

## 9. Uyumluluk ve Standartlar

### 9.1 KVKK (Kişisel Verilerin Korunması Kanunu)

LUMINEX, Türkiye'nin veri koruma yasasına uygundur:

- ✅ Kişisel verilerin işlenmesi için açık rıza
- ✅ Veri minimizasyon ilkesi
- ✅ Şifrelenmiş veri saklama
- ✅ KVKK aydınlatma metni
- ✅ Veri sahiplerinin hakları (erişim, düzeltme, silme)

### 9.2 HIPAA Uyumluluğu (Health Insurance Portability and Accountability Act)

Sağlık verileri için alınan önlemler:

| Önlem | Uygulama |
|-------|----------|
| Access Control | Role-based access control |
| Audit Controls | Winston logger ile tüm işlemler loglanır |
| Integrity | AES-GCM şifreleme |
| Transmission Security | HTTPS/TLS zorunlu |
| Authentication | JWT + bcryptjs |

### 9.3 ISO 27001 Bilgi Güvenliği

Uygulanan güvenlik kontrolleri:

- ✅ A.9.1: Erişim kontrol politikası
- ✅ A.9.2: Kullanıcı erişim yönetimi
- ✅ A.9.3: Kullanıcı sorumlulukları
- ✅ A.12.4: Yedekleme
- ✅ A.14.1: Bilgi güvenliği olaylarının yönetimi

---

## 📊 Özet: Güvenlik Kontrol Listesi

| Güvenlik Önlemi | Durum | Konum |
|-----------------|-------|-------|
| SQL Injection Koruma | ✅ | Prisma ORM |
| XSS Koruma | ✅ | xss-clean + CSP |
| CSRF Koruma | ✅ | Double Submit Cookie |
| Rate Limiting | ✅ | express-rate-limit |
| JWT Authentication | ✅ | jsonwebtoken |
| Şifre Hashleme | ✅ | bcryptjs |
| CORS Policy | ✅ | cors middleware |
| Security Headers | ✅ | Helmet.js |
| Input Validation | ✅ | express-validator |
| Audit Logging | ✅ | Winston |
| HPP Koruma | ✅ | hpp middleware |
| Session Security | ✅ | express-session |
| Data Encryption | ✅ | AES-GCM 256-bit |
| RBAC | ✅ | authorize middleware |
| Origin Validation | ✅ | validateOrigin |
| HSTS | ✅ | Helmet HSTS |
| Clickjacking Koruma | ✅ | X-Frame-Options |
| MIME Sniffing Koruması | ✅ | X-Content-Type-Options |

---

## 📝 Versiyon Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 1.0.0 | 2025 | İlk release |
| 1.1.0 | 2025 | PostgreSQL geçişi |
| 1.2.0 | 2025 | Vercel + Render deployment |

---

## 👥 Geliştirici Ekibi

- **Proje**: LUMINEX Sağlık Yönetim Sistemi
- **Lisans**: MIT
- **Backend**: Node.js + Express + Prisma
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3

---

*Bu dokümantasyon LUMINEX projesinin teknik ve güvenlik özelliklerini kapsamlı bir şekilde açıklamaktadır.*
