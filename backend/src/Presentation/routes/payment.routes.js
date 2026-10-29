const express = require("express");
const paymentController = require("../controllers/payment.controller");
const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");
const CustomerAccessPolicy = require("../../domain/services/customer.access.policy");

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

// Guard: Verify patient access if patientId is in route parameters
router.use((req, res, next) => {
    const targetPatientId = req.params.patientId;
    if (targetPatientId && req.user?.role === "CUSTOMER") {
        const policy = CustomerAccessPolicy.canAccessPatient(req.user, targetPatientId);
        if (!policy.allowed) {
            return res.status(policy.statusCode || 403).json({
                success: false,
                code: policy.code || "FORBIDDEN",
                message: policy.message || "You do not have permission to access this patient's payments.",
            });
        }
    }
    next();
});

const requireStaff = (req, res, next) => {
    if (req.user?.role === "CUSTOMER") {
        return res.status(403).json({
            success: false,
            code: "FORBIDDEN",
            message: "Customers cannot record payments.",
        });
    }
    next();
};

// Task 7: Record Payment (Receptionist / Dentist Can record payment)
router.post("/", requireStaff, paymentController.recordPayment);
router.post("/record", requireStaff, paymentController.recordPayment);

// Task 9: Payment History (Displays Amount, Due Date, Recorded by)
router.get("/", paymentController.getPaymentHistory);
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
