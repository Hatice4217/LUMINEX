// Authentication Middleware - TypeScript Version
import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../utils/jwt-utils.js';
import logger from '../utils/logger.js';

/**
 * JWT ile doğrulama middleware'i
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Yetkilendirme token\'ı bulunamadı',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = getUserFromToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token',
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      tcNo: decoded.tcNo,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası',
    });
  }
}

/**
 * Rol bazlı yetkilendirme middleware'i
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Önce giriş yapmalısınız',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok',
      });
      return;
    }

    next();
  };
}

/**
 * İsteğin sahibi olma kontrolü
 */
export function isOwner(paramUserId: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestedUserId = req.params[paramUserId];

    if (req.user?.role === 'ADMIN') {
      next();
      return;
    }

    if (req.user?.id !== requestedUserId) {
      res.status(403).json({
        success: false,
        message: 'Bu kaynağa erişim yetkiniz yok',
      });
      return;
    }

    next();
  };
}
