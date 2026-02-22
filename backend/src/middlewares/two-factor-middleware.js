// Two-Factor Authentication (2FA) Middleware
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * 2FA Secret oluştur (TOTP için)
 * @param {String} userId - Kullanıcı ID
 * @returns {Object} secret ve QR code URL
 */
export const generate2FASecret = (userId) => {
  const secret = crypto.randomBytes(20).toString('base32');
  const serviceName = 'LUMINEX';
  const issuer = 'LUMINEX Health';

  // Google Authenticator formatında QR code URL
  const otpauthUrl = `otpauth://totp/${serviceName}:${userId}@${issuer}?secret=${secret}&issuer=${issuer}`;

  return { secret, otpauthUrl };
};

/**
 * TOTP (Time-based One-Time Password) doğrula
 * @param {String} secret - 2FA secret
 * @param {String} token - Kullanıcının girdiği kod
 * @returns {Boolean} Geçerli mi?
 */
export const verifyTOTP = (secret, token) => {
  try {
    // Basit TOTP validasyonu (production'da speakeasyables gibi paketler kullanılabilir)
    // Şimdilik basit implementasyon

    // Time step hesapla (30 saniyelik)
    const timeStep = Math.floor(Date.now() / 1000 / 30);

    // Secret ve time step'tan HMAC oluştur
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(Buffer.from(timeStep.toString()));

    const hmacResult = hmac.digest();
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const code = (
      ((hmacResult[offset] & 0x7f) << 24 |
       (hmacResult[offset + 1] & 0xff) << 16 |
       (hmacResult[offset + 2] & 0xff) << 8 |
       (hmacResult[offset + 3] & 0xff))
    ).toString();

    // Son 6 hane ile karşılaştır
    return code.slice(-6) === token;
  } catch (error) {
    logger.error('TOTP verification error', { error: error.message });
    return false;
  }
};

/**
  * Backup kodları oluştur (2FA için)
  * @returns {Array} 10 adet 8 haneli kod
  */
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

/**
  * 2FA enabled kontrolü
  */
export const require2FA = (req, res, next) => {
  if (!req.user.twoFactorEnabled) {
    return res.status(403).json({
      success: false,
      message: 'İki faktörlü doğrulama gerekli',
      requiresTwoFactor: true,
    });
  }

  // 2FA token kontrolü
  const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;

  if (!twoFactorToken) {
    return res.status(403).json({
      success: false,
      message: '2FA token gerekli',
      requiresTwoFactor: true,
    });
  }

  // Token'ı doğrula
  const isValid = verifyTOTP(req.user.twoFactorSecret, twoFactorToken);

  if (!isValid) {
    logger.warn('Invalid 2FA token', {
      userId: req.user.id,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: 'Geçersiz 2FA kodu',
    });
  }

  next();
};

/**
  * 2FA kurulumu için endpoint
  */
export const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { secret, otpauthUrl } = generate2FASecret(userId);
    const backupCodes = generateBackupCodes();

    // Burada veritabanına 2FA bilgilerini kaydetmek gerekiyor
    // Şimdilik sadece response döndürüyoruz

    res.json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        backupCodes,
      },
      message: '2FA kurulumu için QR kodu tarayın',
    });
  } catch (error) {
    next(error);
  }
};

/**
  * 2FA doğrulama endpoint'i
  */
export const verify2FA = async (req, res, next) => {
  try {
    const { token, backupCode } = req.body;
    const userId = req.user.id;

    // Önce backup code kontrol et
    if (backupCode) {
      // Burada veritabanından backup code kontrolü yapılmalı
      // Şimdilik basit implementasyon

      return res.json({
        success: true,
        message: 'Backup kodu ile giriş başarılı',
      });
    }

    // TOTP token kontrolü
    if (req.user.twoFactorSecret && token) {
      const isValid = verifyTOTP(req.user.twoFactorSecret, token);

      if (isValid) {
        return res.json({
          success: true,
          message: '2FA doğrulama başarılı',
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Geçersiz 2FA kodu',
    });
  } catch (error) {
    next(error);
  }
};

/**
  * SMS ile 2FA kodu gönder (opsiyonel)
  */
export const send2FACode = async (phoneNumber, code) => {
  // Production'da burada SMS API entegrasyonu olacak
  // Örnek: Twilio, Nexmo, veya yerel SMS sağlayıcıları

  logger.info('2FA SMS gönderildi', {
    phoneNumber,
    last4Digits: phoneNumber.slice(-4),
    code, // ⚠️ Production'da loglamayın!
  });

  // Gerçek implementasyon için:
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({ body, from, to });

  return { success: true, message: 'SMS gönderildi' };
};
