# 🚀 LUMINEX - DEPLOYMENT REHBERİ

## 📋 ÖNCELİK SİPARAŞ

### Gerekli Hesaplar (Ücretsiz)
| Platform | Kullanım | Link |
|----------|---------|------|
| **GitHub** | Kod hosting | https://github.com/new |
| **Render** | Backend + DB | https://dashboard.render.com/register |
| **Vercel** | Frontend | https://vercel.com/signup |

---

## 🔰 ADIM ADIM DEPLOYMENT

### Adım 1: GitHub Repository Oluştur

1. **GitHub hesabına giriş yap** (https://github.com)
2. **Yeni repository oluştur:**
   - Repository name: `luminex-health`
   - Description: LUMINEX Sağlık Yönetim Sistemi
   - Public seç (ücretsiz plan için)
   - "Initialize README" işaretini kaldır (mevcut README'miz var)

3. **Kodu GitHub'a push et:**

```bash
# Proje klasörüne git
cd C:\Users\Hatice\LUMINEX

# Git'i başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "feat: Production-ready LUMINEX healthcare system

✅ Full-stack Node.js + Express backend
✅ Prisma ORM with PostgreSQL
✅ JWT authentication with bcrypt
✅ Rate limiting and IP blacklist
✅ CSP and security headers
✅ 2FA ready implementation
✅ Comprehensive API documentation

🔒 Security features:
- Multi-layer rate limiting
- IP blacklist and threat detection
- Audit logging
- Strong password policy
- CSRF protection
- Content Security Policy

🌐 Multi-language support (TR/EN)
🎨 Dark/Light theme
📱 Responsive design
🔔 Real-time notifications"

# GitHub remote URL'ini ekle (USERNAME yerine kendi GitHub kullanıcı adınızı)
git remote add origin https://github.com/USERNAME/luminex-health.git

# Main branch yap
git branch -M main

# Kodu GitHub'a push et
git push -u origin main
```

---

### Adım 2: Render - Backend API + PostgreSQL

1. **Render hesabı oluştur**
   - https://dashboard.render.com/register
   - GitHub ile giriş yap
   - Email doğrulaması yap

2. **PostgreSQL Database Oluştur**
   - Dashboard'da **"New"** → **"PostgreSQL"**
   - Database name: `luminex-db`
   - User: `luminex_user`
   - Password: (güvenli şifre generate et)
   - Region: **Frankfurt** (en yakın)
   - **Plan: Free** seç
   - **Create Database**

3. **Backend Web Service Oluştur**
   - Dashboard'da **"New"** → **"Web Service"**
   - **"Connect GitHub"** butonuna tıkla
   - GitHub reposunu görüp seçin
   - **"Connect"** de

   **Build Settings:**
   ```
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && node src/server.js
   ```

   **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<Render PostgreSQL bağlantısı otomatik>
   JWT_SECRET=<copy_scripts_output_from_earlier>
   SESSION_SECRET=<copy_scripts_output_from_earlier>
   ENCRYPTION_KEY=<copy_scripts_output_from_earlier>
   FRONTEND_URL=<deploy_edilen_frontend_url>
   ENABLE_2FA=true
   ENABLE_AUDIT_LOGGING=true
   ```

   **Advanced:**
   - Plan: **Free**
   - Region: **Frankfurt**

   - **"Deploy Web Service"** butonuna tıkla

4. **Deploy tamamlandığında URL'ı kopyala:**
   - Backend API URL: `https://luminex-backend.onrender.com` (veya benzeri)

---

### Adım 3: Vercel - Frontend

1. **Vercel hesabı oluştur**
   - https://vercel.com/signup
   - GitHub ile giriş yap

2. **New Project:**
   - **"Add New Project"**
   - **"Import Git Repository"**
   - GitHub reposunu seçin
   - **Root Directory:** `/`
   - **Framework Preset:** **Other**
   - **"Import"**

3. **Otomatik deploy başlar!**

4. **Deploy tamamlandığında URL'ı kopyala:**
   - Frontend URL: `https://luminex-app.vercel.app` (veya benzeri)

---

### Adım 4: Frontend API URL Güncelleme

Vercel deploy olduktan sonra frontend'in backend API'ye bağlanması için:

1. **Vercel Dashboard** → **Project** → **Settings**
2. **Environment Variables** sekmesine git
3. **Yeni Variable ekle:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://luminex-backend.onrender.com/api`
4. **Save** de
5. **Redeploy** de

---

### Adım 5: Test Etme

```bash
# Health check
curl https://luminex-backend.onrender.com/health

# Login test (Postman veya browser)
curl -X POST https://luminex-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tcNo":"10000000146","password":"admin123"}'
```

---

## 🎉 BAŞARI KONTROL

| Servis | URL | Durum |
|--------|-----|------|
| **Frontend** | `https://luminex-app.vercel.app` | ✅ Aktif |
| **Backend API** | `https://luminex-backend.onrender.com` | ✅ Aktif |
| **Health Check** | `https://luminex-backend.onrender.com/health` | ✅ Test et |

---

## 💰 TOPLAM MALİYET: **0 TL**

| Platform | Maliyet | Durum |
|----------|--------|-------|
| GitHub (Public Repo) | Ücretsiz | ✅ |
| Render (Backend + PostgreSQL) | Ücretsiz | ✅ |
| Vercel (Frontend) | Ücretsiz | ✅ |
| Let's Encrypt SSL | Ücretsiz | ✅ |
| **TOPLAM** | **0 TL** | 🎉 |

---

## 📱 Domain İsterseniz

Kendi domain'inizi bağlamak için:

### Backend (Render)
1. Render Dashboard → Web Service → Settings
2. "Custom Domain" sekmesi
3. Domain'inizi ekleyin
4. DNS ayarlarını Render'dan alın

### Frontend (Vercel)
1. Vercel Dashboard → Project → Settings → Domains
2. Domain'inizi ekleyin
3. DNS ayarlarını Vercel'den alın

---

## ✅ DEPLOYMENT SONRASI

Deploy tamamlandıktan sonra:

1. **Test et:**
   - Frontend'i açın
   - Giriş yapın (kayıtlı olduğunuz test hesabı ile)
   - Randevu oluşturun
   - Dashboard'ı kontrol edin

2. **Monitor et:**
   - Render dashboard'da logları inceleyin
   - Vercel dashboard'da deploy geçmişini kontrol edin

3. **Yedekle:**
   - Database yedeği almayı unutmayın
   - Kodları güncel tutun

---

## 🆘 SORUN YAŞARSANIZ

### Render deployment başarısız olursa:
- Build loglarını kontrol edin
- Environment variables'ı doğru girdiğinizden emin olun
- Database bağlantısını test edin

### Vercel deployment başarısız olursa:
- Domain ayarlarını kontrol edin
- Build loglarını inceleyin
- Repository ayarlarını kontrol edin

---

## 📞 YARDIM

Sorun yaşarsanız:
1. `DEPLOYMENT.md` dosyasını kontrol edin
2. Render dokümantasyonu: https://render.com/docs
3. Vercel dokümantasyonu: https://vercel.com/docs

---

**Deployment hazırlık tamamlandı!** 🚀

Şimdi GitHub'a push edip deploy edebilirsiniz!
