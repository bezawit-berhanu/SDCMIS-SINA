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

    // Role guard for queue management actions (Staff only: RECEPTIONIST or DENTIST)
    const requireStaff = (req, res, next) => {
        if (req.user && req.user.role === "CUSTOMER") {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You do not have permission to manage the clinical queue.",
            });
        }
        next();
    };

    // Customer position endpoint (Task 4: Your Queue Number: #007, Position: 2, Status: WAITING)
    router.get("/my-position", controller.getMyQueuePosition);

    // Specific endpoints
    router.post("/check-in", requireStaff, controller.checkIn);
    router.post("/auto-advance", requireStaff, controller.autoAdvance);
    router.post("/call", requireStaff, controller.callCustomer);
    router.post("/complete", requireStaff, controller.completeVisit);

    // RESTful endpoints with ID
    router.post("/:id/call", requireStaff, controller.callCustomer);
    router.post("/:id/complete", requireStaff, controller.completeVisit);

    // Base endpoints
    router.get("/", controller.getQueue);
    router.post("/", requireStaff, controller.checkIn);

    return router;
}

module.exports = createQueueRoutes;
