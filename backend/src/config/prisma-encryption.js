// Prisma Encryption Middleware - Lifecycle hooks ile otomatik şifreleme
import { encryptField, decryptField } from '../services/encryptionService.js';
import logger from '../utils/logger.js';

/**
 * Şifrelenecek field'ların konfigürasyonu
 */
const ENCRYPTED_FIELDS_MAP = {
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
 * Prisma middleware - Şifreleme için lifecycle hooks
 */
export function prismaEncryptionMiddleware(prisma) {
  // Her model için middleware'i ekle
  for (const [model, fields] of Object.entries(ENCRYPTED_FIELDS_MAP)) {
    addEncryptionHooks(prisma, model, fields);
  }

  logger.info('Prisma encryption middleware initialized');
}

/**
 * Belirli bir model için encryption hook'ları ekle
 */
function addEncryptionHooks(prisma, modelName, fields) {
  try {
    const model = prisma[modelName];

    if (!model) {
      logger.warn(`Model ${modelName} not found, skipping encryption hooks`);
      return;
    }

    // beforeCreate hook - Kaydetmeden önce şifrele
    model.$use(async (params, next) => {
      if (params.action === 'create') {
        params = encryptParams(params, fields);
      }
      return next(params);
    });

    // beforeUpdate hook - Güncellemeden önce şifrele
    model.$use(async (params, next) => {
      if (params.action === 'update') {
        params = encryptParams(params, fields);
      }
      return next(params);
    });

    // afterFind hook - Okuduktan sonra çöz
    model.$use(async (params, next) => {
      const result = await next(params);

      if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
        return decryptResult(result, fields);
      }

      return result;
    });

    logger.debug(`Encryption hooks added for model ${modelName}`);
  } catch (error) {
    logger.error(`Error adding encryption hooks for ${modelName}:`, error);
  }
}

/**
 * Params'ı şifrele
 */
function encryptParams(params, fields) {
  if (!params.data || typeof params.data !== 'object') {
    return params;
  }

  const encryptedData = { ...params.data };

  for (const field of fields) {
    if (encryptedData[field] && typeof encryptedData[field] === 'string') {
      // Şifrelenmiş field'ı oluştur
      encryptedData[`${field}Encrypted`] = encryptField(field, encryptedData[field]);

      // Orijinal field'ı koru (geriye dönük uyumluluk için)
    }
  }

  return {
    ...params,
    data: encryptedData,
  };
}

/**
 * Sonucu deşifre et
 */
function decryptResult(result, fields) {
  if (!result) {
    return result;
  }

  // Array ise
  if (Array.isArray(result)) {
    return result.map(item => decryptObject(item, fields));
  }

  // Object ise
  return decryptObject(result, fields);
}

/**
 * Object'i deşifre et
 */
function decryptObject(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const decryptedObj = { ...obj };

  for (const field of fields) {
    const encryptedField = `${field}Encrypted`;

    // Eğer şifrelenmiş field varsa
    if (decryptedObj[encryptedField]) {
      const decryptedValue = decryptField(field, decryptedObj[encryptedField]);

      // Deşifre edilen değeri orijinal field'a ata
      if (decryptedValue !== null) {
        decryptedObj[field] = decryptedValue;
      }

      // Şifrelenmiş field'ı object'ten kaldır (opsiyonel)
      // delete decryptedObj[encryptedField];
    }
  }

  return decryptedObj;
}

/**
 * Şifreleme middleware'ini Prisma client'e ekle
 */
export function initializePrismaEncryption(prisma) {
  try {
    // Encryption middleware'i ekle
    prismaEncryptionMiddleware(prisma);

    logger.info('Prisma encryption middleware initialized successfully');
    return prisma;
  } catch (error) {
    logger.error('Error initializing Prisma encryption middleware:', error);
    return prisma;
  }
}

/**
 * Belirli bir model için manuel şifreleme
 * (Middleware kullanılmadığında için)
 */
export function encryptModelData(modelName, data) {
  const fields = ENCRYPTED_FIELDS_MAP[modelName];

  if (!fields) {
    return data;
  }

  const encryptedData = { ...data };

  for (const field of fields) {
    if (encryptedData[field] && typeof encryptedData[field] === 'string') {
      encryptedData[`${field}Encrypted`] = encryptField(field, encryptedData[field]);
    }
  }

  return encryptedData;
}

/**
 * Belirli bir model için manuel deşifreleme
 * (Middleware kullanılmadığında için)
 */
export function decryptModelData(modelName, data) {
  const fields = ENCRYPTED_FIELDS_MAP[modelName];

  if (!fields || !data) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => decryptObject(item, fields));
  }

  return decryptObject(data, fields);
}

export default {
  prismaEncryptionMiddleware,
  initializePrismaEncryption,
  encryptModelData,
  decryptModelData,
  ENCRYPTED_FIELDS_MAP,
};
