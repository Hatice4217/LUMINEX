# LUMINEX Sağlık Yönetim Sistemi

LUMINEX, sağlık kurumları için geliştirilmiş kapsamlı bir web tabanlı yönetim platformudur. Bu sistem, küçük kliniklerin ve hastanelerin günlük operasyonlarını yönetmek için tasarlanmıştır.

## 📋 İçindekiler

- [Proje Genel Bakış](#proje-genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Kurulum](#kurulum)
- [Proje Yapısı](#proje-yapısı)
- [Özellikler](#özellikler)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Deployment](#deployment)
- [Test Hesapları](#test-hesapları)

## 🎯 Proje Genel Bakış

LUMINEX, sağlık profesyonellerinin yöneticilerin ihtiyaçlarını karşılamak üzere tasarlanmıştır. Aşağıdaki işlevleri sağlar:

- 👥 Kullanıcı yönetimi (Admin, Doktor, Hasta)
- 📅 Randevu planlama ve yönetimi
- 👨‍⚕️ Doktor müsaitlik ve profilleri
- 📋 Hasta sağlık geçmişi ve reçeteleri
- 🔬 Laboratuvar ve radyoloji raporları
- 📊 İdari raporlama ve departman yönetimi
- 🔔 Bildirim sistemi
- 🌍 Çoklu dil desteği (TR/EN)
- 🌙 Dark/Light tema

## 🛠 Teknoloji Stack

### Frontend
- **HTML5** - Sayfa yapısı
- **CSS3** - Stil ve tasarım
- **JavaScript (ES6+)** - Uygulama mantığı
- **SweetAlert2** - Bildirimler
- **localStorage** - İstemci tarafı veri saklama

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM
- **SQLite** - Geliştirme veritabanı
- **PostgreSQL** - Production veritabanı (önerilen)

### Güvenlik
- **JWT** - Authentication
- **bcryptjs** - Şifre hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

### Testing
- **Jest** - Unit testing
- **Supertest** - API testing

### CI/CD
- **GitHub Actions** - Continuous Integration

## 🚀 Kurulum

### Gereksinimler
- Node.js v18+ ve npm
- Git

### Adımlar

1. **Depoyu klonlayın:**
```bash
git clone https://github.com/username/LUMINEX.git
cd LUMINEX
```

2. **Backend bağımlılıklarını yükleyin:**
```bash
cd backend
npm install
```

3. **Environment variables'ı ayarlayın:**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyerek gerekli ayarları yapın.

4. **Veritabanını başlatın:**
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

5. **Backend server'ı başlatın:**
```bash
npm start
# veya development modunda
npm run dev
```

Backend API `http://localhost:3000` adresinde çalışacak.

6. **Frontend'i açın:**
```bash
# Yeni terminal penceresinde
cd ..
# http-server ile basit server
npm install -g http-server
http-server -p 8080
```

Frontend `http://localhost:8080` adresinde çalışacak.

## 📁 Proje Yapısı

```
LUMINEX/
├── backend/                 # Backend API
│   ├── prisma/             # Veritabanı şeması ve seed
│   ├── src/
│   │   ├── config/         # Konfigürasyon
│   │   ├── controllers/    # Business logic
│   │   ├── middlewares/    # Auth, validation, error
│   │   ├── routes/         # API endpoint'leri
│   │   ├── utils/          # Yardımcı fonksiyonlar
│   │   └── server.js       # Ana server dosyası
│   ├── tests/              # Test dosyaları
│   └── package.json
│
├── css/                    # Frontend stilleri
│   └── style.css
│
├── js/                     # Frontend JavaScript
│   ├── dashboard.js
│   ├── appointment.js
│   └── utils/              # Yardımcı fonksiyonlar
│
├── assets/                 # Resimler ve ikonlar
│
├── *.html                  # HTML sayfaları
│   ├── login.html          # Giriş sayfası
│   ├── dashboard.html      # Ana panel
│   ├── appointment.html    # Randevu sayfası
│   └── ...                 # Diğer sayfalar
│
├── .github/workflows/      # CI/CD pipeline'ları
│
└── README.md               # Bu dosya
```

## ✨ Özellikler

### Kimlik Doğrulama
- TC Kimlik No ile giriş
- JWT token tabanlı authentication
- Rol bazlı yetkilendirme (Admin/Doktor/Hasta)
- Şifre sıfırlama

### Randevu Yönetimi
- Randevu oluşturma ve görüntüleme
- Randevu iptali ve güncelleme
- Doktor müsaitlik yönetimi
- Otomatik bildirimler

### Kullanıcı Yönetimi
- Kullanıcı kaydı ve yönetimi
- Profil düzenleme
- Rol atama

### Diğer Özellikler
- Çoklu dil desteği
- Dark/Light tema geçişi
- Responsive tasarım
- Sağlık geçmişi takibi
- Reçete yönetimi
- Test sonucu görüntüleme

## 📚 API Dokümantasyonu

### Authentication

#### POST /api/auth/register
Yeni kullanıcı kaydı oluşturur.

**Request:**
```json
{
  "tcNo": "10000000146",
  "password": "password123",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "role": "PATIENT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kayıt başarılı",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Kullanıcı girişi yapar.

**Request:**
```json
{
  "tcNo": "10000000146",
  "password": "password123"
}
```

#### GET /api/auth/me
Mevcut kullanıcı bilgilerini getirir. (Authentication gerektirir)

### Randevular

#### GET /api/appointments
Kullanıcının randevularını listeler.

#### POST /api/appointments
Yeni randevu oluşturur.

**Request:**
```json
{
  "hospitalId": "hospital-id",
  "doctorId": "doctor-id",
  "appointmentDate": "2026-03-01T10:00:00Z",
  "symptoms": "Baş ağrısı"
}
```

### Kullanıcılar

#### GET /api/users
Tüm kullanıcıları listeler. (Admin only)

#### GET /api/users/:id
Kullanıcı detayını getirir.

Daha fazla endpoint için [backend/README.md](backend/README.md) dosyasına bakın.

## 🌐 Deployment

### Render (Ücretsiz - Önerilen)

1. GitHub'a kodunuzu push edin
2. [render.com](https://render.com)'a gidin
3. "New Web Service" oluşturun
4. GitHub reposunu bağlayın
5. Build Command: `npm install && cd backend && npm install`
6. Start Command: `cd backend && node src/server.js`
7. Environment variables'ı ekleyin
8. Deploy edin!

### Railway (Alternatif)

1. [railway.app](https://railway.app)'e gidin
2. New Project oluşturun
3. GitHub reposunu deploy edin
4. PostgreSQL ekle
5. Environment variables'ı ayarlayın

### Vercel (Frontend için)

1. [vercel.com](https://vercel.com)'a gidin
2. GitHub reposunu import edin
3. Build settings'ı ayarlayın
4. Deploy edin

## 👥 Test Hesapları

Seed sonrası oluşturulan test hesapları:

| Rol | TC Kimlik | Şifre |
|-----|-----------|-------|
| Admin | 10000000146 | admin123 |
| Doktor | 12345678901 | doctor123 |
| Hasta | 98765432109 | patient123 |

## 🔒 Güvenlik

- Şifreler bcryptjs ile hash'lenir
- JWT token'ları güvenli authentication için
- Rate limiting ile abuse koruması
- Helmet ile security headers
- Input validation ile XSS/SQL injection koruması
- CORS ile cross-origin koruması

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen:
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**LUMINEX** - Sağlık yönetimi hiç bu kadar kolay olmamıştı!
