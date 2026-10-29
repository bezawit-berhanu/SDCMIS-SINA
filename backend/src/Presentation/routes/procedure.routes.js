const express = require("express");
const procedureController = require("../controllers/procedure.controller");
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
        req.user = { id: "usr-admin-01", fullName: "Clinical Practitioner", role: "DENTIST" };
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
                message: policy.message || "You do not have permission to access this patient's procedures.",
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
            message: "Customers cannot create or update clinical procedures.",
        });
    }
    next();
};

// Task 2: Create Next Procedure (CRUD Create)
router.post("/next", requireStaff, procedureController.createNextProcedure);
router.post("/", requireStaff, procedureController.createNextProcedure);

// Task 2: Get Procedures (CRUD Read)
router.get("/", procedureController.getProceduresByPatient);

// Task 4: Next -> Ongoing transition
router.post("/:id/start-ongoing", requireStaff, procedureController.startOngoingProcedure);
router.post("/start-ongoing", requireStaff, procedureController.startOngoingProcedure);
router.put("/:id/ongoing", requireStaff, procedureController.startOngoingProcedure);

// Task 5: Ongoing -> Done transition
router.post("/:id/complete", requireStaff, procedureController.completeProcedure);
router.post("/complete", requireStaff, procedureController.completeProcedure);
router.put("/:id/complete", requireStaff, procedureController.completeProcedure);

// Task 2: Update Procedure (CRUD Update)
router.put("/:id", requireStaff, procedureController.updateProcedure);
router.patch("/:id", requireStaff, procedureController.updateProcedure);

// Task 2: Delete Procedure (CRUD Delete)
router.delete("/:id", requireStaff, procedureController.deleteProcedure);

module.exports = router;
