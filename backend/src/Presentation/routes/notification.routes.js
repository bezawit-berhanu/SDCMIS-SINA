const express = require("express");
const QueueController = require("../controllers/queue.controller");

function createNotificationRoutes(container) {
    const router = express.Router();
    const controller = new QueueController(container);

    // Unread notifications endpoint
    router.get("/unread", controller.getUnreadNotifications);

    // Mark all notifications read
    router.post("/mark-all-read", controller.markAllNotificationsRead);
    router.patch("/mark-all-read", controller.markAllNotificationsRead);
    router.put("/mark-all-read", controller.markAllNotificationsRead);

    // Mark single notification read
    router.post("/:id/read", controller.markNotificationRead);
    router.patch("/:id/read", controller.markNotificationRead);
    router.put("/:id/read", controller.markNotificationRead);

    // Base get notifications
    router.get("/", controller.getNotifications);

    return router;
}

module.exports = createNotificationRoutes;
