#!/usr/bin/env node
/**
 * LUMINEX - Production Secrets Generator
 * Bu script production için güvenli secrets oluşturur
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 LUMINEX Production Secrets Generator\n');

// Güvenli random string oluştur
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Güvenli sayısal secret oluştur
const generateNumericSecret = (length = 16) => {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Base64 encoded secret oluştur
const generateBase64Secret = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('base64');
};

// Secrets oluştur
const secrets = {
  JWT_SECRET: generateSecret(64), // 128 karakter hex
  JWT_REFRESH_SECRET: generateSecret(64),
  LICENSE_SECRET: generateSecret(48),
  ENCRYPTION_KEY: generateBase64Secret(32), // 32 bytes base64
  API_KEY: generateSecret(32),
  SESSION_SECRET: generateSecret(48),
  CSRF_SECRET: generateSecret(32),
  WEBHOOK_SECRET: generateSecret(32),
};

// .env.production dosyası oluştur
const envContent = `# LUMINEX Backend - Production Environment Variables
# ⚠️ BU DOSYA PRODUCTION İÇİNDİR - GİZLİ TUTUN!

# Server
NODE_ENV=production
PORT=3000

# Database (Production PostgreSQL)
# Format: postgresql://user:password@host:port/database
DATABASE_URL="postgresql://user:password@localhost:5432/luminex"

# JWT Secrets - YENİLENEN GÜVENLİ SECRETS
JWT_SECRET="${secrets.JWT_SECRET}"
JWT_REFRESH_SECRET="${secrets.JWT_REFRESH_SECRET}"
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# License Secret
LICENSE_SECRET="${secrets.LICENSE_SECRET}"

# Session Secret
SESSION_SECRET="${secrets.SESSION_SECRET}"

# CSRF Secret
CSRF_SECRET="${secrets.CSRF_SECRET}"

# Encryption (AES-256 için 32 byte key)
ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"

# API Keys (Opsiyonel)
# SENDGRID_API_KEY=your_production_key
# TWILIO_ACCOUNT_SID=your_production_sid
# TWILIO_AUTH_TOKEN=your_production_token

# CORS - Production frontend URL
FRONTEND_URL="https://yourdomain.com"

# Rate Limiting (Production values)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Monitoring (Opsiyonel)
# SENTRY_DSN=your_sentry_dsn
# DATADOG_API_KEY=your_datadog_key

# Feature Flags
ENABLE_2FA=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
`;

// .env.production dosyasını yaz
const envPath = path.join(__dirname, '.env.production');
fs.writeFileSync(envPath, envContent, { mode: 0o600 }); // Sadece owner okuyabilir/yazabilir

console.log('✅ .env.production dosyası oluşturuldu');
console.log('⚠️ BU DOSYA .gitignore\'DA OLUP GİTHUB\'A YÜKLENMEZ!\n');

// Security summary göster
console.log('🔐 Oluşturulan Secrets (kopyalayın güvenli yere):\n');
console.log('='.repeat(70));
Object.entries(secrets).forEach(([key, value]) => {
  const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
  console.log(`${key.padEnd(25)}: ${displayValue}`);
});
console.log('='.repeat(70));
console.log('\n⚠️ LÜTFEN BU SECRETLERİ GÜVENLİ YERDE SAKLAYIN:');
console.log('   - Password manager (1Password, Bitwarden, etc.)');
console.log('   - Environment variable management (AWS Secrets Manager, etc.)');
console.log('   - Her deployment için farklı secrets kullanın\n');

// .gitignore kontrolü
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
}

if (!gitignoreContent.includes('.env.production')) {
  console.log('✅ .gitignore güncellendi (.env.production eklendi)');

  const newGitignoreContent = gitignoreContent + '\n# Environment variables\n.env.production\n.env.local\n';

  fs.writeFileSync(gitignorePath, newGitignoreContent);
}

console.log('\n📋 Sonraki Adımlar:');
console.log('1. .env.production dosyasını kontrol edin');
console.log('2. Production veritabanı URL\'ini güncelleyin');
console.log('3. FRONTEND_URL\'u production domain\'inizle değiştirin');
console.log('4. Backend\'i restart edin');
console.log('5. Güvenli bir yerde secrets\'lerinizi yedekleyin\n');

console.log('✨ Tamamlandı! Production için güvenlik ayarları hazır.');
