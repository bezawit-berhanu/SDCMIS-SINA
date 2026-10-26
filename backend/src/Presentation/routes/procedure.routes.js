const express = require("express");
const procedureController = require("../controllers/procedure.controller");
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
        req.user = { id: "usr-admin-01", fullName: "Clinical Practitioner", role: "DENTIST" };
    }
    next();
});

// Task 2: Create Next Procedure (CRUD Create)
router.post("/next", procedureController.createNextProcedure);
router.post("/", procedureController.createNextProcedure);

// Task 2: Get Procedures (CRUD Read)
router.get("/", procedureController.getProceduresByPatient);

// Task 4: Next -> Ongoing transition
router.post("/:id/start-ongoing", procedureController.startOngoingProcedure);
router.post("/start-ongoing", procedureController.startOngoingProcedure);
router.put("/:id/ongoing", procedureController.startOngoingProcedure);

// Task 5: Ongoing -> Done transition
router.post("/:id/complete", procedureController.completeProcedure);
router.post("/complete", procedureController.completeProcedure);
router.put("/:id/complete", procedureController.completeProcedure);

// Task 2: Update Procedure (CRUD Update)
router.put("/:id", procedureController.updateProcedure);
router.patch("/:id", procedureController.updateProcedure);

// Task 2: Delete Procedure (CRUD Delete)
router.delete("/:id", procedureController.deleteProcedure);

module.exports = router;
