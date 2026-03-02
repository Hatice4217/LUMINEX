+# LUMINEX Sağlık Yönetim Sistemi - Teknik Dokümantasyon

## 📋 İçindekiler
1. [Teknoloji Yığını](#teknoloji-yığını)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Güvenlik Önlemleri](#güvenlik-önlemleri)
4. [Veritabanı Yapısı](#veritabanı-yapısı)
5. [API Endpoints](#api-endpoints)
6. [Deployment](#deployment)

---

## 1. TEKNOLOJİ YINI (Tech Stack)

### Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| HTML5 | - | Sayfa yapısı |
| CSS3 | - | Stil ve tasarım |
| JavaScript (ES6+) | - | Frontend mantığı |
| SweetAlert2 | 11.x | Modal ve bildirimler |
| Font Awesome | 6.2.0 | İkonlar |
| Google Fonts | - | Poppins, Exo 2 fontları |
| Plausible Analytics | - | Gizlik odaklı analitik |

### Backend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| Node.js | 24.x | JavaScript runtime |
| Express.js | 4.21.2 | Web framework |
| Prisma ORM | 6.1.0 | Veritabanı yönetimi |
| PostgreSQL | - | Prodüksiyon veritabanı |
| SQLite | - | Geliştirme veritabanı |

### Güvenlik Kütüphaneleri
| Kütüphane | Versiyon | Güvenlik Türü |
|-----------|----------|---------------|
| jsonwebtoken | 9.0.2 | JWT Authentication |
| bcryptjs | 2.4.3 | Şifre hashleme |
| cors | 2.8.5 | Cross-origin kontrolü |
| helmet | 8.0.0 | Security headers |
| hpp | 0.2.3 | HTTP Parameter Pollution |
| xss-clean | 0.1.4 | XSS koruması |
| express-rate-limit | 7.5.0 | Rate limiting |
| express-validator | 7.2.1 | Input validation |

### Deployment
| Platform | Kullanım |
|----------|----------|
| Vercel | Frontend hosting |
| Render | Backend + PostgreSQL |
| GitHub | Kaynak kod deposu |

---

## 2. SİSTEM MİMARİSİ

### Dizin Yapısı
```
LUMINEX/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Veritabanı şeması
│   │   └── seed.js            # Başlangıç verileri
│   ├── src/
│   │   ├── config/            # Veritabanı konfigürasyonu
│   │   ├── controllers/       # İş mantığı
│   │   ├── middlewares/       # Güvenlik katmanı
│   │   ├── routes/            # API endpoint'leri
│   │   ├── utils/             # Yardımcı fonksiyonlar
│   │   └── server.js          # Ana sunucu dosyası
│   └── package.json
├── css/                       # Stil dosyaları
├── js/                        # Frontend JavaScript
├── *.html                     # Sayfalar
└── vercel.json                # Vercel konfigürasyonu
```

### Katmanlı Mimari

```
┌─────────────────────────────────────────┐
│          FRONTEND (Vercel)              │
│     HTML/CSS/JavaScript (ES6)           │
└──────────────┬──────────────────────────┘
               │ HTTPS/Fetch API
               ↓
┌─────────────────────────────────────────┐
│         SECURITY LAYER                  │
│  CORS → Helmet → Rate Limit → CSRF     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         BACKEND (Render)                │
│         Express.js + Node.js            │
├─────────────────────────────────────────┤
│  Authentication → Authorization         │
│  Validation → Business Logic            │
└──────────────┬──────────────────────────┘
               │ Prisma ORM
               ↓
┌─────────────────────────────────────────┐
│       PostgreSQL (Render)               │
│         Users, Appointments, ...        │
└─────────────────────────────────────────┘
```

---

## 3. GÜVENLİK ÖNLEMLERİ

### 3.1 Authentication (Kimlik Doğrulama)

#### JWT Tabanlı Authentication
```javascript
// Token yapısı
{
  userId: "uuid",
  tcNo: "12345678901",
  role: "PATIENT",
  iat: 1234567890,
  exp: 1234567890 + 7 gün
}
```

**Özellikler:**
- ✅ 7 gün geçerlilik süresi
- ✅ Authorization header ile gönderim
- ✅ Kullanıcı bilgileri token içinde
- ✅ Secret key ile imzalanma

### 3.2 Authorization (Yetkilendirme)

#### Role-Based Access Control (RBAC)
```
ADMIN    → Full system access
DOCTOR   → Doctor features + Patient view
PATIENT  → Own data only
```

**Middleware Kontrolü:**
```javascript
if (req.user.role !== 'ADMIN' && req.user.id !== resource.userId) {
  return 403 Forbidden;
}
```

### 3.3 Password Security

#### bcrypt Hashleme
- **Cost Factor:** 10
- **Algoritma:** Blowfish
- **Salt:** Her şifre için unique

#### Şifre Validasyon Kuralları
| Kural | Gereksinim |
|-------|------------|
| Minimum uzunluk | 8 karakter |
| Büyük harf | En az 1 |
| Küçük harf | En az 1 |
| Rakam | En az 1 |
| Özel karakter | En az 1 |
| Zayıf şifreler | YASAK |

### 3.4 CORS (Cross-Origin Resource Sharing)

**İzin Verilen Origin'ler:**
```javascript
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://luminex-app-seven.vercel.app',
  /.+\.vercel\.app$/  // Tüm Vercel domain'leri
];
```

### 3.5 CSRF Protection

**Origin Validation Middleware:**
```javascript
- Request origin kontrolü
- Referer header kontrolü
- Production'da aktif
- Development'da devre dışı
```

### 3.6 Rate Limiting

| Endpoint | Limit | Süre | Amaç |
|----------|-------|------|------|
| Genel API | 100 | 15 dk | Flood koruması |
| Login | 5 | 15 dk | Brute force koruması |
| Register | 3 | 1 saat | Spam kayıt koruması |

### 3.7 Input Validation

**express-validator ile:**
- ✅ TC Kimlik: 11 haneli, sadece rakam
- ✅ Email: Geçerli email formatı
- ✅ Telefon: Türkiye formatı
- ✅ Şifre: Güçlülük kuralları
- ✅ Tarih: ISO 8601 formatı

### 3.8 XSS Protection

**Korumalar:**
- ✅ Helmet XSS Protection header
- ✅ xss-clean middleware
- ✅ Content Security Policy
- ✅ HTML escaping
- ✅ DOM sanitization

### 3.9 SQL Injection Prevention

**Prisma ORM ile:**
```javascript
// Otomatik parametre binding
const user = await prisma.user.findUnique({
  where: { tcNo: userInput }  // Güvenli!
});
```

### 3.10 Security Headers (Helmet)

| Header | Değer | Amaç |
|--------|-------|------|
| X-Frame-Options | DENY | Clickjacking koruması |
| X-XSS-Protection | 1; mode=block | XSS koruması |
| X-Content-Type-Options | nosniff | MIME sniffing koruması |
| Strict-Transport-Security | max-age=31536000 | HTTPS zorunluluğu |
| Content-Security-Policy | Kendi politikası | XSS/sniffing koruması |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |

---

## 4. VERİTABANI YAPISI

### User Model
```prisma
model User {
  id           String    @id @default(uuid())
  tcNo         String    @unique
  email        String?   @unique
  password     String    // bcrypt hash
  firstName    String
  lastName     String
  role         UserRole  // ADMIN, DOCTOR, PATIENT
  gender       Gender?
  phone        String?
  dateOfBirth  DateTime?
  hospitalId   String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### İlişkisel Yapı
```
User ──┬──→ Appointments (1:N)
      ├──→ Notifications (1:N)
      ├──→ TestResults (1:N)
      ├──→ Prescriptions (1:N)
      ├──→ Reviews (1:N)
      └──→ Messages (1:N)
```

### Diğer Modeller
- **Hospital** - Hastane bilgileri
- **Department** - Departmanlar
- **Doctor** - Doktor profilleri
- **Appointment** - Randevular
- **Availability** - Doktor müsaitliği
- **Notification** - Bildirimler
- **TestResult** - Test sonuçları
- **Prescription** - Reçeteler
- **Review** - Değerlendirmeler
- **Message** - Mesajlaşma

---

## 5. API ENDPOINTS

### Auth Endpoints (`/api/auth`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/register` | Kullanıcı kaydı | ❌ |
| POST | `/login` | Kullanıcı girişi | ❌ |
| GET | `/me` | Mevcut kullanıcı bilgisi | ✅ |
| POST | `/change-password` | Şifre değiştirme | ✅ |
| POST | `/forgot-password` | Şifremi unuttum | ❌ |
| POST | `/reset-password` | Şifre sıfırlama | ❌ |

### User Endpoints (`/api/users`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Kullanıcı listesi | ✅ Admin |
| GET | `/:id` | Kullanıcı detayı | ✅ |
| PUT | `/:id` | Kullanıcı güncelleme | ✅ Owner/Admin |
| DELETE | `/:id` | Kullanıcı silme | ✅ Admin |

### Appointment Endpoints (`/api/appointments`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/` | Yeni randevu | ✅ Patient |
| GET | `/` | Randevu listesi | ✅ |
| GET | `/:id` | Randevu detayı | ✅ |
| PUT | `/:id` | Randevu güncelleme | ✅ Owner/Doctor |
| DELETE | `/:id` | Randevu iptal | ✅ Owner/Doctor |

### Doctor Endpoints (`/api/doctors`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Doktor listesi | ✅ |
| GET | `/:id` | Doktor detayı | ✅ |
| GET | `/:id/appointments` | Doktor randevuları | ✅ |
| PUT | `/:id/availability` | Müsaitlik ayarla | ✅ Doctor |

### Hospital Endpoints (`/api/hospitals`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Hastane listesi | ✅ |
| GET | `/:id` | Hastane detayı | ✅ |
| POST | `/` | Hastane ekleme | ✅ Admin |
| PUT | `/:id` | Hastane güncelleme | ✅ Admin |

### Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Bildirim listesi | ✅ |
| PUT | `/:id/read` | Okundu işaretle | ✅ |
| DELETE | `/:id` | Bildirim sil | ✅ |

---

## 6. DEPLOYMENT

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT
JWT_SECRET=minimum_32_character_secret_key
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=https://luminex-app-seven.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (Vercel)
- **URL:** https://luminex-app-seven.vercel.app
- **Type:** Static Site
- **Build:** Gerekli değil
- **Features:** CDN, Auto-scaling, SSL

### Backend (Render)
- **URL:** https://luminex-backend-8zyl.onrender.com
- **Type:** Node.js Service
- **Database:** PostgreSQL (Render)
- **Features:** Auto-deploy, Health checks

### Yerel Geliştirme

**Backend Başlatma:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm start
```

**Frontend Çalıştırma:**
- VS Code Live Server
- veya `python -m http.server 8080`
- veya `npx serve`

---

## GÜVENLİK ÖZETİ

| Güvenlik Katmanı | Durum |
|------------------|-------|
| Authentication | ✅ JWT + bcrypt |
| Authorization | ✅ RBAC |
| Password Security | ✅ Hash + Validation |
| CORS | ✅ Origin kontrolü |
| CSRF | ✅ Origin validation |
| Rate Limiting | ✅ Endpoint bazlı |
| Input Validation | ✅ express-validator |
| XSS Protection | ✅ Helmet + xss-clean |
| SQL Injection | ✅ Prisma ORM |
| Security Headers | ✅ Helmet |
| Audit Logging | ✅ Winston |

---

*Dokümantasyon Tarihi: 23 Şubat 2026*
*Versiyon: 1.0.0*
