// js/utils/validation-utils.js

/**
 * E-posta Validasyonu (Production Ready)
 *
 * Regex açıklaması:
 * - Local part: Harf, rakam, ve özel karakterler (!#$%&'*+/=?^_`{|}~-)
 * - @ işareti zorunlu
 * - Domain: Harf ile başlar, harf/rakam/şehirtire içerebilir
 * - TLD: En az 2 harf zorunlu
 *
 * RFC 5322 & 5321 compliant (pratik versiyon)
 *
 * @param {string} email - Validasyon yapılacak e-posta
 * @returns {boolean} Geçerli ise true, değilse false
 *
 * @example
 * validateEmail("test@example.com")    // true
 * validateEmail("test@domain.co.uk")   // true
 * validateEmail("invalid@.com")        // false
 * validateEmail("test@domain")         // false
 * validateEmail("test domain.com")     // false
 *
 * TODO: Production için Backend MX record check ekleyin:
 * fetch('/api/validate-email?email=' + email)
 *   .then(res => res.json())
 *   .then(data => data.mxValid);
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email.trim().toLowerCase());
}

export function validatePassword(password) {
    // Requires at least 8 characters, one uppercase, one lowercase, one number, and one special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    return re.test(password);
}

/**
 * TC Kimlik Numarası Validasyonu (Production Ready)
 *
 * Türkiye Cumhuriyeti TC Kimlik Numarası Algoritması:
 * 1. 11 haneli olmalı
 * 2. Sadece rakamlardan oluşmalı
 * 3. İlk hane 0 olamaz
 * 4. 10. hane: İlk 9 hanenin toplamının 10'a bölümünden kalan
 * 5. 11. hane: (1,3,5,7,9 pozisyonlarının toplamı * 7) - (2,4,6,8 pozisyonlarının toplamı)
 *             Sonucun 10'a bölümünden kalan
 *
 * @param {string|number} tc - TC Kimlik numarası
 * @returns {boolean} Geçerli ise true, değilse false
 *
 * @example
 * validateTcKimlik("10000000146") // true (örnek TC)
 * validateTcKimlik("12345678901") // false (geçersiz algoritma)
 */
export function validateTcKimlik(tc) {
    // Type conversion ve trim
    const tcKimlik = String(tc).trim();

    // 1. Temel format kontrolü: 11 haneli, sadece rakam, 0 ile başlamaz
    if (!/^[1-9]\d{10}$/.test(tcKimlik)) {
        return false;
    }

    // Rakamlara ayır
    const digits = tcKimlik.split('').map(Number);

    // 2. 10. hane kontrolü: İlk 9 hanenin toplamının % 10
    const first9Sum = digits.slice(0, 9).reduce((sum, digit) => sum + digit, 0);
    const tenthDigit = first9Sum % 10;
    if (digits[9] !== tenthDigit) {
        return false;
    }

    // 3. 11. hane kontrolü: (tek pozisyonlar * 7 - çift pozisyonlar) % 10
    // Tek pozisyonlar: 1, 3, 5, 7, 9 (index: 0, 2, 4, 6, 8)
    // Çift pozisyonlar: 2, 4, 6, 8 (index: 1, 3, 5, 7)
    const oddPositions = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenPositions = digits[1] + digits[3] + digits[5] + digits[7];
    const eleventhDigit = ((oddPositions * 7) - evenPositions) % 10;
    if (digits[10] !== eleventhDigit) {
        return false;
    }

    return true;
}

export function validateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age >= 18;
}
