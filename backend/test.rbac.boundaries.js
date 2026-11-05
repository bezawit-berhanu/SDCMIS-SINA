const http = require("http");
const assert = require("assert");
const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const userRepository = require("./src/Infrastructure/Repositories/user.repository");
const CustomerAccessPolicy = require("./src/domain/services/customer.access.policy");

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

async function runRbacTests() {
    console.log("=== RBAC & Cross-Customer Isolation Boundary Suite (SRS BR-05 / BR-31) ===");

    // 1. Direct Unit Tests on CustomerAccessPolicy
    {
        const staffDentist = { id: "u-dent", role: "DENTIST" };
        const staffRec = { id: "u-rec", role: "RECEPTIONIST" };
        const customerAlice = { id: "u-alice", role: "CUSTOMER", patientId: "pat-alice-101" };
        const customerBob = { id: "u-bob", role: "CUSTOMER", patientId: "pat-bob-202" };

        // Staff access
        assert.strictEqual(CustomerAccessPolicy.canAccessPatient(staffDentist, "pat-alice-101").allowed, true);
        assert.strictEqual(CustomerAccessPolicy.canAccessPatient(staffRec, "pat-bob-202").allowed, true);

        // Own customer access
        assert.strictEqual(CustomerAccessPolicy.canAccessPatient(customerAlice, "pat-alice-101").allowed, true);
        assert.strictEqual(CustomerAccessPolicy.canAccessPatient(customerBob, "pat-bob-202").allowed, true);

        // Cross-customer access (BR-05 Horizontal Isolation)
        const deniedAliceToBob = CustomerAccessPolicy.canAccessPatient(customerAlice, "pat-bob-202");
        assert.strictEqual(deniedAliceToBob.allowed, false);
        assert.strictEqual(deniedAliceToBob.statusCode, 403);
        assert.strictEqual(deniedAliceToBob.code, "FORBIDDEN");

        // Unauthenticated access
        const unauth = CustomerAccessPolicy.canAccessPatient(null, "pat-alice-101");
        assert.strictEqual(unauth.allowed, false);
        assert.strictEqual(unauth.statusCode, 401);

        console.log("✓ Unit Tests: CustomerAccessPolicy authorization boundary rules passed");
    }

    // 2. Integration / Endpoint Tests
    userRepository.seedUser({
        id: "usr-cust-alice",
        fullName: "Alice Patient",
        email: "alice@test.com",
        role: "CUSTOMER",
        status: "ACTIVE",
        patientId: "pat-alice-101",
    });

    userRepository.seedUser({
        id: "usr-staff-rec",
        fullName: "Reception Desk",
        email: "desk@sina.com",
        role: "RECEPTIONIST",
        status: "ACTIVE",
    });

    const aliceToken = tokenService.signAccessToken({
        id: "usr-cust-alice",
        role: "CUSTOMER",
        patientId: "pat-alice-101",
    });

    const staffToken = tokenService.signAccessToken({
        id: "usr-staff-rec",
        role: "RECEPTIONIST",
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    try {
        // Test 2.1: Customer Alice accessing Bob's patient record via GET /api/v1/patients/pat-bob-202
        {
            const res = await makeRequest(server, {
                path: "/api/v1/patients/pat-bob-202",
                headers: { Authorization: `Bearer ${aliceToken}` },
            });
            assert.strictEqual(res.statusCode, 403, "Alice accessing Bob must return 403 Forbidden");
            assert.strictEqual(res.body?.success, false);
            assert.strictEqual(res.body?.code, "FORBIDDEN");
            console.log("✓ Test 2.1: Cross-customer GET /patients/:id rejected with 403 FORBIDDEN passed");
        }

        // Test 2.2: Customer Alice trying to create a patient via POST /api/v1/patients
        {
            const res = await makeRequest(server, {
                path: "/api/v1/patients",
                method: "POST",
                headers: { Authorization: `Bearer ${aliceToken}` },
            }, { firstName: "Intruder", lastName: "Test" });
            assert.strictEqual(res.statusCode, 403, "Customer creating patient record must return 403");
            assert.strictEqual(res.body?.success, false);
            assert.strictEqual(res.body?.code, "FORBIDDEN");
            console.log("✓ Test 2.2: Customer role write to POST /patients rejected with 403 FORBIDDEN passed");
        }

        // Test 2.3: Customer Alice trying to delete another record via DELETE /api/v1/patients/pat-bob-202
        {
            const res = await makeRequest(server, {
                path: "/api/v1/patients/pat-bob-202",
                method: "DELETE",
                headers: { Authorization: `Bearer ${aliceToken}` },
            });
            assert.strictEqual(res.statusCode, 403, "Customer deleting patient record must return 403");
            assert.strictEqual(res.body?.success, false);
            assert.strictEqual(res.body?.code, "FORBIDDEN");
            console.log("✓ Test 2.3: Customer role DELETE /patients/:id rejected with 403 FORBIDDEN passed");
        }

        // Test 2.4: Receptionist accessing patient record gets past RBAC boundary
        {
            const res = await makeRequest(server, {
                path: "/api/v1/patients/pat-bob-202",
                headers: { Authorization: `Bearer ${staffToken}` },
            });
            assert.notStrictEqual(res.statusCode, 403, "Staff must not be rejected with 403 on patient record");
            console.log("✓ Test 2.4: Staff accessing patient record passes RBAC boundary passed");
        }

        console.log("ALL RBAC & customer data isolation tests passed successfully!");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

runRbacTests()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("RBAC boundary test failure:", err);
        process.exit(1);
    });
