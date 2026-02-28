// Encryption Service - AES-256-GCM ile veri şifreleme
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Encryption key - Environment variable'dan al
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ALGORITHM = 'aes-256-gcm';

/**
 * Encryption key'in doğruluğunu kontrol et
 */
function validateKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for encryption');
  }

  // Key'in 32 byte (256 bit) olması gerekiyor
  let key = Buffer.from(ENCRYPTION_KEY, 'hex');

  if (key.length !== KEY_LENGTH) {
    // Eğer key hex değilse, UTF-8'den çevir ve 32 byte'a pad et
    key = Buffer.from(ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').substring(0, KEY_LENGTH), 'utf-8');
  }

  return key;
}

/**
 * Metni şifrele
 * @param {string} text - Şifrelenecek metin
 * @returns {string} - Şifrelenmiş veri (base64: iv + authTag + encrypted)
 */
export function encrypt(text) {
  try {
    if (!text) {
      return null;
    }

    const key = validateKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Auth tag'i al
    const authTag = cipher.getAuthTag();

    // Format: iv (hex) + authTag (hex) + encrypted (hex)
    // Hepsi birleştirip base64 olarak return et
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Şifrelenmiş metni çöz
 * @param {string} encryptedText - Şifrelenmiş veri (base64)
 * @returns {string} - Çözülmüş metin
 */
export function decrypt(encryptedText) {
  try {
    if (!encryptedText) {
      return null;
    }

    const key = validateKey();

    // Base64'den decode et
    const combined = Buffer.from(encryptedText, 'base64');

    // Parçalara ayır
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH).toString('hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    // Hata durumunda null return et (uyumluluk için)
    return null;
  }
}

/**
 * Database field'ı şifrele
 * @param {string} field - Field adı
 * @param {string} value - Şifrelenecek değer
 * @returns {string} - Şifrelenmiş değer
 */
export function encryptField(field, value) {
  if (!value) {
    return value;
  }

  try {
    return encrypt(value);
  } catch (error) {
    logger.error(`Error encrypting field ${field}:`, error);
    // Şifreleme başarısız olursa ham değeri return et (fail-safe)
    return value;
  }
}

/**
 * Database field'ı çöz
 * @param {string} field - Field adı
 * @param {string} encryptedValue - Şifrelenmiş değer
 * @returns {string} - Çözülmüş değer
 */
export function decryptField(field, encryptedValue) {
  if (!encryptedValue) {
    return encryptedValue;
  }

  try {
    const decrypted = decrypt(encryptedValue);

    // Eğer decryption başarısız olursa, ham değeri return et
    // Bu, eski verilerle uyumluluk için
    return decrypted || encryptedValue;
  } catch (error) {
    logger.error(`Error decrypting field ${field}:`, error);
    // Hata durumunda ham değeri return et (fail-safe)
    return encryptedValue;
  }
}

/**
 * Birden fazla field'ı şifrele
 * @param {Object} data - Şifrelenecek veri objesi
 * @param {string[]} fields - Şifrelenecek field listesi
 * @returns {Object} - Şifrelenmiş veri objesi
 */
export function encryptFields(data, fields = []) {
  const encryptedData = { ...data };

  for (const field of fields) {
    if (encryptedData[field]) {
      encryptedData[`${field}Encrypted`] = encryptField(field, encryptedData[field]);
      // Orijinal field'ı sil (opsiyonel - her iki field'ı da tutmak için comment out edebilirsiniz)
      // delete encryptedData[field];
    }
  }

  return encryptedData;
}

/**
 * Birden fazla field'ı çöz
 * @param {Object} data - Çözülecek veri objesi
 * @param {string[]} fields - Çözülecek field listesi
 * @returns {Object} - Çözülmüş veri objesi
 */
export function decryptFields(data, fields = []) {
  const decryptedData = { ...data };

  for (const field of fields) {
    const encryptedField = `${field}Encrypted`;
    if (decryptedData[encryptedField]) {
      decryptedData[field] = decryptField(field, decryptedData[encryptedField]);
      // Şifrelenmiş field'ı sil (opsiyonel)
      // delete decryptedData[encryptedField];
    }
  }

  return decryptedData;
}

/**
 * Şifrelenmiş değer olup olmadığını kontrol et
 * @param {string} value - Kontrol edilecek değer
 * @returns {boolean}
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Base64 formatında mı kontrol et
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(value)) {
    return false;
  }

  // Decode edip uzunluk kontrolü yap
  try {
    const decoded = Buffer.from(value, 'base64');
    // Minimum uzunluk: IV (16) + AuthTag (16) + En az 1 byte encrypted
    return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Hash oluşturma (password hash için değil, encryption key için)
 * @param {string} text - Hash'lenecek metin
 * @returns {string} - Hex formatında hash
 */
export function createHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Rastgele encryption key oluştur (development için)
 * Production'da environment variable kullanın
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Validation - Encryption key'in geçerli olup olmadığını kontrol et
 */
export function isEncryptionConfigured() {
  try {
    validateKey();
    return true;
  } catch {
    return false;
  }
}

export default {
  encrypt,
  decrypt,
  encryptField,
  decryptField,
  encryptFields,
  decryptFields,
  isEncrypted,
  createHash,
  generateEncryptionKey,
  isEncryptionConfigured,
  ALGORITHM,
  KEY_LENGTH,
};
