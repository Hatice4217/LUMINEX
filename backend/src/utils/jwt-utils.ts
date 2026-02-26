// JWT Utilities - TypeScript Version
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/index.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'luminex_jwt_secret_key';
const JWT_EXPIRE: string = process.env.JWT_EXPIRE || '7d';

/**
 * JWT token oluştur
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || JWT_EXPIRE } as any);
}

/**
 * JWT token doğrula
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error('Geçersiz veya süresi dolmuş token');
  }
}

/**
 * Token'dan kullanıcı bilgilerini çıkar
 */
export function getUserFromToken(token: string): JwtPayload | null {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Refresh token oluştur
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return generateToken(payload, '30d');
}
