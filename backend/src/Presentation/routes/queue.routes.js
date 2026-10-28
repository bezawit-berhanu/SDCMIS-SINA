const express = require("express");
const QueueController = require("../controllers/queue.controller");
const createQueueStreamRoutes = require("./queue.stream.routes");
const tokenService = require("../../Infrastructure/authentication/token.service");

function createQueueRoutes(container) {
    const router = express.Router();
    const controller = new QueueController(container);

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
                // Ignore optional auth verification errors
            }
        }
        if (!req.user) {
            req.user = { id: "usr-receptionist-01", fullName: "Front Desk Receptionist", role: "RECEPTIONIST" };
        }
        next();
    });

    // Mount SSE live stream endpoint
    router.use(createQueueStreamRoutes(container));

    // Specific endpoints
    router.post("/check-in", controller.checkIn);
    router.post("/auto-advance", controller.autoAdvance);
    router.post("/call", controller.callCustomer);
    router.post("/complete", controller.completeVisit);

    // RESTful endpoints with ID
    router.post("/:id/call", controller.callCustomer);
    router.post("/:id/complete", controller.completeVisit);

    // Base endpoints
    router.get("/", controller.getQueue);
    router.post("/", controller.checkIn);

    return router;
}

module.exports = createQueueRoutes;
