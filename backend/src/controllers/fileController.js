// File Controller
import prisma from '../config/database.js';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * Profil resmi yükle
 */
export const uploadProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const userId = req.user.id;

    // Eski profil resmini sil
    const oldProfile = await prisma.file.findFirst({
      where: {
        uploader: userId,
        category: 'PROFILE_PICTURE',
      },
    });

    if (oldProfile) {
      // Eski dosyayı disk'ten sil
      const oldPath = path.resolve(oldProfile.path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      // Veritabanından sil
      await prisma.file.delete({
        where: { id: oldProfile.id },
      });
    }

    // Yeni profil resmini kaydet
    const file = await prisma.file.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: userId,
        category: 'PROFILE_PICTURE',
      },
    });

    // Kullanıcının profil resmi ID'sini güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureId: file.id },
    });

    logger.info('Profile picture uploaded', { userId, fileId: file.id });

    res.status(201).json({
      success: true,
      message: 'Profil resmi yüklendi',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Genel dosya yükle
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const userId = req.user.id;
    const category = req.body.category || 'MEDICAL_RECORD';

    const file = await prisma.file.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: userId,
        category,
      },
    });

    logger.info('File uploaded', { userId, fileId: file.id, category });

    res.status(201).json({
      success: true,
      message: 'Dosya yüklendi',
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Birden fazla dosya yükle
 */
export const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const userId = req.user.id;
    const category = req.body.category || 'MEDICAL_RECORD';

    const files = await Promise.all(
      req.files.map(async (file) => {
        return await prisma.file.create({
          data: {
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedBy: userId,
            category,
          },
        });
      })
    );

    logger.info('Multiple files uploaded', { userId, count: files.length, category });

    res.status(201).json({
      success: true,
      message: `${files.length} dosya yüklendi`,
      data: { files },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dosya getir (indir)
 */
export const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    // Yetki kontrolü - sadece kendi dosyalarını veya admin tüm dosyaları görebilir
    if (file.uploadedBy !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu dosyaya erişim yetkiniz yok',
      });
    }

    // Path injection kontrolü
    const normalizedPath = path.normalize(file.path);
    const uploadsDir = path.resolve('uploads');

    // Dosya yolu uploads dizini içinde mi kontrol et
    if (!normalizedPath.startsWith(uploadsDir)) {
      logger.warn('Potential path injection attempt', { fileId: id, requestedPath: file.path });
      return res.status(403).json({
        success: false,
        message: 'Geçersiz dosya yolu',
      });
    }

    // Dosya varlığını kontrol et
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Dosya disk üzerinde bulunamadı',
      });
    }

    // Dosyayı gönder
    res.sendFile(normalizedPath, (err) => {
      if (err) {
        logger.error('Error sending file:', err);
        res.status(500).json({
          success: false,
          message: 'Dosya gönderilirken hata oluştu',
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dosya bilgilerini getir
 */
export const getFileInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    // Yetki kontrolü
    if (file.uploadedBy !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu dosyaya erişim yetkiniz yok',
      });
    }

    res.json({
      success: true,
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kullanıcının dosyalarını listele
 */
export const getUserFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, page = 1, limit = 20 } = req.query;

    const where = { uploadedBy: userId };

    if (category) {
      where.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          mimeType: true,
          size: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.file.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dosya sil
 */
export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    // Yetki kontrolü
    if (file.uploadedBy !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu dosyayı silme yetkiniz yok',
      });
    }

    // Profil resmiyse, kullanıcıdan bağlantıyı kaldır
    if (file.category === 'PROFILE_PICTURE') {
      await prisma.user.updateMany({
        where: { profilePictureId: id },
        data: { profilePictureId: null },
      });
    }

    // Path injection kontrolü
    const normalizedPath = path.normalize(file.path);
    const uploadsDir = path.resolve('uploads');

    // Dosya yolu uploads dizini içinde mi kontrol et
    if (!normalizedPath.startsWith(uploadsDir)) {
      logger.warn('Potential path injection attempt', { fileId: id, requestedPath: file.path });
      return res.status(403).json({
        success: false,
        message: 'Geçersiz dosya yolu',
      });
    }

    // Dosyayı disk'ten sil
    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
    }

    // Veritabanından sil
    await prisma.file.delete({
      where: { id },
    });

    logger.info('File deleted', { fileId: id, deletedBy: userId });

    res.json({
      success: true,
      message: 'Dosya silindi',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Profil resmi getir (public endpoint - token ile erişim)
 */
export const getProfilePicture = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profilePicture: true,
      },
    });

    if (!user || !user.profilePicture) {
      return res.status(404).json({
        success: false,
        message: 'Profil resmi bulunamadı',
      });
    }

    const file = user.profilePicture;

    // Path injection kontrolü
    const normalizedPath = path.normalize(file.path);
    const uploadsDir = path.resolve('uploads');

    // Dosya yolu uploads dizini içinde mi kontrol et
    if (!normalizedPath.startsWith(uploadsDir)) {
      logger.warn('Potential path injection attempt (profile picture)', { userId, requestedPath: file.path });
      return res.status(403).json({
        success: false,
        message: 'Geçersiz dosya yolu',
      });
    }

    // Dosya varlığını kontrol et
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Dosya disk üzerinde bulunamadı',
      });
    }

    // Dosyayı gönder
    res.sendFile(normalizedPath, (err) => {
      if (err) {
        logger.error('Error sending profile picture:', err);
        res.status(500).json({
          success: false,
          message: 'Profil resmi gönderilirken hata oluştu',
        });
      }
    });
  } catch (error) {
    next(error);
  }
};
