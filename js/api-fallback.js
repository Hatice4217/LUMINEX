/**
 * API Fallback Module for Contact Form
 * Handles Formspree limit issues with backup API support
 */

const APIConfig = {
    primary: {
        url: 'https://formspree.io/f/mqeboqzk',
        name: 'Formspree',
        limit: 50 // forms per month
    },
    backup: {
        url: '/api/contact',
        name: 'Backup API'
    },
    mailto: {
        url: 'mailto:destek@luminex.com.tr',
        name: 'Email Client'
    }
};

/**
 * Submit form with fallback mechanism
 * @param {FormData} formData - Form data to submit
 * @param {HTMLFormElement} formElement - Form element for reference
 * @returns {Promise<Object>} - Submission result
 */
export async function submitWithFallback(formData, formElement) {
    // Primary: Formspree
    const primaryResult = await submitToPrimary(formData);
    if (primaryResult.success) {
        return primaryResult;
    }

    // Fallback 1: Backup API
    logger.warn('Primary API failed, trying backup API');
    const backupResult = await submitToBackupAPI(formData);
    if (backupResult.success) {
        return backupResult;
    }

    // Fallback 2: Mailto (last resort)
    logger.error('All APIs failed, using mailto fallback');
    return submitToMailto(formData, formElement);
}

/**
 * Submit to primary API (Formspree)
 */
async function submitToPrimary(formData) {
    try {
        const response = await fetch(APIConfig.primary.url, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            return {
                success: true,
                method: APIConfig.primary.name,
                message: 'Form başarıyla gönderildi.'
            };
        }

        // Check if limit exceeded
        if (response.status === 429) {
            logger.warn('Formspree limit exceeded');
            return {
                success: false,
                reason: 'limit_exceeded',
                message: 'Aylık form limiti aşıldı.'
            };
        }

        return {
            success: false,
            reason: 'api_error',
            message: 'API hatası oluştu.'
        };
    } catch (error) {
        logger.error('Primary API error:', error);
        return {
            success: false,
            reason: 'network_error',
            message: error.message
        };
    }
}

/**
 * Submit to backup API
 */
async function submitToBackupAPI(formData) {
    try {
        const data = Object.fromEntries(formData.entries());

        const response = await fetch(APIConfig.backup.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            return {
                success: true,
                method: APIConfig.backup.name,
                message: 'Form yedek API üzerinden gönderildi.'
            };
        }

        return {
            success: false,
            reason: 'backup_error',
            message: 'Yedek API de cevap vermedi.'
        };
    } catch (error) {
        // 404 means API doesn't exist yet (expected)
        if (error.message.includes('404') || error.name === 'SyntaxError') {
            logger.warn('Backup API not implemented yet');
        }
        return {
            success: false,
            reason: 'backup_unavailable',
            message: 'Yedek API mevcut değil.'
        };
    }
}

/**
 * Fallback to mailto client
 */
function submitToMailto(formData, formElement) {
    const data = Object.fromEntries(formData.entries());

    // Build email subject and body
    const subject = encodeURIComponent(`Luminex İletişim Formu - ${data.name || 'İsimsiz'}`);
    const body = Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

    const mailtoLink = `mailto:${APIConfig.mailto.url.replace('mailto:', '')}?subject=${subject}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    return {
        success: true,
        method: APIConfig.mailto.name,
        message: 'E-posta istemcisi açılıyor...'
    };
}

/**
 * Check if Formspree limit might be exceeded
 * @param {number} sentThisMonth - Forms sent this month
 * @returns {boolean}
 */
export function isNearLimit(sentThisMonth = 0) {
    return sentThisMonth >= (APIConfig.primary.limit - 5);
}

/**
 * Get remaining form allowance
 * @param {number} sentThisMonth - Forms sent this month
 * @returns {number}
 */
export function getRemainingAllowance(sentThisMonth = 0) {
    return Math.max(0, APIConfig.primary.limit - sentThisMonth);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LuminexAPIFallback = {
        submitWithFallback,
        isNearLimit,
        getRemainingAllowance
    };
}
