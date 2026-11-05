const cluster = require("cluster");
const os = require("os");
const app = require("./app");
const container = require("./src/container/container");
const env = require("./src/config/env");

function startWorker() {
    const server = app.listen(env.PORT, () => {
        console.log(
            `SDCMIS API running on port ${env.PORT} in ${env.NODE_ENV} mode (Process: ${process.pid})`
        );
    });

    // Load balancer Keep-Alive timeout alignment (AWS ALB / Nginx default 60s)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Attach real-time WebSocket gateway
    if (container.realtimeGateway?.attachToServer) {
        container.realtimeGateway.attachToServer(server, "/ws/queue");
    }

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(
                `Port ${env.PORT} is already in use (EADDRINUSE). Please ensure no previous server instance is running or set a different PORT in environment variables.`
            );
        } else {
            console.error("HTTP server error:", error);
        }
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
        console.log(`Received ${signal}. Gracefully terminating HTTP server...`);
        server.close(async () => {
            try {
                if (container.prisma?.$disconnect) {
                    await container.prisma.$disconnect();
                }
            } catch (_) {}
            console.log("Server closed cleanly.");
            process.exit(0);
        });

        // Force shutdown after 10s if connections refuse to terminate
        setTimeout(() => {
            console.error("Forcefully shutting down after timeout.");
            process.exit(1);
        }, 10000).unref();
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));

    return server;
}

// Cluster mode support when CLUSTER_MODE=true is enabled
if (process.env.CLUSTER_MODE === "true" && cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`Primary cluster process ${process.pid} is starting ${numCPUs} worker processes...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.warn(`Worker process ${worker.process.pid} exited (code: ${code}, signal: ${signal}). Respawning worker...`);
        cluster.fork();
    });
} else {
    startWorker();
}
