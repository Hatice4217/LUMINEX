# LUMINEX Backend API

LUMINEX Sağlık Yönetim Sistemi için Node.js + Express + Prisma backend API.

## 🚀 Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Environment variables'ları ayarla
`.env` dosyasını `.env.example` dosyasından kopyalayarak oluştur:
```bash
cp .env.example .env
```

### 3. Prisma'yı başlat
```bash
# Prisma client'ı oluştur
npm run prisma:generate

# Database'i oluştur
npm run prisma:migrate

# Seed data'yı yükle (test verileri)
npx prisma db seed
```

### 4. Server'ı başlat
```bash
# Development modu
npm run dev

# Production modu
npm start
```

Server `http://localhost:3000` adresinde çalışacak.

## 📚 API Endpoint'leri

### Authentication
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `GET /api/auth/me` - Mevcut kullanıcı
- `POST /api/auth/change-password` - Şifre değiştir
- `POST /api/auth/forgot-password` - Şifremi unuttum

### Randevular
- `GET /api/appointments` - Randevu listesi
- `POST /api/appointments` - Randevu oluştur
- `GET /api/appointments/:id` - Randevu detayı
- `PUT /api/appointments/:id` - Randevu güncelle
- `DELETE /api/appointments/:id` - Randevu iptal

### Kullanıcılar
- `GET /api/users` - Kullanıcı listesi (Admin)
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil

### Doktorlar
- `GET /api/doctors` - Doktor listesi
- `GET /api/doctors/:id` - Doktor detayı
- `POST /api/doctors/availability` - Müsaitlik ekle
- `GET /api/doctors/:doctorId/availability` - Müsaitlik listesi

### Bildirimlar
- `GET /api/notifications` - Bildirim listesi
- `PUT /api/notifications/:id/read` - Okundu işaretle
- `PUT /api/notifications/read-all` - Tümünü okundu işaretle

### Hastaneler
- `GET /api/hospitals` - Hastane listesi
- `POST /api/hospitals` - Hastane ekle (Admin)

## 🔒 Güvenlik

- JWT token authentication
- bcryptjs ile şifre hashing
- Helmet ile security headers
- Express rate limiting
- XSS koruması
- CORS yapılandırması
- Input validation

## 📝 Test Hesapları

Seed sonrası oluşan test hesapları:

| Rol | TC Kimlik | Şifre |
|-----|-----------|-------|
| Admin | 10000000146 | admin123 |
| Doktor | 12345678901 | doctor123 |
| Hasta | 98765432109 | patient123 |

## 🛠️ Scripts

| Script | Açıklama |
|--------|----------|
| `npm start` | Production'da çalıştır |
| `npm run dev` | Development'da çalıştır (nodemon) |
| `npm test` | Testleri çalıştır |
| `npm run prisma:generate` | Prisma client oluştur |
| `npm run prisma:migrate` | Database migration |
| `npm run prisma:studio` | Prisma Studio aç |

## 📂 Proje Yapısı

```
backend/
├── prisma/
│   ├── schema.prisma      # Database şeması
│   └── seed.js            # Seed data
├── src/
│   ├── config/
│   │   └── database.js    # Database bağlantısı
│   ├── controllers/       # Business logic
│   ├── middlewares/       # Auth, validation, error
│   ├── routes/           # API endpoint'leri
│   ├── utils/            # Yardımcı fonksiyonlar
│   └── server.js         # Ana server dosyası
├── .env                  # Environment variables
├── package.json
└── README.md
```

## 🌐 Deployment

### Render (Önerilen - Ücretsiz)

1. GitHub'a push et
2. Render.com'da "New Web Service" oluştur
3. GitHub reposunu bağla
4. Build Command: `npm install && cd backend && npm install`
5. Start Command: `cd backend && node src/server.js`
6. Environment variables'ı ekle
7. Deploy!

## 📄 Lisans

MIT
