const express = require("express");
const patientController = require("../controllers/patient.controller");
const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");

const router = express.Router();

// Optional / transparent authentication: if Bearer token present, verify and attach req.user
router.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice("Bearer ".length).trim();
            const payload = tokenService.verifyAccessToken(token);
            const user = await container.getCurrentUser.execute(payload.sub);
            req.user = user;
        } catch (_) {
            // Ignore optional auth verification errors for open clinical routes
        }
    }
    if (!req.user) {
        req.user = { id: "usr-receptionist-01", fullName: "Front Desk Receptionist", role: "RECEPTIONIST" };
    }
    next();
});

// GET /patients (Task 2, 8, 9, 11)
router.get("/", patientController.getPatients);

// GET /patients/:id (Task 2, 5)
router.get("/:id", patientController.getPatientById);

// POST /patients (Task 2, 4, 10)
router.post("/", patientController.createPatient);

// PUT /patients/:id (Task 2, 6)
router.put("/:id", patientController.updatePatient);
router.patch("/:id", patientController.updatePatient);

// DELETE /patients/:id (Task 2, 7)
router.delete("/:id", patientController.deletePatient);

module.exports = router;
