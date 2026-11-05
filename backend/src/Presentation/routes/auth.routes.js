const express = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Sensitive auth rate limiter: max 10 requests per minute per IP to prevent credential brute-forcing
const authLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    prefix: "auth",
    message: "Too many attempts. Please try again in a few minutes.",
});

// FR-AUTH-01: Account creation (supports both /register and /signup per SRS 8.5.1)
router.post("/register", authLimiter, authController.register);
router.post("/signup", authLimiter, authController.register);

// FR-AUTH-02: User login with rate limiting (NFR-SEC-05, BR-09)
router.post("/login", authLimiter, authController.login);

// FR-AUTH-03: User logout
router.post("/logout", authController.logout);

// FR-AUTH-04: Current authenticated user session verification
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
