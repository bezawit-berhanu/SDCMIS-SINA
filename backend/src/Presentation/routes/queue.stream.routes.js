const express = require("express");

function createQueueStreamRoutes(container) {
    const router = express.Router();
    const gateway = container.realtimeGateway;
    const queueRepository = container.queueRepository;

    router.get("/stream", async (req, res) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();

        const role = req.query.role || "ANONYMOUS";
        const userId = req.query.userId || null;

        // Send initial connection event
        res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", role, userId, time: new Date().toISOString() })}\n\n`);

        // Send initial queue snapshot
        try {
            const currentQueue = await queueRepository.findTodayQueue();
            res.write(`event: QUEUE_SNAPSHOT\ndata: ${JSON.stringify({ queue: currentQueue })}\n\n`);
        } catch (_) {}

        // Listener for all gateway broadcast events
        const eventListener = (data) => {
            res.write(`event: ${data.type || "message"}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        gateway.on("event", eventListener);

        // Keep-alive heartbeat every 20 seconds
        const heartbeatInterval = setInterval(() => {
            res.write(": heartbeat\n\n");
        }, 20000);

        req.on("close", () => {
            clearInterval(heartbeatInterval);
            gateway.off("event", eventListener);
            res.end();
        });
    });

    return router;
}

module.exports = createQueueStreamRoutes;
