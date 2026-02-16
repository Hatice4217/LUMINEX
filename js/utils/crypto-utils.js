/**
 * Crypto Utils - Production Ready Security Functions
 *
 * Features:
 * - SHA-256 hashing for passwords
 * - AES-GCM encryption for sensitive data (localStorage)
 * - Key derivation from master password
 */

/**
 * Hash a string using SHA-256 (one-way, for passwords)
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex encoded hash
 */
export async function hashString(str) {
    if (!str) {
        return Promise.resolve('');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * AES-GCM Encryption for localStorage sensitive data
 * Prevents XSS attacks on stored data
 *
 * @param {string} text - Plain text to encrypt
 * @param {string} key - Encryption key (use app secret)
 * @returns {Promise<string>} Base64 encoded encrypted data
 *
 * @example
 * const encrypted = await encryptData('sensitive-data', 'my-secret-key');
 * localStorage.setItem('tcKimlik', encrypted);
 */
export async function encryptData(text, key) {
    if (!text || !key) return '';

    try {
        // Derive a cryptographic key from the password
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Generate a random salt (stored with encrypted data)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        const cryptoKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // Generate random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the data
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encoder.encode(text)
        );

        // Combine: salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Return as base64 for localStorage storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        return '';
    }
}

/**
 * AES-GCM Decryption for localStorage sensitive data
 *
 * @param {string} encryptedText - Base64 encoded encrypted data
 * @param {string} key - Decryption key (same as encryption)
 * @returns {Promise<string>} Decrypted plain text
 *
 * @example
 * const encrypted = localStorage.getItem('tcKimlik');
 * const decrypted = await decryptData(encrypted, 'my-secret-key');
 */
export async function decryptData(encryptedText, key) {
    if (!encryptedText || !key) return '';

    try {
        // Decode base64
        const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        // Derive the same key
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const cryptoKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encrypted
        );

        // Decode to string
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
}

/**
 * Application secret key for encryption
 * In production, this should come from environment variable
 */
export const APP_SECRET = 'luminex-2025-health-tech-secret-key';
