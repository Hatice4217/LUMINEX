// Multer Configuration for File Upload
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directories
const uploadDir = path.join(__dirname, '../../uploads');
const profileUploadDir = path.join(uploadDir, 'profiles');
const documentUploadDir = path.join(uploadDir, 'documents');

// Create directories if they don't exist
const directories = [uploadDir, profileUploadDir, documentUploadDir];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profile') {
      cb(null, profileUploadDir);
    } else {
      cb(null, documentUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Geçersiz dosya formatı. Sadece resim ve PDF dosyaları yüklenebilir.'), false);
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Single profile upload
export const uploadProfile = upload.single('profile');

// Multiple documents upload
export const uploadDocuments = upload.array('documents', 5);

// Any file upload
export const uploadAny = upload.any();

// Validate file category
export function validateFileCategory(category) {
    const validCategories = ['profile', 'document', 'medical'];
    return validCategories.includes(category);
}
