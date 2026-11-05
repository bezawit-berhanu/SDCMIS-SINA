/**
 * In-Memory Rate Limiter Middleware
 * Implements SRS NFR-SEC-05 & BR-09:
 * "Failed login attempts and API requests shall be rate-limited per account and per source IP to mitigate brute-force attacks."
 * Error Code: ERR-RATE-LIMITED
 * Displayed Message: "Too many attempts. Please try again in a few minutes."
 */

class RateLimiterStore {
    constructor() {
        this.hits = new Map();
        // Periodic cleanup to prevent memory leaks every 5 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, record] of this.hits.entries()) {
                if (record.resetTime <= now) {
                    this.hits.delete(key);
                }
            }
        }, 300000);

        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    increment(key, windowMs) {
        const now = Date.now();
        let record = this.hits.get(key);

        if (!record || record.resetTime <= now) {
            record = {
                count: 1,
                resetTime: now + windowMs,
            };
            this.hits.set(key, record);
            return record;
        }

        record.count += 1;
        return record;
    }

    reset() {
        this.hits.clear();
    }
}

const defaultStore = new RateLimiterStore();

/**
 * Creates an Express rate limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.max - Max requests per window (default: 100)
 * @param {string} [options.message] - Custom error message
 * @param {Function} [options.keyGenerator] - Custom key generator function (req) => string
 * @param {boolean} [options.skipSuccessfulRequests] - Whether to only count failed attempts
 */
function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 60000;
    const max = options.max || 100;
    const message = options.message || "Too many attempts. Please try again in a few minutes.";
    const keyGenerator =
        options.keyGenerator ||
        ((req) => {
            const forwarded = req.headers["x-forwarded-for"];
            const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || req.socket?.remoteAddress || "127.0.0.1";
            return ip;
        });

    const store = options.store || defaultStore;

    const middleware = (req, res, next) => {
        // Skip rate limiting in automated unit tests unless explicitly enabled
        if (process.env.NODE_ENV === "test" && !options.enableInTests) {
            return next();
        }

        const key = `${options.prefix || "global"}:${keyGenerator(req)}`;
        const record = store.increment(key, windowMs);
        const remaining = Math.max(0, max - record.count);
        const resetSeconds = Math.ceil((record.resetTime - Date.now()) / 1000);

        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", resetSeconds);

        if (record.count > max) {
            res.setHeader("Retry-After", resetSeconds);
            return res.status(429).json({
                success: false,
                code: "ERR-RATE-LIMITED",
                errorCode: "ERR-RATE-LIMITED",
                message,
            });
        }

        next();
    };

    middleware.reset = () => store.reset();
    return middleware;
}

module.exports = {
    createRateLimiter,
    RateLimiterStore,
    defaultStore,
};
