// Encryption Middleware - Hassas field'ları otomatik şifrele/çöz
import { encryptField, decryptField, encryptFields, decryptFields, isEncrypted } from '../services/encryptionService.js';
import logger from '../utils/logger.js';

/**
 * Şifrelenecek field'ların konfigürasyonu
 * Her model için hangi field'ların şifreleneceğini belirler
 */
const ENCRYPTED_FIELDS_CONFIG = {
  User: ['tcNo', 'phone'],
  Appointment: ['notes', 'symptoms', 'diagnosis'],
  TestResult: ['results', 'notes'],
  Prescription: ['diagnosis', 'notes'],
  Review: ['comment'],
  Rating: ['comment'],
  Message: ['message'],
  Notification: ['message'],
  HealthRecord: ['description'],
  EmailLog: ['to', 'metadata'],
};

/**
 * Request body'deki hassas field'ları şifrele
 * Bu middleware, veritabanına kaydetmeden önce field'ları şifreler
 */
export function encryptRequestMiddleware(modelName) {
  return (req, res, next) => {
    try {
      if (!req.body || !ENCRYPTED_FIELDS_CONFIG[modelName]) {
        return next();
      }

      const fieldsToEncrypt = ENCRYPTED_FIELDS_CONFIG[modelName];
      const encryptedData = {};

      // Şifrelenecek field'ları işle
      for (const field of fieldsToEncrypt) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          // Şifrelenmiş field'ı ayrı olarak ekle
          encryptedData[`${field}Encrypted`] = encryptField(field, req.body[field]);

          // Orijinal field'ı koru (geriye dönük uyumluluk için)
          // İsterseniz silebilirsiniz: delete req.body[field];
        }
      }

      // Şifrelenmiş verileri request body'ye ekle
      req.body = { ...req.body, ...encryptedData };

      next();
    } catch (error) {
      logger.error('Encryption middleware error:', error);
      next();
    }
  };
}

/**
 * Response'daki hassas field'ları çöz
 * Bu middleware, veritabanından gelen şifrelenmiş field'ları çözer
 */
export function decryptResponseMiddleware(modelName) {
  return (req, res, next) => {
    // Original res.json fonksiyonunu override et
    const originalJson = res.json;

    res.json = function(data) {
      try {
        if (!data || !ENCRYPTED_FIELDS_CONFIG[modelName]) {
          return originalJson.call(this, data);
        }

        const fieldsToDecrypt = ENCRYPTED_FIELDS_CONFIG[modelName];
        let decryptedData = data;

        // Eğer data bir array ise
        if (Array.isArray(data)) {
          decryptedData = data.map(item => decryptObject(item, fieldsToDecrypt));
        }
        // Eğer data bir object ve data varsa
        else if (data.data && typeof data.data === 'object') {
          // Pagination durumunda data.data array olabilir
          if (Array.isArray(data.data)) {
            decryptedData = {
              ...data,
              data: data.data.map(item => decryptObject(item, fieldsToDecrypt)),
            };
          } else {
            decryptedData = {
              ...data,
              data: decryptObject(data.data, fieldsToDecrypt),
            };
          }
        }
        // Tek bir object ise
        else if (typeof data === 'object') {
          decryptedData = decryptObject(data, fieldsToDecrypt);
        }

        return originalJson.call(this, decryptedData);
      } catch (error) {
        logger.error('Decryption middleware error:', error);
        return originalJson.call(this, data);
      }
    };

    next();
  };
}

/**
 * Object'i decrypt et
 */
function decryptObject(obj, fieldsToDecrypt) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const decryptedObj = { ...obj };

  for (const field of fieldsToDecrypt) {
    const encryptedField = `${field}Encrypted`;

    // Eğer şifrelenmiş field varsa
    if (decryptedObj[encryptedField]) {
      const decryptedValue = decryptField(field, decryptedObj[encryptedField]);

      // Şifrelenmiş field'ın değerini orijinal field'a ata
      if (decryptedValue !== null) {
        decryptedObj[field] = decryptedValue;
      }

      // Şifrelenmiş field'ı response'dan çıkar (opsiyonel)
      // delete decryptedObj[encryptedField];
    }
    // Eğer şifrelenmiş field yok ama orijinal field varsa ve şifrelenmiş gibi görünüyorsa
    else if (decryptedObj[field] && isEncrypted(decryptedObj[field])) {
      const decryptedValue = decryptField(field, decryptedObj[field]);
      if (decryptedValue !== null) {
        decryptedObj[field] = decryptedValue;
      }
    }
  }

  return decryptedObj;
}

/**
 * Prisma middleware için şifreleme fonksiyonu
 * beforeCreate ve beforeUpdate hook'larında kullanılır
 */
export function encryptPrismaData(params, modelName) {
  if (!ENCRYPTED_FIELDS_CONFIG[modelName]) {
    return params;
  }

  const fieldsToEncrypt = ENCRYPTED_FIELDS_CONFIG[modelName];
  const encryptedData = {};

  // Şifrelenecek field'ları işle
  for (const field of fieldsToEncrypt) {
    if (params.data[field] && typeof params.data[field] === 'string') {
      encryptedData[`${field}Encrypted`] = encryptField(field, params.data[field]);
    }
  }

  // Şifrelenmiş verileri params.data'ya ekle
  params.data = { ...params.data, ...encryptedData };

  return params;
}

/**
 * Prisma middleware için deşifreleme fonksiyonu
 * afterFind hook'larında kullanılır
 */
export function decryptPrismaData(result, modelName) {
  if (!result || !ENCRYPTED_FIELDS_CONFIG[modelName]) {
    return result;
  }

  const fieldsToDecrypt = ENCRYPTED_FIELDS_CONFIG[modelName];

  // Eğer result bir array ise
  if (Array.isArray(result)) {
    return result.map(item => decryptPrismaObject(item, fieldsToDecrypt));
  }

  // Tek bir object ise
  return decryptPrismaObject(result, fieldsToDecrypt);
}

/**
 * Prisma object'ini decrypt et
 */
function decryptPrismaObject(obj, fieldsToDecrypt) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const decryptedObj = { ...obj };

  for (const field of fieldsToDecrypt) {
    const encryptedField = `${field}Encrypted`;

    // Eğer şifrelenmiş field varsa
    if (decryptedObj[encryptedField]) {
      const decryptedValue = decryptField(field, decryptedObj[encryptedField]);

      // Şifrelenmiş field'ın değerini orijinal field'a ata
      if (decryptedValue !== null) {
        decryptedObj[field] = decryptedValue;
      }

      // Şifrelenmiş field'ı response'dan çıkar (opsiyonel)
      // delete decryptedObj[encryptedField];
    }
  }

  return decryptedObj;
}

/**
 * Hassas field'ları loglamadan önce maskele
 */
export function maskSensitiveFields(data, modelName) {
  if (!data || !ENCRYPTED_FIELDS_CONFIG[modelName]) {
    return data;
  }

  const fieldsToMask = ENCRYPTED_FIELDS_CONFIG[modelName];
  const maskedData = { ...data };

  for (const field of fieldsToMask) {
    if (maskedData[field] && typeof maskedData[field] === 'string') {
      maskedData[field] = '***MASKED***';
    }
    if (maskedData[`${field}Encrypted`]) {
      maskedData[`${field}Encrypted`] = '***MASKED***';
    }
  }

  return maskedData;
}

/**
 * Middleware factory - belirli modeller için middleware oluştur
 */
export function createEncryptionMiddleware(modelName) {
  return {
    request: encryptRequestMiddleware(modelName),
    response: decryptResponseMiddleware(modelName),
  };
}

export default {
  encryptRequestMiddleware,
  decryptResponseMiddleware,
  encryptPrismaData,
  decryptPrismaData,
  maskSensitiveFields,
  createEncryptionMiddleware,
  ENCRYPTED_FIELDS_CONFIG,
};
