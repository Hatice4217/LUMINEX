// Authentication Controller
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt-utils.js';
import { validateTC, validateEmail, validatePassword } from '../utils/validation-utils.js';
import logger from '../utils/logger.js';

/**
 * Kullanıcı kaydı
 */
export const register = async (req, res, next) => {
  try {
    const { tcNo, password, firstName, lastName, role = 'PATIENT', email, phone, gender, dateOfBirth } = req.body;

    // TC Kimlik No doğrula
    if (!validateTC(tcNo)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz TC Kimlik Numarası',
      });
    }

    // Email varsa doğrula
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz email adresi',
      });
    }

    // Şifre validasyonu
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(', '),
      });
    }

    // TC Kimlik No zaten kayıtlı mı?
    const existingUser = await prisma.user.findUnique({
      where: { tcNo },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu TC Kimlik Numarası zaten kayıtlı',
      });
    }

    // Email zaten kayıtlı mı?
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kayıtlı',
        });
      }
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        tcNo,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      select: {
        id: true,
        tcNo: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    // Token oluştur
    const token = generateToken({
      userId: user.id,
      tcNo: user.tcNo,
      role: user.role,
    });

    logger.info('New user registered', { userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcı girişi
 */
export const login = async (req, res, next) => {
  try {
    const { tcNo, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { tcNo },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'TC Kimlik Numarası veya şifre hatalı',
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'TC Kimlik Numarası veya şifre hatalı',
      });
    }

    // Token oluştur
    const token = generateToken({
      userId: user.id,
      tcNo: user.tcNo,
      role: user.role,
    });

    logger.info('User logged in', { userId: user.id, role: user.role });

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          tcNo: user.tcNo,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mevcut kullanıcı bilgilerini al
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        tcNo: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Şifre değiştirme
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı',
      });
    }

    // Yeni şifre validasyonu (güçlü mod)
    const passwordValidation = validatePassword(newPassword, true);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(', '),
      });
    }

    // Şifre gücü zayıfsa uyar
    if (passwordValidation.strength === 'Zayıf' || passwordValidation.strength === 'Orta') {
      return res.status(400).json({
        success: false,
        message: `Şifre gücü: ${passwordValidation.strength}. Lütfen daha güçlü bir şifre seçin.`,
      });
    }

    // Yeni şifreyi hashle ve güncelle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed', { userId });

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Şifremi unuttum - Sıfırlama token'ı oluştur
 * (Not: Gerçek uygulamada email ile gönderilmeli)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { tcNo } = req.body;

    const user = await prisma.user.findUnique({
      where: { tcNo },
    });

    if (!user) {
      // Güvenlik için kullanıcı bulunamasa da başarlı döndür
      return res.json({
        success: true,
        message: 'Eğer bu TC Kimlik Numarası kayıtlıysa, şifre sıfırlama bilgileri gönderilecektir',
      });
    }

    // Şifre sıfırlama token'ı oluştur (1 saat geçerli)
    const resetToken = generateToken({
      userId: user.id,
      type: 'password_reset',
    }, '1h');

    logger.info('Password reset requested', { userId: user.id });

    // Not: Gerçek uygulamada bu token email ile gönderilmeli
    res.json({
      success: true,
      message: 'Şifre sıfırlama token\'ı oluşturuldu',
      data: {
        resetToken, // Sadece development'da geri döndür
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Şifre sıfırlama
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Token'ı doğrula
    const { verifyToken } = await import('../utils/jwt-utils.js');
    const decoded = verifyToken(token);

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    // Yeni şifre validasyonu (güçlü mod)
    const passwordValidation = validatePassword(newPassword, true);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(', '),
      });
    }

    // Şifre gücü zayıfsa uyar
    if (passwordValidation.strength === 'Zayıf' || passwordValidation.strength === 'Orta') {
      return res.status(400).json({
        success: false,
        message: `Şifre gücü: ${passwordValidation.strength}. Lütfen daha güçlü bir şifre seçin.`,
      });
    }

    // Şifreyi hashle ve güncelle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    logger.info('Password reset completed', { userId: decoded.userId });

    res.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı',
    });
  } catch (error) {
    next(error);
  }
};
