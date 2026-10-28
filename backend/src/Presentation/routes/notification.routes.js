const express = require("express");
const QueueController = require("../controllers/queue.controller");

function createNotificationRoutes(container) {
    const router = express.Router();
    const controller = new QueueController(container);

    router.get("/", controller.getNotifications);
    router.post("/:id/read", controller.markNotificationRead);
    router.patch("/:id/read", controller.markNotificationRead);
    router.put("/:id/read", controller.markNotificationRead);

    return router;
}

module.exports = createNotificationRoutes;
