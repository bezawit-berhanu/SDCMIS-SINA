/**
 * Production Structured Logger for SDCMIS-SINA
 * Formats log entries as standardized JSON records with ISO timestamps,
 * log level tags, request tracking context, and error stacks.
 */

const LOG_LEVELS = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
};

const CURRENT_LEVEL = process.env.LOG_LEVEL
    ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO)
    : LOG_LEVELS.INFO;

function formatLog(level, message, meta = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: "sdcmis-sina-backend",
        environment: process.env.NODE_ENV || "development",
        message: typeof message === "string" ? message : JSON.stringify(message),
        ...meta,
    };

    if (meta.error && meta.error instanceof Error) {
        entry.error = {
            name: meta.error.name,
            message: meta.error.message,
            stack: meta.error.stack,
            code: meta.error.code,
        };
    }

    return JSON.stringify(entry);
}

const logger = {
    debug(message, meta) {
        if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
            console.debug(formatLog("DEBUG", message, meta));
        }
    },

    info(message, meta) {
        if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
            console.log(formatLog("INFO", message, meta));
        }
    },

    warn(message, meta) {
        if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
            console.warn(formatLog("WARN", message, meta));
        }
    },

    error(message, meta) {
        if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
            console.error(formatLog("ERROR", message, meta));
        }
    },
};

module.exports = logger;

