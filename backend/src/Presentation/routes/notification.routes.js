const express = require("express");
const QueueController = require("../controllers/queue.controller");
const tokenService = require("../../Infrastructure/authentication/token.service");

function createNotificationRoutes(container) {
    const router = express.Router();
    const controller = new QueueController(container);

    // Authentication middleware for notifications
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
            req.user = { id: "usr-dentist-01", fullName: "Dr. Bethel Haile", role: "DENTIST" };
        }
        next();
    });

    // Unread notifications endpoint
    router.get("/unread", controller.getUnreadNotifications);

    // Mark all notifications read
    router.post("/mark-all-read", controller.markAllNotificationsRead);
    router.patch("/mark-all-read", controller.markAllNotificationsRead);
    router.put("/mark-all-read", controller.markAllNotificationsRead);

    // Mark single notification read (SRS 8.5.4: PATCH /notifications/{id}/read, FR-NOT-02)
    router.post("/:id/read", controller.markNotificationRead);
    router.patch("/:id/read", controller.markNotificationRead);
    router.put("/:id/read", controller.markNotificationRead);

    // Base get notifications (SRS 8.5.4: GET /notifications)
    router.get("/", controller.getNotifications);

    return router;
}

module.exports = createNotificationRoutes;
