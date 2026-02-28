// File Upload Controller Tests
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('File Controller Tests', () => {
  let app;
  let mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock Prisma
    mockPrisma = {
      file: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    // Mock authentication middleware
    jest.mock('../../src/middlewares/auth-middleware.js', () => ({
      authenticate: (req, res, next) => {
        req.user = { id: 'user-1', role: 'PATIENT' };
        next();
      },
      authorize: () => (req, res, next) => next(),
    }));

    // Mock file upload
    jest.mock('multer', () => {
      return {
        default: jest.fn(() => ({
          single: jest.fn(() => (req, res, next) => {
            req.file = {
              filename: 'test-file.jpg',
              originalname: 'test-file.jpg',
              mimetype: 'image/jpeg',
              size: 1024,
              path: '/uploads/profiles/test-file.jpg',
            };
            next();
          }),
          array: jest.fn(() => (req, res, next) => {
            req.files = [
              {
                filename: 'test-file-1.jpg',
                originalname: 'test-file-1.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                path: '/uploads/test-file-1.jpg',
              },
            ];
            next();
          }),
        })),
      };
    });
  });

  describe('Upload Profile Picture', () => {
    it('should upload profile picture successfully', async () => {
      const mockFile = {
        id: 'file-1',
        fileName: 'test-file.jpg',
        originalName: 'test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/uploads/profiles/test-file.jpg',
        uploadedBy: 'user-1',
        category: 'PROFILE_PICTURE',
        createdAt: new Date(),
      };

      mockPrisma.file.findFirst.mockResolvedValue(null);
      mockPrisma.file.create.mockResolvedValue(mockFile);
      mockPrisma.user.update.mockResolvedValue({});

      const { uploadProfile } = await import('../../src/controllers/fileController.js');

      const req = {
        file: {
          filename: 'test-file.jpg',
          originalname: 'test-file.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: '/uploads/profiles/test-file.jpg',
        },
        user: { id: 'user-1' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadProfile(req, res, null);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profil resmi yüklendi',
        })
      );
    });

    it('should replace old profile picture', async () => {
      const oldFile = {
        id: 'old-file-1',
        path: '/uploads/profiles/old-file.jpg',
      };

      const newFile = {
        id: 'file-1',
        fileName: 'test-file.jpg',
        originalName: 'test-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/uploads/profiles/test-file.jpg',
        uploadedBy: 'user-1',
        category: 'PROFILE_PICTURE',
        createdAt: new Date(),
      };

      mockPrisma.file.findFirst.mockResolvedValue(oldFile);
      mockPrisma.file.create.mockResolvedValue(newFile);
      mockPrisma.user.update.mockResolvedValue({});

      const req = {
        file: {
          filename: 'test-file.jpg',
          originalname: 'test-file.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: '/uploads/profiles/test-file.jpg',
        },
        user: { id: 'user-1' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const fs = await import('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      const { uploadProfile } = await import('../../src/controllers/fileController.js');
      await uploadProfile(req, res, null);

      expect(mockPrisma.file.delete).toHaveBeenCalledWith({
        where: { id: 'old-file-1' },
      });
    });
  });

  describe('Upload General File', () => {
    it('should upload file successfully', async () => {
      const mockFile = {
        id: 'file-1',
        fileName: 'document.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        path: '/uploads/documents/document.pdf',
        uploadedBy: 'user-1',
        category: 'MEDICAL_RECORD',
        createdAt: new Date(),
      };

      mockPrisma.file.create.mockResolvedValue(mockFile);

      const req = {
        file: {
          filename: 'document.pdf',
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          path: '/uploads/documents/document.pdf',
        },
        body: { category: 'MEDICAL_RECORD' },
        user: { id: 'user-1' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { uploadFile } = await import('../../src/controllers/fileController.js');
      await uploadFile(req, res, null);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Dosya yüklendi',
        })
      );
    });

    it('should return error when no file uploaded', async () => {
      const req = {
        file: null,
        user: { id: 'user-1' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { uploadFile } = await import('../../src/controllers/fileController.js');
      await uploadFile(req, res, null);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Dosya yüklenmedi',
        })
      );
    });
  });

  describe('Upload Multiple Files', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          fileName: 'test1.jpg',
          originalName: 'test1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          path: '/uploads/test1.jpg',
          uploadedBy: 'user-1',
          category: 'MEDICAL_RECORD',
        },
        {
          id: 'file-2',
          fileName: 'test2.jpg',
          originalName: 'test2.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          path: '/uploads/test2.jpg',
          uploadedBy: 'user-1',
          category: 'MEDICAL_RECORD',
        },
      ];

      mockPrisma.file.create.mockResolvedValueOnce(mockFiles[0]);
      mockPrisma.file.create.mockResolvedValueOnce(mockFiles[1]);

      const req = {
        files: [
          {
            filename: 'test1.jpg',
            originalname: 'test1.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
            path: '/uploads/test1.jpg',
          },
          {
            filename: 'test2.jpg',
            originalname: 'test2.jpg',
            mimetype: 'image/jpeg',
            size: 2048,
            path: '/uploads/test2.jpg',
          },
        ],
        body: { category: 'MEDICAL_RECORD' },
        user: { id: 'user-1' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { uploadMultipleFiles } = await import('../../src/controllers/fileController.js');
      await uploadMultipleFiles(req, res, null);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '2 dosya yüklendi',
        })
      );
    });
  });

  describe('Get User Files', () => {
    it('should retrieve user files', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          fileName: 'test.jpg',
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          category: 'PROFILE_PICTURE',
          createdAt: new Date(),
        },
      ];

      mockPrisma.file.findMany.mockResolvedValue(mockFiles);
      mockPrisma.file.count.mockResolvedValue(1);

      const req = {
        user: { id: 'user-1' },
        query: { page: 1, limit: 20 },
      };

      const res = {
        json: jest.fn(),
      };

      const { getUserFiles } = await import('../../src/controllers/fileController.js');
      await getUserFiles(req, res, null);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            files: expect.any(Array),
            pagination: expect.objectContaining({
              total: 1,
              page: 1,
              limit: 20,
            }),
          }),
        })
      );
    });
  });

  describe('Delete File', () => {
    it('should delete file successfully', async () => {
      const mockFile = {
        id: 'file-1',
        uploadedBy: 'user-1',
        path: '/uploads/test.jpg',
        category: 'MEDICAL_RECORD',
      };

      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.file.delete.mockResolvedValue({});

      const req = {
        params: { id: 'file-1' },
        user: { id: 'user-1', role: 'PATIENT' },
      };

      const res = {
        json: jest.fn(),
      };

      const fs = await import('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      const { deleteFile } = await import('../../src/controllers/fileController.js');
      await deleteFile(req, res, null);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Dosya silindi',
        })
      );
    });

    it('should return error for unauthorized deletion', async () => {
      const mockFile = {
        id: 'file-1',
        uploadedBy: 'user-2',
        path: '/uploads/test.jpg',
        category: 'MEDICAL_RECORD',
      };

      mockPrisma.file.findUnique.mockResolvedValue(mockFile);

      const req = {
        params: { id: 'file-1' },
        user: { id: 'user-1', role: 'PATIENT' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { deleteFile } = await import('../../src/controllers/fileController.js');
      await deleteFile(req, res, null);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bu dosyayı silme yetkiniz yok',
        })
      );
    });
  });
});
