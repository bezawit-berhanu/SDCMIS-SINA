const http = require("node:http");
const { performance } = require("node:perf_hooks");

// Mock prisma before requiring app to avoid remote DB timeouts during local measurement
const mockPrisma = {
    user: {
        findFirst: async () => null,
        findUnique: async () => null,
    },
    patient: {
        findFirst: async () => null,
        findUnique: async () => null,
        findMany: async () => [],
    },
    $disconnect: async () => {},
};
require.cache[require.resolve("../backend/src/Infrastructure/prisma")] = {
    id: require.resolve("../backend/src/Infrastructure/prisma"),
    filename: require.resolve("../backend/src/Infrastructure/prisma"),
    loaded: true,
    exports: mockPrisma,
};

const app = require("../backend/app");
const tokenService = require("../backend/src/Infrastructure/authentication/token.service");
const userRepository = require("../backend/src/Infrastructure/Repositories/user.repository");
const container = require("../backend/src/container/container");
const patientRepository = container.patientRepository;
const queueRepository = container.queueRepository;
const realtimeGateway = container.realtimeGateway;
const QueueEntry = require("../backend/src/domain/entities/queue.entry");
const { QueueStatus } = require("../backend/src/domain/enums/enum");

async function runBenchmark() {
    console.log("===============================================================");
    console.log("SDCMIS-SINA Performance & Latency Benchmarking Suite (Task 9)");
    console.log("===============================================================\n");

    const dentistUser = {
        id: "usr-perf-dentist",
        role: "DENTIST",
        fullName: "Dr. Performance",
        recordStatus: "ACTIVE",
        deletedAt: null,
    };
    userRepository.seedUser(dentistUser);
    const token = tokenService.signAccessToken(dentistUser);

    // Seed test patients in memory
    for (let i = 1; i <= 25; i++) {
        await patientRepository.create({
            fullName: `Benchmark Patient ${i}`,
            age: 28,
            contact: `+2519110000${String(i).padStart(2, "0")}`,
            serviceType: i % 2 === 0 ? "Scaling and Polishing" : "Root Canal Therapy",
            initialFee: 500.00,
            remainingFee: 250.00,
            dentistId: dentistUser.id,
        });
    }

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    const results = {};

    // 1. Measure Dashboard Response Time
    console.log("[1/5] Measuring Dashboard Response Latency...");
    const dashboardTimes = [];
    for (let i = 0; i < 10; i++) {
        const start = performance.now();
        const res = await fetch(`${baseUrl}/api/v1/patients?dentistId=${dentistUser.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        await res.json();
        const duration = performance.now() - start;
        dashboardTimes.push(duration);
    }
    const avgDashboard = dashboardTimes.reduce((a, b) => a + b, 0) / dashboardTimes.length;
    results.dashboardResponse = {
        minMs: Math.min(...dashboardTimes).toFixed(2),
        maxMs: Math.max(...dashboardTimes).toFixed(2),
        avgMs: avgDashboard.toFixed(2),
    };
    console.log(`  ✓ Dashboard Latency: Avg ${results.dashboardResponse.avgMs} ms (Min: ${results.dashboardResponse.minMs} ms, Max: ${results.dashboardResponse.maxMs} ms)`);

    // 2. Measure Search Response Time
    console.log("[2/5] Measuring Search Indexing Latency...");
    const searchTimes = [];
    const searchQueries = ["Benchmark", "Scaling", "Root", "Patient 10", "+251911"];
    for (const q of searchQueries) {
        const start = performance.now();
        const res = await fetch(`${baseUrl}/api/v1/patients?search=${encodeURIComponent(q)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        await res.json();
        searchTimes.push(performance.now() - start);
    }
    const avgSearch = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
    results.searchResponse = {
        minMs: Math.min(...searchTimes).toFixed(2),
        maxMs: Math.max(...searchTimes).toFixed(2),
        avgMs: avgSearch.toFixed(2),
    };
    console.log(`  ✓ Search Query Latency: Avg ${results.searchResponse.avgMs} ms (Min: ${results.searchResponse.minMs} ms, Max: ${results.searchResponse.maxMs} ms)`);

    // 3. Measure Queue Propagation Latency
    console.log("[3/5] Measuring Real-Time Queue Propagation Latency...");
    const queuePropagationTimes = [];
    for (let i = 0; i < 10; i++) {
        const testEntry = new QueueEntry({
            patientId: `pat-perf-${i}`,
            queueNumber: i + 1,
            status: QueueStatus.SERVING,
        });
        const start = performance.now();
        await new Promise((resolve) => {
            realtimeGateway.once("QUEUE_STATUS_CHANGED", () => {
                const elapsed = performance.now() - start;
                queuePropagationTimes.push(elapsed);
                resolve();
            });
            realtimeGateway.broadcastQueueStatusChanged(testEntry, QueueStatus.WAITING);
        });
    }
    const avgQueue = queuePropagationTimes.reduce((a, b) => a + b, 0) / queuePropagationTimes.length;
    results.queuePropagation = {
        minMs: Math.min(...queuePropagationTimes).toFixed(3),
        maxMs: Math.max(...queuePropagationTimes).toFixed(3),
        avgMs: avgQueue.toFixed(3),
    };
    console.log(`  ✓ Queue Propagation: Avg ${results.queuePropagation.avgMs} ms (Min: ${results.queuePropagation.minMs} ms, Max: ${results.queuePropagation.maxMs} ms)`);

    // 4. Measure Notification Propagation Latency
    console.log("[4/5] Measuring Notification Propagation Latency...");
    const notifPropagationTimes = [];
    for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await new Promise((resolve) => {
            realtimeGateway.once("DENTIST_NOTIFICATION", () => {
                notifPropagationTimes.push(performance.now() - start);
                resolve();
            });
            realtimeGateway.broadcastPatientCalled(
                new QueueEntry({ patientId: `pat-perf-${i}`, queueNumber: i + 1, dentistId: dentistUser.id, status: QueueStatus.SERVING }),
                { message: `Patient #${String(i + 1).padStart(3, "0")} is ready.` }
            );
        });
    }
    const avgNotif = notifPropagationTimes.reduce((a, b) => a + b, 0) / notifPropagationTimes.length;
    results.notificationPropagation = {
        minMs: Math.min(...notifPropagationTimes).toFixed(3),
        maxMs: Math.max(...notifPropagationTimes).toFixed(3),
        avgMs: avgNotif.toFixed(3),
    };
    console.log(`  ✓ Notification Propagation: Avg ${results.notificationPropagation.avgMs} ms (Min: ${results.notificationPropagation.minMs} ms, Max: ${results.notificationPropagation.maxMs} ms)`);

    // 5. Measure Database / Repository Performance
    console.log("[5/5] Measuring Repository / DB Query Execution Performance...");
    const dbTimes = [];
    for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await patientRepository.findAll({ status: "ACTIVE" });
        await queueRepository.findTodayQueue();
        dbTimes.push(performance.now() - start);
    }
    const avgDb = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
    results.databasePerformance = {
        minMs: Math.min(...dbTimes).toFixed(2),
        maxMs: Math.max(...dbTimes).toFixed(2),
        avgMs: avgDb.toFixed(2),
    };
    console.log(`  ✓ DB / Repository Execution: Avg ${results.databasePerformance.avgMs} ms (Min: ${results.databasePerformance.minMs} ms, Max: ${results.databasePerformance.maxMs} ms)`);

    server.close();

    console.log("\n===============================================================");
    console.log("Benchmark Summary Table");
    console.log("===============================================================");
    console.table(results);

    return results;
}

if (require.main === module) {
    runBenchmark()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Benchmark error:", err);
            process.exit(1);
        });
}

module.exports = { runBenchmark };
