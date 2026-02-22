# LUMINEX - Render Deployment Guide

## 🚀 Ücretsiz Deployment (Render)

### Önce Hazırlık

1. **GitHub Repository** (GitHub'da yeni repo oluştur)
   - https://github.com/new
   - Repository name: `luminex-backend`
   - Public repo seç (ücretsiz plan için)

2. **Kodu GitHub'a Push Et**
```bash
cd C:\Users\Hatice\LUMINEX
git init
git add .
git commit -m "feat: Production-ready LUMINEX healthcare system

- Full-stack Node.js + Express backend
- Prisma ORM with PostgreSQL support
- JWT authentication with bcrypt
- Rate limiting and IP blacklist
- CSP and security headers
- 2FA ready implementation
- Comprehensive API documentation"

# GitHub remote URL'ini ekle
git remote add origin https://github.com/USERNAME/luminex-backend.git
git branch -M main
git push -u origin main
```

---

## 📦 Render Deployment

### Backend API + PostgreSQL

1. **Render hesabı oluştur**
   - https://dashboard.render.com/register (ücretsiz)
   - GitHub hesabı ile giriş yap

2. **PostgreSQL Database Oluştur**
   - Dashboard'da "New" → "PostgreSQL"
   - İsim: `luminex-db`
   - Database: PostgreSQL
   - Region: Frankfurt (en yakın)
   - **Ücretsiz plan seç**
   - "Create Database"

3. **Backend Web Service Oluştur**
   - "New" → "Web Service"
   - GitHub reposunu bağla
   - Build Command:
   ```bash
   cd backend && npm install && npm run build
   ```
   - Start Command:
   ```bash
   cd backend && node src/server.js
   ```
   - Environment Variables (Secrets):
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<Render PostgreSQL bağlantı>
   JWT_SECRET=<64 karakterlik secret>
   SESSION_SECRET=<48 karakterlik secret>
   FRONTEND_URL=<Frontend URL>
   ENCRYPTION_KEY=<base64 key>
   ENABLE_2FA=true
   ENABLE_AUDIT_LOGGING=true
   ```
   - **"Advanced"** bölümünde:
     - Plan: **Free**
   - "Deploy Web Service"

---

## 🌐 Vercel Deployment (Frontend)

### Frontend Static Site

1. **Vercel hesabı oluştur**
   - https://vercel.com/signup (ücretsiz)
   - GitHub ile giriş yap

2. **New Project**
   - "Add New Project"
   - GitHub reposunu import et
   - Root Directory: `/` (tüm proje)
   - Framework Preset: **Other**
   - Build Command: (boş bırak)
   - Output Directory: (boş bırak)
   - "Deploy"

3. **Environment Variables** (Varsa)
   - `NEXT_PUBLIC_API_URL`: Backend API URL

---

## 🔧 Domain Bağlama (Opsiyonel)

### Kendi Domain'iniz Varsa

1. **Backend için (Render)**
   - Render dashboard → Web Service → Settings
   - "Custom Domain"
   - Domain'inizi girin
   - DNS ayarlarını Render'dan alın

2. **Frontend için (Vercel)**
   - Vercel dashboard → Project → Settings → Domains
   - Domain'inizi ekleyin
   - DNS ayarlarını Vercel'den alın

---

## ✅ Deployment Sonrası Kontrol Listesi

- [ ] Backend health check: `curl https://your-api.onrender.com/health`
- [ ] Frontend açılıyor mu
- [ ] Login çalışıyor mu
- [ ] Database bağlantısı aktif mi
- [ ] HTTPS aktif mi
- [ ] Rate limiting çalışıyor mu
- [ ] Logları kontrol et

---

## 🎉 Sonuç

**Backend URL:** `https://your-api.onrender.com`
**Frontend URL:** `https://your-app.vercel.app`

**Toplam Maliyet: 0 TL** 💰
