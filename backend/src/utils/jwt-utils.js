// JWT Utilities
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'luminex_jwt_secret_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * JWT token oluştur
 * @param {Object} payload - Token içine eklenecek veri
 * @param {String} expiresIn - Token geçerlilik süresi (opsiyonel)
 * @returns {String} JWT token
 */
export const generateToken = (payload, expiresIn = JWT_EXPIRE) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
};

/**
 * JWT token doğrula
 * @param {String} token - Doğrulanacak token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz veya süresi dolmuş token');
  }
};

/**
 * Token'dan kullanıcı bilgilerini çıkar
 * @param {String} token - JWT token
 * @returns {Object|null} Kullanıcı bilgileri veya null
 */
export const getUserFromToken = (token) => {
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};
