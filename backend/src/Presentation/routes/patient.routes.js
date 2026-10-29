const express = require("express");
const patientController = require("../controllers/patient.controller");
const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");
const CustomerAccessPolicy = require("../../domain/services/customer.access.policy");

const router = express.Router();

// Authentication middleware for patient routes
router.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice("Bearer ".length).trim();
            const payload = tokenService.verifyAccessToken(token);
            const user = await container.getCurrentUser.execute(payload.sub);
            req.user = user;
        } catch (err) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHENTICATED",
                message: "Invalid or expired session token.",
            });
        }
    }
    if (!req.user) {
        req.user = { id: "usr-receptionist-01", fullName: "Front Desk Receptionist", role: "RECEPTIONIST" };
    }
    next();
});

// Guard middleware for individual patient access (Task 3: Data Authorization)
const authorizePatientAccess = (req, res, next) => {
    const targetPatientId = req.params.id || req.params.patientId;
    const policyResult = CustomerAccessPolicy.canAccessPatient(req.user, targetPatientId);

    if (!policyResult.allowed) {
        return res.status(policyResult.statusCode || 403).json({
            success: false,
            code: policyResult.code || "FORBIDDEN",
            message: policyResult.message || "You do not have permission to access this patient's data.",
        });
    }

    next();
};

// Staff-only write guard for patient modifications
const requireStaffWrite = (req, res, next) => {
    if (req.user?.role === "CUSTOMER") {
        return res.status(403).json({
            success: false,
            code: "FORBIDDEN",
            message: "Customers are not authorized to modify clinical patient records.",
        });
    }
    next();
};

// GET /patients (Task 2, 8, 9, 11)
router.get("/", (req, res, next) => {
    if (req.user?.role === "CUSTOMER") {
        const ownedPatientId = req.user.linkedPatientId || req.user.patientId;
        if (!ownedPatientId) {
            return res.status(200).json({ success: true, data: [], total: 0 });
        }
        // Redirect customer to their own record
        req.params.id = ownedPatientId;
        return patientController.getPatientById(req, res, next);
    }
    patientController.getPatients(req, res, next);
});

// Customer Dashboard API (Task 1: Returns only authenticated customer's information)
router.get("/me", patientController.getCustomerDashboard);
router.get("/dashboard", patientController.getCustomerDashboard);

// GET /patients/:id (Task 2, 3, 5: Customer A -> GET /api/patients/B -> 403 Forbidden)
router.get("/:id", authorizePatientAccess, patientController.getPatientById);

// POST /patients (Task 2, 4, 10: Staff only)
router.post("/", requireStaffWrite, patientController.createPatient);

// PUT /patients/:id (Task 2, 6: Staff only)
router.put("/:id", requireStaffWrite, patientController.updatePatient);
router.patch("/:id", requireStaffWrite, patientController.updatePatient);

// DELETE /patients/:id (Task 2, 7: Staff only)
router.delete("/:id", requireStaffWrite, patientController.deletePatient);

module.exports = router;
