/**
 * Structured logger for server-side operations.
 * Outputs JSON logs suitable for cloud logging services (GCP Cloud Logging, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
    [key: string]: unknown;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    stack?: string;
    [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, error?: Error | null, meta?: LogMeta): LogEntry {
    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
    };

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
        };
        if (error.stack) {
            entry.stack = error.stack;
        }
    }

    return entry;
}

function log(level: LogLevel, entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (level) {
        case 'debug':
            console.debug(output);
            break;
        case 'info':
            console.log(output);
            break;
        case 'warn':
            console.warn(output);
            break;
        case 'error':
            console.error(output);
            break;
    }
}

export const logger = {
    /**
     * Log debug-level message (development only by default)
     */
    debug(message: string, meta?: LogMeta): void {
        if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
            log('debug', formatLog('debug', message, null, meta));
        }
    },

    /**
     * Log info-level message
     */
    info(message: string, meta?: LogMeta): void {
        log('info', formatLog('info', message, null, meta));
    },

    /**
     * Log warning-level message
     */
    warn(message: string, meta?: LogMeta): void {
        log('warn', formatLog('warn', message, null, meta));
    },

    /**
     * Log error-level message with optional Error object
     */
    error(message: string, error?: Error | null, meta?: LogMeta): void {
        log('error', formatLog('error', message, error, meta));
    },

    /**
     * Create a child logger with preset metadata
     */
    child(baseMeta: LogMeta) {
        return {
            debug: (message: string, meta?: LogMeta) => logger.debug(message, { ...baseMeta, ...meta }),
            info: (message: string, meta?: LogMeta) => logger.info(message, { ...baseMeta, ...meta }),
            warn: (message: string, meta?: LogMeta) => logger.warn(message, { ...baseMeta, ...meta }),
            error: (message: string, error?: Error | null, meta?: LogMeta) =>
                logger.error(message, error, { ...baseMeta, ...meta }),
        };
    },
};

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: unknown;
}

/**
 * Create a standardized API error response
 */
export function createApiError(
    error: string,
    code?: string,
    details?: unknown
): ApiErrorResponse {
    const response: ApiErrorResponse = { error };
    if (code !== undefined) {
        response.code = code;
    }
    if (details !== undefined) {
        response.details = details;
    }
    return response;
}
