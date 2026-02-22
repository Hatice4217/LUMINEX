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
  const phoneRegex = /^(05|5)\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Şifre gücü kontrolü (Güçlü mod)
 * @param {String} password - Şifre
 * @param {Boolean} strongMode - Güçlü mod (varsayılan: true)
 * @returns {Object} { valid: Boolean, errors: Array, strength: String }
 */
export const validatePassword = (password, strongMode = true) => {
  const errors = [];

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
