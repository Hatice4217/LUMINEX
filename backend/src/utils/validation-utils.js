// TC Kimlik No Doğrulama
/**
 * TC Kimlik No doğrula
 * @param {String} tcNo - TC Kimlik Numarası
 * @returns {Boolean} Geçerli mi?
 */
export const validateTC = (tcNo) => {
  // TC Kimlik No 11 haneli olmalı
  if (!tcNo || typeof tcNo !== 'string') {
    return false;
  }

  tcNo = tcNo.trim();

  // Boş kontrolü
  if (tcNo.length === 0) {
    return false;
  }

  // Sadece rakam kontrolü
  if (!/^\d{11}$/.test(tcNo)) {
    return false;
  }

  // İlk hane 0 olamaz
  if (tcNo[0] === '0') {
    return false;
  }

  // Rakamlara ayır
  const digits = tcNo.split('').map(Number);

  // 10. hane kontrolü
  const tenthDigit = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 -
                     (digits[1] + digits[3] + digits[5] + digits[7]);
  const tenthDigitCalculated = tenthDigit % 10;

  if (digits[9] !== tenthDigitCalculated) {
    return false;
  }

  // 11. hane kontrolü
  const eleventhDigitCalculated = (digits[0] + digits[1] + digits[2] + digits[3] +
                                   digits[4] + digits[5] + digits[6] + digits[7] +
                                   digits[8] + digits[9]) % 10;

  if (digits[10] !== eleventhDigitCalculated) {
    return false;
  }

  return true;
};

/**
 * Email doğrula
 * @param {String} email - Email adresi
 * @returns {Boolean} Geçerli mi?
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Telefon numarası doğrula (Türkiye formatı)
 * @param {String} phone - Telefon numarası
 * @returns {Boolean} Geçerli mi?
 */
export const validatePhone = (phone) => {
  // Türkiye telefon formatı: 05XX XXX XX XX veya 5XX XXX XX XX
  // veya +90 5XX XXX XX XX formatında
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.trim().replace(/\s/g, '').replace(/\+/g, '');

  // +90 ile başlayan veya doğrudan 5 ile başlayan
  const phoneRegex = /^(?:(?:90)?5\d{2}\d{3}\d{2}\d{2}|(05|5)\d{2}\d{3}\d{2}\d{2})$/;
  return phoneRegex.test(cleaned);
};

/**
 * Türkçe isim doğrula
 * @param {String} name - İsim/Soyisim
 * @param {Object} options - Seçenekler
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateTurkishName = (name, options = {}) => {
  const {
    minLength = 2,
    maxLength = 50,
    fieldName = 'İsim',
  } = options;

  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} gereklidir` };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} en az ${minLength} karakter olmalı` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} en fazla ${maxLength} karakter olabilir` };
  }

  // Türkçe karakterler ve harfler, boşluk, tire
  const turkishNameRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜı\.\-\s']+$/;
  if (!turkishNameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} sadece harf, nokta, tire ve boşluk içerebilir` };
  }

  // Sadece sayı içeremez
  if (/\d/.test(trimmed)) {
    return { valid: false, error: `${fieldName} rakam içeremez` };
  }

  return { valid: true, error: null };
};

/**
 * Doğum tarihi doğrula
 * @param {String|Date} dateOfBirth - Doğum tarihi
 * @returns {Object} { valid: Boolean, error: String, age: Number }
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return { valid: false, error: 'Doğum tarihi gereklidir', age: null };
  }

  const date = new Date(dateOfBirth);

  // Geçerli tarih kontrolü
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Geçersiz tarih formatı', age: null };
  }

  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  // Yaş hesaplama
  const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())
    ? age - 1
    : age;

  // Gelecek tarih olamaz
  if (date > now) {
    return { valid: false, error: 'Doğum tarihi gelecek bir tarih olamaz', age: null };
  }

  // Çok eski tarih (150 yıldan fazla)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 150);

  if (date < maxDate) {
    return { valid: false, error: 'Geçersiz doğum tarihi', age: null };
  }

  // Yaş aralığı kontrolü (0-120)
  if (actualAge < 0) {
    return { valid: false, error: 'Geçersiz doğum tarihi', age: null };
  }

  if (actualAge > 120) {
    return { valid: false, error: 'Doğum tarihi çok eski', age: actualAge };
  }

  // Bebek yaş kontrolü (18 yaşından küçükler için uyarı ama izin ver)
  if (actualAge < 18) {
    return {
      valid: true,
      error: '18 yaşından küçükler için veli izni gerekebilir',
      age: actualAge,
      warning: true,
    };
  }

  return { valid: true, error: null, age: actualAge };
};

/**
 * Adres doğrula
 * @param {String} address - Adres
 * @param {Object} options - Seçenekler
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateAddress = (address, options = {}) => {
  const {
    minLength = 10,
    maxLength = 500,
    fieldName = 'Adres',
  } = options;

  if (!address || typeof address !== 'string') {
    return { valid: false, error: `${fieldName} gereklidir` };
  }

  const trimmed = address.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} en az ${minLength} karakter olmalı` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} en fazla ${maxLength} karakter olabilir` };
  }

  // XSS ve SQL injection için basit kontrol
  const dangerousPatterns = ['<script', 'javascript:', 'onerror=', 'onload='];
  const lowerAddress = trimmed.toLowerCase();

  for (const pattern of dangerousPatterns) {
    if (lowerAddress.includes(pattern)) {
      return { valid: false, error: 'Geçersiz karakterler içeren adres' };
    }
  }

  return { valid: true, error: null };
};

/**
 * Website URL doğrula
 * @param {String} url - Website URL
 * @returns {Object} { valid: Boolean, error: String, normalized: String }
 */
export const validateWebsite = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Website URL gereklidir', normalized: null };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Website URL gereklidir', normalized: null };
  }

  // URL format kontrolü
  let normalized = trimmed;

  // http:// veya https:// ekle yoksa
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }

  try {
    new URL(normalized);
  } catch {
    return { valid: false, error: 'Geçersiz website URL formatı', normalized: null };
  }

  // URL regex kontrolü
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (!urlRegex.test(trimmed) && !urlRegex.test(normalized)) {
    return { valid: false, error: 'Geçersiz website URL', normalized: null };
  }

  return { valid: true, error: null, normalized };
};

/**
 * T.C. Kimlik No formatını normalize et (boşlukları ve tireleri kaldır)
 * @param {String} tcNo - TC Kimlik Numarası
 * @returns {String} Normalize edilmiş TC Kimlik Numarası
 */
export const normalizeTC = (tcNo) => {
  if (!tcNo || typeof tcNo !== 'string') {
    return '';
  }
  return tcNo.replace(/[\s\-]/g, '').trim();
};

/**
 * Telefon numarasını normalize et (0555 123 45 67 -> 05551234567)
 * @param {String} phone - Telefon numarası
 * @returns {String} Normalize edilmiş telefon numarası
 */
export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  let normalized = phone.trim().replace(/\s/g, '').replace(/[\(\)\-]/g, '');

  // +90 ile başlıyorsa 0 ile değiştir
  if (normalized.startsWith('+90')) {
    normalized = '0' + normalized.substring(3);
  }
  // 90 ile başlıyorsa ve 12 hane ise 0 ile başlat (905551234567 -> 05551234567)
  else if (normalized.startsWith('90') && normalized.length === 12) {
    normalized = '0' + normalized.substring(2);
  }
  // 0 ile başlamıyorsa ve 10 hane ise 0 ekle (5551234567 -> 05551234567)
  else if (!normalized.startsWith('0') && normalized.length === 10) {
    normalized = '0' + normalized;
  }

  return normalized;
};

/**
 * Email'i normalize et (lowercase, trim)
 * @param {String} email - Email adresi
 * @returns {String} Normalize edilmiş email
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
};

/**
 * Şifre gücü kontrolü (Güçlü mod)
 * @param {String} password - Şifre
 * @param {Boolean} strongMode - Güçlü mod (varsayılan: true)
 * @returns {Object} { valid: Boolean, errors: Array, strength: String }
 */
export const validatePassword = (password, strongMode = true) => {
  const errors = [];

  // Boş kontrolü
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Şifre gereklidir'],
      strength: 'Zayıf',
    };
  }

  // Minimum uzunluk
  const minLength = strongMode ? 8 : 6;
  if (password.length < minLength) {
    errors.push(`Şifre en az ${minLength} karakter olmalı`);
  }

  if (password.length > 128) {
    errors.push('Şifre en fazla 128 karakter olabilir');
  }

  // Güçlü modda ek kontroller
  if (strongMode) {
    // Büyük harf kontrolü
    if (!/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermeli');
    }

    // Küçük harf kontrolü
    if (!/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermeli');
    }

    // Rakam kontrolü
    if (!/[0-9]/.test(password)) {
      errors.push('Şifre en az bir rakam içermeli');
    }

    // Özel karakter kontrolü
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Şifre en az bir özel karakter içermeli (!@#$%^&*()_+-=[]{}|;:\'",.<>?)');
    }

    // Yaygın zayıf şifre kontrolü
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty123',
      'abc12345', 'sifre123', 'deneme123', 'admin123'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Bu şifre çok yaygın, lütfen daha güçlü bir şifre seçin');
    }
  }

  // Şifre gücü hesapla
  let strength = 'Zayıf';
  if (errors.length === 0) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLong = password.length >= 12;

    const score = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length;

    if (score >= 5) {
      strength = 'Çok güçlü';
    } else if (score >= 4) {
      strength = 'Güçlü';
    } else if (score >= 3) {
      strength = 'Orta';
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Randevu tarihi doğrula
 * @param {String} dateStr - Tarih string'i (YYYY-MM-DD formatında)
 * @returns {Boolean} Geçerli mi?
 */
export const validateAppointmentDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();

  // Geçerli tarih kontrolü
  if (isNaN(date.getTime())) {
    return false;
  }

  // Geçmiş tarih olamaz
  if (date < now) {
    return false;
  }

  // Çok ileri bir tarih (1 yıldan fazla)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  if (date > maxDate) {
    return false;
  }

  return true;
};

/**
 * Tarih aralığı doğrula
 * @param {String} startDate - Başlangıç tarihi
 * @param {String} endDate - Bitiş tarihi
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Başlangıç ve bitiş tarihi gereklidir' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Geçersiz tarih formatı' };
  }

  if (start > end) {
    return { valid: false, error: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' };
  }

  // Çok geniş aralığı kontrol et (365 günden fazla)
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 365) {
    return { valid: false, error: 'Tarih aralığı 365 günden fazla olamaz' };
  }

  return { valid: true, error: null };
};

/**
 * Uzmanlık alanı doğrula (doktor için)
 * @param {String} specialty - Uzmanlık alanı
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateSpecialty = (specialty) => {
  if (!specialty || typeof specialty !== 'string') {
    return { valid: false, error: 'Uzmanlık alanı gereklidir' };
  }

  const trimmed = specialty.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Uzmanlık alanı en az 3 karakter olmalı' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Uzmanlık alanı en fazla 100 karakter olabilir' };
  }

  // Türkçe karakter, harf, boşluk, virgül, tire
  const specialtyRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜı\,\.\-\s]+$/;
  if (!specialtyRegex.test(trimmed)) {
    return { valid: false, error: 'Uzmanlık alanı geçersiz karakterler içeriyor' };
  }

  return { valid: true, error: null };
};

/**
 * Hastane adı doğrula
 * @param {String} name - Hastane adı
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateHospitalName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Hastane adı gereklidir' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Hastane adı en az 3 karakter olmalı' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Hastane adı en fazla 100 karakter olabilir' };
  }

  return { valid: true, error: null };
};

/**
 * Cinsiyet doğrula
 * @param {String} gender - Cinsiyet (MALE, FEMALE, OTHER)
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateGender = (gender) => {
  const validGenders = ['MALE', 'FEMALE', 'OTHER', 'ERKEK', 'KADIN', 'DİĞER'];

  if (!gender || typeof gender !== 'string') {
    return { valid: false, error: 'Cinsiyet gereklidir' };
  }

  const upperGender = gender.trim().toUpperCase();

  if (!validGenders.includes(upperGender)) {
    return { valid: false, error: 'Geçersiz cinsiyet değeri' };
  }

  // Normalize to English values
  const normalized = upperGender === 'ERKEK' ? 'MALE' : upperGender === 'KADIN' ? 'FEMALE' : upperGender === 'DİĞER' ? 'OTHER' : upperGender;

  return { valid: true, error: null, normalized };
};
