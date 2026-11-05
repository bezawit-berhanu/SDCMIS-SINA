/**
 * Input Sanitization Middleware
 * Sanitizes request body, query, and params by trimming strings and removing harmful control characters.
 */

function sanitizeValue(value) {
    if (typeof value === "string") {
        return value.replace(/\0/g, "").trim();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === "object") {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
    }
    return value;
}

function inputSanitizer(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === "object") {
        req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === "object") {
        req.params = sanitizeValue(req.params);
    }
    next();
}

module.exports = inputSanitizer;
