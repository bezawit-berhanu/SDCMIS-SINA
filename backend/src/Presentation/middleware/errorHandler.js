// Import the logger so errors can be recorded consistently.
const logger = require("../../config/logger");

// Express recognizes this as an error-handling middleware because it has four parameters.
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log the full error and stack internally for diagnostic tracing
    logger.error(err.message || "Unexpected server error", {
        requestId: req?.id,
        code: err.code,
        stack: err.stack,
    });

    // Sanitize client-facing messages so secrets or internal paths are never leaked
    let clientMessage = err.message || "An unexpected error occurred.";
    let clientCode = err.code || "INTERNAL_SERVER_ERROR";

    if (statusCode === 500) {
        if (err.name?.includes("Prisma") || (typeof err.code === "string" && err.code.startsWith("P")) || clientMessage.includes(":\\")) {
            clientMessage = "A database error occurred while processing the request.";
            clientCode = "DATABASE_ERROR";
        }
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: clientCode,
            message: clientMessage,
            fields: err.fields || {},
        },
        requestId: req?.id,
    });
};

module.exports = errorHandler;