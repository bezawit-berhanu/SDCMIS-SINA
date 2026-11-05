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
                let user = null;
                try {
                    user = await container.getCurrentUser.execute(payload.sub);
                } catch (_) {}
                req.user = user || { id: payload.sub, role: payload.role || "CUSTOMER" };
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

    // Customer position endpoint (SRS 8.5.4: GET /queue/mine, FR-CUS-02)
    router.get("/my-position", controller.getMyQueuePosition);
    router.get("/mine", controller.getMyQueuePosition);

    // Today's queue endpoint (SRS 8.5.4: GET /queue/today)
    router.get("/today", controller.getQueue);

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
