// LUMINEX Backend - Environment Variables

# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (Production'da güçlü bir secret kullanın)
# ⚠️ LÜTFEN BURAYI DEĞİŞTİR - Aşağıdaki komutu çalıştırın:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=luminex_jwt_secret_key_2026_change_in_production
JWT_EXPIRE=7d

# License Secret (Lisanslama için)
# ⚠️ LÜTFEN BURAYI DEĞİŞTİR - Aşağıdaki komutu çalıştırın:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
LICENSE_SECRET=luminex_license_secret_2026_change_in_production

# CORS
FRONTEND_URL=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption (Şifreleme için - şifrelemeli veriler)
# ⚠️ LÜTFEN BURAYI DEĞİŞTİR - 32 karakter rastgele string kullanın:
ENCRYPTION_KEY=luminex_encryption_key_32_chars_long

# API Keys (Opsiyonel - harici servisler için)
# SENDGRID_API_KEY=your_key_here
# TWILIO_ACCOUNT_SID=your_sid_here
# TWILIO_AUTH_TOKEN=your_token_here
