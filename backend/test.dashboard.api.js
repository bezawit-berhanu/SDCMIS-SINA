const assert = require("node:assert");
const http = require("node:http");
const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const userRepository = require("./src/Infrastructure/Repositories/user.repository");

function makeRequest(server, options, body = null) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const reqOptions = {
            hostname: "127.0.0.1",
            port: address.port,
            path: options.path,
            method: options.method || "GET",
            headers: options.headers || {},
        };

        const req = http.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (_) {
                    parsed = data;
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsed,
                });
            });
        });

        req.on("error", reject);
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=== Dashboard API Endpoint Test Suite (SRS 8.5.3 / FR-DEN-01 / FR-REC-01) ===");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    userRepository.seedUser({ id: "usr-dent-1", role: "DENTIST", fullName: "Dr. Dentist", recordStatus: "ACTIVE", deletedAt: null });
    userRepository.seedUser({ id: "usr-rec-1", role: "RECEPTIONIST", fullName: "Front Desk", recordStatus: "ACTIVE", deletedAt: null });
    userRepository.seedUser({ id: "usr-cust-1", role: "CUSTOMER", fullName: "Customer Patient", recordStatus: "ACTIVE", deletedAt: null });

    try {
        const dentistToken = tokenService.signAccessToken({ id: "usr-dent-1", role: "DENTIST" });
        const receptionistToken = tokenService.signAccessToken({ id: "usr-rec-1", role: "RECEPTIONIST" });
        const customerToken = tokenService.signAccessToken({ id: "usr-cust-1", role: "CUSTOMER" });

        // Test 1: Unauthenticated request rejected with 401
        {
            const res = await makeRequest(server, { path: "/api/v1/dentist/dashboard" });
            assert.strictEqual(res.statusCode, 401, "Unauthenticated request should return 401");
            console.log("✓ Test 1: Unauthenticated request rejected with 401 passed");
        }

        // Test 2: Customer role rejected from Dentist dashboard with 403
        {
            const res = await makeRequest(server, {
                path: "/api/v1/dentist/dashboard",
                headers: { Authorization: `Bearer ${customerToken}` },
            });
            assert.strictEqual(res.statusCode, 403, "Customer should be rejected with 403");
            assert.strictEqual(res.body?.code, "ERR-FORBIDDEN", "Error code should be ERR-FORBIDDEN");
            console.log("✓ Test 2: Role authorization boundary rejected customer from dentist dashboard passed");
        }

        // Test 3: Dentist gets dentist dashboard with 200 OK
        {
            const res = await makeRequest(server, {
                path: "/api/v1/dentist/dashboard",
                headers: { Authorization: `Bearer ${dentistToken}` },
            });
            console.log("Test 3 Body:", JSON.stringify(res.body));
            assert.strictEqual(res.statusCode, 200, "Dentist should access dentist dashboard with 200");
            assert.strictEqual(res.body?.success, true);
            assert.ok(res.body?.data !== undefined, "Data should be present");
            console.log("✓ Test 3: Dentist dashboard returns 200 OK passed");
        }

        // Test 4: Receptionist gets receptionist dashboard with 200 OK
        {
            const res = await makeRequest(server, {
                path: "/api/v1/receptionist/dashboard",
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });
            assert.strictEqual(res.statusCode, 200, "Receptionist should access receptionist dashboard with 200");
            assert.strictEqual(res.body?.success, true);
            assert.ok(
                (res.body?.data?.scheduledThisMonth !== undefined || res.body?.scheduledThisMonth !== undefined),
                "scheduledThisMonth should be present per FR-REC-01"
            );
            console.log("✓ Test 4: Receptionist dashboard returns 200 OK passed");
        }

        // Test 5: GET /api/v1/dentist/tasks returns upcoming tasks
        {
            const res = await makeRequest(server, {
                path: "/api/v1/dentist/tasks",
                headers: { Authorization: `Bearer ${dentistToken}` },
            });
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.body?.success, true);
            assert.ok(Array.isArray(res.body?.tasks || res.body?.data), "Tasks array should be returned");
            console.log("✓ Test 5: Dentist upcoming tasks returns 200 OK passed");
        }

        // Test 6: GET /api/v1/dentist/missed-appointments returns missed list
        {
            const res = await makeRequest(server, {
                path: "/api/v1/dentist/missed-appointments",
                headers: { Authorization: `Bearer ${dentistToken}` },
            });
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.body?.success, true);
            assert.ok(Array.isArray(res.body?.missedAppointments || res.body?.data), "Missed appointments array should be returned");
            console.log("✓ Test 6: Dentist missed-appointments returns 200 OK passed");
        }

        console.log("ALL 6 Dashboard API endpoint tests passed successfully!");
    } finally {
        await new Promise((resolve) => server.close(resolve));
        try {
            const { appointmentScheduler } = require("./src/Infrastructure/scheduler/appointment.scheduler");
            if (appointmentScheduler && typeof appointmentScheduler.stop === "function") {
                appointmentScheduler.stop();
            }
        } catch (_) {}
    }
}

runTests().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error("Dashboard API test failure:", err);
    process.exit(1);
});
