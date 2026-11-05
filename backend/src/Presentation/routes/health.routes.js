const express = require("express");
const container = require("../../container/container");

const router = express.Router();

/**
 * Health & Liveness Probe
 * Used by load balancers, container orchestrators, and monitoring services (NFR-REL-01, NFR-LOG-01).
 */
router.get(["/health", "/live"], (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "sdcmis-sina-api",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});

/**
 * Readiness Probe
 * Verifies application dependencies (database connection pool, background workers).
 */
router.get(["/health/ready", "/ready"], async (req, res) => {
    let dbStatus = "UP";
    try {
        if (container.prisma?.$queryRaw) {
            await container.prisma.$queryRaw`SELECT 1`;
        }
    } catch (_) {
        dbStatus = "DEGRADED";
    }

    const memoryUsage = process.memoryUsage();

    res.status(dbStatus === "UP" ? 200 : 503).json({
        status: dbStatus === "UP" ? "READY" : "NOT_READY",
        service: "sdcmis-sina-api",
        timestamp: new Date().toISOString(),
        database: dbStatus,
        memory: {
            rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
    });
});

module.exports = router;
