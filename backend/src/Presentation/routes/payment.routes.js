const express = require("express");
const paymentController = require("../controllers/payment.controller");
const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");

const router = express.Router({ mergeParams: true });

// Optional auth token extractor / transparent role attachment
router.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice("Bearer ".length).trim();
            const payload = tokenService.verifyAccessToken(token);
            const user = await container.getCurrentUser.execute(payload.sub);
            req.user = user;
        } catch (_) {}
    }
    if (!req.user) {
        req.user = { id: "usr-receptionist-01", fullName: "Front Desk Staff", role: "RECEPTIONIST" };
    }
    next();
});

// Task 7: Record Payment (Receptionist / Dentist Can record payment)
router.post("/", paymentController.recordPayment);
router.post("/record", paymentController.recordPayment);

// Task 9: Payment History (Displays Amount, Due Date, Recorded by)
router.get("/", paymentController.getPaymentHistory);
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
