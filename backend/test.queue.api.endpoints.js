const http = require("http");
const assert = require("assert");
const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const userRepository = require("./src/Infrastructure/Repositories/user.repository");

function makeRequest(server, options, requestBody = null) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const reqOptions = {
            hostname: "127.0.0.1",
            port: address.port,
            path: options.path,
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        };

        const req = http.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
                } catch (_) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, raw: data });
                }
            });
        });

        req.on("error", reject);

        if (requestBody) {
            req.write(typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody));
        }
        req.end();
    });
}

async function runQueueTests() {
    console.log("=== Queue API Endpoint Test Suite (SRS 8.5.4 / FR-REC-02 / FR-CUS-02) ===");

    // Seed mock users for in-memory / fallback auth
    userRepository.seedUser({
        id: "usr-rec-queue",
        fullName: "Queue Receptionist",
        email: "queue.rec@sina.com",
        role: "RECEPTIONIST",
        status: "ACTIVE",
    });

    userRepository.seedUser({
        id: "usr-cust-queue",
        fullName: "Queue Customer",
        email: "queue.cust@sina.com",
        role: "CUSTOMER",
        status: "ACTIVE",
        patientId: "pat-queue-01",
    });

    const receptionistToken = tokenService.signAccessToken({
        id: "usr-rec-queue",
        role: "RECEPTIONIST",
        email: "queue.rec@sina.com",
    });

    const customerToken = tokenService.signAccessToken({
        id: "usr-cust-queue",
        role: "CUSTOMER",
        email: "queue.cust@sina.com",
        patientId: "pat-queue-01",
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    try {
        // Test 1: GET /api/v1/queue returns today's live queue (200 OK)
        {
            const res = await makeRequest(server, {
                path: "/api/v1/queue",
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });
            assert.strictEqual(res.statusCode, 200, "Should retrieve queue list with 200 OK");
            assert.strictEqual(res.body?.success, true);
            assert.ok(Array.isArray(res.body?.data), "Queue list should be an array");
            assert.ok(res.body?.summary !== undefined, "Summary stats should be present");
            console.log("✓ Test 1: GET /api/v1/queue returns live queue and summary passed");
        }

        // Test 2: GET /api/v1/queue/mine retrieves customer's personal queue status (FR-CUS-02)
        {
            const res = await makeRequest(server, {
                path: "/api/v1/queue/mine",
                headers: { Authorization: `Bearer ${customerToken}` },
            });
            assert.strictEqual(res.statusCode, 200, "Customer queue endpoint should return 200 OK");
            assert.strictEqual(res.body?.success, true);
            assert.ok(res.body?.data !== undefined, "Queue position data should be returned");
            console.log("✓ Test 2: GET /api/v1/queue/mine returns personal queue position passed");
        }

        // Test 3: POST /api/v1/queue/check-in rejected with 403 when attempted by CUSTOMER
        {
            const res = await makeRequest(server, {
                path: "/api/v1/queue/check-in",
                method: "POST",
                headers: { Authorization: `Bearer ${customerToken}` },
            }, { patientId: "pat-queue-01" });
            assert.strictEqual(res.statusCode, 403, "Customer must not be allowed to perform check-in");
            assert.strictEqual(res.body?.success, false);
            assert.strictEqual(res.body?.code, "FORBIDDEN");
            console.log("✓ Test 3: Customer role blocked from POST /api/v1/queue/check-in with 403 FORBIDDEN passed");
        }

        // Test 4: POST /api/v1/queue/call rejected with 403 when attempted by CUSTOMER
        {
            const res = await makeRequest(server, {
                path: "/api/v1/queue/call",
                method: "POST",
                headers: { Authorization: `Bearer ${customerToken}` },
            }, { queueEntryId: "qe-test-01" });
            assert.strictEqual(res.statusCode, 403, "Customer must not call queue entries");
            assert.strictEqual(res.body?.success, false);
            assert.strictEqual(res.body?.code, "FORBIDDEN");
            console.log("✓ Test 4: Customer role blocked from POST /api/v1/queue/call with 403 FORBIDDEN passed");
        }

        // Test 5: POST /api/v1/queue/auto-advance accessible by RECEPTIONIST staff
        {
            const res = await makeRequest(server, {
                path: "/api/v1/queue/auto-advance",
                method: "POST",
                headers: { Authorization: `Bearer ${receptionistToken}` },
            }, {});
            assert.strictEqual(res.statusCode, 200, "Staff should execute auto-advance with 200 OK");
            assert.strictEqual(res.body?.success, true);
            assert.ok(typeof res.body?.advanced === "boolean", "Advanced boolean flag should be returned");
            console.log("✓ Test 5: Staff auto-advance returns 200 OK passed");
        }

        console.log("ALL 5 Queue API endpoint tests passed successfully!");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

runQueueTests()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Queue API test failure:", err);
        process.exit(1);
    });
