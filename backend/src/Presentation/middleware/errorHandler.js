// Import the logger so errors can be recorded consistently.
const logger = require("../../config/logger");

// Standard SRS Section 6.9 Error Code mapping
const SRS_ERROR_MAP = {
    DUPLICATE_ACCOUNT: "ERR-DUP-ACCOUNT",
    INVALID_OR_EXPIRED_TOKEN: "ERR-SESSION-EXPIRED",
    UNAUTHENTICATED: "ERR-SESSION-EXPIRED",
    FORBIDDEN: "ERR-FORBIDDEN",
    VALIDATION_ERROR: "ERR-REQUIRED-FIELD",
    RATE_LIMITED: "ERR-RATE-LIMITED",
};

// Express recognizes this as an error-handling middleware because it has four parameters.
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log the full error and stack internally for diagnostic tracing (NFR-LOG-01)
    logger.error(err.message || "Unexpected server error", {
        requestId: req?.id,
        code: err.code,
        stack: err.stack,
    });

    // Sanitize client-facing messages so secrets or internal paths are never leaked
    let clientMessage = err.message || "An unexpected error occurred.";
    let clientCode = err.errorCode || err.code || "INTERNAL_SERVER_ERROR";

    if (statusCode === 500) {
        if (err.name?.includes("Prisma") || (typeof err.code === "string" && err.code.startsWith("P")) || clientMessage.includes(":\\")) {
            clientMessage = "A database error occurred while processing the request.";
            clientCode = "DATABASE_ERROR";
        }
    }

    const firstField = err.fields && typeof err.fields === "object" ? Object.keys(err.fields)[0] || null : null;

    res.status(statusCode).json({
        success: false,
        error: {
            code: clientCode,
            srsCode: SRS_ERROR_MAP[clientCode] || clientCode,
            message: clientMessage,
            field: firstField,
            fields: err.fields || {},
        },
        requestId: req?.id,
    });
};

module.exports = errorHandler;
