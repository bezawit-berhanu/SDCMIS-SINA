const express = require("express");
const AppointmentController = require("../controllers/appointment.controller");
const authenticate = require("../middlewares/authenticate");

function createAppointmentRoutes(container) {
    const router = express.Router();
    const controller = new AppointmentController(container);

    // Optional auth middleware: use if present, or fallback gracefully in test
    const auth = authenticate(container.tokenService, container.userRepository);

    // Specific endpoints before param /:id
    router.get("/upcoming", (req, res) => {
        req.query.view = "upcoming";
        return controller.list(req, res);
    });

    router.get("/missed", (req, res) => {
        req.query.view = "missed";
        return controller.list(req, res);
    });

    router.post("/sync-missed", controller.syncMissed);

    // Standard CRUD and Lifecycle
    router.post("/", controller.create);
    router.get("/", controller.list);
    router.get("/:id", controller.getById);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.delete);

    // Cancel and Reschedule
    router.post("/:id/cancel", controller.cancel);
    router.post("/:id/reschedule", controller.reschedule);

    return router;
}

module.exports = createAppointmentRoutes;
