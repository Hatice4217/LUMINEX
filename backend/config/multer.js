// Multer Configuration - File Upload
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory'lerini oluştur
const uploadBaseDir = path.join(__dirname, '..', '..', 'uploads');
const uploadDirs = {
  profiles: path.join(uploadBaseDir, 'profiles'),
  messages: path.join(uploadBaseDir, 'messages'),
  documents: path.join(uploadBaseDir, 'documents'),
  testResults: path.join(uploadBaseDir, 'test-results'),
  prescriptions: path.join(uploadBaseDir, 'prescriptions'),
};

// Directory'leri oluştur
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = uploadDirs.documents; // default

    // File type'a göre directory seç
    if (req.body.category === 'PROFILE_PICTURE') {
      uploadDir = uploadDirs.profiles;
    } else if (req.body.category === 'MESSAGE_ATTACHMENT') {
      uploadDir = uploadDirs.messages;
    } else if (req.body.category === 'TEST_RESULT') {
      uploadDir = uploadDirs.testResults;
    } else if (req.body.category === 'PRESCRIPTION') {
      uploadDir = uploadDirs.prescriptions;
    } else if (req.body.category === 'MEDICAL_RECORD') {
      uploadDir = uploadDirs.documents;
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur: UUID ile çakışma riski sıfıra yakın
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname);

    // Orijinal dosya adını temizle ve güvenlik önlemleri uygula:
    // 1. Path traversal önleme
    // 2. Uzunluk sınırı (max 50 karakter)
    // 3. Sadece güvenli karakterler
    let baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_') // Türkçe karakterleri koru
      .replace(/_{2,}/g, '_') // Birden fazla alt çizgiyi tek'e indir
      .substring(0, 50); // Maksimum 50 karakter

    // Boş kaldıysa 'file' kullan
    if (!baseName) {
      baseName = 'file';
    }

    // Format: uuid-clean_basename.extension
    // Örnek: a1b2c3d4-e5f6-7890-abcd-ef1234567890_dosya_adi.jpg
    cb(null, `${uniqueId}_${baseName}${ext}`);
  },
});

// File filter - MIME type kontrolü + Ek güvenlik
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // MIME type kontrolü
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Geçersiz dosya türü. Sadece JPEG, PNG, GIF, WEBP, PDF ve DOC/DOCX dosyaları yüklenebilir.'), false);
  }

  // Dosya uzantısı kontrolü (MIME type spoofing'i önlemek için)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Geçersiz dosya uzantısı.'), false);
  }

  // MIME type ve uzantı tutarsızlığını kontrol et
  const mimeExtMap = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  };

  const validExtensions = mimeExtMap[file.mimetype] || [];
  if (!validExtensions.includes(ext)) {
    return cb(new Error('Dosya uzantısı ve MIME type uyuşmuyor. Güvenlik riski tespit edildi.'), false);
  }

  cb(null, true);
};

// Multer instance oluştur
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
});

// Profil resmi için single upload (max 1 dosya)
export const uploadProfilePicture = upload.single('file');

// Genel dosya yükleme için multiple upload (max 5 dosya)
export const uploadFiles = upload.array('files', 5);

// Single file upload
export const uploadSingleFile = upload.single('file');

// File bilgilerini kontrol et
export const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'Dosya yüklenmedi',
    });
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
  const files = req.files || [req.file];

  for (const file of files) {
    // 1. Dosya boyutu kontrolü
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Dosya boyutu çok büyük (max ${maxSize / 1024 / 1024}MB)`,
      });
    }

    // 2. Minimum dosya boyutu kontrolü (boş dosya önleme)
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Boş dosya yüklenemez',
      });
    }

    // 3. Dosya adı uzunluğu kontrolü
    if (file.originalname && file.originalname.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Dosya adı çok uzun (max 255 karakter)',
      });
    }

    // 4. Double extension kontrolü (gizli .exe veya .php dosyaları için)
    if (file.originalname) {
      const parts = file.originalname.split('.');
      const extensions = parts.slice(1); // İlk parça dosya adı

      // 3'ten fazla uzantı varsa şüpheli
      if (extensions.length > 2) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz dosya adı',
        });
      }
    }
  }

  next();
};

// File category validator
export const validateFileCategory = (req, res, next) => {
  const allowedCategories = ['PROFILE_PICTURE', 'MESSAGE_ATTACHMENT', 'TEST_RESULT', 'MEDICAL_RECORD', 'PRESCRIPTION'];

  if (!req.body.category || !allowedCategories.includes(req.body.category)) {
    return res.status(400).json({
      success: false,
      message: `Geçersiz dosya kategorisi. İzin verilen kategoriler: ${allowedCategories.join(', ')}`,
    });
  }

  next();
};

export default upload;
