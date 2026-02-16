/**
 * Production-Ready Logger
 *
 * Environment-based logging system:
 * - Development: Full logging with colors
 * - Production: Security-first, error-only logging
 *
 * @example
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('Invalid password attempt', { ip: '...' });
 * logger.error('Database connection failed', error);
 */

// Environment detection
const isDevelopment = import.meta.env?.DEV ||
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.port !== '';

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
    /password/i,
    /tc/i,
    /kimlik/i,
    /token/i,
    /secret/i,
    /authorization/i
];

/**
 * Redact sensitive data from objects
 */
function redactSensitive(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        // Check if key contains sensitive pattern
        const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));

        if (isSensitive) {
            redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitive(value);
        } else {
            redacted[key] = value;
        }
    }
    return redacted;
}

/**
 * Format log message with timestamp
 */
function formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data && Object.keys(data).length > 0) {
        const safeData = redactSensitive(data);
        return `${prefix} ${message} ${JSON.stringify(safeData)}`;
    }
    return `${prefix} ${message}`;
}

const logger = {
    /**
     * Info level - Development only
     */
    info(message, data) {
        if (isDevelopment) {
            console.log(formatMessage('info', message, data));
        }
    },

    /**
     * Warning level - Development + Production
     */
    warn(message, data) {
        if (isDevelopment) {
            console.warn(formatMessage('warn', message, data));
        } else {
            // Production: Minimal warning (no data exposure)
            console.warn(`[WARN] ${message}`);
        }
    },

    /**
     * Error level - Always logged (redacted in production)
     */
    error(message, error) {
        const errorData = error ? {
            message: error.message,
            stack: isDevelopment ? error.stack : '[STACK HIDDEN]'
        } : null;

        if (isDevelopment) {
            console.error(formatMessage('error', message, errorData));
        } else {
            // Production: Send to error tracking service (Sentry, LogRocket, etc.)
            // For now, just log minimal info
            console.error(`[ERROR] ${message}`);
        }
    },

    /**
     * Debug level - Development only
     */
    debug(message, data) {
        if (isDevelopment) {
            console.debug(formatMessage('debug', message, data));
        }
    }
};

// Export for ES modules
export default logger;
export { logger };
